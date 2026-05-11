# Publish this repo to `try-cr-op`

Your empty repo: **https://github.com/sarany1947/try-cr-op.git**

`origin` in this clone still points at **upstream** `santifer/career-ops` so you can pull updates. Add a **second remote** for your copy.

## Before you push

1. **Make `try-cr-op` Private** on GitHub (Settings → General → Danger zone → Change visibility) if you might ever commit resume text, prompts, or tokens by mistake.
2. Never commit **`.env`**, **`config/profile.yml`**, or **`modes/_profile.md`** — they are gitignored here for a reason.
3. **`resume/*.docx`** is gitignored so base Word shells do not land on GitHub by default; copy them manually onto the VM.

## Commands (run in your local `career-ops` folder)

```bash
git remote add try-cr-op https://github.com/sarany1947/try-cr-op.git
git add -A
git status   # review carefully
git commit -m "Career-ops fork: GPT/Gemini docs, paste-pipeline, viewer-web, resume wiring"
git push -u try-cr-op main
```

If GitHub shows an error because the remote already has a commit (e.g. README created on the web):

```bash
git pull try-cr-op main --allow-unrelated-histories
# resolve conflicts if any, then:
git push -u try-cr-op main
```

## Pull upstream fixes later

```bash
git fetch origin
git merge origin/main
# or: git rebase origin/main
git push try-cr-op main
```
