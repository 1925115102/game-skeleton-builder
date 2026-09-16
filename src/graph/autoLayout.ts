import dagre from '@dagrejs/dagre';
import type { GameEdge, GameNode } from '../types';

export const COMPACT_NODE_DIMENSIONS = { width: 200, height: 88 };

/**
 * Produces presentation positions only. The canonical node/edge identities and
 * semantic data are deliberately left untouched.
 */
export function getAutoLayoutedNodes(nodes: GameNode[], edges: GameEdge[]): GameNode[] {
  if (nodes.length < 2) return nodes.map((node) => ({ ...node, position: { ...node.position } }));

  const graph = new dagre.graphlib.Graph({ multigraph: true });
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({
    rankdir: 'LR',
    ranker: 'network-simplex',
    nodesep: 62,
    ranksep: 135,
    edgesep: 28,
    marginx: 56,
    marginy: 56,
  });

  for (const node of nodes) graph.setNode(node.id, { ...COMPACT_NODE_DIMENSIONS });
  for (const edge of edges) {
    if (nodes.some((node) => node.id === edge.source) && nodes.some((node) => node.id === edge.target)) {
      graph.setEdge(edge.source, edge.target, {}, edge.id);
    }
  }

  dagre.layout(graph);

  return nodes.map((node) => {
    const positioned = graph.node(node.id);
    if (!positioned || !Number.isFinite(positioned.x) || !Number.isFinite(positioned.y)) {
      return { ...node, position: { ...node.position } };
    }
    return {
      ...node,
      position: { x: positioned.x - COMPACT_NODE_DIMENSIONS.width / 2, y: positioned.y - COMPACT_NODE_DIMENSIONS.height / 2 },
    };
  });
}
