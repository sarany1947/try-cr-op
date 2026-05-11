#!/usr/bin/env node
/**
 * CLI: one-shot URL → PDF (same pipeline as the web server).
 *
 *   node paste-pipeline/cli.mjs "https://jobs.example.com/123"
 */
import { runTailoredPipeline } from './gemini-resume.mjs';

const url = process.argv[2];
if (!url || url === '--help' || url === '-h') {
  console.error('Usage: node paste-pipeline/cli.mjs <job-posting-url>');
  process.exit(url ? 0 : 1);
}

runTailoredPipeline(url)
  .then((r) => {
    console.log(JSON.stringify(r, null, 2));
  })
  .catch((e) => {
    console.error(e.message || e);
    if (e.rawSnippet) console.error('\n--- raw model output (snippet) ---\n', e.rawSnippet);
    process.exit(1);
  });
