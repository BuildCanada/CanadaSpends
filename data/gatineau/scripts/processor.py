#!/usr/bin/env python3
"""Convert Gatineau markdown summary into sankey.json and summary.json."""

from __future__ import annotations

import argparse
import json
import math
import os
import re
import sys
import time
import unicodedata
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional
from urllib.request import urlretrieve

OPENAI_MODEL = "gpt-4o"  # Model must support file attachments


NUMBER_SPLIT_PATTERN = re.compile(r"\s[–-]\s")
LEADING_BULLET_PATTERN = re.compile(r"^(\s*)[*-]\s+")
LEADING_HEADER_PATTERN = re.compile(r"^###\s+\*\*(.+?)\*\*")
METRIC_SECTION_KEYWORDS = ("key metrics", "overview", "summary", "key facts")
METRIC_SPECS = [
    {
        "field": "population",
        "aliases": ("population",),
        "type": "integer",
    },
    {
        "field": "totalEmployees",
        "aliases": ("total employees", "public service employees"),
        "type": "integer",
    },
    {
        "field": "netDebt",
        "aliases": ("net debt",),
        "type": "currency",
    },
    {
        "field": "totalDebt",
        "aliases": ("total debt",),
        "type": "currency",
    },
    {
        "field": "debtInterest",
        "aliases": ("debt interest", "interest on debt", "annual interest on debt"),
        "type": "currency",
    },
    {
        "field": "propertyTaxRevenue",
        "aliases": ("property tax revenue", "property taxes revenue"),
        "type": "currency",
    },
]


@dataclass
class Entry:
    name: str
    amount: Optional[float] = None  # Stored in billions of dollars
    children: List["Entry"] = field(default_factory=list)

    def to_sankey_node(self) -> dict:
        node: dict = {"name": self.name}
        if self.children:
            node["children"] = [child.to_sankey_node() for child in self.children]
        else:
            node["amount"] = self.amount
        return node


def parse_amount(text: str) -> Optional[float]:
    """Convert a '123,456 k$' or '123 456 k$' string into billions of dollars."""
    # Remove formatting characters (lenient)
    cleaned = (
        text.replace("**", "")
        .replace("k$", "")
        .replace("K$", "")
        .replace("$", "")
        .replace(",", "")  # Remove commas
        .replace(" ", "")  # Remove spaces (handles "123 456" format)
    )
    if not cleaned or cleaned in {"-", "–"}:
        return None
    try:
        value_as_thousands = float(cleaned)
    except ValueError:
        return None
    # Convert thousands of dollars to billions (divide by 1_000_000)
    return round(value_as_thousands / 1_000_000, 6)


def clean_name(text: str) -> str:
    stripped = text.strip()
    if stripped.startswith("**") and stripped.endswith("**"):
        stripped = stripped[2:-2]
    return stripped.strip(" -*")


def split_name_and_value(raw: str) -> tuple[str, Optional[str]]:
    parts = NUMBER_SPLIT_PATTERN.split(raw.replace("**", ""), maxsplit=1)
    if len(parts) == 2:
        name, value_text = parts
        return name.strip(" -*"), value_text.strip()
    return clean_name(raw), None


def extract_name_and_amount(raw: str) -> tuple[str, Optional[float]]:
    name, value_text = split_name_and_value(raw)
    if value_text is None:
        return name, None
    return name, parse_amount(value_text)


def parse_metric_value(value_text: str, value_type: str) -> Optional[float]:
    if not value_text:
        return None
    cleaned = re.sub(r"[^\d.\-]", "", value_text.replace(",", ""))
    if not cleaned:
        return None
    try:
        numeric = float(cleaned)
    except ValueError:
        return None

    if value_type == "integer":
        return int(numeric)
    if value_type == "currency":
        return round(numeric / 1_000_000, 6)
    return numeric


