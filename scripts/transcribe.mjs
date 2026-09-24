#!/usr/bin/env node
// Transcribes an audio file in audio/ locally with Parakeet TDT v3
// (via parakeet-coreml, accelerated by the Neural Engine on Apple Silicon).
// Usage: pnpm transcribe [-- audio/session-11.mp3]
// With no argument, picks the only audio file in audio/ without a matching .txt.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';

// parakeet-coreml's ESM build (dist/index.js) is broken: it contains a dynamic
// `require('bindings')` inside a bundled chunk that Node can't resolve in ESM
// mode ("Dynamic require ... is not supported"). The CommonJS build
// (dist/index.cjs) works, so load it explicitly with createRequire.
const { ParakeetAsrEngine } = createRequire(import.meta.url)('parakeet-coreml');

const AUDIO_DIR = path.join(process.cwd(), 'audio');
const AUDIO_EXTENSIONS = ['.mp3', '.m4a', '.wav', '.mp4', '.ogg', '.flac'];

function findInputFile() {
  const arg = process.argv[2];
  if (arg) return path.resolve(arg);

  if (!fs.existsSync(AUDIO_DIR)) {
    console.error(`Directory ${AUDIO_DIR} not found. Create it and put an audio file in it.`);
    process.exit(1);
  }

  const candidates = fs
    .readdirSync(AUDIO_DIR)
    .filter((f) => AUDIO_EXTENSIONS.includes(path.extname(f).toLowerCase()))
    .filter((f) => {
      const txt = path.join(AUDIO_DIR, `${path.basename(f, path.extname(f))}.txt`);
      return !fs.existsSync(txt);
    });

  if (candidates.length === 0) {
    console.error('No new audio file found in audio/ (or they all already have a matching .txt transcript).');
    process.exit(1);
  }
  if (candidates.length > 1) {
    console.error(
      `Found several audio files without a transcript: ${candidates.join(', ')}.\n` +
        `Pick one: pnpm transcribe -- audio/<file>`
    );
    process.exit(1);
  }
  return path.join(AUDIO_DIR, candidates[0]);
}

function decodeToPcm(inputFile) {
  const pcmPath = path.join(os.tmpdir(), `${path.basename(inputFile)}.${process.pid}.pcm`);
  const result = spawnSync(
    'ffmpeg',
    ['-hide_banner', '-loglevel', 'error', '-y', '-i', inputFile, '-ar', '16000', '-ac', '1', '-f', 'f32le', pcmPath],
    { stdio: 'inherit' }
  );
  if (result.status !== 0) {
    console.error('ffmpeg audio conversion failed.');
    process.exit(1);
  }
  const buffer = fs.readFileSync(pcmPath);
  fs.unlinkSync(pcmPath);
  return new Float32Array(buffer.buffer, buffer.byteOffset, buffer.length / 4);
}

const inputFile = findInputFile();
if (!fs.existsSync(inputFile)) {
  console.error(`File not found: ${inputFile}`);
  process.exit(1);
}

const ext = path.extname(inputFile);
const base = path.basename(inputFile, ext);
const dir = path.dirname(inputFile);
const finalTxtPath = path.join(dir, `${base}.txt`);

console.log(`Converting ${inputFile} to 16kHz mono PCM...`);
const samples = decodeToPcm(inputFile);

console.log('Initialising Parakeet TDT v3 (first run downloads ~1.5GB of models, cached afterwards)...');
const engine = new ParakeetAsrEngine();
await engine.initialize();

console.log('Transcribing...');
const result = await engine.transcribe(samples);
engine.cleanup();

fs.writeFileSync(finalTxtPath, result.text, 'utf-8');

const relTxt = path.relative(process.cwd(), finalTxtPath);
console.log(`\nTranscript saved to ${relTxt} (${(result.durationMs / 1000).toFixed(1)}s processing time)`);
console.log(`Next step: pnpm session -- ${relTxt}`);
