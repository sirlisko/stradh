# Curse of Stradh

Sito compagno per una campagna di *Curse of Strahd* (D&D 5e), in italiano.
Diario delle sessioni, personaggi, PNG e luoghi, collegati tra loro con
wikilink in stile Obsidian. Costruito con [Astro](https://astro.build),
contenuti in Markdown.

Le convenzioni editoriali (frontmatter, wikilink, workflow settimanale) sono
documentate in [`CLAUDE.md`](./CLAUDE.md) — quel file è pensato per guidare
Claude Code quando aggiorna il sito, ma è la fonte di verità anche per chi
scrive contenuti a mano.

## Sviluppo

Richiede [pnpm](https://pnpm.io).

```bash
pnpm install
pnpm dev       # http://localhost:4321
pnpm build     # output statico in dist/
pnpm preview   # serve la build di dist/
```

Il sito è deployato su Netlify (`netlify.toml`), build automatica su push.
`public/robots.txt` e il meta tag `noindex` tengono il sito fuori dagli
indici dei motori di ricerca — non vanno rimossi.

## Struttura dei contenuti

```
src/content/
  sessions/     diario delle sessioni (sessione-NN.md)
  personaggi/   personaggi giocanti
  png/          personaggi non giocanti
  luoghi/       luoghi visitati o conosciuti
  riassunto/    overview generale della campagna
```

Ogni entità può linkare le altre con `[[Nome Entità]]` (o
`[[Nome|testo visualizzato]]`); i link vengono risolti a build time e un
wikilink verso un'entità inesistente non rompe la build — viene mostrato
come "link rotto" con un warning in console, utile per notare i typo. Vedi
`CLAUDE.md` per i dettagli completi e le cose da non fare.

## Pipeline audio → sessione

Invece di trascrivere e riassumere una sessione a mano, si può partire
direttamente dalla registrazione audio: uno script la trascrive in locale,
un secondo chiama Claude Code (non interattivo) che segue il workflow
descritto in `CLAUDE.md` per aggiornare sessione, entità e wikilink.

### Prerequisiti

- macOS 14+ su Apple Silicon (richiesto da `parakeet-coreml`, che usa il
  Neural Engine per la trascrizione)
- Node.js 20+ e `ffmpeg` installati (`brew install ffmpeg`)
- [Claude Code](https://claude.com/product/claude-code) installato e
  autenticato (`claude auth login`) — la pipeline lo richiama come CLI

### 1. Aggiungi l'audio

Metti la registrazione in `audio/` (cartella gitignored — audio e
trascrizioni grezze non finiscono mai nel repo):

```bash
mkdir -p audio
cp ~/Registrazioni/sessione-11.mp3 audio/
```

### 2. Trascrivi

```bash
pnpm trascrivi                          # trova da solo l'unico file nuovo in audio/
pnpm trascrivi -- audio/sessione-11.mp3 # oppure specifica il file
```

Converte l'audio in PCM 16kHz mono con `ffmpeg` e trascrive con **Parakeet
TDT v3** (accelerato dal Neural Engine, ~40x realtime su Apple Silicon —
un'ora di audio in circa 90 secondi). Al primo avvio scarica ~1.5GB di
modelli (restano in cache per le volte successive). Produce
`audio/sessione-11.txt`.

### 3. Genera i contenuti

```bash
pnpm sessione -- audio/sessione-11.txt
```

Richiama `claude -p` in modalità non interattiva: legge la trascrizione,
determina il numero di sessione corretto, scrive `sessione-NN.md` e
crea/aggiorna le entità coinvolte seguendo `CLAUDE.md`, wikilink inclusi.
Modello di default `sonnet`, configurabile con `CLAUDE_MODEL=opus pnpm
sessione -- ...`.

**Controlla sempre `git diff` prima di committare**: la trascrizione
automatica può contenere errori di riconoscimento o nomi storpiati, e in
modalità non interattiva Claude non può fare domande di chiarimento — se
qualcosa è ambiguo, lo segnala nel proprio messaggio finale invece di
indovinare in silenzio.

### Costi

Se Claude Code è autenticato con un abbonamento (Pro/Max), `pnpm sessione`
non ha costo a consumo: rientra nei limiti di utilizzo del piano, come una
sessione interattiva normale. Con una chiave API il costo è invece a
token (per una sessione di 2-3 ore, indicativamente pochi centesimi di
dollaro con Sonnet).
