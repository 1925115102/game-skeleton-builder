import type {
  GameEdge,
  GameNode,
} from '../types';

import type {
  ProposedDesignNode,
  ProposedDesignRelationship,
  ProposedNodeReference,
} from './guidedDesignTypes';


export function findDuplicateNode(
  nodes: GameNode[],
  proposal: ProposedDesignNode
): GameNode | undefined {
  const normalizedLabel = proposal.label.trim().toLocaleLowerCase();

  return nodes.find(
    (node) =>
      node.data.gameType === proposal.gameType &&
      node.data.label.trim().toLocaleLowerCase() === normalizedLabel
  );
}


export function resolveProposalNodeReference(
  reference: ProposedNodeReference,
  nodes: GameNode[],
  acceptedNodeIds: Record<string, string>
): string | null {
  if (reference.kind === 'existing_node') {
    return nodes.some((node) => node.id === reference.id)
      ? reference.id
      : null;
  }

  return acceptedNodeIds[reference.id] ?? null;
}


export function canApplyProposedRelationship(
  proposal: ProposedDesignRelationship,
  nodes: GameNode[],
  edges: GameEdge[],
  acceptedNodeIds: Record<string, string>
): {
  canApply: boolean;
  sourceId?: string;
  targetId?: string;
  reason?: string;
} {
  const sourceId = resolveProposalNodeReference(
    proposal.source,
    nodes,
    acceptedNodeIds
  );

  const targetId = resolveProposalNodeReference(
    proposal.target,
    nodes,
    acceptedNodeIds
  );

  if (!sourceId || !targetId) {
    return {
      canApply: false,
      reason: 'Accept each proposed endpoint before applying this relationship.',
    };
  }

  if (sourceId === targetId) {
    return {
      canApply: false,
      reason: 'A relationship cannot connect a node to itself.',
    };
  }

  const duplicate = edges.some(
    (edge) =>
      edge.source === sourceId &&
      edge.target === targetId &&
      edge.data?.relation === proposal.relation
  );

  if (duplicate) {
    return {
      canApply: false,
      reason: 'An equivalent relationship already exists.',
    };
  }

  return {
    canApply: true,
    sourceId,
    targetId,
  };
}
