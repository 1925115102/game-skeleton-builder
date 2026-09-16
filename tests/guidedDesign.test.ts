import assert from 'node:assert/strict';
import test from 'node:test';

import {
  GuidedDesignProposalSchema,
} from '../server/guidedDesignSchema';

import {
  canApplyProposedRelationship,
} from '../src/guidedDesign/proposalApplication';

import {
  getProjectBrief,
  isValidGameState,
} from '../src/gameStateValidation';

import type {
  GameEdge,
  GameNode,
} from '../src/types';

const explore: GameNode = {
  id: 'explore',
  type: 'gameNode',
  position: { x: 0, y: 0 },
  data: {
    label: 'Explore',
    gameType: 'activity',
    importance: 'core',
  },
};

const materials: GameNode = {
  id: 'materials',
  type: 'gameNode',
  position: { x: 100, y: 0 },
  data: {
    label: 'Materials',
    gameType: 'resource',
    importance: 'supporting',
  },
};

test('accepts a valid Guided Design proposal schema', () => {
  const proposal = GuidedDesignProposalSchema.safeParse({
    explanation: 'Start with a resource loop.',
    proposedNodes: [{
      proposalId: 'alchemy',
      label: 'Alchemy',
      gameType: 'system',
      importance: 'supporting',
      description: 'Converts materials into useful items.',
    }],
    proposedRelationships: [{
      proposalId: 'materials-to-alchemy',
      source: { kind: 'existing_node', id: 'materials' },
      target: { kind: 'proposed_node', id: 'alchemy' },
      relation: 'consumes',
    }],
    followUpQuestions: ['What does Alchemy produce?'],
  });

  assert.equal(proposal.success, true);
});

test('rejects an invalid Guided Design node category', () => {
  const proposal = GuidedDesignProposalSchema.safeParse({
    explanation: '',
    proposedNodes: [{
      proposalId: 'invalid',
      label: 'Invalid',
      gameType: 'building',
      importance: 'core',
      description: '',
    }],
    proposedRelationships: [],
    followUpQuestions: [],
  });

  assert.equal(proposal.success, false);
});

test('rejects an invalid Guided Design relationship', () => {
  const proposal = GuidedDesignProposalSchema.safeParse({
    explanation: '',
    proposedNodes: [],
    proposedRelationships: [{
      proposalId: 'invalid',
      source: { kind: 'existing_node', id: 'explore' },
      target: { kind: 'existing_node', id: 'materials' },
      relation: 'transforms',
    }],
    followUpQuestions: [],
  });

  assert.equal(proposal.success, false);
});

test('blocks self-edge and duplicate relationship proposals', () => {
  const existingEdge: GameEdge = {
    id: 'explore-materials',
    source: 'explore',
    target: 'materials',
    data: { relation: 'produces' },
  };

  const selfEdge = canApplyProposedRelationship(
    {
      proposalId: 'self',
      source: { kind: 'existing_node', id: 'explore' },
      target: { kind: 'existing_node', id: 'explore' },
      relation: 'leads_to',
    },
    [explore, materials],
    [existingEdge],
    {}
  );

  const duplicate = canApplyProposedRelationship(
    {
      proposalId: 'duplicate',
      source: { kind: 'existing_node', id: 'explore' },
      target: { kind: 'existing_node', id: 'materials' },
      relation: 'produces',
    },
    [explore, materials],
    [existingEdge],
    {}
  );

  assert.equal(selfEdge.canApply, false);
  assert.equal(duplicate.canApply, false);
});

test('project brief survives export/import and legacy 0.1 exports remain valid', () => {
  const currentExport = {
    version: '0.1',
    name: 'Cultivation Roguelike',
    brief: 'Explore, gather, and advance through cultivation stages.',
    nodes: [],
    edges: [],
  };

  const legacyExport = {
    version: '0.1',
    name: 'Legacy Project',
    nodes: [],
    edges: [],
  };

  const importedExport = JSON.parse(JSON.stringify(currentExport));

  assert.equal(isValidGameState(importedExport), true);
  if (isValidGameState(importedExport)) {
    assert.equal(
      getProjectBrief(importedExport),
      'Explore, gather, and advance through cultivation stages.'
    );
  }
  assert.equal(isValidGameState(legacyExport), true);
  if (isValidGameState(legacyExport)) {
    assert.equal(getProjectBrief(legacyExport), '');
  }
});
