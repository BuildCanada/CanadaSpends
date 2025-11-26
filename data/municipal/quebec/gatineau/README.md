# Gatineau Financial Actuals Data

Extract and process Gatineau's municipal financial actuals (consolidated accounting actuals, not budgeted projections).

## Setup

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r data/gatineau/scripts/requirements.txt
```

## Usage

**Full workflow:**

```bash
export OPENAI_API_KEY='your-key-here'
python3 data/gatineau/scripts/processor.py --year 2024 --pdf-url "https://..." --extract
```

**Extract only (PDF already downloaded):**

```bash
export OPENAI_API_KEY='your-key-here'
python3 data/gatineau/scripts/processor.py --year 2024 --extract
```

**Convert only (markdown already exists):**

```bash
python3 data/gatineau/scripts/processor.py --year 2024
```

Defaults to `extracted/<year>/llm_extracted_en.md`. Use `--input-markdown` to specify a different file.

**Manual extraction:**

1. Open `raw/Gatineau Consolidated Financial Report <year>.pdf`
2. Use prompt from `llm_prompt.txt` with your LLM
3. Save output to `extracted/<year>/llm_extracted.md` (French) or `llm_extracted_en.md` (English)
4. Run converter: `python3 data/gatineau/scripts/processor.py --year 2024`

## Output

- `sankey.json` - Hierarchical financial data for visualization
- `summary.json` - Metadata, metrics, and ministry breakdowns

## Data Format

Markdown must include:

- `## Key Metrics – <year>` (population, employees, debt, property tax)
- `## Revenues – <year>` (nested bullets with amounts)
- `## Expenses – <year>` (nested bullets with amounts)

All amounts must be in full dollars (e.g., `$123,456,789`), not thousands. See `llm_prompt.txt` for full specification.

## Processing Features

- Collapses single-child categories into "parent – child" format
- Handles negative values (parentheses format)
- Preserves hierarchy for categories with multiple children
- Backfills totals by summing children when missing
