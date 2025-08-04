import { defineCollection, z } from 'astro:content';

const eventsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    endDate: z.date().optional(),
    location: z.string().optional(),
    description: z.string(),
    featured: z.boolean().default(false),
    category: z.enum(['workshop', 'social', 'conference', 'meeting', 'competition', 'other']).default('other'),
    images: z.array(z.string()).optional(),
    external_link: z.string().url().optional(),
    tags: z.array(z.string()).default([]),
    status: z.enum(['upcoming', 'completed', 'cancelled']).default('completed'),
  }),
});

export const collections = {
  events: eventsCollection,
};