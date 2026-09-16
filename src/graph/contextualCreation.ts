import type { GameEdge, GameEdgeType, GameNode } from '../types';

export function contextualNodePosition(selectedNode: GameNode | null, nodes: GameNode[]) {
  if (!selectedNode) return { x: 200 + nodes.length * 30, y: 200 + nodes.length * 30 };
  let position = { x: selectedNode.position.x + 260, y: selectedNode.position.y };
  while (nodes.some((node) => Math.abs(node.position.x - position.x) < 160 && Math.abs(node.position.y - position.y) < 90)) {
    position = { ...position, y: position.y + 120 };
  }
  return position;
}

export function createContextualNode(nodes: GameNode[], selectedNodeId: string | null, id: string, relation: GameEdgeType): { node: GameNode; edge: GameEdge | null } {
  const selected = nodes.find((node) => node.id === selectedNodeId) ?? null;
  const node: GameNode = {
    id, type: 'gameNode', position: contextualNodePosition(selected, nodes),
    data: { label: 'New Activity', gameType: 'activity', importance: 'supporting', description: '' },
  };
  const edge = selected ? {
    id: crypto.randomUUID(), source: selected.id, target: id, label: relation, data: { relation }, type: 'smoothstep',
  } satisfies GameEdge : null;
  return { node, edge };
}
