import type { AIReviewResult, AIIssue } from './ai/aiTypes';
import type { DesignChangeSet } from './ai/changeSet';
import { presentChangeSet } from './ai/changeSetPresentation';
import type { GameEdge, GameNode } from './types';
import './NodeInspector.css';

interface Props {
  analysis: Pick<AIReviewResult, 'summary' | 'strengths' | 'issues'> | null;
  changeSet: DesignChangeSet | null;
  selectedIssue: AIIssue | null;
  suggestedIssueIds: string[];
  appliedIssueIds: string[];
  nodes: GameNode[];
  edges: GameEdge[];
  loading: boolean;
  applying: boolean;
  analysisStale: boolean;
  error: string | null;
  onRequestChange: (issue: AIIssue) => void;
  onAnalyze: () => void;
  onApprove: () => void;
  onReject: () => void;
  onBack: () => void;
  onClose: () => void;
}

export default function DesignAssistantPanel(props: Props) {
  const { analysis, changeSet, selectedIssue, suggestedIssueIds, appliedIssueIds, nodes, edges, loading, applying, analysisStale, error, onRequestChange, onAnalyze, onApprove, onReject, onBack, onClose } = props;
  const showingSuggestion = selectedIssue && (changeSet || loading);
  const presentedChanges = changeSet ? presentChangeSet(changeSet, nodes, edges) : [];

  return <div className="inspector">
    <h2>AI Design Assistant</h2>
    <p style={introStyle}>AI analyzes and proposes. You approve every graph change.</p>
    {error && <p role="alert" style={errorStyle}>{error}</p>}
    {showingSuggestion ? <>
      <button style={backButtonStyle} onClick={onBack} disabled={applying}>← Back to analysis</button>
      <p style={eyebrowStyle}>Suggestion for: {selectedIssue.title}</p>
      {loading && <p>Preparing a focused suggestion…</p>}
      {changeSet && <>
        <h3>{changeSet.title}</h3>
        <section style={sectionStyle}><h4 style={headingStyle}>Why this helps</h4><p style={bodyStyle}>{changeSet.rationale}</p></section>
        <section style={sectionStyle}><h4 style={headingStyle}>Proposed changes</h4>
          {presentedChanges.map((change, index) => <div key={`${change.action}-${change.title}-${index}`} style={changeStyle}>
            <span style={actionStyle}>{change.action}</span><strong>{change.title}</strong>{change.detail && <div style={detailStyle}>{change.detail}</div>}
          </div>)}
        </section>
        <section style={sectionStyle}><h4 style={headingStyle}>Expected effect</h4><p style={bodyStyle}>{changeSet.expectedEffect}</p></section>
        <button style={primaryButtonStyle} onClick={onApprove} disabled={applying}>{applying ? 'Applying...' : 'Approve Changes'}</button>
        <button style={buttonStyle} onClick={onReject} disabled={applying}>Reject</button>
      </>}
      {analysis && analysis.issues.filter((issue) => issue.id !== selectedIssue.id).length > 0 && <section style={sectionStyle}>
        <h4 style={headingStyle}>Other issues</h4>
        {analysis.issues.filter((issue) => issue.id !== selectedIssue.id).map((issue) => <button key={issue.id} style={issueSwitchStyle} onClick={() => onRequestChange(issue)} disabled={applying}>{issue.title}</button>)}
      </section>}
    </> : analysis && !loading ? <>
      {analysisStale && <p role="status" style={staleStyle}>Analysis may be outdated because the design changed.</p>}
      <button style={buttonStyle} onClick={onAnalyze}>Re-analyze</button>
      <section style={sectionStyle}><h3>Summary</h3><p style={bodyStyle}>{analysis.summary}</p></section>
      <section style={sectionStyle}><h3>Strengths</h3>{analysis.strengths.map((strength) => <div key={strength.id} style={cardStyle}><strong>{strength.title}</strong><div style={detailStyle}>{strength.description}</div></div>)}</section>
      <section style={sectionStyle}><h3>Issues</h3>{analysis.issues.map((issue) => {
        const hasSuggestion = suggestedIssueIds.includes(issue.id);
        const wasApplied = appliedIssueIds.includes(issue.id);
        return <div key={issue.id} style={cardStyle}><strong>{issue.title}</strong><div style={detailStyle}>{issue.description}</div>
          {wasApplied && <span style={appliedStyle}>Applied</span>}
          <button style={smallButtonStyle} onClick={() => onRequestChange(issue)}>{hasSuggestion ? 'View Suggestion' : 'Suggest Improvement'}</button>
        </div>;
      })}</section>
    </> : loading ? <p>Analyzing design…</p> : <button style={primaryButtonStyle} onClick={onAnalyze}>Analyze Design</button>}
    <button style={buttonStyle} onClick={onClose}>Close</button>
  </div>;
}

const introStyle = { fontSize: '13px', lineHeight: 1.5, color: '#475569' };
const sectionStyle = { margin: '14px 0' };
const cardStyle = { padding: '10px', border: '1px solid #dbe3ee', borderRadius: '7px', marginBottom: '9px', background: '#fff' };
const changeStyle = { padding: '10px', borderLeft: '3px solid #7c9cff', borderRadius: '4px', marginBottom: '8px', background: '#f8fafc', fontSize: '13px' };
const buttonStyle = { width: '100%', padding: '9px', marginBottom: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white', cursor: 'pointer' };
const primaryButtonStyle = { ...buttonStyle, border: '1px solid #4f6bed', background: '#4f6bed', color: 'white', fontWeight: 700 };
const smallButtonStyle = { marginTop: '8px', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '4px', background: 'white', cursor: 'pointer' };
const backButtonStyle = { ...smallButtonStyle, marginTop: 0 };
const bodyStyle = { fontSize: '13px', lineHeight: 1.45, margin: '5px 0' };
const detailStyle = { fontSize: '12px', lineHeight: 1.4, color: '#475569', marginTop: '4px' };
const headingStyle = { margin: '0 0 4px', fontSize: '13px', color: '#334155' };
const eyebrowStyle = { fontSize: '12px', color: '#64748b', margin: '10px 0' };
const actionStyle = { display: 'block', color: '#4f46e5', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' as const, marginBottom: '2px' };
const staleStyle = { padding: '8px', borderRadius: '6px', background: '#fff7ed', color: '#9a3412', fontSize: '13px' };
const errorStyle = { padding: '8px', borderRadius: '6px', background: '#fef2f2', color: '#b91c1c', fontSize: '13px' };
const appliedStyle = { display: 'inline-block', marginTop: '8px', marginRight: '8px', fontSize: '11px', fontWeight: 700, color: '#15803d' };
const issueSwitchStyle = { display: 'block', width: '100%', padding: '7px', marginBottom: '5px', textAlign: 'left' as const, border: '1px solid #dbe3ee', borderRadius: '5px', background: '#fff', cursor: 'pointer', fontSize: '12px' };
