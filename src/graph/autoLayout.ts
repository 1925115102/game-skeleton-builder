import dagre from '@dagrejs/dagre';
import type { GameEdge, GameNode } from '../types';

const NODE_WIDTH = 210;
const NODE_HEIGHT = 120;

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
    nodesep: 80,
    ranksep: 150,
    edgesep: 40,
    marginx: 40,
    marginy: 40,
  });

  for (const node of nodes) graph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
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
      position: { x: positioned.x - NODE_WIDTH / 2, y: positioned.y - NODE_HEIGHT / 2 },
    };
  });
}
