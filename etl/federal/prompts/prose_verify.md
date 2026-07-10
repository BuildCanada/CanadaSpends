You are fact-checking a draft paragraph of civic copy about a Government of
Canada department's spending, against the JSON data it was supposed to be
based on.

JSON source of record:
{{CONTEXT}}

Draft prose:
{{PROSE}}

For every factual claim in the draft (a program name, an organization, a
vote or transfer-payment category, a comparison, a claim of
"largest"/"most"/"increase"/"one of" or similar), check whether it is
directly supported by the JSON above.

Output a short plain-text list of ONLY the claims that are NOT clearly
supported by the JSON (unsupported, exaggerated, or unverifiable from this
data alone). For each flagged claim, quote the phrase from the draft and say
briefly why it isn't supported. If every claim is supported, output exactly
the line:
No unsupported claims found.

Do not restate the whole draft. Do not use markdown formatting.
