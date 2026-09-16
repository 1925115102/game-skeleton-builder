import assert from 'node:assert/strict';
import test from 'node:test';
import { highlightForChangeSet, highlightForIssue } from '../src/ai/designAssistantHighlights';
import type { GameEdge, GameNode } from '../src/types';

const nodes: GameNode[] = [
  { id: 'a', type: 'gameNode', position: { x: 0, y: 0 }, data: { label: 'A', gameType: 'activity', importance: 'core' } },
  { id: 'b', type: 'gameNode', position: { x: 1, y: 1 }, data: { label: 'B', gameType: 'resource', importance: 'supporting' } },
];
const edges: GameEdge[] = [{ id: 'e', source: 'a', target: 'b', data: { relation: 'produces' } }];

test('derives highlights for an issue and existing change-set elements only', () => {
  assert.deepEqual(highlightForIssue({ id: 'i', title: '', description: '', severity: 'low', affectedNodeIds: ['b'] }), { nodeIds: ['b'], edgeIds: [] });
  const highlight = highlightForChangeSet({ title: '', rationale: '', expectedEffect: '', operations: [
    { type: 'ADD_NODE', node: { id: 'new', label: 'New', gameType: 'system', importance: 'supporting', description: null } },
    { type: 'UPDATE_NODE', nodeId: 'b', replacement: { label: 'B', gameType: 'resource', importance: 'supporting', description: null } },
    { type: 'REMOVE_EDGE', edgeId: 'e' },
  ] }, nodes, edges);
  assert.deepEqual(new Set(highlight.nodeIds), new Set(['a', 'b']));
  assert.deepEqual(highlight.edgeIds, ['e']);
});
