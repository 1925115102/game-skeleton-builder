import { MarkerType } from '@xyflow/react';
import type { GameEdge, GameEdgeType } from '../types';

export const relationshipLabel = (relation: GameEdgeType): string => ({
  produces: 'Produces',
  consumes: 'Consumes',
  requires: 'Requires',
  unlocks: 'Unlocks',
  improves: 'Improves',
  leads_to: 'Leads to',
})[relation];

export function hasOppositeDirection(edge: GameEdge, allEdges: GameEdge[]): boolean {
  return allEdges.some((candidate) => candidate.id !== edge.id
    && candidate.source === edge.target && candidate.target === edge.source);
}

export function edgePresentation(edge: GameEdge, allEdges: GameEdge[], highlighted = false) {
  const color = highlighted ? '#ff9f1c' : '#64748b';
  const relation = edge.data?.relation ?? 'leads_to';
  const opposite = hasOppositeDirection(edge, allEdges);
  const pairedEdges = allEdges
    .filter((candidate) => candidate.source === edge.target && candidate.target === edge.source)
    .sort((a, b) => a.id.localeCompare(b.id));
  const pairedIndex = pairedEdges.length > 0 && edge.id.localeCompare(pairedEdges[0].id) > 0 ? 1 : 0;

  return {
    type: opposite ? 'relationshipEdge' : 'smoothstep',
    label: relationshipLabel(relation),
    data: { ...edge.data, relation, bidirectionalOffset: opposite ? (pairedIndex === 0 ? -1 : 1) : 0 },
    markerEnd: { type: MarkerType.ArrowClosed, color, width: 18, height: 18 },
    style: { ...edge.style, stroke: color, strokeWidth: highlighted ? 3 : 1.7 },
    labelStyle: { fill: highlighted ? '#b45309' : '#475569', fontSize: 11, fontWeight: 600 },
    labelBgStyle: { fill: '#ffffff', fillOpacity: 0.88 },
    pathOptions: { offset: opposite ? 36 + pairedIndex * 18 : 22, borderRadius: 14 },
  };
}
