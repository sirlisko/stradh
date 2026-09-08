// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import remarkWikilinks from './src/lib/remark-wikilinks.mjs';

export default defineConfig({
  site: 'https://stradh.ogreballerino.com',
  output: 'static',
  markdown: {
    processor: unified({
      remarkPlugins: [remarkWikilinks],
    }),
  },
});
