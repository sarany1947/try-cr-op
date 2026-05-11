# Web viewer (Azure VM–friendly)

Read-only HTTP UI for `data/applications.md`, `reports/*.md`, and `output/*.pdf`.

## Run locally

```bash
cd /path/to/career-ops
node viewer-web/server.mjs
```

Open `http://127.0.0.1:8787/` (default).

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `CAREER_OPS_ROOT` | parent of `viewer-web/` | Repo root |
| `PORT` | `8787` | Listen port |
| `BIND_HOST` | `127.0.0.1` | Set `0.0.0.0` to listen on all interfaces (VM-wide) |

## Azure VM (recommended pattern)

1. Deploy career-ops on the VM (clone repo, `npm install`, `npx playwright install` for PDF generation).
2. Run the viewer bound to localhost and put **NGINX** or **Azure Application Gateway** in front with **TLS + authentication** (Azure AD, mutual TLS, or VPN-only). **Do not** expose this service raw to the internet — reports and PDFs are sensitive.
3. Optional: `systemd` user unit:

```ini
[Unit]
Description=career-ops viewer
After=network.target

[Service]
Type=simple
WorkingDirectory=/home/azureuser/career-ops
Environment=CAREER_OPS_ROOT=/home/azureuser/career-ops
Environment=PORT=8787
Environment=BIND_HOST=127.0.0.1
ExecStart=/usr/bin/node viewer-web/server.mjs
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Then proxy `https://your-domain` → `127.0.0.1:8787` with TLS termination on nginx.

## Scope

- No write APIs — viewer only.
- For full markdown rendering, you can add `marked` later; current UI uses `<pre>` for reports.
