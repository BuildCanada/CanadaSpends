# Quebec Government's Revenue and Spending - FY 2024-25

This directory contains the source data, and derived JSON files that power the Alberta view in **Canada Spends**.
All monetary figures are expressed in **billions of dollars (B$)** unless noted otherwise.

---

## 1. Data Source

_Public Account (FY 2024-25) published by the Government of Quebec._
Official URL: [https://www.finances.gouv.qc.ca/department/public_finance/public_accounts/]("https://www.finances.gouv.qc.ca/department/public_finance/public_accounts/")

\_Supporting Data from Données Québec ([source 1](https://www.donneesquebec.ca/recherche/dataset/comptes-publics-du-gouvernement-volume-2/resource/faafc34e-d67f-4912-a32c-98e2ab1482be), [source 2](https://www.donneesquebec.ca/recherche/dataset/comptes-publics-du-gouvernement-volume-2/resource/faafc34e-d67f-4912-a32c-98e2ab1482be))

## All numbers/images originate from PDF tables in those documents.

## 2. Methodology & Key Assumptions

1. **Audited vs. unaudited figure treatment**• Provincial-level totals are audited.• Ministry-level tables are _unaudited_; any difference between their sum and the audited provincial total is recorded as **“Other”** or **“Inter-portfolio elimination”** to account for inter department spending/accounting.
2. **Revenues vs. Expenses**• Revenues — revenue number are from consolidated line by line item of each portoflio revenue, special funds • Expenses — follow the structure of Portfolio -> Program -> Elements. Element level items corresponds to appropriation transfered, with approval from National Assembly to reflect what was actually spent. Special Funds expenditure by line items are also reflected here. Any difference between their sum and the audited provincial total is recorded as **“Other”** or **“Inter-portfolio elimination”** to account for inter department spending/accounting.
3. **Screenshots as immutable evidence**Every number used is traceable back to an image in `data/`. This is taken from the Volume 1 and Volume 2 PDF public accounts.
4. **Specific judgment calls** -
   - While Portfolio is not 1 to 1 mapped to specific ministry, we can rely on this breakdown for simplification of the model. The Ministry spending is then mapped to the closest assigned Portfolio (usually with the same name).
   - Make sure to provide to provide and maintain French, and English version
   - I also prepared to a simplified Sankey version which includes only the \*\*Audited Revenue and Expenditure by Portfolio" which is 1 level deep for a more accurated and clear view. Can consider swapping between the 2 views.

---

## 3. Contribution Notes

_Authored by:_ **`<Quan Nguyen>`** (GitHub: `@<https://github.com/nguyenquannnn/`>). Powered by Gemini 3 and Kiro.

_Have questions or spot an issue?_
Please open an issue or pull request and reference the specific CSV line or screenshot — every figure is traceable.
