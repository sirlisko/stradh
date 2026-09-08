import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const baseFields = {
  titolo: z.string(),
  estratto: z.string().max(300).optional(),
  immagine: z.string().optional(),
  tag: z.array(z.string()).default([]),
};

const sessions = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/sessions' }),
  schema: z.object({
    ...baseFields,
    numero: z.number().int().positive(),
    data: z.coerce.date(),
    luoghiVisitati: z.array(z.string()).default([]),
  }),
});

const personaggi = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/personaggi' }),
  schema: z.object({
    ...baseFields,
    giocatore: z.string().optional(),
    classe: z.string().optional(),
    stato: z.enum(['vivo', 'morto', 'scomparso', 'ritirato']).default('vivo'),
    fazione: z.string().optional(),
  }),
});

const png = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/png' }),
  schema: z.object({
    ...baseFields,
    ruolo: z.string().optional(),
    stato: z.enum(['vivo', 'morto', 'scomparso', 'sconosciuto']).default('vivo'),
    fazione: z.string().optional(),
    luogo: z.string().optional(),
  }),
});

const luoghi = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/luoghi' }),
  schema: z.object({
    ...baseFields,
    tipo: z.string().optional(),
    regione: z.string().optional(),
  }),
});

const riassunto = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/riassunto' }),
  schema: z.object({
    titolo: z.string(),
  }),
});

export const collections = { sessions, personaggi, png, luoghi, riassunto };
