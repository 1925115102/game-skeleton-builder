import type { DesignChangeSet } from './changeSet';
import { relationshipLabel } from '../graph/edgePresentation';
import type { GameEdge, GameNode } from '../types';

export interface PresentedChange {
  action: string;
  title: string;
  detail?: string;
}

export function presentChangeSet(changeSet: DesignChangeSet, nodes: GameNode[], edges: GameEdge[]): PresentedChange[] {
  const labels = new Map(nodes.map((node) => [node.id, node.data.label]));
  const knownEdges = new Map(edges.map((edge) => [edge.id, edge]));
  const name = (id: string) => labels.get(id) ?? 'New design element';

  return changeSet.operations.map((operation) => {
    if (operation.type === 'ADD_NODE') {
      labels.set(operation.node.id, operation.node.label);
      return { action: 'Add', title: operation.node.label, detail: operation.node.description ?? undefined };
    }
    if (operation.type === 'UPDATE_NODE') {
      const before = name(operation.nodeId);
      labels.set(operation.nodeId, operation.replacement.label);
      return { action: 'Change', title: `${before} → ${operation.replacement.label}`, detail: operation.replacement.description ?? undefined };
    }
    if (operation.type === 'REMOVE_NODE') return { action: 'Remove', title: name(operation.nodeId) };
    if (operation.type === 'ADD_EDGE') {
      return { action: 'Connect', title: `${name(operation.edge.source)} → ${name(operation.edge.target)}`, detail: relationshipLabel(operation.edge.relation) };
    }
    const edge = knownEdges.get(operation.edgeId);
    const connection = edge ? `${name(edge.source)} → ${name(edge.target)}` : 'Existing connection';
    if (operation.type === 'REMOVE_EDGE') return { action: 'Remove connection', title: connection, detail: edge ? relationshipLabel(edge.data?.relation ?? 'leads_to') : undefined };
    return {
      action: 'Change connection',
      title: connection,
      detail: edge ? `${relationshipLabel(edge.data?.relation ?? 'leads_to')} → ${relationshipLabel(operation.relation)}` : relationshipLabel(operation.relation),
    };
  });
}
