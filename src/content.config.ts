import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const legal = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/legal' }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    summary: z.string().min(1),
    effectiveDate: z.coerce.date(),
    updatedDate: z.coerce.date(),
    order: z.number().int().positive(),
  }),
});

export const collections = { legal };
