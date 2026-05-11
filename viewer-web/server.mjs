#!/usr/bin/env node
/**
 * Career-ops read-only web viewer for Azure VM (or local).
 * Serves tracker rows, report markdown, and PDFs under the repo root.
 *
 * Env:
 *   CAREER_OPS_ROOT — path to career-ops repo (default: parent of viewer-web)
 *   PORT — listen port (default: 8787)
 *   BIND_HOST — default 127.0.0.1 (use 0.0.0.0 on Azure VM behind NSG + auth)
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(process.env.CAREER_OPS_ROOT || path.join(__dirname, ".."));
const PORT = Number(process.env.PORT || 8787, 10);
const BIND_HOST = process.env.BIND_HOST || "127.0.0.1";

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function safeResolveUnder(root, rel) {
  const resolved = path.resolve(root, rel);
  if (!resolved.startsWith(root + path.sep) && resolved !== root) {
    return null;
  }
  return resolved;
}

function findApplicationsPath() {
  const a = path.join(ROOT, "data", "applications.md");
  if (fs.existsSync(a)) return a;
  const b = path.join(ROOT, "applications.md");
  if (fs.existsSync(b)) return b;
  return null;
}

function parseApplications(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const lines = raw.split(/\r?\n/);
  const rows = [];
  let num = 0;
  for (const line of lines) {
    const t = line.trim();
    if (!t.startsWith("|")) continue;
    if (t.startsWith("| #") || t.startsWith("|---") || /^#\s/.test(t)) continue;

    let fields;
    if (t.includes("\t")) {
      const rest = t.replace(/^\|/, "").trim();
      fields = rest.split("\t").map((p) => p.replace(/\|/g, "").trim());
    } else {
      fields = t
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((p) => p.trim());
    }
    if (fields.length < 8) continue;

    num += 1;
    let trackerNumber = num;
    const n0 = parseInt(fields[0], 10);
    if (!Number.isNaN(n0)) trackerNumber = n0;

    const reportCell = fields[7] || "";
    let reportPath = "";
    const m = reportCell.match(/\[(\d+)\]\(([^)]+)\)/);
    if (m) reportPath = m[2].trim();

    rows.push({
      number: trackerNumber,
      date: fields[1],
      company: fields[2],
      role: fields[3],
      score: fields[4],
      status: fields[5],
      pdfCell: fields[6],
      reportPath,
      notes: fields[8] || "",
    });
  }
  return rows;
}

function listPdfs() {
  const outDir = path.join(ROOT, "output");
  if (!fs.existsSync(outDir)) return [];
  return fs
    .readdirSync(outDir)
    .filter((f) => f.endsWith(".pdf"))
    .sort()
    .reverse();
}

function layout(title, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(title)}</title>
<style>
  :root { font-family: system-ui, sans-serif; background: #0f1419; color: #e6edf3; }
  a { color: #58a6ff; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #30363d; padding: 8px 10px; text-align: left; }
  th { background: #161b22; }
  tr:nth-child(even) { background: #11161d; }
  .wrap { max-width: 1100px; margin: 24px auto; padding: 0 16px; }
  pre.report { white-space: pre-wrap; background: #161b22; padding: 16px; border-radius: 8px; overflow: auto; }
  nav a { margin-right: 16px; }
</style>
</head>
<body>
<div class="wrap">
<nav><a href="/">Applications</a><a href="/pdfs">PDFs</a><a href="/cv">cv.md</a></nav>
<h1>${esc(title)}</h1>
${body}
</div>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const route = url.pathname;

  try {
    if (route === "/" || route === "/index.html") {
      const appPath = findApplicationsPath();
      if (!appPath) {
        res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
        res.end(layout("career-ops viewer", "<p>No <code>data/applications.md</code> found.</p>"));
        return;
      }
      const apps = parseApplications(appPath);
      const rows = apps
        .map(
          (a) =>
            `<tr><td>${esc(a.number)}</td><td>${esc(a.date)}</td><td>${esc(a.company)}</td><td>${esc(a.role)}</td><td>${esc(a.score)}</td><td>${esc(a.status)}</td><td>${
              a.reportPath
                ? `<a href="/report?path=${encodeURIComponent(a.reportPath)}">report</a>`
                : "—"
            }</td></tr>`
        )
        .join("");
      const html = layout(
        "Applications",
        `<p>Root: <code>${esc(ROOT)}</code></p>
<table><thead><tr><th>#</th><th>Date</th><th>Company</th><th>Role</th><th>Score</th><th>Status</th><th>Report</th></tr></thead><tbody>${rows}</tbody></table>`
      );
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(html);
      return;
    }

    if (route === "/pdfs") {
      const pdfs = listPdfs();
      const list = pdfs
        .map((f) => `<li><a href="/file/pdf?name=${encodeURIComponent(f)}">${esc(f)}</a></li>`)
        .join("");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(layout("PDFs", `<ul>${list || "<li>No PDFs in output/</li>"}</ul>`));
      return;
    }

    if (route === "/cv") {
      const p = path.join(ROOT, "cv.md");
      if (!fs.existsSync(p)) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("cv.md not found");
        return;
      }
      const text = fs.readFileSync(p, "utf8");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(layout("cv.md", `<pre class="report">${esc(text)}</pre>`));
      return;
    }

    if (route === "/report") {
      const rel = url.searchParams.get("path") || "";
      if (!rel || rel.includes("..")) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("Bad path");
        return;
      }
      const full = safeResolveUnder(ROOT, rel);
      if (!full || !fs.existsSync(full)) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not found");
        return;
      }
      const text = fs.readFileSync(full, "utf8");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(
        layout(
          path.basename(rel),
          `<p><a href="/">← Back</a> · <code>${esc(rel)}</code></p><pre class="report">${esc(text)}</pre>`
        )
      );
      return;
    }

    if (route === "/file/pdf") {
      const name = url.searchParams.get("name") || "";
      if (!name || name.includes("..") || name.includes("/") || name.includes("\\")) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("Bad file name");
        return;
      }
      const full = safeResolveUnder(ROOT, path.join("output", name));
      if (!full || !fs.existsSync(full)) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not found");
        return;
      }
      const buf = fs.readFileSync(full);
      res.writeHead(200, {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${name}"`,
      });
      res.end(buf);
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  } catch (e) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end(String(e?.message || e));
  }
});

server.listen(PORT, BIND_HOST, () => {
  console.error(`career-ops viewer: http://${BIND_HOST}:${PORT}/  (root=${ROOT})`);
});
