import type { GameEdge, GameNode } from '../types';

type Side = 'top' | 'right' | 'bottom' | 'left';
const PORT_COUNT = 4;

interface Direction {
  source: Side;
  target: Side;
}

function directionFor(source: GameNode, target: GameNode): Direction {
  const dx = target.position.x - source.position.x;
  const dy = target.position.y - source.position.y;
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? { source: 'right', target: 'left' } : { source: 'left', target: 'right' };
  return dy >= 0 ? { source: 'bottom', target: 'top' } : { source: 'top', target: 'bottom' };
}

/** Assign stable handle lanes so neighbouring relationships do not share one port. */
export function routeEdges(nodes: GameNode[], edges: GameEdge[]): GameEdge[] {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const directions = new Map<string, Direction>();
  for (const edge of edges) {
    const source = nodeById.get(edge.source);
    const target = nodeById.get(edge.target);
    if (source && target) directions.set(edge.id, directionFor(source, target));
  }

  const assignSlots = (key: (edge: GameEdge, direction: Direction) => string) => {
    const slots = new Map<string, number>();
    const groups = new Map<string, GameEdge[]>();
    for (const edge of edges) {
      const direction = directions.get(edge.id);
      if (!direction) continue;
      const groupKey = key(edge, direction);
      groups.set(groupKey, [...(groups.get(groupKey) ?? []), edge]);
    }
    for (const group of groups.values()) {
      group.sort((a, b) => a.id.localeCompare(b.id)).forEach((edge, index) => slots.set(edge.id, index % PORT_COUNT));
    }
    return slots;
  };

  const sourceSlots = assignSlots((edge, direction) => `${edge.source}:${direction.source}`);
  const targetSlots = assignSlots((edge, direction) => `${edge.target}:${direction.target}`);
  return edges.map((edge) => {
    const direction = directions.get(edge.id);
    if (!direction) return edge;
    return {
      ...edge,
      sourceHandle: `source-${direction.source}-${sourceSlots.get(edge.id) ?? 0}`,
      targetHandle: `target-${direction.target}-${targetSlots.get(edge.id) ?? 0}`,
    };
  });
}