def parse_markdown(filepath: Path) -> dict:
    sections = {"revenues": [], "expenses": []}
    totals = {"revenues": None, "expenses": None}
    metrics: Dict[str, Optional[float]] = {
        spec["field"]: None for spec in METRIC_SPECS
    }

    current_section: Optional[str] = None
    current_parent: Optional[Entry] = None
    parent_stack: List[tuple[int, Entry]] = []  # (indent_level, entry) pairs

    with filepath.open("r", encoding="utf-8") as f:
        for raw_line in f:
            line = raw_line.rstrip("\n")
            stripped = line.strip()

            if stripped.startswith("## Revenues"):
                current_section = "revenues"
                current_parent = None
                parent_stack = []
                continue
            if stripped.startswith("## Expenses"):
                current_section = "expenses"
                current_parent = None
                parent_stack = []
                continue
            # Handle ### headers as top-level categories
            header_match = LEADING_HEADER_PATTERN.match(stripped)
            if header_match and current_section in ("revenues", "expenses"):
                category_name = header_match.group(1).strip()
                # Handle "Grand Total" entries - extract amount from next line if available
                if "grand total" in category_name.lower() or "total" in category_name.lower():
                    current_parent = None
                    parent_stack = []
                    # Try to extract amount from the category name itself
                    if "–" in category_name or "-" in category_name:
                        parts = NUMBER_SPLIT_PATTERN.split(category_name, maxsplit=1)
                        if len(parts) == 2:
                            amount = parse_amount(parts[1].strip())
                            if amount is not None:
                                totals[current_section] = amount
                    continue
                entry = Entry(name=category_name, amount=None)
                sections[current_section].append(entry)
                current_parent = entry
                parent_stack = [(0, entry)]  # Reset stack with new category
                continue
            
            if stripped.startswith("##"):
                header = stripped.lower()
                if any(keyword in header for keyword in METRIC_SECTION_KEYWORDS):
                    current_section = "metrics"
                    current_parent = None
                    continue
            if current_section is None:
                continue
            if stripped in {"", "---"}:
                continue
            if stripped.startswith(("(", "(All figures")):
                # Comment or note line
                continue
            # Skip lines that are just headers or notes
            if stripped.startswith("(") and stripped.endswith(")"):
                continue
            
            bullet_match = LEADING_BULLET_PATTERN.match(line)
            if not bullet_match:
                continue

            indent_level = len(bullet_match.group(1))
            content = line[bullet_match.end() :].strip()

            if not content:
                continue

            # Handle * **Category** as top-level category (lenient: allow variations)
            # Check for bold-only content (category header) at top level
            if indent_level == 0 and current_section in ("revenues", "expenses"):
                # Try to match bold-only pattern (more lenient)
                bold_match = re.match(r"^\*\*(.+?)\*\*\s*$", content)
                if bold_match:
                    category_name = bold_match.group(1).strip()
                    # Skip if it's a total line (has "total" and a dash/amount)
                    if "total" in category_name.lower():
                        # Check if it has an amount (has dash or number)
                        if "–" in category_name or "-" in category_name or re.search(r'\d', category_name):
                            # Extract total amount
                            parts = NUMBER_SPLIT_PATTERN.split(category_name, maxsplit=1)
                            if len(parts) == 2:
                                amount = parse_amount(parts[1].strip())
                                if amount is not None:
                                    totals[current_section] = amount
                            current_parent = None
                            parent_stack = []
                            continue
                    # Create new top-level category
                    entry = Entry(name=category_name, amount=None)
                    sections[current_section].append(entry)
                    current_parent = entry
                    parent_stack = [(0, entry)]
                    continue

            name, amount = extract_name_and_amount(content)

            # Skip calculation check bullets or narration
            if name.lower().startswith("calcul") or name.lower().startswith("note"):
                continue

            if current_section == "metrics":
                if indent_level > 0:
                    continue
                metric_name, metric_value_text = split_name_and_value(content)
                if metric_value_text is None:
                    continue
                lowered = metric_name.lower()
                for spec in METRIC_SPECS:
                    if any(alias in lowered for alias in spec["aliases"]):
                        parsed_value = parse_metric_value(
                            metric_value_text, spec["type"]
                        )
                        # Only set if we got a valid parsed value, otherwise leave as None
                        if parsed_value is not None:
                            metrics[spec["field"]] = parsed_value
                        break
                continue

            # Handle nested structure - track parent chain based on indent level
            if current_parent is not None:
                if name.lower().startswith("total"):
                    # Set parent's total
                    current_parent.amount = amount
                    # Clear parent stack when we hit a total
                    parent_stack = []
                    continue
                
                # Find the correct parent based on indent level
                # Remove parents from stack that are at same or deeper indent
                while parent_stack and parent_stack[-1][0] >= indent_level:
                    parent_stack.pop()
                
                # Get the appropriate parent (deepest one at shallower indent)
                if parent_stack:
                    actual_parent = parent_stack[-1][1]
                else:
                    actual_parent = current_parent
                
                # Add as child
                child = Entry(name=name, amount=amount)
                actual_parent.children.append(child)
                
                # If this child might have children (no amount yet), add to stack
                if amount is None:
                    parent_stack.append((indent_level, child))
                continue

            # No current parent - this is a top-level entry
            if indent_level == 0:
                # Top-level bullet
                if name.lower().startswith("total "):
                    totals[current_section] = amount
                    current_parent = None
                    continue

                entry = Entry(name=name, amount=amount)
                sections[current_section].append(entry)
                current_parent = entry if amount is None else None
                if amount is None:
                    parent_stack = [(0, entry)]
                else:
                    parent_stack = []
            else:
                # Indented bullet but no parent - skip
                continue

    # Backfill missing totals from child sums
    for category in sections.values():
        for entry in category:
            if entry.amount is None and entry.children:
                entry.amount = round(
                    sum(child.amount or 0 for child in entry.children), 6
                )

    return {"sections": sections, "totals": totals, "metrics": metrics}


