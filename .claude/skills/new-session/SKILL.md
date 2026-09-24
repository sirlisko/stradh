---
name: new-session
description: Turn a game-session transcript into site updates — writes the new session journal entry and creates/updates every character, NPC, place, the campaign overview and the map it touches. Use when the user pastes a session transcript (usually Italian, often messy speech-to-text), points at a transcript file such as audio/session-NN.txt, or asks to "add/process/write up the latest session".
---

# New session

Turn a raw transcript into a complete, cross-linked update of the site. All
content you write is in **Italian**; follow the conventions in `CLAUDE.md`
(wikilinks, spoilers, canonical names, don'ts).

The transcript is either pasted in the conversation or in a file passed as the
argument. Automatic transcripts contain misheard words and mangled names —
never silently guess: resolve what you can, and list the rest in the final
report.

**Public site.** The site is public and indexed:

- Players are referred to only by their characters. Transcripts are full of
  real names ("Marco, tira l'iniziativa"): work out which character each
  player runs from context and the existing `personaggi/` files, and never
  write a real name anywhere.
- Write only what the party learned in play. Skip DM asides and
  explanations, out-of-character chatter, things the DM said by mistake and
  took back, and secrets one character learned privately unless they shared
  them with the group.

## 1. Gather context

Before writing anything:

- Grep `^numero:` in `src/content/sessions/` to get the next session number
  (highest + 1), then read the latest one or two sessions for continuity
  and tone.
- Read `src/content/riassunto/overview.md` for the current state of the
  campaign.
- Grep `^titolo:` in `src/content/personaggi/`, `png/` and `luoghi/` for
  the list of existing entities. Every name you meet in the transcript must
  be matched against it — including near-misses from speech
  recognition (e.g. "Vargas Vallakovich" → `Barone Vargas`, "Ismarc" →
  `Ismark Kolyanovich`).
- For names you can't match, check canonical spelling on
  https://5e.tools/adventure.html#cos. Use it for spelling and to
  disambiguate only — never bring in anything the party hasn't learned in
  play.

## 2. Write the session

Create `src/content/sessions/sessione-NN.md` (NN zero-padded):

```yaml
---
titolo: <evocative title>
numero: <N>
data: <YYYY-MM-DD — the real session date if known; interactively, ask if unknown; otherwise today and flag it>
estratto: <1-2 sentences, max 300 characters (schema-enforced)>
luoghiVisitati: [<titolo of each place the party was physically in>]
tag: [<optional, short>]
---
```

Body: a third-person narrative in Italian that summarises what happened,
split into `##` sections by scene. Past tense or narrative present consistent
with earlier sessions. Keep it readable prose — no raw transcript, no
out-of-character table talk, no rules chatter unless it matters to the story.
Link every entity on its first mention in each section.

## 3. Create new entities

For each character, NPC or place that appears for the first time, create a
file named after the kebab-case, accent-free title (e.g.
`padre-lucian-petrovich.md`). Fields besides `titolo` are optional; fill in
what is known, use `sconosciuto` for things that matter but aren't known yet.

- `personaggi/` (player characters): `titolo`, `classe`, `stato`
  (`vivo`|`morto`|`scomparso`|`ritirato`), `fazione`, `estratto`, `tag`.
  Leave `giocatore` out (no real names). Set
  `immagine: /images/personaggi/<id>.png` only if that file exists.
- `png/`: `titolo`, `ruolo`, `stato` (`vivo`|`morto`|`scomparso`|`sconosciuto`),
  `fazione`, `luogo`, `estratto`, `tag`.
- `luoghi/`: `titolo`, `tipo`, `regione`, `visitato` (`true` if the party has
  been there), `estratto`, `tag`.

Body: a short Italian paragraph with what the party knows and how they met
it, linked back to the session and other entities.

## 4. Update existing entities

For each existing entity that appears again:

- Update frontmatter that changed: `stato` (e.g. `morto`), `visitato: true`,
  `luogo`, `ruolo`, `estratto` if it's now misleading.
- **Append** a paragraph describing the new development. Don't rewrite
  earlier history.
- Player characters: note significant personal moments (choices, injuries,
  items, relationships).

## 5. Overview and map

- Update `src/content/riassunto/overview.md` only if the campaign's overall
  state changed meaningfully (goal reached, new faction, new region, major
  death). Append or adjust the relevant section; don't rewrite it.
- The map (`src/pages/mappa.astro`) shows only headline places (not shops
  inside a town). Pin colours follow `visitato` automatically. If the party
  reached a new headline place or travelled a new road, move the road from
  `knownRoads` to `travelledRoads` when it already exists; don't invent
  coordinates for new pins — list them in the report so the user can place
  them.

## 6. Verify

Run `pnpm build` and check the output:

- It must succeed (schema errors, e.g. `estratto` over 300 characters, fail
  the build).
- Fix every `[wikilinks] Unresolved link` warning by correcting the target
  or creating the missing entity.

## 7. Report

End with a short report:

- Session file created, entities created, entities updated.
- **Ambiguities**: every name or detail you had to interpret, with your
  choice (e.g. "«Strad» → Strahd von Zarovich", "unclear whether Izek died:
  left `stato: vivo`").
- Anything left for the user: map pins to place, a missing session date,
  and for new player characters the portraits to add in
  `public/images/personaggi/` (`<id>.png` square + `<id>-full.png` tall;
  the home page picks up the full one automatically, then set `immagine`).
- A suggested commit message, e.g. `feat(content): add sessione-11`.

Don't commit — the user reviews `git diff` first.
