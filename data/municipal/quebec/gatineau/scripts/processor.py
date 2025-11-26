#!/usr/bin/env python3
"""Convert Gatineau financial actuals markdown summary into sankey.json and summary.json."""

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

OPENAI_MODEL = "gpt-4o"

NUMBER_SPLIT_PATTERN = re.compile(r"\s[–-]\s")
LEADING_BULLET_PATTERN = re.compile(r"^(\s*)[*-]\s+")
LEADING_HEADER_PATTERN = re.compile(r"^###\s+\*\*(.+?)\*\*")
METRIC_SECTION_KEYWORDS = ("key metrics", "overview", "summary", "key facts")
METRIC_SPECS = [
    {"field": "population", "aliases": ("population",), "type": "integer"},
    {"field": "totalEmployees", "aliases": ("total employees", "public service employees"), "type": "integer"},
    {"field": "netDebt", "aliases": ("net debt",), "type": "currency"},
    {"field": "totalDebt", "aliases": ("total debt",), "type": "currency"},
    {"field": "debtInterest", "aliases": ("debt interest", "interest on debt", "annual interest on debt"), "type": "currency"},
    {"field": "propertyTaxRevenue", "aliases": ("property tax revenue", "property taxes revenue"), "type": "currency"},
]


@dataclass
class Entry:
    name: str
    amount: Optional[float] = None
    children: List["Entry"] = field(default_factory=list)

    def to_sankey_node(self) -> dict:
        """Convert Entry to sankey node format. Collapses single-child categories into "parent – child"."""
        node: dict = {"name": self.name}
        if not self.children:
            node["amount"] = self.amount
            return node
        
        if len(self.children) == 1:
            child_node = self.children[0].to_sankey_node()
            if "children" in child_node or " – " in child_node["name"]:
                node["children"] = [child_node]
            else:
                node["name"] = f"{self.name} – {child_node['name']}"
                node["amount"] = child_node.get("amount")
        else:
            node["children"] = [child.to_sankey_node() for child in self.children]
        return node


def parse_amount(text: str) -> Optional[float]:
    """Convert '$123,456,789' or '($123,456,789)' string to billions of dollars.
    Negative values are indicated by parentheses: ($123) = -$123
    """
    cleaned_for_check = text.replace("**", "").strip()
    is_negative = cleaned_for_check.startswith("(") and cleaned_for_check.endswith(")")
    
    cleaned = (
        text.replace("**", "")
        .replace("≈", "")
        .replace("$", "")
        .replace(",", "")
        .replace(" ", "")
    )
    cleaned = re.sub(r"[()]", "", cleaned).strip()
    
    if not cleaned or cleaned in {"-", "–"}:
        return None
    try:
        value = float(cleaned) / 1_000_000_000
        return -value if is_negative else value
    except ValueError:
        return None


def clean_name(text: str) -> str:
    stripped = text.strip()
    if stripped.startswith("**") and stripped.endswith("**"):
        stripped = stripped[2:-2]
    return stripped.strip(" -*")


def split_name_and_value(raw: str) -> tuple[str, Optional[str]]:
    """Split line into name and value, handling multiple dashes."""
    cleaned = raw.replace("**", "")
    parts = re.split(r"\s[–-]\s+", cleaned)
    
    if len(parts) < 2:
        return clean_name(cleaned), None
    
    amount_pattern = re.compile(r"^[\d\s,]+(?:\s*\$?)?$")
    
    for i in range(len(parts) - 1, 0, -1):
        potential_amount = parts[i].strip()
        if amount_pattern.match(potential_amount) or re.search(r"\d", potential_amount):
            name = " – ".join(parts[:i]).strip(" -*")
            return name, potential_amount
    
    if len(parts) >= 2:
        name = " – ".join(parts[:-1]).strip(" -*")
        return name, parts[-1].strip()
    
    return clean_name(cleaned), None


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
        return numeric / 1_000_000_000
    return numeric