def slugify(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text)
    ascii_text = "".join(ch for ch in normalized if not unicodedata.combining(ch))
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_text.lower())
    return slug.strip("-")


def format_currency(amount: Optional[float]) -> Optional[str]:
    if amount is None:
        return None
    if amount >= 1:
        return f"${amount:.1f}B"
    millions = int(round(amount * 1000))
    return f"${millions}M"


def format_signed_currency(amount: Optional[float]) -> Optional[str]:
    if amount is None:
        return None
    formatted = format_currency(abs(amount))
    if formatted is None:
        return None
    return f"-{formatted}" if amount < 0 else formatted


def build_sankey_data(parsed: dict, city_name: str) -> dict:
    totals = parsed["totals"]
    sections = parsed["sections"]
    metrics = parsed.get("metrics", {})

    total_revenue = totals["revenues"]
    total_spending = totals["expenses"]
    budget_balance = (
        None
        if total_revenue is None or total_spending is None
        else round(total_revenue - total_spending, 6)
    )

    property_tax_revenue = metrics.get("propertyTaxRevenue")
    if property_tax_revenue is None:
        property_tax_entry = next(
            (entry for entry in sections["revenues"] if "tax" in entry.name.lower()),
            None,
        )
        if property_tax_entry:
            property_tax_revenue = property_tax_entry.amount

    population = metrics.get("population")
    per_capita_spending = (
        int(round((total_spending * 1_000_000_000) / population))
        if population and total_spending
        else None
    )
    property_tax_per_capita = (
        int(round((property_tax_revenue * 1_000_000_000) / population))
        if population and property_tax_revenue is not None
        else None
    )

    sankey = {
        "city": city_name,
        "total": total_revenue,
        "spending": total_spending,
        "revenue": total_revenue,
        "budget_balance": budget_balance,
        "spending_data": {
            "name": "Spending",
            "children": [entry.to_sankey_node() for entry in sections["expenses"]],
        },
        "revenue_data": {
            "name": "Revenue",
            "children": [entry.to_sankey_node() for entry in sections["revenues"]],
        },
        "population": population,
        "per_capita_spending": per_capita_spending,
        "property_tax_per_capita": property_tax_per_capita,
        "property_tax_revenue": property_tax_revenue,
    }
    return sankey


