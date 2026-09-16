import assert from 'node:assert/strict';
import test from 'node:test';
import { applyDesignChangeSet } from '../src/ai/changeSet';
import { getProjectExportFilename, migrateProjectDocument } from '../src/projectState';
import type { GameEdge, GameNode } from '../src/types';

const node = (id: string): GameNode => ({ id, type: 'gameNode', position: { x: 0, y: 0 }, data: { label: id, gameType: 'activity', importance: 'core' } });
const edge = (id: string, source: string, target: string): GameEdge => ({ id, source, target, data: { relation: 'leads_to' } });

test('applies add, update, remove node operations', () => {
  const added = applyDesignChangeSet([node('a')], [], { title: '', rationale: '', expectedEffect: '', operations: [{ type: 'ADD_NODE', node: { id: 'b', label: 'B', gameType: 'resource', importance: 'supporting' } }] });
  assert.equal(added.success, true); if (!added.success) return;
  const updated = applyDesignChangeSet(added.nodes, [], { title: '', rationale: '', expectedEffect: '', operations: [{ type: 'UPDATE_NODE', nodeId: 'b', updates: { label: 'Materials' } }] });
  assert.equal(updated.success, true); if (!updated.success) return;
  assert.equal(updated.nodes[1].data.label, 'Materials');
  const removed = applyDesignChangeSet(updated.nodes, [], { title: '', rationale: '', expectedEffect: '', operations: [{ type: 'REMOVE_NODE', nodeId: 'b' }] });
  assert.equal(removed.success, true); if (removed.success) assert.equal(removed.nodes.length, 1);
});

test('applies valid edge operations and mixed change sets', () => {
  const result = applyDesignChangeSet([node('a'), node('b')], [edge('old', 'a', 'b')], { title: '', rationale: '', expectedEffect: '', operations: [
    { type: 'UPDATE_EDGE', edgeId: 'old', relation: 'produces' },
    { type: 'ADD_NODE', node: { id: 'c', label: 'C', gameType: 'system', importance: 'supporting' } },
    { type: 'ADD_EDGE', edge: { id: 'new', source: 'b', target: 'c', relation: 'consumes' } },
  ] });
  assert.equal(result.success, true); if (result.success) assert.equal(result.edges.length, 2);
});

test('rejects dangling, self, duplicate, and invalid references atomically', () => {
  const originalNodes = [node('a'), node('b')]; const originalEdges = [edge('e', 'a', 'b')];
  const cases = [
    [{ type: 'ADD_EDGE', edge: { id: 'x', source: 'a', target: 'missing', relation: 'leads_to' } }],
    [{ type: 'ADD_EDGE', edge: { id: 'x', source: 'a', target: 'a', relation: 'leads_to' } }],
    [{ type: 'ADD_EDGE', edge: { id: 'x', source: 'a', target: 'b', relation: 'leads_to' } }],
    [{ type: 'UPDATE_NODE', nodeId: 'missing', updates: { label: 'Nope' } }],
    [{ type: 'REMOVE_NODE', nodeId: 'a' }],
  ] as const;
  for (const operations of cases) {
    const result = applyDesignChangeSet(originalNodes, originalEdges, { title: '', rationale: '', expectedEffect: '', operations: operations as never });
    assert.equal(result.success, false);
    assert.equal(originalNodes.length, 2);
    assert.equal(originalEdges.length, 1);
  }
});

test('migrates 0.1 projects and preserves 0.2 metadata', () => {
  const migrated = migrateProjectDocument({ version: '0.1', name: 'Old', brief: 'Brief', nodes: [], edges: [] });
  assert.equal(migrated?.version, '0.2'); assert.equal(migrated?.project.name, 'Old');
  const project = { id: 'project-id', name: 'New', brief: 'Context', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z' };
  const current = migrateProjectDocument({ version: '0.2', project, nodes: [], edges: [] });
  assert.deepEqual(current?.project, project);
  assert.equal(getProjectExportFilename('Cultivation Roguelike', new Date('2026-09-15T12:00:00Z')), 'Cultivation-Roguelike_2026-09-15.json');
});
