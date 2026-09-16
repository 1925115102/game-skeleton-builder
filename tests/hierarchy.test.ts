import assert from 'node:assert/strict';
import test from 'node:test';
import { applyDesignChangeSet } from '../src/ai/changeSet';
import { getVisibleHierarchyGraph, hiddenExternalGameplayConnectionCount } from '../src/graph/hierarchy';
import { selectedNodeNeighborhood } from '../src/graph/neighborhood';
import { relationshipLabel } from '../src/graph/edgePresentation';
import { serializeSkeleton } from '../src/ai/skeletonSerializer';
import type { GameEdge, GameEdgeType, GameNode } from '../src/types';

const node = (id: string): GameNode => ({ id, type: 'gameNode', position: { x: 0, y: 0 }, data: { label: id, gameType: 'system', importance: 'supporting' } });
const edge = (id: string, source: string, target: string, relation: GameEdgeType): GameEdge => ({ id, source, target, data: { relation } });

test('derives selected-node incoming and outgoing neighborhood', () => {
  const edges = [edge('incoming', 'herbs', 'alchemy', 'leads_to'), edge('outgoing', 'alchemy', 'pills', 'produces')];
  const context = selectedNodeNeighborhood('alchemy', edges);
  assert.deepEqual(context.incoming.map((item) => item.id), ['incoming']);
  assert.deepEqual(context.outgoing.map((item) => item.id), ['outgoing']);
  assert.deepEqual([...context.nodeIds].sort(), ['alchemy', 'herbs', 'pills']);
  assert.equal(relationshipLabel('contains'), 'Contains');
});

test('hierarchy containment rejects self, duplicate, and cyclic relationships', () => {
  const nodes = [node('a'), node('b'), node('c')];
  const valid = applyDesignChangeSet(nodes, [], { title: '', rationale: '', expectedEffect: '', operations: [{ type: 'ADD_EDGE', edge: { id: 'ab', source: 'a', target: 'b', relation: 'contains' } }] });
  assert.equal(valid.success, true);
  const self = applyDesignChangeSet(nodes, [], { title: '', rationale: '', expectedEffect: '', operations: [{ type: 'ADD_EDGE', edge: { id: 'self', source: 'a', target: 'a', relation: 'contains' } }] });
  assert.equal(self.success, false);
  const duplicate = applyDesignChangeSet(nodes, [edge('ab', 'a', 'b', 'contains')], { title: '', rationale: '', expectedEffect: '', operations: [{ type: 'ADD_EDGE', edge: { id: 'duplicate', source: 'a', target: 'b', relation: 'contains' } }] });
  assert.equal(duplicate.success, false);
  const cycle = applyDesignChangeSet(nodes, [edge('ab', 'a', 'b', 'contains'), edge('bc', 'b', 'c', 'contains')], { title: '', rationale: '', expectedEffect: '', operations: [{ type: 'ADD_EDGE', edge: { id: 'ca', source: 'c', target: 'a', relation: 'contains' } }] });
  assert.equal(cycle.success, false);
});

test('collapse hides descendants only in the visible graph and serialization remains canonical', () => {
  const nodes = [node('alchemy'), node('furnace'), node('recipe')];
  const edges = [edge('alchemy-furnace', 'alchemy', 'furnace', 'contains'), edge('furnace-recipe', 'furnace', 'recipe', 'contains')];
  const visible = getVisibleHierarchyGraph(nodes, edges, ['alchemy']);
  assert.deepEqual(visible.nodes.map((item) => item.id), ['alchemy']);
  assert.deepEqual(visible.edges, []);
  const serialized = serializeSkeleton(nodes, edges);
  assert.equal(serialized.nodes.length, 3);
  assert.equal(serialized.edges.length, 2);
  assert.equal(serialized.edges[0].relation, 'contains');
  assert.equal(hiddenExternalGameplayConnectionCount('alchemy', [...edges, edge('furnace-world', 'furnace', 'world', 'leads_to')]), 1);
});
