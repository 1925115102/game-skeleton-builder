import { validateCanonicalGraph } from '../ai/changeSet';
import type { GameEdge, GameNode } from '../types';

export function reverseCanonicalEdge(nodes: GameNode[], edges: GameEdge[], edgeId: string): { success: true; edges: GameEdge[] } | { success: false; error: string } {
  const existing = edges.find((edge) => edge.id === edgeId);
  if (!existing) return { success: false, error: 'The selected connection no longer exists.' };
  const nextEdges = edges.map((edge) => edge.id === edgeId ? { ...edge, source: edge.target, target: edge.source } : edge);
  const error = validateCanonicalGraph(nodes, nextEdges);
  return error ? { success: false, error } : { success: true, edges: nextEdges };
}
