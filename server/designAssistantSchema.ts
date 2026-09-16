import { z } from 'zod/v4';

const nodeType = z.enum(['activity', 'system', 'resource', 'challenge', 'progression', 'goal']);
const importance = z.enum(['core', 'supporting', 'optional']);
const relation = z.enum(['produces', 'consumes', 'requires', 'unlocks', 'improves', 'leads_to', 'contains']);

const projectAndSkeleton = z.object({
  project: z.object({ name: z.string(), brief: z.string() }),
  skeleton: z.object({
    nodes: z.array(z.object({ id: z.string(), label: z.string(), type: nodeType, importance, description: z.string().optional() })),
    edges: z.array(z.object({ id: z.string(), source: z.string(), target: z.string(), relation })),
  }),
});

export const DesignAnalysisRequestSchema = projectAndSkeleton;

export const DesignAnalysisSchema = z.object({
  summary: z.string(),
  strengths: z.array(z.object({ id: z.string(), title: z.string(), description: z.string(), affectedNodeIds: z.array(z.string()) })),
  issues: z.array(z.object({ id: z.string(), title: z.string(), description: z.string(), affectedNodeIds: z.array(z.string()), severity: z.enum(['low', 'medium', 'high']) })),
});

const changeOperation = z.discriminatedUnion('type', [
  z.object({ type: z.literal('ADD_NODE'), node: z.object({ id: z.string().min(1), label: z.string().min(1), gameType: nodeType, importance, description: z.string().nullable() }) }),
  z.object({ type: z.literal('UPDATE_NODE'), nodeId: z.string().min(1), replacement: z.object({ label: z.string().min(1), gameType: nodeType, importance, description: z.string().nullable() }) }),
  z.object({ type: z.literal('REMOVE_NODE'), nodeId: z.string().min(1) }),
  z.object({ type: z.literal('ADD_EDGE'), edge: z.object({ id: z.string().min(1), source: z.string().min(1), target: z.string().min(1), relation }) }),
  z.object({ type: z.literal('UPDATE_EDGE'), edgeId: z.string().min(1), relation }),
  z.object({ type: z.literal('REMOVE_EDGE'), edgeId: z.string().min(1) }),
]);

export const DesignChangeRequestSchema = projectAndSkeleton.extend({
  issue: DesignAnalysisSchema.shape.issues.element,
});

export const DesignChangeSetSchema = z.object({
  title: z.string(),
  rationale: z.string(),
  expectedEffect: z.string(),
  operations: z.array(changeOperation).min(1).max(8),
});
