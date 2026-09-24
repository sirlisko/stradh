# Curse of Stradh — project conventions

Companion site for a Curse of Strahd (D&D 5e) campaign, built with Astro. The
sections (diario, riassunto, personaggi, PNG, luoghi) are cross-linked with
Obsidian-style wikilinks.

**Language:** all site content (everything under `src/content/` and any
user-visible text in pages/components) is written in **Italian**. Code,
comments, commit messages and docs are in English. Collection names,
frontmatter keys and URL routes are Italian and must stay that way.

## Weekly workflow (session transcript)

When the user pastes a session transcript:

1. Create ONE file at `src/content/sessions/sessione-NN.md` (NN = running
   number, zero-padded to two digits). Required frontmatter: `titolo`,
   `numero`, `data` (the real session date if known, otherwise today),
   `estratto` (1-2 sentences), `tag` (optional). Write the body as a
   third-person narrative in Italian that summarises the transcript — do NOT
   paste the raw transcript.

2. For every NEW player character, NPC or place mentioned in the session,
   create a matching file in `src/content/personaggi/`, `src/content/png/`
   or `src/content/luoghi/` with the frontmatter filled in (use neutral
   values like "sconosciuto" for fields not yet known rather than omitting
   them, if the schema requires them).

3. For EXISTING entities mentioned again, update their file if their state
   changed (e.g. `stato: morto` for an NPC who was just killed, or
   `visitato: true` for a place the party reached for the first time) and/or
   add a paragraph describing the new development — don't rewrite the
   earlier history.

4. ALWAYS link entities with Obsidian-style wikilinks: `[[Nome Entità]]` for
   plain text, `[[Nome Entità|testo visualizzato]]` for an alias (e.g. to
   inflect a name). Use the entity's exact `titolo` (or its filename) as the
   target — resolution is case/accent-insensitive but works best with a
   near-exact match.

5. If you're not sure whether an entity already exists, search the existing
   files before creating a duplicate (names with slight spelling variants
   must be unified into ONE canonical file). To check the canonical spelling
   of a name or clarify an ambiguous detail in the transcript, use
   https://5e.tools/adventure.html#cos (the official Curse of Strahd module)
   as reference. Don't copy from it anything the characters haven't
   discovered in play yet (plot twists, secret identities, future
   developments) — the players themselves read this site.

6. Update `src/content/riassunto/overview.md` if the session significantly
   changed the overall state of the campaign (e.g. a goal achieved, a new
   faction emerged).

### Audio → session pipeline (optional)

Instead of pasting the transcript by hand, you can start from an audio
recording: put the file in `audio/` (gitignored) and run `pnpm transcribe`
(local transcription with Parakeet TDT v3 via `parakeet-coreml`, accelerated
by the Neural Engine — requires macOS 14+ on Apple Silicon and `ffmpeg`; the
first run downloads ~1.5GB of models). Then `pnpm session -- audio/<file>.txt`
runs Claude Code non-interactively (`claude -p`), following this same
workflow on the given file. Automatic transcription may contain recognition
errors or mangled names: when processing a file produced this way, still
follow the rules above but flag any ambiguities at the end instead of
silently guessing.

## Don'ts

- Don't invent a second linking system: use only `[[...]]`, never manual
  markdown links `[testo](/percorso)` for internal references between
  entities.
- Don't add a `slug` field to frontmatter (Astro derives the id from the
  filename; `slug` is reserved for a possible override).
- Don't install extra UI frameworks (no Tailwind/React/Vue) — the site uses
  plain CSS and pure Astro.
- Don't remove `public/robots.txt` or the `noindex` meta tag in
  `src/layouts/BaseLayout.astro` — the site must stay out of search engine
  indexes.

## Technical notes

- Wikilinks are resolved at build time by `src/lib/wikilinks.mjs` (slug map)
  and `src/lib/remark-wikilinks.mjs` (remark plugin). A wikilink to a missing
  entity doesn't break the build: it renders as text styled as a "broken
  link" and logs a console warning — handy for spotting typos.
- Backlinks ("Menzionato in") are computed by `src/lib/backlinks.ts` by
  scanning the markdown body of every entry.
- In `astro dev`, a new file added to `src/content/` may not be picked up
  right away by already-cached wikilinks: restart the dev server after
  adding new entities.
- `src/content/` can be opened directly as an Obsidian vault to browse the
  links graphically.
- The map (`/mappa`, `src/pages/mappa.astro`) uses a painted background image
  (`public/images/mappe/barovia.webp`, with no labels or roads to avoid
  spoilers), desaturated by the `#sepia` SVG filter. On top of it, in
  1920x1080 coordinates, sit only Barovia's "headline" places (not stops
  inside a settlement, e.g. the shops in Vallaki): pins placed by hand in the
  `nodes` array, roads in `travelledRoads` (red) or `knownRoads` (dashed).
  When the party reaches a new place, add its pin and move the road from
  known to travelled.
- Search (`/cerca`, `src/pages/cerca.astro`) uses Pagefind: the index is
  generated by `pnpm build` (the `pagefind --site dist` step) and so does NOT
  exist in `astro dev` — to try it, use `pnpm build && pnpm preview`. Only
  pages using `EntryLayout` (`data-pagefind-body`) are indexed, with a
  `sezione` filter; metadata, badges, backlinks and pagination are excluded
  with `data-pagefind-ignore`. Supports `/cerca/?q=term`.
