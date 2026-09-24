# Curse of Stradh — convenzioni del progetto

Sito compagno per una campagna di Curse of Strahd (D&D 5e), in italiano,
costruito con Astro. Le sezioni (diario, riassunto, personaggi, PNG, luoghi)
sono collegate tra loro con wikilink in stile Obsidian.

## Flusso di lavoro settimanale (trascrizione sessione)

Quando l'utente incolla la trascrizione di una sessione:

1. Crea UN file in `src/content/sessions/sessione-NN.md` (NN = numero
   progressivo, zero-padded a due cifre). Frontmatter richiesto: `titolo`,
   `numero`, `data` (data reale della sessione se nota, altrimenti data
   odierna), `estratto` (1-2 frasi), `tag` (opzionale). Scrivi il corpo come
   narrazione in terza persona che sintetizza la trascrizione — NON incollare
   la trascrizione grezza.

2. Per ogni personaggio giocante, PNG o luogo NUOVO menzionato nella
   sessione, crea un file corrispondente in `src/content/personaggi/`,
   `src/content/png/` o `src/content/luoghi/` con frontmatter compilato
   (usa valori neutri come "sconosciuto" per campi non ancora noti anziché
   ometterli, se lo schema li richiede).

3. Per entità ESISTENTI menzionate di nuovo, aggiorna il loro file se lo
   stato è cambiato (es. `stato: morto` per un PNG appena ucciso, oppure
   `visitato: true` per un luogo raggiunto per la prima volta dal gruppo)
   e/o aggiungi un paragrafo che racconta il nuovo sviluppo — non
   riscrivere la cronologia precedente.

4. Collega SEMPRE le entità con wikilink in stile Obsidian: `[[Nome Entità]]`
   per il testo semplice, `[[Nome Entità|testo visualizzato]]` per un alias
   (es. per declinare un nome). Usa il `titolo` esatto dell'entità (o il nome
   del file) come target — la risoluzione è case/accent-insensitive ma
   funziona meglio con corrispondenza quasi esatta.

5. Se non sei sicuro se un'entità esiste già, cerca nei file esistenti prima
   di crearne uno duplicato (nomi con leggere varianti ortografiche vanno
   uniformati a UN file canonico). Per verificare la grafia corretta di un
   nome canonico o chiarire un dettaglio ambiguo della trascrizione, usa
   come riferimento https://5e.tools/adventure.html#cos (il modulo
   ufficiale di Curse of Strahd). Non copiare da lì contenuti che i
   personaggi non hanno ancora scoperto in gioco (colpi di scena, identità
   segrete, sviluppi futuri) — il sito è letto dai giocatori stessi.

6. Aggiorna eventualmente `src/content/riassunto/overview.md` se la sessione
   ha cambiato in modo significativo lo stato generale della campagna (es.
   un obiettivo raggiunto, una nuova fazione emersa).

### Pipeline audio → sessione (opzionale)

Invece di incollare la trascrizione a mano, si può partire da una
registrazione audio: metti il file in `audio/` (cartella gitignored) e lancia
`pnpm trascrivi` (trascrizione locale con Parakeet TDT v3 via
`parakeet-coreml`, accelerata dal Neural Engine — richiede macOS 14+ Apple
Silicon e `ffmpeg` installato; al primo avvio scarica ~1.5GB di modelli).
Poi `pnpm sessione -- audio/sessione-NN.txt`
richiama Claude Code in modalità non interattiva (`claude -p`) che segue
questo stesso workflow sul file indicato. La trascrizione automatica può
contenere errori di riconoscimento o nomi storpiati: quando elabori un file
generato così, segui comunque le regole sopra ma segnala alla fine eventuali
ambiguità invece di indovinare in silenzio.

## Cose da NON fare

- Non inventare un secondo sistema di link: usa solo `[[...]]`, mai link
  markdown manuali `[testo](/percorso)` per riferimenti interni tra entità.
- Non aggiungere il campo `slug` nel frontmatter (Astro genera l'id dal nome
  del file; `slug` è riservato per un eventuale override).
- Non installare framework UI aggiuntivi (niente Tailwind/React/Vue) — il
  sito usa CSS semplice e Astro puro.
- Non rimuovere `public/robots.txt` o il meta tag `noindex` in
  `src/layouts/BaseLayout.astro` — il sito deve restare fuori dagli indici
  dei motori di ricerca.

## Note tecniche

- Wikilink risolti a build time da `src/lib/wikilinks.mjs` (mappa slug) e
  `src/lib/remark-wikilinks.mjs` (plugin remark). Un wikilink verso
  un'entità inesistente non rompe la build: viene renderizzato come testo
  con stile "link rotto" e un warning in console — utile per notare typo.
- I backlink ("Menzionato in") sono calcolati da `src/lib/backlinks.ts`
  scansionando il corpo markdown di ogni entry.
- In `astro dev`, un file nuovo aggiunto a `src/content/` potrebbe non
  essere subito riconosciuto dai wikilink già in cache: riavviare il dev
  server dopo aver aggiunto nuove entità risolve il problema.
- La cartella `src/content/` può essere aperta direttamente come vault
  Obsidian per navigare graficamente i collegamenti.
- La mappa è nascosta: il file è `src/pages/_mappa.astro` (il prefisso `_`
  lo esclude dal routing) e non compare nella navigazione. Per ripristinarla,
  rinominalo in `mappa.astro` e riaggiungi il link in
  `src/components/Header.astro`. Mostra uno schizzo di viaggio con i luoghi
  "di punta" di Barovia (non le tappe interne a un insediamento, es. le
  botteghe di Vallaki); le coordinate dei pin sono scelte a mano nell'array
  `nodi`, con eventuali strade in `stradePercorse` o `stradeConosciute`.
- La ricerca (`/cerca`, `src/pages/cerca.astro`) usa Pagefind: l'indice viene
  generato da `pnpm build` (passo `pagefind --site dist`) e quindi NON esiste
  in `astro dev` — per provarla usa `pnpm build && pnpm preview`. Vengono
  indicizzate solo le pagine che usano `EntryLayout` (`data-pagefind-body`),
  con un filtro `sezione`; metadati, badge, backlink e paginazione sono
  esclusi con `data-pagefind-ignore`. Supporta `/cerca/?q=termine`.
