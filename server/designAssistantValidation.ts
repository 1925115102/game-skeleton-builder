import type { z } from 'zod/v4';
import { applyDesignChangeSet, type DesignChangeSet } from '../src/ai/changeSet';
import type { GameEdge, GameNode } from '../src/types';
import type { DesignChangeSetSchema } from './designAssistantSchema';

type CanonicalRequest = {
  skeleton: {
    nodes: Array<{ id: string; label: string; type: GameNode['data']['gameType']; importance: GameNode['data']['importance']; description?: string }>;
    edges: Array<{ id: string; source: string; target: string; relation: NonNullable<GameEdge['data']>['relation'] }>;
  };
};

type ChangeSet = z.infer<typeof DesignChangeSetSchema>;

export type CanonicalChangeSetValidation =
  | { success: true; changeSet: DesignChangeSet | null; normalizedOperationCount: number }
  | { success: false; error: string };

/**
 * Turns safe, provable AI no-ops into no-ops and verifies the remaining delta
 * against the exact canonical graph before it reaches the browser.
 */
export function normalizeAndValidateChangeSet(
  request: CanonicalRequest,
  changeSet: ChangeSet
): CanonicalChangeSetValidation {
  const canonicalNodeIds = new Set(request.skeleton.nodes.map((node) => node.id));
  const canonicalEdgeIds = new Set(request.skeleton.edges.map((edge) => edge.id));
  const canonicalEdgesById = new Map(request.skeleton.edges.map((edge) => [edge.id, edge]));
  const knownEdgeKeys = new Set(request.skeleton.edges.map(edgeKey));
  const proposedNodeIds = new Set<string>();
  const proposedEdgeIds = new Set<string>();
  const normalizedOperations: DesignChangeSet['operations'] = [];

  for (const operation of changeSet.operations) {
    if (operation.type === 'ADD_NODE') {
      if (canonicalNodeIds.has(operation.node.id) || proposedNodeIds.has(operation.node.id)) {
        return failure(`ADD_NODE attempts to use an existing node ID: ${operation.node.id}.`);
      }
      proposedNodeIds.add(operation.node.id);
      normalizedOperations.push(operation);
      continue;
    }

    if (operation.type === 'ADD_EDGE') {
      if (canonicalEdgeIds.has(operation.edge.id) || proposedEdgeIds.has(operation.edge.id)) {
        return failure(`ADD_EDGE attempts to use an existing edge ID: ${operation.edge.id}.`);
      }
      const key = edgeKey(operation.edge);
      // Identical semantic edges are provable no-ops. Removing only these is
      // safe; anything more ambiguous remains a visible model/server error.
      if (knownEdgeKeys.has(key)) continue;
      proposedEdgeIds.add(operation.edge.id);
      knownEdgeKeys.add(key);
      normalizedOperations.push(operation);
      continue;
    }

    if ((operation.type === 'REMOVE_EDGE' || operation.type === 'UPDATE_EDGE') && !canonicalEdgeIds.has(operation.edgeId)) {
      return failure(`${operation.type} references an edge ID that is not in the canonical skeleton.`);
    }

    // Maintain the proposed sequence's semantic state. An edge that existed
    // initially is not a no-op if an earlier operation removed or changed it.
    if (operation.type === 'REMOVE_EDGE') {
      const existing = canonicalEdgesById.get(operation.edgeId);
      if (existing) knownEdgeKeys.delete(edgeKey(existing));
    } else if (operation.type === 'UPDATE_EDGE') {
      const existing = canonicalEdgesById.get(operation.edgeId);
      if (existing) {
        knownEdgeKeys.delete(edgeKey(existing));
        canonicalEdgesById.set(operation.edgeId, { ...existing, relation: operation.relation });
        knownEdgeKeys.add(edgeKey({ ...existing, relation: operation.relation }));
      }
    }

    normalizedOperations.push(operation);
  }

  if (normalizedOperations.length === 0) {
    return { success: true, changeSet: null, normalizedOperationCount: changeSet.operations.length };
  }

  const normalized: DesignChangeSet = { ...changeSet, operations: normalizedOperations };
  const simulation = applyDesignChangeSet(toGameNodes(request), toGameEdges(request), normalized);
  if (!simulation.success) return failure(simulation.error);

  return {
    success: true,
    changeSet: normalized,
    normalizedOperationCount: changeSet.operations.length - normalizedOperations.length,
  };
}

/** Kept for focused callers/tests; full proposal processing should use the function above. */
export function validateExistingEdgeReferences(request: CanonicalRequest, changeSet: ChangeSet): string | null {
  const edgeIds = new Set(request.skeleton.edges.map((edge) => edge.id));
  for (const operation of changeSet.operations) {
    if ((operation.type === 'REMOVE_EDGE' || operation.type === 'UPDATE_EDGE') && !edgeIds.has(operation.edgeId)) {
      return `${operation.type} references an edge ID that is not in the canonical skeleton.`;
    }
  }
  return null;
}

function toGameNodes(request: CanonicalRequest): GameNode[] {
  return request.skeleton.nodes.map((node) => ({
    id: node.id,
    type: 'gameNode',
    position: { x: 0, y: 0 },
    data: { label: node.label, gameType: node.type, importance: node.importance, description: node.description },
  }));
}

function toGameEdges(request: CanonicalRequest): GameEdge[] {
  return request.skeleton.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    data: { relation: edge.relation },
  }));
}

function edgeKey(edge: { source: string; target: string; relation: string }): string {
  return `${edge.source}|${edge.target}|${edge.relation}`;
}

function failure(error: string): CanonicalChangeSetValidation {
  return { success: false, error };
}
