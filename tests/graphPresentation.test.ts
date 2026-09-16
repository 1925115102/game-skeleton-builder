import assert from 'node:assert/strict';
import test from 'node:test';
import { presentChangeSet } from '../src/ai/changeSetPresentation';
import { COMPACT_NODE_DIMENSIONS, getAutoLayoutedNodes } from '../src/graph/autoLayout';
import { edgePresentation, hasOppositeDirection, relationshipLabel } from '../src/graph/edgePresentation';
import { routeEdges } from '../src/graph/edgeRouting';
import type { GameEdge, GameEdgeType, GameNode } from '../src/types';

const node = (id: string, label = id): GameNode => ({ id, type: 'gameNode', position: { x: 2, y: 3 }, data: { label, gameType: 'activity', importance: 'core' } });
const edge = (id: string, source: string, target: string, relation: GameEdgeType = 'leads_to'): GameEdge => ({ id, source, target, data: { relation } });

test('auto layout preserves graph semantics and creates finite positions', () => {
  const nodes = [node('a', 'Explore'), node('b', 'Materials'), node('c', 'Alchemy')];
  const edges = [edge('ab', 'a', 'b', 'produces'), edge('bc', 'b', 'c', 'consumes'), edge('ca', 'c', 'a', 'leads_to')];
  const result = getAutoLayoutedNodes(nodes, edges);
  assert.deepEqual(result.map(({ id, data }) => ({ id, data })), nodes.map(({ id, data }) => ({ id, data })));
  assert.deepEqual(edges, [edge('ab', 'a', 'b', 'produces'), edge('bc', 'b', 'c', 'consumes'), edge('ca', 'c', 'a', 'leads_to')]);
  assert.ok(result.every((item) => Number.isFinite(item.position.x) && Number.isFinite(item.position.y)));
});

test('auto layout handles empty and single-node graphs', () => {
  assert.deepEqual(getAutoLayoutedNodes([], []), []);
  const only = node('only');
  assert.deepEqual(getAutoLayoutedNodes([only], []), [only]);
});

test('compact layout dimensions ignore long descriptions and keep positions bounded', () => {
  const longDescription = 'A very long description '.repeat(100);
  const nodes = Array.from({ length: 12 }, (_, index) => ({ ...node(`n${index}`, `Node ${index}`), data: { ...node(`n${index}`).data, description: longDescription } }));
  const edges = nodes.slice(1).map((item, index) => edge(`e${index}`, nodes[index].id, item.id));
  const result = getAutoLayoutedNodes(nodes, edges);
  const xs = result.map((item) => item.position.x);
  const ys = result.map((item) => item.position.y);
  assert.deepEqual(COMPACT_NODE_DIMENSIONS, { width: 200, height: 88 });
  assert.ok(Math.max(...xs) - Math.min(...xs) < 5000);
  assert.ok(Math.max(...ys) - Math.min(...ys) < 1500);
});

test('presents every operation in human-readable language, including added nodes', () => {
  const changes = presentChangeSet({ title: '', rationale: '', expectedEffect: '', operations: [
    { type: 'ADD_NODE', node: { id: 'pill', label: 'Cultivation Pill', gameType: 'resource', importance: 'supporting', description: null } },
    { type: 'UPDATE_NODE', nodeId: 'gather', replacement: { label: 'Gather Materials', gameType: 'activity', importance: 'core', description: null } },
    { type: 'REMOVE_NODE', nodeId: 'old' },
    { type: 'ADD_EDGE', edge: { id: 'new-edge', source: 'gather', target: 'pill', relation: 'produces' } },
    { type: 'UPDATE_EDGE', edgeId: 'existing', relation: 'requires' },
    { type: 'REMOVE_EDGE', edgeId: 'remove' },
  ] }, [node('gather', 'Gather Resources'), node('old', 'Collect Materials'), node('alchemy', 'Alchemy')], [edge('existing', 'gather', 'alchemy', 'leads_to'), edge('remove', 'old', 'alchemy', 'consumes')]);
  assert.deepEqual(changes.map(({ action, title }) => ({ action, title })), [
    { action: 'Add', title: 'Cultivation Pill' },
    { action: 'Change', title: 'Gather Resources → Gather Materials' },
    { action: 'Remove', title: 'Collect Materials' },
    { action: 'Connect', title: 'Gather Materials → Cultivation Pill' },
    { action: 'Change connection', title: 'Gather Materials → Alchemy' },
    { action: 'Remove connection', title: 'Collect Materials → Alchemy' },
  ]);
  assert.equal(JSON.stringify(changes).includes('ADD_NODE'), false);
});

test('edge presentation has an arrow, readable relationship labels, and preserves opposite directions', () => {
  const forward = edge('forward', 'a', 'b', 'improves');
  const reverse = edge('reverse', 'b', 'a', 'requires');
  assert.equal(relationshipLabel('leads_to'), 'Leads to');
  assert.equal(hasOppositeDirection(forward, [forward, reverse]), true);
  const normal = edgePresentation(forward, [forward, reverse]);
  const highlighted = edgePresentation(forward, [forward, reverse], true);
  assert.equal(normal.label, 'Improves');
  assert.equal(normal.markerEnd.type, 'arrowclosed');
  assert.notEqual(normal.pathOptions.offset, edgePresentation(reverse, [forward, reverse]).pathOptions.offset);
  assert.equal(highlighted.markerEnd.color, '#ff9f1c');
  assert.equal(highlighted.style.stroke, '#ff9f1c');
  assert.equal(forward.data?.relation, 'improves');
  assert.equal(reverse.data?.relation, 'requires');
});

test('routing assigns distinct ports to parallel edges', () => {
  const nodes = [node('a'), node('b')];
  const edges = [edge('one', 'a', 'b', 'produces'), edge('two', 'a', 'b', 'requires'), edge('three', 'a', 'b', 'improves')];
  const routed = routeEdges(nodes, edges);
  assert.equal(new Set(routed.map((item) => item.sourceHandle)).size, 3);
  assert.equal(new Set(routed.map((item) => item.targetHandle)).size, 3);
});
