import { z } from 'zod/v4';

export const AIReviewSchema = z.object({

  summary: z.string(),

  strengths: z.array(
    z.object({
      id: z.string(),

      title: z.string(),

      description: z.string(),

      affectedNodeIds: z.array(
        z.string()
      ),
    })
  ),

  issues: z.array(
    z.object({
      id: z.string(),

      title: z.string(),

      description: z.string(),

      affectedNodeIds: z.array(
        z.string()
      ),

      severity: z.enum([
        'low',
        'medium',
        'high',
      ]),
    })
  ),

  suggestions: z.array(
    z.object({
      id: z.string(),

      title: z.string(),

      description: z.string(),

      affectedNodeIds: z.array(
        z.string()
      ),

      scopeImpact: z.enum([
        'low',
        'medium',
        'high',
      ]),

      category: z.enum([
        'core_loop',
        'resource_loop',
        'progression',
        'system_connection',
        'player_motivation',
        'scope',
        'other',
      ]),
    })
  ),

});

export type AIReviewResult =
  z.infer<typeof AIReviewSchema>;