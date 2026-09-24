import { visit } from 'unist-util-visit';
import { getSlugMap, normalize, WIKILINK_RE } from './wikilinks.mjs';

const escapeHtml = (s) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export default function remarkWikilinks() {
  return (tree) => {
    const slugMap = getSlugMap();

    visit(tree, 'text', (node, index, parent) => {
      if (!parent || typeof index !== 'number') return;
      WIKILINK_RE.lastIndex = 0;
      if (!WIKILINK_RE.test(node.value)) return;
      WIKILINK_RE.lastIndex = 0;

      const newNodes = [];
      let lastIndex = 0;
      let match;

      while ((match = WIKILINK_RE.exec(node.value))) {
        const [full, target, alias] = match;
        if (match.index > lastIndex) {
          newNodes.push({ type: 'text', value: node.value.slice(lastIndex, match.index) });
        }

        const entry = slugMap.get(normalize(target));
        const label = alias ?? (entry ? entry.title : target);

        if (entry) {
          newNodes.push({
            type: 'link',
            url: entry.url,
            data: { hProperties: { class: 'wikilink' } },
            children: [{ type: 'text', value: label }],
          });
        } else {
          newNodes.push({
            type: 'html',
            value: `<span class="wikilink-broken" title="Nessuna pagina trovata per &quot;${escapeHtml(target)}&quot;">${escapeHtml(label)}</span>`,
          });
          console.warn(`[wikilinks] Unresolved link: [[${target}]]`);
        }

        lastIndex = match.index + full.length;
      }
      if (lastIndex < node.value.length) {
        newNodes.push({ type: 'text', value: node.value.slice(lastIndex) });
      }

      parent.children.splice(index, 1, ...newNodes);
      return index + newNodes.length;
    });
  };
}
