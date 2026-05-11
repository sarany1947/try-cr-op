# Career-ops on Azure — Windows VM

Use this when you want the **whole repo** (Node, Playwright PDFs, Gemini CLI/API, optional viewer, optional Go dashboard) on a **Windows Server** VM.

## VM sizing (honest)

This workload is **CPU-light** most of the time (Markdown, HTTP, occasional Chromium PDF). You do **not** need GPU.

| Goal | Size (example) | Notes |
|------|----------------|--------|
| Comfortable | **D16s_v5** (16 vCPU, 64 GiB RAM) | Plenty for Playwright + browser + IDE |
| “High compute” without waste | **D32s_v5** | Fine if you run parallel batches later |
| Minimum viable | **D4s_v5** | Works for single-threaded PDF + eval |

Pick **SSD** OS disk; enable **Azure Backup** if this is your canonical job-search machine.

## Network security

- **RDP (3389):** restrict source to **your IP only** (NSG rule), not `0.0.0.0/0`.
- **`npm run viewer`:** do not expose port **8787** to the internet without **HTTPS + authentication** (reverse proxy or Azure Front Door + Entra ID). Prefer **localhost-only** + **RDP port-forward** while testing.

## One-time setup (RDP into the VM)

### 1) Install Git + Node.js LTS

- **Git:** https://git-scm.com/download/win  
- **Node.js LTS (22.x):** https://nodejs.org/  
Verify in **PowerShell**:

```powershell
git --version
node -v
npm -v
```

### 2) Clone career-ops

```powershell
cd $env:USERPROFILE
git clone https://github.com/santifer/career-ops.git
cd career-ops
```

(Use your fork or private clone URL if applicable.)

### 3) Install dependencies + Playwright Chromium

```powershell
npm install
npx playwright install chromium
```

### 4) Environment variables

Create `.env` in the repo root (same folder as `package.json`):

```env
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.0-flash
```

Get a key: https://aistudio.google.com/apikey  

Restart PowerShell after editing `.env` if you rely on tooling that loads it only at start.

### 5) Required user files

Copy or create on the VM (see `DATA_CONTRACT.md`):

- `cv.md`
- `config/profile.yml` (from `config/profile.example.yml`)
- `modes/_profile.md` (from `modes/_profile.template.md`)
- `resume/tailoring-prompt.txt` and optional `resume/*.docx`
- `data/applications.md` (tracker)

### 6) Smoke tests

```powershell
node gemini-eval.mjs "We are hiring a DevOps engineer with Terraform and Kubernetes."
```

Generate a PDF once you have HTML output from your pipeline (paths use `\` or `/` on Windows):

```powershell
node generate-pdf.mjs path\to\input.html output\smoke.pdf --format=letter
```

### 7) Optional: Go terminal dashboard

Install **Go** from https://go.dev/dl/ , then:

```powershell
cd dashboard
go build -o career-dashboard.exe .
.\career-dashboard.exe --path ..
```

### 8) Optional: read-only web viewer

```powershell
cd $env:USERPROFILE\career-ops
$env:BIND_HOST="127.0.0.1"
$env:PORT="8787"
npm run viewer
```

Open in browser on the VM: http://127.0.0.1:8787/  
Or tunnel via RDP **local port forwarding** from your laptop if you configure it.

## Cursor / IDE on Windows VM

- Install **Cursor** or **VS Code** on the VM and open the `career-ops` folder **or**
- Edit locally and sync via **Git** to the VM **or**
- Use **Remote** development only if your toolchain supports Windows SSH/OpenSSH Server.

## Paste URL → PDF (built-in)

The repo includes **`paste-pipeline/`**: run **`npm run pasta`** after setting **`GEMINI_API_KEY`** and **`PASTE_API_TOKEN`** (see **`paste-pipeline/README.md`**). Bind **`127.0.0.1`** on the VM and terminate TLS + auth on **nginx** / **Azure Front Door** — do not expose the Node port publicly without a proxy.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Playwright fails to launch Chromium | Run `npx playwright install chromium` again; ensure VM has enough RAM; close other browsers |
| `GEMINI_API_KEY` not found | `.env` in repo root; `dotenv` loads from `gemini-eval.mjs` |
| Path errors | Use `resolve()`-friendly paths; prefer forward slashes in `node` CLI args |
