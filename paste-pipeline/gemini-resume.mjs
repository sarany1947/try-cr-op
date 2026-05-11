/**
 * URL → JD text → Gemini (tailoring prompt + cv.md) → HTML template → PDF.
 * Called by paste-pipeline/server.mjs and paste-pipeline/cli.mjs.
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

import yaml from 'js-yaml';
import { GoogleGenerativeAI } from '@google/generative-ai';

import { fetchJobDescription } from './fetch-jd.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

try {
  const { config } = await import('dotenv');
  config({ path: join(ROOT, '.env') });
} catch {
  /* optional */
}

function readText(rel, label) {
  const p = join(ROOT, rel);
  if (!existsSync(p)) {
    throw new Error(`Missing ${label}: ${rel}`);
  }
  return readFileSync(p, 'utf8').trim();
}

function kebab(s) {
  return String(s || 'candidate')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'candidate';
}

function safeSlug(s) {
  return kebab(s).slice(0, 48) || 'company';
}

function fillTemplate(template, vars) {
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    const val = v == null ? '' : String(v);
    out = out.split(`{{${k}}}`).join(val);
  }
  return out;
}

function extractJsonObject(text) {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fence ? fence[1].trim() : text.trim();
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('Model did not return JSON with {}');
  }
  return JSON.parse(raw.slice(start, end + 1));
}

/**
 * @param {string} jobUrl
 * @param {{ skipFetch?: boolean, jdText?: string }} [opts]
 * @returns {Promise<{ pdfPath: string, htmlPath: string, companySlug: string }>}
 */