def build_summary_data(parsed: dict, city_name: str, year: str, source: str, pdf_url: Optional[str] = None) -> dict:
    totals = parsed["totals"]
    total_spending = totals["expenses"]
    sections = parsed["sections"]
    metrics = parsed.get("metrics", {})
    total_revenue = totals["revenues"]
    budget_balance = (
        None
        if total_revenue is None or total_spending is None
        else round(total_revenue - total_spending, 6)
    )
    population = metrics.get("population")
    property_tax_revenue = metrics.get("propertyTaxRevenue")
    if property_tax_revenue is None:
        property_tax_entry = next(
            (entry for entry in sections["revenues"] if "tax" in entry.name.lower()),
            None,
        )
        if property_tax_entry:
            property_tax_revenue = property_tax_entry.amount
    property_tax_per_capita = (
        int(round((property_tax_revenue * 1_000_000_000) / population))
        if property_tax_revenue is not None and population
        else None
    )
    per_capita_spending = (
        int(round((total_spending * 1_000_000_000) / population))
        if population and total_spending
        else None
    )

    ministries = []
    if total_spending and not math.isclose(total_spending, 0):
        for entry in sections["expenses"]:
            percentage = (
                (entry.amount or 0) / total_spending * 100 if total_spending else 0
            )
            ministries.append(
                {
                    "name": entry.name,
                    "slug": slugify(entry.name),
                    "totalSpending": entry.amount,
                    "totalSpendingFormatted": format_currency(entry.amount),
                    "percentage": round(percentage, 6),
                    "percentageFormatted": f"{round(percentage, 1)}%",
                }
            )

    summary = {
        "name": city_name,
        "financialYear": year,
        "source": source,
        "pdfUrl": pdf_url,
        "totalProvincialSpending": total_spending,
        "totalProvincialSpendingFormatted": format_currency(total_spending),
        "totalEmployees": metrics.get("totalEmployees"),
        "netDebt": metrics.get("netDebt"),
        "totalDebt": metrics.get("totalDebt"),
        "debtInterest": metrics.get("debtInterest"),
        "population": population,
        "budgetBalance": budget_balance,
        "budgetBalanceFormatted": format_signed_currency(budget_balance),
        "perCapitaSpending": per_capita_spending,
        "propertyTaxPerCapita": property_tax_per_capita,
        "propertyTaxRevenue": property_tax_revenue,
        "propertyTaxRevenueFormatted": format_currency(property_tax_revenue),
        "ministries": ministries,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }
    return summary


def write_json(data: dict, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")


def download_pdf(url: str, output_path: Path) -> None:
    """Download PDF from URL to the specified path."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        urlretrieve(url, output_path)
    except Exception as e:
        raise RuntimeError(f"Failed to download PDF: {e}") from e


def load_prompt_template(prompt_file: Path) -> str:
    """Load the prompt template from file."""
    if not prompt_file.exists():
        raise FileNotFoundError(f"Prompt file not found: {prompt_file}")
    with prompt_file.open("r", encoding="utf-8") as f:
        content = f.read()
    # Remove the "Model: ..." line if present
    lines = content.split("\n")
    if lines[0].startswith("Model:"):
        content = "\n".join(lines[2:])  # Skip model line and blank line
    # Extract just the prompt content (between ``` markers if present)
    if "```" in content:
        parts = content.split("```")
        if len(parts) >= 3:
            content = parts[1].strip()
    return content.strip()


def call_openai_api(
    pdf_path: Path, prompt_template: str, year: str, model: str
) -> str:
    """Extract data from PDF using OpenAI Chat Completions API with file upload."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError(
            "OPENAI_API_KEY environment variable not set. "
            "Set it with: export OPENAI_API_KEY='your-key-here'"
        )

    try:
        from openai import OpenAI
    except ImportError:
        raise ImportError(
            "openai package not installed. "
            "Install with: pip install -r data/gatineau/scripts/requirements.txt"
        )

    client = OpenAI(api_key=api_key)
    prompt = prompt_template.replace("<year>", year)

    print(f"Uploading PDF and calling {model}...")
    file_obj = None
    try:
        # Upload and process file
        with pdf_path.open("rb") as pdf_file:
            file_obj = client.files.create(file=pdf_file, purpose="assistants")
        
        while file_obj.status != "processed":
            if file_obj.status == "error":
                raise RuntimeError("File upload failed")
            time.sleep(1)
            file_obj = client.files.retrieve(file_obj.id)

        # Call API with file attachment
        response = client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": f"{prompt}\n\nExtract the budget data from the attached PDF for year {year}. Follow the instructions exactly."
                        },
                        {"type": "file", "file_id": file_obj.id}
                    ]
                }
            ],
            temperature=0,
        )

        if response.choices and response.choices[0].message.content:
            return response.choices[0].message.content
        raise RuntimeError("No response content from API")

    except Exception as e:
        raise RuntimeError(f"OpenAI API call failed: {e}") from e
    finally:
        if file_obj:
            try:
                client.files.delete(file_obj.id)
            except Exception:
                pass


