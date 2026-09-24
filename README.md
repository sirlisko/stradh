# Curse of Stradh

Companion site for an Italian-language *Curse of Strahd* (D&D 5e) campaign:
session journal, player characters, NPCs and places, cross-linked with
Obsidian-style wikilinks. Built with [Astro](https://astro.build), content in
Markdown.

The site itself is in Italian; code and docs are in English. Editorial
conventions (frontmatter, wikilinks, spoilers) live in
[`CLAUDE.md`](./CLAUDE.md), and the procedure for turning a session
transcript into site updates is the `new-session` Claude Code skill
([`.claude/skills/new-session/SKILL.md`](./.claude/skills/new-session/SKILL.md)).
Both are written to guide Claude Code, but they're also the source of truth
for anyone writing content by hand.

## Adding a session

In Claude Code, paste the session transcript (or ask it to process
`audio/session-NN.txt`) and the `new-session` skill kicks in: it writes the
session entry, creates or updates characters, NPCs and places, adjusts the
overview and map, runs `pnpm build` to catch broken wikilinks, and reports any
ambiguities. You can also invoke it explicitly with `/new-session`.

To rename an entity or merge duplicates (common with misheard names), ask
Claude Code or run `/rename-entity`: it rewrites every wikilink and adds a
301 redirect in `netlify.toml` for the old URL.

## Development

Requires Node.js 22.12+ and [pnpm](https://pnpm.io).

```bash
pnpm install
pnpm dev       # http://localhost:4321
pnpm build     # static output in dist/ (plus the Pagefind search index)
pnpm preview   # serve the dist/ build
```

Deployed on Netlify (`netlify.toml`), building on every push to `main`.
A sitemap is generated at build time (`@astrojs/sitemap`) and referenced from
`public/robots.txt`.

## Content layout

Collection and frontmatter names are Italian, matching the site's URLs:

```
src/content/
  sessions/     session journal (sessione-NN.md)  → /diario/
  personaggi/   player characters                 → /personaggi/
  png/          non-player characters (PNG)       → /png/
  luoghi/       places visited or heard of        → /luoghi/
  riassunto/    campaign overview                 → /riassunto/
```

Any entry can link to another with `[[Entity Name]]` (or
`[[Name|display text]]`). Links are resolved at build time. A wikilink to a
missing entry doesn't break the build: it renders as a "broken link" and logs
a warning, which helps catch typos. See `CLAUDE.md` for the full details.

`src/content/` can also be opened directly as an Obsidian vault.

## Audio → session pipeline

Instead of pasting a transcript, you can start from the audio recording. One
script transcribes it locally, then a second one runs Claude Code
non-interactively with the `new-session` skill.

### Requirements

- macOS 14+ on Apple Silicon (required by `parakeet-coreml`, which runs
  transcription on the Neural Engine; it's an optional dependency and is
  skipped on other platforms)
- `ffmpeg` (`brew install ffmpeg`)
- [Claude Code](https://claude.com/product/claude-code), installed and
  authenticated (`claude auth login`), since the pipeline calls it as a CLI

### 1. Add the audio

Put the recording in `audio/`. The folder is gitignored, so recordings and raw
transcripts never end up in the repo:

```bash
mkdir -p audio
cp ~/Recordings/session-11.mp3 audio/
```

### 2. Transcribe

```bash
pnpm transcribe                          # picks the only new file in audio/
pnpm transcribe -- audio/session-11.mp3  # or name the file
```

Converts the audio to 16kHz mono PCM with `ffmpeg` and transcribes it with
**Parakeet TDT v3** (Neural Engine accelerated, ~40x realtime on Apple
Silicon, so an hour of audio takes about 90 seconds). The first run downloads
~1.5GB of models, which are cached afterwards. Produces
`audio/session-11.txt`.

### 3. Generate the content

```bash
pnpm session -- audio/session-11.txt
```

Runs `claude -p` non-interactively with the `new-session` skill on the
transcript. The default model is
`sonnet`; override it with `CLAUDE_MODEL=opus pnpm session -- ...`.

**Always review `git diff` before committing.** Automatic transcription can
misrecognise words or mangle names, and in non-interactive mode Claude can't
ask clarifying questions. When something is ambiguous, it flags it in its
final message instead of silently guessing.

### Cost

If Claude Code is signed in with a subscription (Pro/Max), `pnpm session` has
no metered cost and counts against your plan's usage limits like a normal
interactive session. With an API key it's billed per token (for a 2-3 hour
session, roughly a few cents with Sonnet).

## License

- **Code** is licensed under [MIT](./LICENSE).
- **Campaign content** (everything under `src/content/` and `public/images/`)
  is licensed under [CC BY-NC 4.0](./LICENSE-CONTENT).

This is unofficial Fan Content permitted under the
[Wizards of the Coast Fan Content Policy](https://company.wizards.com/en/legal/fancontentpolicy).
Not approved/endorsed by Wizards. Portions of the materials used are property
of Wizards of the Coast. ©Wizards of the Coast LLC.