def parse_markdown(filepath: Path) -> dict:
    sections = {"revenues": [], "expenses": []}
    totals = {"revenues": None, "expenses": None}
    metrics: Dict[str, Optional[float]] = {spec["field"]: None for spec in METRIC_SPECS}

    current_section: Optional[str] = None
    current_parent: Optional[Entry] = None
    parent_stack: List[tuple[int, Entry]] = []

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
            
            header_match = LEADING_HEADER_PATTERN.match(stripped)
            if header_match and current_section in ("revenues", "expenses"):
                category_name = header_match.group(1).strip()
                if "total" in category_name.lower():
                    current_parent = None
                    parent_stack = []
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
                parent_stack = [(0, entry)]
                continue
            
            if stripped.startswith("##"):
                header = stripped.lower()
                if any(keyword in header for keyword in METRIC_SECTION_KEYWORDS):
                    current_section = "metrics"
                    current_parent = None
                    continue
            if current_section is None:
                continue
            if stripped in {"", "---"} or (stripped.startswith("(") and stripped.endswith(")")):
                continue
            
            bullet_match = LEADING_BULLET_PATTERN.match(line)
            if not bullet_match:
                continue

            indent_level = len(bullet_match.group(1))
            content = line[bullet_match.end() :].strip()

            if not content:
                continue

            if indent_level == 0 and current_section in ("revenues", "expenses"):
                bold_match = re.match(r"^\*\*(.+?)\*\*\s*$", content)
                if bold_match:
                    category_name = bold_match.group(1).strip()
                    if "total" in category_name.lower():
                        if "–" in category_name or "-" in category_name or re.search(r'\d', category_name):
                            parts = NUMBER_SPLIT_PATTERN.split(category_name, maxsplit=1)
                            if len(parts) == 2:
                                amount = parse_amount(parts[1].strip())
                                if amount is not None:
                                    totals[current_section] = amount
                            current_parent = None
                            parent_stack = []
                            continue
                    entry = Entry(name=category_name, amount=None)
                    sections[current_section].append(entry)
                    current_parent = entry
                    parent_stack = [(0, entry)]
                    continue

            name, amount = extract_name_and_amount(content)

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
                        parsed_value = parse_metric_value(metric_value_text, spec["type"])
                        if parsed_value is not None:
                            metrics[spec["field"]] = parsed_value
                        break
                continue

            if current_parent is not None:
                if name.lower().startswith("total"):
                    current_parent.amount = amount
                    parent_stack = []
                    continue
                
                while parent_stack and parent_stack[-1][0] >= indent_level:
                    parent_stack.pop()
                
                actual_parent = parent_stack[-1][1] if parent_stack else current_parent
                child = Entry(name=name, amount=amount)
                actual_parent.children.append(child)
                
                if amount is None:
                    parent_stack.append((indent_level, child))
                continue

            if indent_level == 0:
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
                continue

    def backfill_entry(entry: Entry) -> None:
        """Backfill missing amounts by summing children."""
        for child in entry.children:
            backfill_entry(child)
        if entry.amount is None and entry.children:
            entry.amount = sum(child.amount or 0 for child in entry.children)
    
    for category in sections.values():
        for entry in category:
            backfill_entry(entry)

    for section_name in ("revenues", "expenses"):
        if totals[section_name] is None and sections[section_name]:
            grand_total = sum(entry.amount or 0 for entry in sections[section_name])
            if grand_total > 0:
                totals[section_name] = grand_total

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


def _get_property_tax_revenue(metrics: dict, sections: dict) -> Optional[float]:
    """Get property tax revenue from metrics or find it in revenue sections."""
    revenue = metrics.get("propertyTaxRevenue")
    if revenue is None:
        tax_entry = next(
            (entry for entry in sections["revenues"] if "tax" in entry.name.lower()),
            None,
        )
        if tax_entry:
            revenue = tax_entry.amount
    return revenue


def _calculate_per_capita(amount: Optional[float], population: Optional[int]) -> Optional[int]:
    """Calculate per capita amount in dollars."""
    if population and amount:
        return int(round((amount * 1_000_000_000) / population))
    return None


