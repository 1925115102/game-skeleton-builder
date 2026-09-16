import assert from 'node:assert/strict';
import test from 'node:test';
import { validateExistingEdgeReferences } from '../server/designAssistantValidation';

const request = {
  project: { name: 'Test', brief: '' },
  skeleton: { nodes: [], edges: [{ id: 'edge-explore-materials', source: 'explore', target: 'materials', relation: 'produces' as const }] },
  issue: { id: 'duplicate', title: '', description: '', affectedNodeIds: [], severity: 'low' as const },
};

test('server accepts an AI remove-edge operation only when it references a canonical ID', () => {
  const valid = { title: '', rationale: '', expectedEffect: '', operations: [{ type: 'REMOVE_EDGE' as const, edgeId: 'edge-explore-materials' }] };
  const invented = { title: '', rationale: '', expectedEffect: '', operations: [{ type: 'REMOVE_EDGE' as const, edgeId: 'invented-edge' }] };
  assert.equal(validateExistingEdgeReferences(request, valid), null);
  assert.match(validateExistingEdgeReferences(request, invented) ?? '', /not in the canonical skeleton/);
});
