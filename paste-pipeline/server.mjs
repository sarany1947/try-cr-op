#!/usr/bin/env node
/**
 * Minimal always-on site: paste job URL → PDF download (Gemini + tailoring prompt).
 *
 * Env:
 *   PASTE_API_TOKEN   (required) shared secret — send as form field "token"
 *   PORT              default 8790
 *   BIND_HOST         default 127.0.0.1 — use 0.0.0.0 on Azure VM behind NSG + HTTPS proxy
 *   GEMINI_API_KEY    required for pipeline (see gemini-resume.mjs)
 */
import http from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync } from 'node:fs';

import { runTailoredPipeline } from './gemini-resume.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const PORT = Number(process.env.PORT || process.env.PASTE_PORT || 8790, 10);
const BIND_HOST = process.env.BIND_HOST || '127.0.0.1';
const TOKEN = process.env.PASTE_API_TOKEN || '';

function parseForm(body) {
  const params = new URLSearchParams(body);
  return Object.fromEntries(params.entries());
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const pageHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>career-ops — paste job URL</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 560px; margin: 48px auto; padding: 0 16px; }
  label { display: block; margin-top: 16px; font-weight: 600; }
  input[type="url"], input[type="password"] { width: 100%; padding: 10px; margin-top: 6px; box-sizing: border-box; }
  button { margin-top: 20px; padding: 12px 20px; font-weight: 600; cursor: pointer; }
  .hint { color: #555; font-size: 14px; margin-top: 8px; }
  .err { color: #b00020; margin-top: 16px; }
</style>
</head>
<body>
<h1>Paste job posting URL</h1>
<p class="hint">Runs on your VM: fetches the page, calls Gemini with <code>resume/tailoring-prompt.txt</code> + <code>cv.md</code>, returns a tailored PDF.</p>
<form method="POST" action="/run">
  <label for="token">API token</label>
  <input type="password" id="token" name="token" autocomplete="off" required placeholder="PASTE_API_TOKEN"/>
  <label for="url">Job URL</label>
  <input type="url" id="url" name="url" required placeholder="https://"/>
  <button type="submit">Build resume PDF</button>
</form>
<p class="hint">First request may take 1–3 minutes (Playwright + Gemini + PDF).</p>
</body>
</html>`;

async function handlePostRun(req, res) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const body = Buffer.concat(chunks).toString('utf8');
  let fields;
  try {
    fields = parseForm(body);
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Bad form body');
    return;
  }

  if (!TOKEN || fields.token !== TOKEN) {
    res.writeHead(401, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!DOCTYPE html><html><body><p class="err">Unauthorized.</p><p><a href="/">Back</a></p></body></html>`);
    return;
  }

  const jobUrl = (fields.url || '').trim();
  if (!jobUrl.startsWith('http://') && !jobUrl.startsWith('https://')) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Invalid URL');
    return;
  }

  try {
    const { pdfPath, pdfRelative } = await runTailoredPipeline(jobUrl);
    const pdfBuf = readFileSync(pdfPath);
    const base = pdfRelative.replace(/^output\//, '');
    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${base}"`,
      'Content-Length': pdfBuf.length,
    });
    res.end(pdfBuf);
  } catch (e) {
    const msg = esc(e.message || String(e));
    res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(
      `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Error</title></head><body><h1>Pipeline failed</h1><pre>${msg}</pre><p><a href="/">Back</a></p></body></html>`
    );
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(pageHtml);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ok');
    return;
  }

  if (req.method === 'POST' && url.pathname === '/run') {
    handlePostRun(req, res).catch((e) => {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(e?.message || String(e));
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

if (!TOKEN) {
  console.error('[paste-pipeline] WARNING: PASTE_API_TOKEN is not set. POST /run will reject all requests.');
}

server.listen(PORT, BIND_HOST, () => {
  console.error(`[paste-pipeline] http://${BIND_HOST}:${PORT}/  (root=${ROOT})`);
  if (!existsSync(join(ROOT, 'cv.md'))) {
    console.error('[paste-pipeline] WARNING: cv.md missing.');
  }
  if (!existsSync(join(ROOT, 'config', 'profile.yml'))) {
    console.error('[paste-pipeline] WARNING: config/profile.yml missing.');
  }
});
