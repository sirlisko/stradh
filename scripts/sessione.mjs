#!/usr/bin/env node
// Chiama Claude Code (non interattivo) per elaborare la trascrizione di una
// sessione e aggiornare il sito seguendo il workflow descritto in CLAUDE.md.
// Uso: pnpm sessione -- audio/sessione-11.txt

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const transcriptArg = process.argv[2];
if (!transcriptArg) {
  console.error('Uso: pnpm sessione -- audio/sessione-11.txt');
  process.exit(1);
}

const transcriptPath = path.resolve(transcriptArg);
if (!fs.existsSync(transcriptPath)) {
  console.error(`File non trovato: ${transcriptPath}`);
  process.exit(1);
}

const relTranscript = path.relative(process.cwd(), transcriptPath);
const model = process.env.CLAUDE_MODEL || 'sonnet';

const prompt = `Nel file ${relTranscript} trovi la trascrizione grezza dell'ultima sessione di gioco, generata automaticamente da un tool di trascrizione audio (puo contenere errori di riconoscimento, nomi storpiati, ripetizioni). Leggila e segui il workflow di sessione settimanale descritto in CLAUDE.md per elaborarla: determina il numero di sessione corretto guardando i file esistenti in src/content/sessions/, crea il file di sessione, crea o aggiorna le entita coinvolte (personaggi/png/luoghi), e collega tutto con wikilink [[...]]. Se un nome o un dettaglio della trascrizione e ambiguo, fai la scelta piu ragionevole e segnalala chiaramente alla fine del tuo messaggio invece di lasciare il lavoro a meta.`;

console.log(`Chiamo Claude Code (modello: ${model}) su ${relTranscript}...\n`);

const child = spawn(
  'claude',
  ['-p', prompt, '--allowedTools', 'Read,Write,Edit,Grep,Glob,WebFetch', '--model', model],
  { stdio: 'inherit', cwd: process.cwd() }
);

child.on('error', (err) => {
  console.error('Impossibile avviare "claude". E installato e nel PATH?', err.message);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
