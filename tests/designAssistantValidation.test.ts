import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeAndValidateChangeSet, validateExistingEdgeReferences } from '../server/designAssistantValidation';
import { applyDesignChangeSet } from '../src/ai/changeSet';
import type { GameEdge, GameNode } from '../src/types';

const request = {
  project: { name: 'Test', brief: '' },
  skeleton: { nodes: [
    { id: 'alchemy-materials', label: 'Alchemy Materials', type: 'system' as const, importance: 'core' as const },
    { id: 'spirit-grass', label: 'Spirit Grass', type: 'resource' as const, importance: 'supporting' as const },
    { id: 'spirit-flower', label: 'Spirit Flower', type: 'resource' as const, importance: 'supporting' as const },
  ], edges: [
    { id: 'edge-explore-materials', source: 'alchemy-materials', target: 'spirit-grass', relation: 'contains' as const },
    { id: 'edge-gameplay', source: 'spirit-grass', target: 'alchemy-materials', relation: 'produces' as const },
  ] },
  issue: { id: 'duplicate', title: '', description: '', affectedNodeIds: [], severity: 'low' as const },
};

test('server accepts an AI remove-edge operation only when it references a canonical ID', () => {
  const valid = { title: '', rationale: '', expectedEffect: '', operations: [{ type: 'REMOVE_EDGE' as const, edgeId: 'edge-explore-materials' }] };
  const invented = { title: '', rationale: '', expectedEffect: '', operations: [{ type: 'REMOVE_EDGE' as const, edgeId: 'invented-edge' }] };
  assert.equal(validateExistingEdgeReferences(request, valid), null);
  assert.match(validateExistingEdgeReferences(request, invented) ?? '', /not in the canonical skeleton/);
});

test('server normalizes redundant canonical edges, leaving an applyable delta', () => {
  const proposal = { title: 'Organize materials', rationale: '', expectedEffect: '', operations: [
    { type: 'ADD_NODE' as const, node: { id: 'spirit-fruit', label: 'Spirit Fruit', gameType: 'resource' as const, importance: 'supporting' as const, description: null } },
    { type: 'ADD_EDGE' as const, edge: { id: 'materials-fruit', source: 'alchemy-materials', target: 'spirit-fruit', relation: 'contains' as const } },
    { type: 'ADD_EDGE' as const, edge: { id: 'materials-grass-again', source: 'alchemy-materials', target: 'spirit-grass', relation: 'contains' as const } },
  ] };
  const normalized = normalizeAndValidateChangeSet(request, proposal);
  assert.equal(normalized.success, true);
  if (!normalized.success || !normalized.changeSet) return assert.fail('Expected an applyable normalized change set.');
  assert.equal(normalized.changeSet.operations.length, 2);
  assert.equal(normalized.normalizedOperationCount, 1);
  const nodes: GameNode[] = request.skeleton.nodes.map((node) => ({ id: node.id, type: 'gameNode', position: { x: 0, y: 0 }, data: { label: node.label, gameType: node.type, importance: node.importance } }));
  const edges: GameEdge[] = request.skeleton.edges.map((edge) => ({ id: edge.id, source: edge.source, target: edge.target, data: { relation: edge.relation } }));
  assert.equal(applyDesignChangeSet(nodes, edges, normalized.changeSet).success, true);
});

test('server normalizes duplicate ADD_EDGE operations and all-redundant proposals', () => {
  const duplicateInsideProposal = normalizeAndValidateChangeSet(request, { title: '', rationale: '', expectedEffect: '', operations: [
    { type: 'ADD_EDGE', edge: { id: 'new-edge-a', source: 'alchemy-materials', target: 'spirit-flower', relation: 'contains' } },
    { type: 'ADD_EDGE', edge: { id: 'new-edge-b', source: 'alchemy-materials', target: 'spirit-flower', relation: 'contains' } },
  ] });
  assert.equal(duplicateInsideProposal.success, true);
  if (duplicateInsideProposal.success) assert.equal(duplicateInsideProposal.changeSet?.operations.length, 1);
  const allRedundant = normalizeAndValidateChangeSet(request, { title: '', rationale: '', expectedEffect: '', operations: [
    { type: 'ADD_EDGE', edge: { id: 'same-gameplay', source: 'spirit-grass', target: 'alchemy-materials', relation: 'produces' } },
    { type: 'ADD_EDGE', edge: { id: 'same-contains', source: 'alchemy-materials', target: 'spirit-grass', relation: 'contains' } },
  ] });
  assert.equal(allRedundant.success, true);
  if (allRedundant.success) assert.equal(allRedundant.changeSet, null);
});

test('server rejects invented references and conflicting operations instead of repairing them', () => {
  const inventedRemove = normalizeAndValidateChangeSet(request, { title: '', rationale: '', expectedEffect: '', operations: [{ type: 'REMOVE_EDGE', edgeId: 'invented-edge' }] });
  const inventedUpdate = normalizeAndValidateChangeSet(request, { title: '', rationale: '', expectedEffect: '', operations: [{ type: 'UPDATE_EDGE', edgeId: 'invented-edge', relation: 'requires' }] });
  const existingNodeId = normalizeAndValidateChangeSet(request, { title: '', rationale: '', expectedEffect: '', operations: [{ type: 'ADD_NODE', node: { id: 'spirit-grass', label: 'Different', gameType: 'resource', importance: 'supporting', description: null } }] });
  assert.equal(inventedRemove.success, false);
  assert.equal(inventedUpdate.success, false);
  assert.equal(existingNodeId.success, false);
});

test('server simulation rejects hierarchy cycles introduced by a batch', () => {
  const cycle = normalizeAndValidateChangeSet(request, { title: '', rationale: '', expectedEffect: '', operations: [
    { type: 'ADD_EDGE', edge: { id: 'grass-materials', source: 'spirit-grass', target: 'alchemy-materials', relation: 'contains' } },
  ] });
  assert.equal(cycle.success, false);
  if (!cycle.success) assert.match(cycle.error, /containment cycle/);
});
