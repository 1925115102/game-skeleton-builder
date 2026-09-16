import type {
  GameEdgeType,
  GameNodeImportance,
  GameNodeType,
} from '../types';

export interface GuidedDesignProjectContext {
  name: string;
  brief: string;
}

export interface ProposedDesignNode {
  proposalId: string;
  label: string;
  gameType: GameNodeType;
  importance: GameNodeImportance;
  description: string;
}

export type ProposalNodeReference = {
  kind: 'proposed_node';
  id: string;
};

export type ExistingNodeReference = {
  kind: 'existing_node';
  id: string;
};

export type ProposedNodeReference =
  | ProposalNodeReference
  | ExistingNodeReference;

export interface ProposedDesignRelationship {
  proposalId: string;
  source: ProposedNodeReference;
  target: ProposedNodeReference;
  relation: GameEdgeType;
}

export interface GuidedDesignProposal {
  explanation: string;
  proposedNodes: ProposedDesignNode[];
  proposedRelationships: ProposedDesignRelationship[];
  followUpQuestions: string[];
}

export interface GuidedDesignRequest {
  project: GuidedDesignProjectContext;
  skeleton: {
    nodes: Array<{
      id: string;
      label: string;
      type: string;
      importance: string;
      description?: string;
    }>;
    edges: Array<{
      source: string;
      target: string;
      relation: string;
    }>;
  };
  latestAnswer?: string;
}
