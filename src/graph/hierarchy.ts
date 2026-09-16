import type { GameEdge, GameNode } from '../types';

const isContains = (edge: GameEdge) => edge.data?.relation === 'contains';

export function hierarchyDescendants(parentId: string, edges: GameEdge[]): Set<string> {
  const children = new Map<string, string[]>();
  for (const edge of edges.filter(isContains)) children.set(edge.source, [...(children.get(edge.source) ?? []), edge.target]);
  const descendants = new Set<string>();
  const visit = (nodeId: string) => {
    for (const child of children.get(nodeId) ?? []) {
      if (descendants.has(child)) continue;
      descendants.add(child);
      visit(child);
    }
  };
  visit(parentId);
  return descendants;
}

export function hierarchyParents(edges: GameEdge[]): Set<string> {
  return new Set(edges.filter(isContains).map((edge) => edge.source));
}

export function getVisibleHierarchyGraph(nodes: GameNode[], edges: GameEdge[], collapsedParentIds: string[]) {
  const hidden = new Set<string>();
  for (const parentId of collapsedParentIds) hierarchyDescendants(parentId, edges).forEach((id) => hidden.add(id));
  const visibleNodes = nodes.filter((node) => !hidden.has(node.id));
  const visibleIds = new Set(visibleNodes.map((node) => node.id));
  return { nodes: visibleNodes, edges: edges.filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target)), hiddenIds: hidden };
}

/** A v1 collapse is disabled when hiding descendants would conceal gameplay meaning. */
export function hiddenExternalGameplayConnectionCount(parentId: string, edges: GameEdge[]): number {
  const hidden = hierarchyDescendants(parentId, edges);
  return edges.filter((edge) => !isContains(edge)
    && ((hidden.has(edge.source) && !hidden.has(edge.target)) || (hidden.has(edge.target) && !hidden.has(edge.source)))).length;
}

export function containsCycle(edges: GameEdge[]): boolean {
  const children = new Map<string, string[]>();
  for (const edge of edges.filter(isContains)) children.set(edge.source, [...(children.get(edge.source) ?? []), edge.target]);
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (nodeId: string): boolean => {
    if (visiting.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;
    visiting.add(nodeId);
    for (const child of children.get(nodeId) ?? []) if (visit(child)) return true;
    visiting.delete(nodeId); visited.add(nodeId);
    return false;
  };
  return [...children.keys()].some(visit);
}
