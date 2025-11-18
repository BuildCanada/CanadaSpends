# Gatineau Budget Data

Scripts and data for extracting and processing Gatineau's municipal budget data.

## Setup

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r data/gatineau/scripts/requirements.txt
```

## Usage

### Full Workflow

```bash
export OPENAI_API_KEY='your-key-here'
python3 data/gatineau/scripts/processor.py \
  --year 2025 \
  --pdf-url "https://www.gatineau.ca/..." \
  --extract
```

### Step-by-Step

**Download PDF:**

```bash
python3 data/gatineau/scripts/processor.py --year 2025 --pdf-url "https://..."
```

**Extract Data (requires API key):**

```bash
export OPENAI_API_KEY='your-key-here'
python3 data/gatineau/scripts/processor.py --year 2025 --extract
```

**Or Extract Manually:**

1. Open `raw/Gatineau Budget <year>.pdf`
2. Use prompt from `llm_prompt.txt` with your LLM
3. Save output to `extracted/<year>/llm_extracted.md`

**Convert to JSON:**

```bash
python3 data/gatineau/scripts/processor.py --year 2025
```

## Output

- `sankey.json` - Hierarchical budget data for visualization
- `summary.json` - Metadata, metrics, and ministry breakdowns

## Data Format

Extracted markdown must include:

- `## Key Metrics – <year>` section (population, employees, debt, property tax)
- `## Revenues – <year>` section with nested bullets
- `## Expenses – <year>` section with nested bullets

All amounts in thousands of dollars (`k$`). See `llm_prompt.txt` for full specification.
