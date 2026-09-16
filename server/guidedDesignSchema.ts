import { z } from 'zod/v4';

const GameNodeTypeSchema = z.enum([
  'activity',
  'system',
  'resource',
  'challenge',
  'progression',
  'goal',
]);

const GameNodeImportanceSchema = z.enum([
  'core',
  'supporting',
  'optional',
]);

const GameEdgeTypeSchema = z.enum([
  'produces',
  'consumes',
  'requires',
  'unlocks',
  'improves',
  'leads_to',
]);

const NodeReferenceSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('proposed_node'),
    id: z.string().min(1),
  }),
  z.object({
    kind: z.literal('existing_node'),
    id: z.string().min(1),
  }),
]);

export const GuidedDesignRequestSchema = z.object({
  project: z.object({
    name: z.string().trim().max(120),
    brief: z.string().trim().max(6000),
  }),
  skeleton: z.object({
    nodes: z.array(z.object({
      id: z.string(),
      label: z.string(),
      type: GameNodeTypeSchema,
      importance: GameNodeImportanceSchema,
      description: z.string().optional(),
    })),
    edges: z.array(z.object({
      source: z.string(),
      target: z.string(),
      relation: GameEdgeTypeSchema,
    })),
  }),
  latestAnswer: z.string().trim().max(3000).optional(),
});

export const GuidedDesignProposalSchema = z.object({
  explanation: z.string(),
  proposedNodes: z.array(z.object({
    proposalId: z.string().min(1),
    label: z.string().min(1),
    gameType: GameNodeTypeSchema,
    importance: GameNodeImportanceSchema,
    description: z.string(),
  })).max(3),
  proposedRelationships: z.array(z.object({
    proposalId: z.string().min(1),
    source: NodeReferenceSchema,
    target: NodeReferenceSchema,
    relation: GameEdgeTypeSchema,
  })).max(4),
  followUpQuestions: z.array(z.string().min(1)).min(1).max(2),
});

export type GuidedDesignRequest =
  z.infer<typeof GuidedDesignRequestSchema>;