export async function runTailoredPipeline(jobUrl, opts = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Set GEMINI_API_KEY in .env or environment');
  }

  const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

  let jdText;
  let pageTitle = '';
  if (opts.skipFetch && opts.jdText) {
    jdText = opts.jdText;
  } else {
    const fetched = await fetchJobDescription(jobUrl);
    pageTitle = fetched.title;
    jdText = fetched.text;
  }

  if (!jdText || jdText.length < 80) {
    throw new Error(
      'Could not extract enough text from the page. Paste the JD as text or try another URL.'
    );
  }

  const tailoringPrompt = readText('resume/tailoring-prompt.txt', 'resume/tailoring-prompt.txt');
  const cvMd = readText('cv.md', 'cv.md');
  const template = readText('templates/cv-template.html', 'templates/cv-template.html');

  const profilePath = join(ROOT, 'config', 'profile.yml');
  if (!existsSync(profilePath)) {
    throw new Error('Copy config/profile.example.yml to config/profile.yml and fill it.');
  }
  const profile = yaml.load(readFileSync(profilePath, 'utf8')) || {};
  const c = profile.candidate || {};

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.35,
      maxOutputTokens: 16384,
    },
  });

  const instruction = `You are building structured HTML fragments for a fixed CV template (ATS-safe).
Rules:
- Use ONLY facts that appear in the candidate's cv.md or are clearly implied; never invent employers, dates, or tools not supported by cv.md.
- Follow the tailoring methodology in CANONICAL_TAILORING (role scoring, keywords, bullet structure) when choosing emphasis and vocabulary.
- Output a single JSON object (no markdown outside JSON) with exactly these string keys:
  "company_slug": short kebab-case slug for the employer (from JD),
  "SUMMARY_TEXT": plain text for the summary section (no HTML),
  "COMPETENCIES": HTML only: 6-8 lines like <span class="competency-tag">Keyword phrase</span> (one span per line or inline),
  "EXPERIENCE": HTML only. Each role = <div class="job avoid-break"><div class="job-header"><span class="job-company">Company</span><span class="job-period">Dates</span></div><div class="job-role">Title</div><div class="job-location">optional</div><ul><li>...</li></ul></div>
  "PROJECTS": HTML using <div class="project avoid-break">, class project-title, project-desc, project-tech as needed,
  "EDUCATION": HTML using <div class="edu-item avoid-break"> and related classes from a typical CV,
  "CERTIFICATIONS": HTML using <div class="cert-item avoid-break">,
  "SKILLS": HTML: plain paragraphs or divs (skills section).
- English unless the JD is clearly non-English (then match JD language).

CANONICAL_TAILORING:
${tailoringPrompt}

CANDIDATE_CV_MD:
${cvMd}

JOB_POSTING_URL: ${jobUrl}
PAGE_TITLE: ${pageTitle}

JOB_DESCRIPTION_TEXT:
${jdText}`;

  const result = await model.generateContent([{ text: instruction }]);
  const responseText = result.response.text();
  let json;
  try {
    json = extractJsonObject(responseText);
  } catch (e) {
    const err = new Error(`Failed to parse Gemini JSON: ${e.message}`);
    err.rawSnippet = responseText.slice(0, 2000);
    throw err;
  }

  const companySlug = safeSlug(json.company_slug || pageTitle || 'company');
  const format =
    process.env.CV_PDF_FORMAT === 'letter' ? 'letter' : process.env.CV_PDF_FORMAT === 'a4' ? 'a4' : 'letter';
  const pageWidth = format === 'letter' ? '8.5in' : '210mm';

  const phone = (c.phone || '').trim();
  const showPhone = phone.length > 0;

  const headerVars = {
    LANG: 'en',
    NAME: c.full_name || 'Name',
    PAGE_WIDTH: pageWidth,
    PHONE: showPhone ? phone : '',
    EMAIL: c.email || '',
    LINKEDIN_URL: (() => {
      const li = (c.linkedin || '').trim();
      if (!li) return '#';
      return li.startsWith('http') ? li : `https://${li}`;
    })(),
    LINKEDIN_DISPLAY: (() => {
      const li = (c.linkedin || '').trim();
      if (!li) return '';
      return li.replace(/^https?:\/\//, '').replace(/^www\./, '');
    })(),
    PORTFOLIO_URL: (() => {
      const p = (c.portfolio_url || c.portfolio || '').trim();
      if (!p) return '#';
      return p.startsWith('http') ? p : `https://${p}`;
    })(),
    PORTFOLIO_DISPLAY: (() => {
      const p = (c.portfolio_url || c.portfolio || '').trim();
      if (!p) return '';
      return p.replace(/^https?:\/\//, '').replace(/^www\./, '');
    })(),
    LOCATION: c.location || '',
    SECTION_SUMMARY: 'Professional Summary',
    SECTION_COMPETENCIES: 'Core Competencies',
    SECTION_EXPERIENCE: 'Work Experience',
    SECTION_PROJECTS: 'Projects',
    SECTION_EDUCATION: 'Education',
    SECTION_CERTIFICATIONS: 'Certifications',
    SECTION_SKILLS: 'Skills',
    SUMMARY_TEXT: json.SUMMARY_TEXT || '',
    COMPETENCIES: json.COMPETENCIES || '',
    EXPERIENCE: json.EXPERIENCE || '',
    PROJECTS: json.PROJECTS || '',
    EDUCATION: json.EDUCATION || '',
    CERTIFICATIONS: json.CERTIFICATIONS || '',
    SKILLS: json.SKILLS || '',
  };

  let html = fillTemplate(template, headerVars);

  if (!showPhone) {
    html = html.replace(/<span><\/span>\s*<span class="separator">\|<\/span>\s*/m, '');
  }

  const outDir = join(ROOT, 'output');
  mkdirSync(outDir, { recursive: true });
  const date = new Date().toISOString().split('T')[0];
  const cand = kebab(c.full_name || 'candidate');
  const base = `cv-${cand}-${companySlug}-${date}`;
  const htmlPath = join(outDir, `${base}.html`);
  const pdfPath = join(outDir, `${base}.pdf`);

  writeFileSync(htmlPath, html, 'utf8');

  const gen = spawnSync(process.execPath, [join(ROOT, 'generate-pdf.mjs'), htmlPath, pdfPath, `--format=${format}`], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env },
  });
  if (gen.status !== 0) {
    throw new Error(gen.stderr || gen.stdout || 'generate-pdf.mjs failed');
  }

  return {
    pdfPath,
    htmlPath,
    companySlug,
    pdfRelative: `output/${base}.pdf`,
  };
}
