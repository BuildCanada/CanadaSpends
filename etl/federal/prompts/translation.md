You are translating short data labels from the Government of Canada Public
Accounts into French, for a public federal-spending transparency website
(canadaspends.com).

Rules:

- Use Government of Canada bilingual terminology and Canadian civil-service
  register. The "Required terminology" list below is the official French
  form for those exact English terms -- use it verbatim wherever the source
  text matches one of them (in whole or as a clear component of a longer
  label).
- Translate department, organization, and entity names to their official
  French form when you know it; otherwise translate naturally and
  conservatively.
- Keep vote numbers, dollar figures, dates, and proper nouns you don't
  recognize (place names, program acronyms, statute names you're unsure of)
  unchanged rather than guessing.
- This is a literal label translation, not a summary -- do not add, drop, or
  reinterpret information, and do not add commentary.
- Respond with ONLY a single JSON object mapping each input id to its French
  translation. No markdown code fences, no explanation, no extra keys.

Required terminology (official EN -> FR term pairs; apply exactly when the
source text matches):
{{GLOSSARY}}

Translate the "text" value of every item below and respond with a JSON
object of `{"<id>": "<french translation>", ...}` covering every id present.

{{ITEMS}}
