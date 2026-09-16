import type { AIIssue } from './aiTypes';
import type { DesignChangeSet } from './changeSet';
import type { GameEdge, GameNode } from '../types';

export interface AssistantHighlight {
  nodeIds: string[];
  edgeIds: string[];
}

export function highlightForIssue(issue: AIIssue): AssistantHighlight {
  return { nodeIds: issue.affectedNodeIds, edgeIds: [] };
}

export function highlightForChangeSet(
  changeSet: DesignChangeSet,
  nodes: GameNode[],
  edges: GameEdge[]
): AssistantHighlight {
  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();
  const existingNodes = new Set(nodes.map((node) => node.id));
  const edgeById = new Map(edges.map((edge) => [edge.id, edge]));

  for (const operation of changeSet.operations) {
    if (operation.type === 'UPDATE_NODE' || operation.type === 'REMOVE_NODE') {
      if (existingNodes.has(operation.nodeId)) nodeIds.add(operation.nodeId);
    }
    if (operation.type === 'ADD_EDGE') {
      if (existingNodes.has(operation.edge.source)) nodeIds.add(operation.edge.source);
      if (existingNodes.has(operation.edge.target)) nodeIds.add(operation.edge.target);
    }
    if (operation.type === 'UPDATE_EDGE' || operation.type === 'REMOVE_EDGE') {
      const edge = edgeById.get(operation.edgeId);
      if (edge) {
        edgeIds.add(edge.id);
        nodeIds.add(edge.source);
        nodeIds.add(edge.target);
      }
    }
  }

  return { nodeIds: [...nodeIds], edgeIds: [...edgeIds] };
}