def extract_with_openai(
    pdf_path: Path, prompt_file: Path, output_markdown: Path, year: str, model: str
) -> None:
    """Extract data from PDF using OpenAI API."""
    prompt_template = load_prompt_template(prompt_file)
    extracted_text = call_openai_api(pdf_path, prompt_template, year, model)
    output_markdown.parent.mkdir(parents=True, exist_ok=True)
    output_markdown.write_text(extracted_text, encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Download, extract, and convert Gatineau budget data into structured JSON.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Full workflow: download, extract, and convert
  python3 processor.py --year 2025 --pdf-url <url>

  # Just extract and convert (PDF already downloaded)
  python3 processor.py --year 2025 --extract

  # Just convert (markdown already exists)
  python3 processor.py --year 2025
        """,
    )
    parser.add_argument(
        "--year",
        required=True,
        help="Financial year to process (e.g. 2025).",
    )
    parser.add_argument(
        "--pdf-url",
        default=None,
        help="URL to download the budget PDF from. If provided, PDF will be downloaded.",
    )
    parser.add_argument(
        "--extract",
        action="store_true",
        help="Extract data from PDF using OpenAI API. Requires OPENAI_API_KEY env var.",
    )
    parser.add_argument(
        "--input-markdown",
        default=None,
        help=(
            "Markdown file containing the revenue and expense summary. "
            "Defaults to data/gatineau/extracted/<year>/llm_extracted.md."
        ),
    )
    parser.add_argument(
        "--output-dir",
        default="data/gatineau",
        help="Directory where sankey.json and summary.json will be written.",
    )
    parser.add_argument("--city-name", default="Gatineau")
    parser.add_argument(
        "--source",
        default=None,
        help=(
            "Source reference for the summary metadata. "
            "Defaults to data/gatineau/raw/Gatineau Budget <year>.pdf."
        ),
    )
    parser.add_argument(
        "--model",
        default=OPENAI_MODEL,
        help=f"OpenAI model to use for extraction. Defaults to {OPENAI_MODEL}.",
    )
    parser.add_argument(
        "--prompt-file",
        default="data/gatineau/llm_prompt.txt",
        help="Path to the prompt template file. Defaults to data/gatineau/llm_prompt.txt.",
    )
    args = parser.parse_args()

    base_dir = Path("data/gatineau")
    year = args.year
    city_name = args.city_name

    # Step 1: Download PDF if needed
    pdf_path = base_dir / "raw" / f"{city_name} Budget {year}.pdf"
    pdf_url = args.pdf_url
    if pdf_url and not pdf_path.exists():
        print(f"Step 1: Downloading PDF...")
        download_pdf(pdf_url, pdf_path)
    elif args.extract and not pdf_path.exists():
        print(f"Error: PDF not found at {pdf_path}. Provide --pdf-url to download it.")
        sys.exit(1)

    # Step 2: Extract with OpenAI if requested
    markdown_path = (
        Path(args.input_markdown)
        if args.input_markdown
        else base_dir / "extracted" / year / "llm_extracted.md"
    )
    prompt_file = Path(args.prompt_file)

    if args.extract:
        print(f"Step 2: Extracting data from PDF...")
        try:
            extract_with_openai(pdf_path, prompt_file, markdown_path, year, args.model)
        except ValueError as e:
            print(f"\n⚠️  {e}\n")
            print(f"Alternatively, manually extract using the prompt from {prompt_file}")
            sys.exit(1)
        except Exception as e:
            print(f"Error: {e}")
            sys.exit(1)
    elif not markdown_path.exists():
        print(f"Error: Markdown file not found at {markdown_path}")
        print("Run with --extract to extract from PDF, or provide --input-markdown")
        sys.exit(1)

    # Step 3: Convert markdown to JSON
    print(f"Step 3: Converting markdown to JSON...")
    parsed = parse_markdown(markdown_path)
    
    output_dir = Path(args.output_dir)
    sankey_path = output_dir / "sankey.json"
    summary_path = output_dir / "summary.json"
    
    # Preserve existing PDF URL from summary.json if no new URL provided
    existing_pdf_url = None
    if summary_path.exists():
        try:
            existing_data = json.loads(summary_path.read_text())
            # Check both pdfUrl and source fields (source may contain URL)
            existing_pdf_url = existing_data.get("pdfUrl")
            if not existing_pdf_url and existing_data.get("source", "").startswith("http"):
                existing_pdf_url = existing_data.get("source")
        except Exception:
            pass
    
    # Use provided URL, or preserve existing, or None
    final_pdf_url = pdf_url or existing_pdf_url
    
    source = args.source or pdf_url or f"data/gatineau/raw/{city_name} Budget {year}.pdf"
    write_json(build_sankey_data(parsed, city_name), sankey_path)
    write_json(build_summary_data(parsed, city_name, year, source, final_pdf_url), summary_path)
    
    print(f"\n✅ Generated: {sankey_path}, {summary_path}")


if __name__ == "__main__":
    main()

