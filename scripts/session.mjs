#!/usr/bin/env node
// Runs Claude Code non-interactively on a session transcript so it updates the
// site following the weekly workflow described in CLAUDE.md.
// Usage: pnpm session -- audio/session-11.txt

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const transcriptArg = process.argv[2];
if (!transcriptArg) {
  console.error('Usage: pnpm session -- audio/session-11.txt');
  process.exit(1);
}

const transcriptPath = path.resolve(transcriptArg);
if (!fs.existsSync(transcriptPath)) {
  console.error(`File not found: ${transcriptPath}`);
  process.exit(1);
}

const relTranscript = path.relative(process.cwd(), transcriptPath);
const model = process.env.CLAUDE_MODEL || 'sonnet';

const prompt = `The file ${relTranscript} contains the raw transcript of the latest game session, produced by an automatic speech-to-text tool (it may contain recognition errors, mangled names and repetitions). Read it and follow the weekly session workflow described in CLAUDE.md: work out the correct session number from the existing files in src/content/sessions/, create the session file, create or update the entities involved (personaggi/png/luoghi), and link everything with [[...]] wikilinks. If a name or detail in the transcript is ambiguous, make the most reasonable choice and flag it clearly at the end of your message rather than leaving the work unfinished.`;

console.log(`Running Claude Code (model: ${model}) on ${relTranscript}...\n`);

const child = spawn(
  'claude',
  ['-p', prompt, '--allowedTools', 'Read,Write,Edit,Grep,Glob,WebFetch', '--model', model],
  { stdio: 'inherit', cwd: process.cwd() }
);

child.on('error', (err) => {
  console.error('Could not start "claude". Is it installed and on your PATH?', err.message);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
