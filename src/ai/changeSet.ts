import type {
  GameEdge,
  GameEdgeType,
  GameNode,
  GameNodeImportance,
  GameNodeType,
} from '../types';

export type DesignChangeOperation =
  | { type: 'ADD_NODE'; node: { id: string; label: string; gameType: GameNodeType; importance: GameNodeImportance; description: string | null } }
  | { type: 'UPDATE_NODE'; nodeId: string; replacement: { label: string; gameType: GameNodeType; importance: GameNodeImportance; description: string | null } }
  | { type: 'REMOVE_NODE'; nodeId: string }
  | { type: 'ADD_EDGE'; edge: { id: string; source: string; target: string; relation: GameEdgeType } }
  | { type: 'UPDATE_EDGE'; edgeId: string; relation: GameEdgeType }
  | { type: 'REMOVE_EDGE'; edgeId: string };

export interface DesignChangeSet {
  title: string;
  rationale: string;
  expectedEffect: string;
  operations: DesignChangeOperation[];
}

const nodeTypes = new Set<GameNodeType>([
  'activity', 'system', 'resource', 'challenge', 'progression', 'goal',
]);
const importanceTypes = new Set<GameNodeImportance>([
  'core', 'supporting', 'optional',
]);
const edgeTypes = new Set<GameEdgeType>([
  'produces', 'consumes', 'requires', 'unlocks', 'improves', 'leads_to',
]);

export function applyDesignChangeSet(
  nodes: GameNode[],
  edges: GameEdge[],
  changeSet: DesignChangeSet
): { success: true; nodes: GameNode[]; edges: GameEdge[] } | { success: false; error: string } {
  const nextNodes = nodes.map((node) => ({ ...node, data: { ...node.data } }));
  const nextEdges: GameEdge[] = edges.map((edge): GameEdge => ({ ...edge, data: edge.data ? { ...edge.data } : edge.data }));
  const nodeMap = new Map(nextNodes.map((node) => [node.id, node]));
  const edgeMap = new Map(nextEdges.map((edge) => [edge.id, edge]));

  for (const operation of changeSet.operations) {
    if (operation.type === 'ADD_NODE') {
      const { node } = operation;
      if (!node.id || nodeMap.has(node.id) || !node.label.trim() || !nodeTypes.has(node.gameType) || !importanceTypes.has(node.importance)) return invalid('Invalid ADD_NODE operation.');
      const nextNode: GameNode = { id: node.id, type: 'gameNode', position: { x: 200 + nextNodes.length * 30, y: 200 + nextNodes.length * 30 }, data: { ...node, description: node.description ?? undefined } };
      nextNodes.push(nextNode); nodeMap.set(node.id, nextNode);
    } else if (operation.type === 'UPDATE_NODE') {
      const node = nodeMap.get(operation.nodeId);
      const replacement = operation.replacement;
      if (!node || !replacement.label.trim() || !nodeTypes.has(replacement.gameType) || !importanceTypes.has(replacement.importance)) return invalid('Invalid UPDATE_NODE operation.');
      node.data = { ...node.data, ...replacement, description: replacement.description ?? undefined };
    } else if (operation.type === 'REMOVE_NODE') {
      if (!nodeMap.has(operation.nodeId)) return invalid('REMOVE_NODE references a nonexistent node.');
      nodeMap.delete(operation.nodeId);
    } else if (operation.type === 'ADD_EDGE') {
      const { edge } = operation;
      if (!edge.id || edgeMap.has(edge.id) || !edgeTypes.has(edge.relation)) return invalid('Invalid ADD_EDGE operation.');
      const nextEdge: GameEdge = { id: edge.id, source: edge.source, target: edge.target, label: edge.relation.replaceAll('_', ' ').toUpperCase(), data: { relation: edge.relation }, type: 'smoothstep' };
      nextEdges.push(nextEdge); edgeMap.set(edge.id, nextEdge);
    } else if (operation.type === 'UPDATE_EDGE') {
      const edge = edgeMap.get(operation.edgeId);
      if (!edge || !edgeTypes.has(operation.relation)) return invalid('Invalid UPDATE_EDGE operation.');
      edge.data = { ...edge.data, relation: operation.relation };
      edge.label = operation.relation.replaceAll('_', ' ').toUpperCase();
    } else if (operation.type === 'REMOVE_EDGE') {
      if (!edgeMap.has(operation.edgeId)) return invalid('REMOVE_EDGE references a nonexistent edge.');
      edgeMap.delete(operation.edgeId);
    }
  }

  const finalNodes = nextNodes.filter((node) => nodeMap.has(node.id));
  const finalEdges = nextEdges.filter((edge) => edgeMap.has(edge.id));
  const seenEdges = new Set<string>();
  for (const edge of finalEdges) {
    if (!nodeMap.has(edge.source) || !nodeMap.has(edge.target)) return invalid('The change set would leave a dangling edge.');
    if (edge.source === edge.target) return invalid('The change set would create a self-edge.');
    const relation = edge.data?.relation;
    if (!relation || !edgeTypes.has(relation)) return invalid('The change set contains an invalid edge relationship.');
    const key = `${edge.source}|${edge.target}|${relation}`;
    if (seenEdges.has(key)) return invalid('The change set would create a duplicate equivalent edge.');
    seenEdges.add(key);
  }

  return { success: true, nodes: finalNodes, edges: finalEdges };
}

function invalid(error: string): { success: false; error: string } {
  return { success: false, error };
}
