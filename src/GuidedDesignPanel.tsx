import { useState } from 'react';

import type {
  GameEdge,
  GameNode,
} from './types';

import {
  canApplyProposedRelationship,
} from './guidedDesign/proposalApplication';

import type {
  GuidedDesignProposal,
  ProposedNodeReference,
} from './guidedDesign/guidedDesignTypes';

import './NodeInspector.css';

interface GuidedDesignPanelProps {
  proposal: GuidedDesignProposal | null;
  nodes: GameNode[];
  edges: GameEdge[];
  acceptedNodeIds: Record<string, string>;
  acceptedRelationshipIds: string[];
  rejectedNodeIds: string[];
  rejectedRelationshipIds: string[];
  isLoading: boolean;
  error: string | null;
  onAcceptNode: (proposalId: string) => void;
  onRejectNode: (proposalId: string) => void;
  onAcceptRelationship: (proposalId: string) => void;
  onRejectRelationship: (proposalId: string) => void;
  onAcceptAll: () => void;
  onRequestFollowUp: (answer: string) => void;
  onClose: () => void;
}

function GuidedDesignPanel({
  proposal,
  nodes,
  edges,
  acceptedNodeIds,
  acceptedRelationshipIds,
  rejectedNodeIds,
  rejectedRelationshipIds,
  isLoading,
  error,
  onAcceptNode,
  onRejectNode,
  onAcceptRelationship,
  onRejectRelationship,
  onAcceptAll,
  onRequestFollowUp,
  onClose,
}: GuidedDesignPanelProps) {
  const [answer, setAnswer] = useState('');

  const referenceLabel = (
    reference: ProposedNodeReference
  ) => {
    if (reference.kind === 'existing_node') {
      return nodes.find((node) => node.id === reference.id)
        ?.data.label ?? reference.id;
    }

    return proposal?.proposedNodes.find(
      (node) => node.proposalId === reference.id
    )?.label ?? reference.id;
  };

  return (
    <div className="inspector">
      <h2>Guided Design</h2>

      <p style={{ fontSize: '13px', lineHeight: 1.5 }}>
        AI proposals stay separate from your skeleton until you accept them.
      </p>

      {isLoading && <p>Developing a small proposal…</p>}

      {error && <p role="alert">{error}</p>}

      {!isLoading && !proposal && !error && (
        <p>Add a project brief, then request a proposal.</p>
      )}

      {proposal && !isLoading && (
        <>
          {proposal.explanation && (
            <p style={{ fontSize: '13px', lineHeight: 1.5 }}>
              {proposal.explanation}
            </p>
          )}

          <button
            onClick={onAcceptAll}
            style={actionStyle}
          >
            Accept All Available
          </button>

          <h3>Proposed Nodes</h3>

          {proposal.proposedNodes.map((node) => {
            const accepted = Boolean(acceptedNodeIds[node.proposalId]);
            const rejected = rejectedNodeIds.includes(node.proposalId);

            return (
              <div key={node.proposalId} style={cardStyle}>
                <strong>{node.label}</strong>
                <div style={detailStyle}>
                  {node.gameType} · {node.importance}
                </div>
                {node.description && (
                  <div style={detailStyle}>{node.description}</div>
                )}
                <ProposalActions
                  accepted={accepted}
                  rejected={rejected}
                  onAccept={() => onAcceptNode(node.proposalId)}
                  onReject={() => onRejectNode(node.proposalId)}
                />
              </div>
            );
          })}

          <h3>Proposed Relationships</h3>

          {proposal.proposedRelationships.map((relationship) => {
            const result = canApplyProposedRelationship(
              relationship,
              nodes,
              edges,
              acceptedNodeIds
            );
            const accepted = acceptedRelationshipIds.includes(
              relationship.proposalId
            );
            const rejected = rejectedRelationshipIds.includes(
              relationship.proposalId
            );

            return (
              <div key={relationship.proposalId} style={cardStyle}>
                <strong>
                  {referenceLabel(relationship.source)} →{' '}
                  {referenceLabel(relationship.target)}
                </strong>
                <div style={detailStyle}>{relationship.relation}</div>
                {!accepted && !rejected && !result.canApply && (
                  <div style={detailStyle}>{result.reason}</div>
                )}
                <ProposalActions
                  accepted={accepted}
                  rejected={rejected}
                  disabled={!result.canApply}
                  onAccept={() =>
                    onAcceptRelationship(relationship.proposalId)
                  }
                  onReject={() =>
                    onRejectRelationship(relationship.proposalId)
                  }
                />
              </div>
            );
          })}

          <h3>Follow-up Questions</h3>

          {proposal.followUpQuestions.map((question) => (
            <p key={question} style={{ fontSize: '13px', lineHeight: 1.5 }}>
              {question}
            </p>
          ))}

          <textarea
            rows={4}
            value={answer}
            placeholder="Answer a question or add more context."
            onChange={(event) => setAnswer(event.target.value)}
            style={{ width: '100%', marginBottom: '8px' }}
          />

          <button
            onClick={() => {
              onRequestFollowUp(answer);
              setAnswer('');
            }}
            disabled={!answer.trim()}
            style={actionStyle}
          >
            Develop Next Step
          </button>
        </>
      )}

      <button onClick={onClose} style={actionStyle}>Close</button>
    </div>
  );
}

function ProposalActions({
  accepted,
  rejected,
  disabled = false,
  onAccept,
  onReject,
}: {
  accepted: boolean;
  rejected: boolean;
  disabled?: boolean;
  onAccept: () => void;
  onReject: () => void;
}) {
  if (accepted) {
    return <div style={detailStyle}>Accepted</div>;
  }

  if (rejected) {
    return <div style={detailStyle}>Rejected</div>;
  }

  return (
    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
      <button disabled={disabled} onClick={onAccept}>Accept</button>
      <button onClick={onReject}>Reject</button>
    </div>
  );
}

const cardStyle = {
  padding: '10px',
  marginBottom: '10px',
  border: '1px solid #ddd',
  borderRadius: '6px',
  background: 'white',
};

const detailStyle = {
  marginTop: '5px',
  fontSize: '12px',
  color: '#666',
};

const actionStyle = {
  width: '100%',
  padding: '9px',
  marginBottom: '10px',
  border: '1px solid #ccc',
  borderRadius: '6px',
  background: 'white',
  cursor: 'pointer',
};

export default GuidedDesignPanel;
