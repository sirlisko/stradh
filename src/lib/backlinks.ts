import { getCollection } from 'astro:content';
import { getSlugMap, normalize, WIKILINK_RE } from './wikilinks.mjs';

type Backlink = { title: string; url: string };

let backlinkCache: Map<string, Backlink[]> | null = null;

const COLLECTIONS = ['sessions', 'personaggi', 'png', 'luoghi', 'riassunto'] as const;

async function buildBacklinkIndex() {
  const index = new Map<string, Backlink[]>();
  const slugMap = getSlugMap();

  for (const collectionName of COLLECTIONS) {
    const entries = await getCollection(collectionName);
    for (const entry of entries) {
      const sourceEntry = slugMap.get(normalize(entry.data.titolo ?? entry.id));
      if (!sourceEntry) continue;

      WIKILINK_RE.lastIndex = 0;
      let match;
      while ((match = WIKILINK_RE.exec(entry.body ?? ''))) {
        const target = slugMap.get(normalize(match[1]));
        if (!target || target.url === sourceEntry.url) continue;
        const list = index.get(target.url) ?? [];
        if (!list.some((l) => l.url === sourceEntry.url)) {
          list.push({ title: sourceEntry.title, url: sourceEntry.url });
        }
        index.set(target.url, list);
      }
    }
  }
  return index;
}

export async function getBacklinksFor(url: string): Promise<Backlink[]> {
  if (!backlinkCache) backlinkCache = await buildBacklinkIndex();
  return backlinkCache.get(url) ?? [];
}