def build_sankey_data(parsed: dict, city_name: str) -> dict:
    totals = parsed["totals"]
    sections = parsed["sections"]
    metrics = parsed.get("metrics", {})

    total_revenue = totals["revenues"]
    total_spending = totals["expenses"]
    budget_balance = (
        None if total_revenue is None or total_spending is None
        else total_revenue - total_spending
    )

    property_tax_revenue = _get_property_tax_revenue(metrics, sections)
    population = metrics.get("population")
    per_capita_spending = _calculate_per_capita(total_spending, population)
    property_tax_per_capita = _calculate_per_capita(property_tax_revenue, population)

    return {
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


def build_summary_data(parsed: dict, city_name: str, year: str, source: str, pdf_url: Optional[str] = None) -> dict:
    totals = parsed["totals"]
    total_spending = totals["expenses"]
    total_revenue = totals["revenues"]
    sections = parsed["sections"]
    metrics = parsed.get("metrics", {})
    
    budget_balance = (
        None if total_revenue is None or total_spending is None
        else total_revenue - total_spending
    )
    
    population = metrics.get("population")
    property_tax_revenue = _get_property_tax_revenue(metrics, sections)
    property_tax_per_capita = _calculate_per_capita(property_tax_revenue, population)
    per_capita_spending = _calculate_per_capita(total_spending, population)

    ministries = []
    if total_spending and not math.isclose(total_spending, 0):
        for entry in sections["expenses"]:
            percentage = (entry.amount or 0) / total_spending * 100 if total_spending else 0
            ministries.append({
                "name": entry.name,
                "slug": slugify(entry.name),
                "totalSpending": entry.amount,
                "totalSpendingFormatted": format_currency(entry.amount),
                "percentage": round(percentage, 6),
                "percentageFormatted": f"{round(percentage, 1)}%",
            })

    return {
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


def write_json(data: dict, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")


def download_pdf(url: str, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        urlretrieve(url, output_path)
    except Exception as e:
        raise RuntimeError(f"Failed to download PDF: {e}") from e


def load_prompt_template(prompt_file: Path) -> str:
    if not prompt_file.exists():
        raise FileNotFoundError(f"Prompt file not found: {prompt_file}")
    with prompt_file.open("r", encoding="utf-8") as f:
        content = f.read()
    lines = content.split("\n")
    if lines[0].startswith("Model:"):
        content = "\n".join(lines[2:])
    if "```" in content:
        parts = content.split("```")
        if len(parts) >= 3:
            content = parts[1].strip()
    return content.strip()


def call_openai_api(pdf_path: Path, prompt_template: str, year: str, model: str) -> str:
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
    prompt = prompt_template.replace("{{YEAR}}", year).replace("<year>", year)

    print(f"Uploading PDF and calling {model}...")
    file_obj = None
    try:
        with pdf_path.open("rb") as pdf_file:
            file_obj = client.files.create(file=pdf_file, purpose="assistants")
        
        while file_obj.status != "processed":
            if file_obj.status == "error":
                raise RuntimeError("File upload failed")
            time.sleep(1)
            file_obj = client.files.retrieve(file_obj.id)

        response = client.chat.completions.create(
            model=model,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": f"{prompt}\n\nExtract the financial actuals data from the attached PDF for year {year}. Follow the instructions exactly."
                    },
                    {"type": "file", "file_id": file_obj.id}
                ]
            }],
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


def extract_with_openai(pdf_path: Path, prompt_file: Path, output_markdown: Path, year: str, model: str) -> None:
    prompt_template = load_prompt_template(prompt_file)
    extracted_text = call_openai_api(pdf_path, prompt_template, year, model)
    output_markdown.parent.mkdir(parents=True, exist_ok=True)
    output_markdown.write_text(extracted_text, encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Convert Gatineau financial actuals markdown to JSON.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python3 processor.py --year 2024 --pdf-url <url> --extract
  python3 processor.py --year 2024 --extract
  python3 processor.py --year 2024
        """,
    )
    parser.add_argument("--year", required=True, help="Financial year (e.g. 2024)")
    parser.add_argument("--pdf-url", default=None, help="URL to download PDF from")
    parser.add_argument("--extract", action="store_true", help="Extract from PDF using OpenAI API")
    parser.add_argument("--input-markdown", default=None, help="Markdown file path")
    parser.add_argument("--output-dir", default="data/gatineau", help="Output directory")
    parser.add_argument("--city-name", default="Gatineau")
    parser.add_argument("--source", default=None, help="Source reference")
    parser.add_argument("--model", default=OPENAI_MODEL, help=f"OpenAI model (default: {OPENAI_MODEL})")
    parser.add_argument("--prompt-file", default="data/gatineau/llm_prompt.txt", help="Prompt template file")
    args = parser.parse_args()

    base_dir = Path("data/gatineau")
    year = args.year
    city_name = args.city_name

    pdf_path = base_dir / "raw" / f"{city_name} Consolidated Financial Report {year}.pdf"
    if args.pdf_url and not pdf_path.exists():
        print("Step 1: Downloading PDF...")
        download_pdf(args.pdf_url, pdf_path)
    elif args.extract and not pdf_path.exists():
        print(f"Error: PDF not found at {pdf_path}. Provide --pdf-url to download it.")
        sys.exit(1)

    markdown_path = (
        Path(args.input_markdown)
        if args.input_markdown
        else base_dir / "extracted" / year / "llm_extracted_en.md"
    )
    prompt_file = Path(args.prompt_file)

    if args.extract:
        print("Step 2: Extracting data from PDF...")
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

    print("Step 3: Converting markdown to JSON...")
    parsed = parse_markdown(markdown_path)
    
    output_dir = Path(args.output_dir)
    sankey_path = output_dir / "sankey.json"
    summary_path = output_dir / "summary.json"
    
    existing_pdf_url = None
    if summary_path.exists():
        try:
            existing_data = json.loads(summary_path.read_text())
            existing_pdf_url = existing_data.get("pdfUrl")
            if not existing_pdf_url and existing_data.get("source", "").startswith("http"):
                existing_pdf_url = existing_data.get("source")
        except Exception:
            pass
    
    final_pdf_url = args.pdf_url or existing_pdf_url
    source = args.source or args.pdf_url or f"data/gatineau/raw/{city_name} Consolidated Financial Report {year}.pdf"
    write_json(build_sankey_data(parsed, city_name), sankey_path)
    write_json(build_summary_data(parsed, city_name, year, source, final_pdf_url), summary_path)
    
    print(f"\n✅ Generated: {sankey_path}, {summary_path}")


if __name__ == "__main__":
    main()
