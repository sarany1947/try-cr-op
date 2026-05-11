# Career-Ops — ChatGPT, Cursor, OpenAI Codex

No Claude subscription required. **GPT-5 / GPT-4.x / Gemini / any agent that can read this repo** runs the same pipeline as Claude Code.

## Canonical instructions

| File | Role |
|------|------|
| **`AGENTS.md`** | Full agent rules (Codex label; applies to all assistants). Read this first. |
| **`modes/_shared.md`** + task mode | e.g. `modes/pdf.md`, `modes/oferta.md` |

Slash commands are Claude/Gemini-CLI conveniences only. **Everything important lives in `modes/*.md`.**

## Cursor or ChatGPT (this repo open)

1. Open the **career-ops** folder as the workspace / upload key files if needed.
2. Ask the agent to **follow `AGENTS.md`** and load **`modes/_shared.md`** plus the mode for your task.
3. **Tailored resume:** say “run **`pdf`** mode for this JD” — the agent must read **`resume/tailoring-prompt.txt`** (STEP 1–16) when present, then fill **`templates/cv-template.html`** and run **`node generate-pdf.mjs`**.

## Gemini CLI users

See **`GEMINI.md`** for `/career-ops-*` slash commands (same underlying modes).

## Per-job resumes (expected)

- **`cv.md`** = stable **evidence bank** (facts, roles, tools, wins). Update it over time; do **not** overwrite it with a single JD.
- **Each job** gets its **own** tailored artifact: **`output/cv-{candidate}-{company}-{YYYY-MM-DD}.pdf`** (and optional temp HTML). Content changes every time because **`resume/tailoring-prompt.txt`** + JD drive the rewrite.

## Terraform / Azure VM

**Do not run `terraform` on your laptop.** Use **GitHub Actions → Terraform (Azure)** only. See `deploy/terraform/DONT_RUN_LOCALLY.md`.

## Update check

Same as `AGENTS.md`:

```bash
node update-system.mjs check
```
