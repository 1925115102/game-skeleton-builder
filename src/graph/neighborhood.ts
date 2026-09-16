import type { GameEdge } from '../types';

export function selectedNodeNeighborhood(nodeId: string | null, edges: GameEdge[]) {
  if (!nodeId) return { nodeIds: new Set<string>(), edgeIds: new Set<string>(), incoming: [], outgoing: [] };
  const incoming = edges.filter((edge) => edge.target === nodeId);
  const outgoing = edges.filter((edge) => edge.source === nodeId);
  return {
    nodeIds: new Set([nodeId, ...incoming.map((edge) => edge.source), ...outgoing.map((edge) => edge.target)]),
    edgeIds: new Set([...incoming, ...outgoing].map((edge) => edge.id)),
    incoming,
    outgoing,
  };
}
