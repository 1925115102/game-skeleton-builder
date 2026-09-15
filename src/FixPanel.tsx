import { useState } from 'react';

import type {
  GameNode,
  GameEdgeType,
} from './types';

import type {
  AnalysisIssue,
} from './analyzer/analyzerTypes';

import type {
  IssueFixOption,
} from './analyzer/issueFixMap';

import './NodeInspector.css';


interface FixPanelProps {
  issue: AnalysisIssue;

  fix: IssueFixOption;

  nodes: GameNode[];

  onApply: (
    targetNodeId: string,
    relation: GameEdgeType
  ) => void;

  onCancel: () => void;
}


function FixPanel({
  issue,
  fix,
  nodes,
  onApply,
  onCancel,
}: FixPanelProps) {

  // ==========================================
  // Problem Node
  // ==========================================

  const sourceNodeId =
    issue.nodeIds?.[0] ?? '';

  const sourceNode =
    nodes.find(
      (node) =>
        node.id === sourceNodeId
    );


  // ==========================================
  // Candidate Target Nodes
  // ==========================================

  const candidateNodes =
    nodes.filter(
      (node) =>
        node.id !== sourceNodeId
    );


  // ==========================================
  // Selected Target
  // ==========================================

  const [
    targetNodeId,
    setTargetNodeId,
  ] = useState<string>(
    candidateNodes[0]?.id ?? ''
  );


  // ==========================================
  // Default Relationship
  // ==========================================

  const defaultRelation: GameEdgeType =
    fix.suggestedRelations?.[0] ??
    'leads_to';


  const [
    relation,
    setRelation,
  ] = useState<GameEdgeType>(
    defaultRelation
  );


  // ==========================================
  // Render
  // ==========================================

  return (
    <div className="inspector">

      <h2>
        Apply Fix
      </h2>


      {/* ======================================
          Fix Description
      ====================================== */}

      <div
        style={{
          marginBottom: '20px',
        }}
      >

        <div
          style={{
            fontWeight: 700,
          }}
        >
          {fix.label}
        </div>


        <div
          style={{
            marginTop: '6px',
            fontSize: '13px',
            lineHeight: 1.5,
            opacity: 0.7,
          }}
        >
          {fix.description}
        </div>


        <div
          style={{
            marginTop: '8px',
            fontSize: '11px',
            opacity: 0.5,
          }}
        >
          Scope impact: {fix.scopeImpact}
        </div>

      </div>


      {/* ======================================
          Problem Node
      ====================================== */}

      <label>
        Problem Node

        <input
          value={
            sourceNode?.data.label ??
            sourceNodeId
          }
          disabled
        />
      </label>


      {/* ======================================
          Target Node
      ====================================== */}

      <label>
        Connect To

        <select
          value={targetNodeId}

          onChange={(event) => {
            setTargetNodeId(
              event.target.value
            );
          }}
        >

          {candidateNodes.length === 0 && (
            <option value="">
              No available nodes
            </option>
          )}


          {candidateNodes.map(
            (node) => (
              <option
                key={node.id}
                value={node.id}
              >
                {node.data.label}
              </option>
            )
          )}

        </select>

      </label>


      {/* ======================================
          Relationship
      ====================================== */}

      <label>
        Relationship

        <select
          value={relation}

          onChange={(event) => {
            setRelation(
              event.target.value as GameEdgeType
            );
          }}
        >

          {(
            fix.suggestedRelations?.length
              ? fix.suggestedRelations
              : ['leads_to']
          ).map((type) => (

            <option
              key={type}
              value={type}
            >
              {type
                .replaceAll('_', ' ')
                .toUpperCase()}
            </option>

          ))}

        </select>

      </label>


      {/* ======================================
          Apply
      ====================================== */}

      <button
        onClick={() => {
          if (!targetNodeId) {
            return;
          }

          onApply(
            targetNodeId,
            relation
          );
        }}

        disabled={!targetNodeId}

        style={{
          width: '100%',
          padding: '10px',
          marginBottom: '8px',
          borderRadius: '6px',
          border: '1px solid #ccc',
          cursor: targetNodeId
            ? 'pointer'
            : 'not-allowed',
        }}
      >
        Apply Fix
      </button>


      {/* ======================================
          Cancel
      ====================================== */}

      <button
        onClick={onCancel}

        style={{
          width: '100%',
          padding: '10px',
          borderRadius: '6px',
          border: '1px solid #ccc',
          cursor: 'pointer',
        }}
      >
        Cancel
      </button>

    </div>
  );
}


export default FixPanel;