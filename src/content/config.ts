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
    category: z.enum(['workshop', 'social', 'conference', 'meeting', 'competition', 'field-notes', 'build-logs', 'speaker-spotlight', 'other']).default('other'),
    images: z.array(z.string()).optional(),
    external_link: z.string().url().optional(),
    tags: z.array(z.string()).default([]),
    status: z.enum(['upcoming', 'completed', 'cancelled']).default('completed'),
    author: z.string().optional(),
    learning_outcomes: z.array(z.string()).optional(),
    related_links: z.array(z.object({
      title: z.string(),
      url: z.string().url()
    })).optional(),
  }),
});

const electionsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    slug: z.string().optional(),
    description: z.string(),
    startDate: z.date(),
    endDate: z.date(),
    nominationStartDate: z.date().optional(),
    nominationEndDate: z.date().optional(),
    status: z.enum(['draft', 'nomination', 'voting', 'completed', 'cancelled']).default('draft'),
    featured: z.boolean().default(false),
    electionType: z.enum(['leadership', 'topics', 'projects']),
    votingMethod: z.enum(['single-choice', 'multi-choice', 'ranked-choice', 'score-based']).default('single-choice'),
    maxChoices: z.number().min(1).optional(),
    maxScore: z.number().min(1).max(10).optional(),
    voterEligibility: z.object({
      requireMembership: z.boolean().default(true),
      minimumMembershipDays: z.number().min(0).default(0),
      allowedRoles: z.array(z.string()).optional(),
      excludedRoles: z.array(z.string()).optional(),
    }).default({}),
    candidates: z.array(z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      category: z.string().optional(),
      order: z.number().optional(),
      image: z.string().optional(),
      external_link: z.string().url().optional(),
      qualifications: z.array(z.string()).optional(),
      platform: z.string().optional(),
    })),
    resultsDisplay: z.object({
      showResults: z.boolean().default(false),
      showLiveResults: z.boolean().default(false),
      showVoterCount: z.boolean().default(true),
      showPercentages: z.boolean().default(true),
      anonymizeResults: z.boolean().default(false),
    }).default({}),
    settings: z.object({
      allowAbstention: z.boolean().default(true),
      requireComment: z.boolean().default(false),
      allowResultsComment: z.boolean().default(false),
      sendNotifications: z.boolean().default(true),
      autoCloseOnEndDate: z.boolean().default(true),
    }).default({}),
    tags: z.array(z.string()).default([]),
    author: z.string().optional(),
  }),
});

export const collections = {
  events: eventsCollection,
  elections: electionsCollection,
};