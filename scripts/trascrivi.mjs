#!/usr/bin/env node
// Trascrive un file audio in audio/ in locale con Parakeet TDT v3
// (via parakeet-coreml, accelerato dal Neural Engine su Apple Silicon).
// Uso: pnpm trascrivi [-- audio/sessione-11.mp3]
// Senza argomenti, cerca l'unico file audio in audio/ che non ha ancora un .txt.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';

// La build ESM di parakeet-coreml (dist/index.js) e rotta: contiene un
// `require('bindings')` dinamico dentro un chunk bundlato che Node non sa
// risolvere in modalita ESM ("Dynamic require ... is not supported"). La
// build CommonJS (dist/index.cjs) funziona correttamente: la carichiamo
// esplicitamente con createRequire invece di un normale `import`.
const { ParakeetAsrEngine } = createRequire(import.meta.url)('parakeet-coreml');

const AUDIO_DIR = path.join(process.cwd(), 'audio');
const AUDIO_EXTENSIONS = ['.mp3', '.m4a', '.wav', '.mp4', '.ogg', '.flac'];

function findInputFile() {
  const arg = process.argv[2];
  if (arg) return path.resolve(arg);

  if (!fs.existsSync(AUDIO_DIR)) {
    console.error(`Cartella ${AUDIO_DIR} non trovata. Creala e mettici un file audio.`);
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
    console.error('Nessun file audio nuovo trovato in audio/ (o hanno gia una trascrizione .txt corrispondente).');
    process.exit(1);
  }
  if (candidates.length > 1) {
    console.error(
      `Trovati piu file audio senza trascrizione: ${candidates.join(', ')}.\n` +
        `Specificane uno: pnpm trascrivi -- audio/<file>`
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
    console.error('Conversione audio con ffmpeg fallita.');
    process.exit(1);
  }
  const buffer = fs.readFileSync(pcmPath);
  fs.unlinkSync(pcmPath);
  return new Float32Array(buffer.buffer, buffer.byteOffset, buffer.length / 4);
}

const inputFile = findInputFile();
if (!fs.existsSync(inputFile)) {
  console.error(`File non trovato: ${inputFile}`);
  process.exit(1);
}

const ext = path.extname(inputFile);
const base = path.basename(inputFile, ext);
const dir = path.dirname(inputFile);
const finalTxtPath = path.join(dir, `${base}.txt`);

console.log(`Converto ${inputFile} in PCM 16kHz mono...`);
const samples = decodeToPcm(inputFile);

console.log('Inizializzo Parakeet TDT v3 (al primo avvio scarica ~1.5GB di modelli, poi resta in cache)...');
const engine = new ParakeetAsrEngine();
await engine.initialize();

console.log('Trascrivo...');
const result = await engine.transcribe(samples);
engine.cleanup();

fs.writeFileSync(finalTxtPath, result.text, 'utf-8');

const relTxt = path.relative(process.cwd(), finalTxtPath);
console.log(`\nTrascrizione salvata in ${relTxt} (${(result.durationMs / 1000).toFixed(1)}s di elaborazione)`);
console.log(`Prossimo passo: pnpm sessione -- ${relTxt}`);
