# Resume sources (user layer)

This folder holds **your** base shell and **canonical tailoring prompt**. Updates from upstream never overwrite files here.

## Files

| File | Purpose |
|------|---------|
| `Sai_Saran_Base_Resume.docx` | **Shell:** identity, contact, client companies — often **no** responsibility bullets. Do not treat missing bullets as “no experience.” |
| `tailoring-prompt.txt` | **Instructions:** STEP 1–16 ATS/tailoring logic the agent must follow when generating tailored resume **content**. |

## How this fits career-ops

1. **Facts and proof** live in **`cv.md`**, **`article-digest.md`**, and **`interview-prep/story-bank.md`**. Populate these with real achievements, metrics, and tools so the tailoring prompt never has to invent experience.
2. **`pdf` mode** reads `tailoring-prompt.txt` (via `modes/_profile.md`) as the primary tailoring spec, then maps output into `templates/cv-template.html` → `generate-pdf.mjs`.
3. **Every job is different:** each JD gets a **fresh** tailored resume — new keywords, reordering, emphasis — saved as **`output/cv-{candidate}-{company}-{date}.pdf`**. That is expected. **`cv.md`** does not rotate per job; it remains your master inventory of truth.
4. **Any LLM:** Claude is optional. Use Cursor + GPT or Gemini — same files — see **`GPT.md`** and **`GEMINI.md`**.
5. The base DOCX is a **branding/contact shell**. If you need Word output, paste the generated sections into the DOCX manually or use a Word mail-merge workflow outside this repo.

## Privacy

`.docx` may contain PII. Keep the repo private or add `resume/*.docx` to `.gitignore` if you only want the prompt tracked.
