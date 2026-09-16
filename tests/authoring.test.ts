import assert from 'node:assert/strict';
import test from 'node:test';
import { createContextualNode } from '../src/graph/contextualCreation';
import { reverseCanonicalEdge } from '../src/graph/edgeReversal';
import { AskDesignResponseSchema } from '../server/designAssistantSchema';
import { askDesignPrompt } from '../server/designAssistantPrompt';
import { validateExistingEdgeReferences } from '../server/designAssistantValidation';
import type { GameEdge, GameNode } from '../src/types';

const node = (id: string, x = 0, y = 0): GameNode => ({ id, type: 'gameNode', position: { x, y }, data: { label: id, gameType: 'system', importance: 'supporting' } });
const edge = (id: string, source: string, target: string, relation: 'leads_to' | 'contains' = 'leads_to'): GameEdge => ({ id, source, target, data: { relation } });

test('Ask AI schema supports either a change set or a clarification without mutation', () => {
  const clarification = AskDesignResponseSchema.safeParse({ interpretation: 'Crafting has two plausible homes.', reasoning: null, clarificationQuestion: 'Should it be part of Alchemy?', changeSet: null });
  const change = AskDesignResponseSchema.safeParse({ interpretation: 'Add a furnace subsystem.', reasoning: 'It expands Alchemy.', clarificationQuestion: null, changeSet: { title: 'Expand Alchemy', rationale: '', expectedEffect: '', operations: [{ type: 'ADD_NODE', node: { id: 'furnace', label: 'Furnace', gameType: 'system', importance: 'supporting', description: null } }] } });
  assert.equal(clarification.success, true);
  assert.equal(change.success, true);
});

test('Ask AI prompt includes canonical hierarchy and exact edge IDs', () => {
  const request = { project: { name: 'Game', brief: '' }, skeleton: { nodes: [{ id: 'alchemy', label: 'Alchemy', type: 'system' as const, importance: 'core' as const, description: undefined }], edges: [{ id: 'alchemy-furnace', source: 'alchemy', target: 'furnace', relation: 'contains' as const }] }, instruction: 'Expand Alchemy', clarificationAnswer: null };
  const prompt = askDesignPrompt(request);
  assert.match(prompt, /contains means parent → child subsystem decomposition/);
  assert.match(prompt, /alchemy-furnace/);
});

test('Ask AI validation rejects invented edge IDs', () => {
  const request = { skeleton: { edges: [{ id: 'canonical-edge' }] } };
  const changeSet = { title: '', rationale: '', expectedEffect: '', operations: [{ type: 'REMOVE_EDGE' as const, edgeId: 'invented-edge' }] };
  assert.match(validateExistingEdgeReferences(request, changeSet) ?? '', /not in the canonical skeleton/);
});

test('contextual node creation is unconnected without selection and connected with predictable relation when selected', () => {
  const nodes = [node('alchemy', 100, 100)];
  const unconnected = createContextualNode(nodes, null, 'new', 'leads_to');
  assert.equal(unconnected.edge, null);
  const connectedDefault = createContextualNode(nodes, 'alchemy', 'new-default', 'leads_to');
  assert.equal(connectedDefault.edge?.source, 'alchemy');
  assert.equal(connectedDefault.edge?.target, 'new-default');
  assert.equal(connectedDefault.edge?.data?.relation, 'leads_to');
  assert.ok(connectedDefault.node.position.x > nodes[0].position.x);
  const connectedContains = createContextualNode(nodes, 'alchemy', 'furnace', 'contains');
  assert.equal(connectedContains.edge?.data?.relation, 'contains');
});

test('edge reversal preserves ID and relation, and rejects duplicate or containment-cycle reversals atomically', () => {
  const nodes = [node('a'), node('b'), node('c')];
  const original = [edge('ab', 'a', 'b')];
  const reversed = reverseCanonicalEdge(nodes, original, 'ab');
  assert.equal(reversed.success, true); if (reversed.success) {
    assert.deepEqual(reversed.edges[0], edge('ab', 'b', 'a'));
  }
  const duplicate = reverseCanonicalEdge(nodes, [edge('ab', 'a', 'b'), edge('ba', 'b', 'a')], 'ab');
  assert.equal(duplicate.success, false);
  const originalHierarchy = [edge('ab', 'a', 'b', 'contains'), edge('bc', 'b', 'c', 'contains'), edge('ac', 'a', 'c', 'contains')];
  const hierarchy = reverseCanonicalEdge(nodes, originalHierarchy, 'ac');
  assert.equal(hierarchy.success, false);
  assert.deepEqual(originalHierarchy, [edge('ab', 'a', 'b', 'contains'), edge('bc', 'b', 'c', 'contains'), edge('ac', 'a', 'c', 'contains')]);
});
