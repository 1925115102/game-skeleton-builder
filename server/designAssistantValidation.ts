import type { z } from 'zod/v4';
import type { DesignChangeSetSchema } from './designAssistantSchema';

/** Guards model output before it reaches the browser. The client keeps the same atomic guard. */
export function validateExistingEdgeReferences(
  request: { skeleton: { edges: Array<{ id: string }> } },
  changeSet: z.infer<typeof DesignChangeSetSchema>
): string | null {
  const edgeIds = new Set(request.skeleton.edges.map((edge) => edge.id));
  for (const operation of changeSet.operations) {
    if ((operation.type === 'REMOVE_EDGE' || operation.type === 'UPDATE_EDGE') && !edgeIds.has(operation.edgeId)) {
      return `${operation.type} references an edge ID that is not in the canonical skeleton.`;
    }
  }
  return null;
}
