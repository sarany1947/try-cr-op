# Paste URL → tailored resume PDF

Always-on **minimal website**: open the page, paste a job URL, get a **PDF** built with:

1. Playwright — loads the posting page and extracts text  
2. Gemini — reads `resume/tailoring-prompt.txt` + `cv.md` + JD text, returns JSON sections  
3. `templates/cv-template.html` — filled and passed to `generate-pdf.mjs`

## What you must do (checklist)

| Step | Action |
|------|--------|
| 1 | Put **`cv.md`** and **`config/profile.yml`** on the machine (same as rest of career-ops). |
| 2 | Keep **`resume/tailoring-prompt.txt`** up to date. |
| 3 | Create **`.env`** in repo root with **`GEMINI_API_KEY=`** ([Google AI Studio](https://aistudio.google.com/apikey)). |
| 4 | Set a strong secret: **`PASTE_API_TOKEN=`** (long random string). |
| 5 | On Azure VM: **`npm install`**, **`npx playwright install chromium`**. |
| 6 | Run the server (**bind localhost** unless you know what you’re doing): `npm run pasta` |
| 7 | Put **HTTPS + reverse proxy** (nginx / Azure App Gateway / Front Door) in front; **never** expose `:8790` raw to the internet. Optional: Entra ID / VPN. |

## Commands

```bash
# Web UI + PDF download on submit
export PASTE_API_TOKEN='your-long-secret'
export GEMINI_API_KEY='your-key'
export BIND_HOST=0.0.0.0
export PORT=8790
npm run pasta
```

```bash
# One-shot from SSH (no browser)
export GEMINI_API_KEY='your-key'
node paste-pipeline/cli.mjs "https://company.com/jobs/xyz"
```

## Limits

- Some career sites block bots or need login — fetch may fail; paste JD text into a future variant if needed.  
- Gemini must return **valid JSON**; if parsing fails, check `cli.mjs` error snippet.  
- This automates **your** tailoring rules but cannot guarantee ATS score — review PDFs before applying.

## Env reference

| Variable | Purpose |
|----------|---------|
| `GEMINI_API_KEY` | Required |
| `GEMINI_MODEL` | Default `gemini-2.0-flash` |
| `PASTE_API_TOKEN` | Required for **POST /run** (form field `token`) |
| `CV_PDF_FORMAT` | `letter` or `a4` (default `letter`) |
| `PORT` / `PASTE_PORT` | Default `8790` |
| `BIND_HOST` | Default `127.0.0.1` |
