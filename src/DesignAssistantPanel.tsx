import type { AIReviewResult, AIIssue } from './ai/aiTypes';
import type { DesignChangeSet } from './ai/changeSet';
import { presentChangeSet } from './ai/changeSetPresentation';
import { splitIssuesByLifecycle } from './ai/issueLifecycle';
import type { GameEdge, GameNode } from './types';
import type { AskDesignExchange, AskDesignResponse } from './ai/askDesignTypes';
import { useState } from 'react';
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
  askResponse: AskDesignResponse | null;
  askHistory: AskDesignExchange[];
  onAsk: (message: string) => void;
  onDismissAsk: () => void;
}

export default function DesignAssistantPanel(props: Props) {
  const { analysis, changeSet, selectedIssue, suggestedIssueIds, appliedIssueIds, nodes, edges, loading, applying, analysisStale, error, onRequestChange, onAnalyze, onApprove, onReject, onBack, onClose, askResponse, askHistory, onAsk, onDismissAsk } = props;
  const [askInput, setAskInput] = useState('');
  const showingSuggestion = Boolean(changeSet && (selectedIssue || askResponse));
  const showingAskClarification = Boolean(askResponse?.clarificationQuestion && !changeSet);
  const presentedChanges = changeSet ? presentChangeSet(changeSet, nodes, edges) : [];
  const issueGroups = analysis ? splitIssuesByLifecycle(analysis.issues, appliedIssueIds) : { active: [], resolved: [] };
  const selectedIssueApplied = Boolean(selectedIssue && appliedIssueIds.includes(selectedIssue.id));

  return <div className="inspector">
    <h2>AI Design Assistant</h2>
    <p style={introStyle}>AI analyzes and proposes. You approve every graph change.</p>
    {error && <p role="alert" style={errorStyle}>{error}</p>}
    {!showingSuggestion && <section style={askStyle}>
      <h3 style={{ marginTop: 0 }}>Ask AI</h3>
      <p style={detailStyle}>Describe the change you want to make. AI will propose a reviewable design change.</p>
      {showingAskClarification && <p style={clarificationStyle}>{askResponse?.clarificationQuestion}</p>}
      <textarea value={askInput} rows={3} placeholder={showingAskClarification ? 'Answer the clarification…' : 'For example: Add five elemental materials under Resources.'} onChange={(event) => setAskInput(event.target.value)} />
      <button style={primaryButtonStyle} disabled={loading || !askInput.trim()} onClick={() => { onAsk(askInput.trim()); setAskInput(''); }}>{loading ? 'Thinking…' : showingAskClarification ? 'Answer & Continue' : 'Ask AI'}</button>
      {askHistory.length > 0 && <details><summary style={historySummaryStyle}>Recent Ask AI exchanges</summary>{askHistory.slice().reverse().map((exchange, index) => <div key={`${exchange.instruction}-${index}`} style={historyStyle}><strong>You:</strong> {exchange.instruction}<br /><strong>AI:</strong> {exchange.interpretation}{exchange.clarificationQuestion && <><br /><em>{exchange.clarificationQuestion}</em></>}</div>)}</details>}
    </section>}
    {showingSuggestion ? <>
      <button style={backButtonStyle} onClick={selectedIssue ? onBack : onDismissAsk} disabled={applying}>← {selectedIssue ? 'Back to analysis' : 'Back to Ask AI'}</button>
      <p style={eyebrowStyle}>{selectedIssue ? `Suggestion for: ${selectedIssue.title}` : `Ask AI: ${askResponse?.interpretation}`}</p>
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
        {selectedIssueApplied ? <p role="status" style={appliedNoticeStyle}>Applied to the design in this session. The analysis has not been re-verified.</p> : <>
          <button style={primaryButtonStyle} onClick={onApprove} disabled={applying}>{applying ? 'Applying...' : 'Approve Changes'}</button>
          <button style={buttonStyle} onClick={onReject} disabled={applying}>Reject</button>
        </>}
      </>}
      {selectedIssue && issueGroups.active.filter((issue) => issue.id !== selectedIssue.id).length > 0 && <section style={sectionStyle}>
        <h4 style={headingStyle}>Other issues</h4>
        {issueGroups.active.filter((issue) => issue.id !== selectedIssue.id).map((issue) => <button key={issue.id} style={issueSwitchStyle} onClick={() => onRequestChange(issue)} disabled={applying}>{issue.title}</button>)}
      </section>}
    </> : analysis && !loading ? <>
      {analysisStale && <p role="status" style={staleStyle}>Analysis may be outdated because the design changed.</p>}
      <button style={buttonStyle} onClick={onAnalyze}>Re-analyze</button>
      <section style={sectionStyle}><h3>Summary</h3><p style={bodyStyle}>{analysis.summary}</p></section>
      <section style={sectionStyle}><h3>Strengths</h3>{analysis.strengths.map((strength) => <div key={strength.id} style={cardStyle}><strong>{strength.title}</strong><div style={detailStyle}>{strength.description}</div></div>)}</section>
      <section style={sectionStyle}><h3>Issues</h3>{issueGroups.active.map((issue) => {
        const hasSuggestion = suggestedIssueIds.includes(issue.id);
        return <div key={issue.id} style={cardStyle}><strong>{issue.title}</strong><div style={detailStyle}>{issue.description}</div>
          <button style={smallButtonStyle} onClick={() => onRequestChange(issue)}>{hasSuggestion ? 'View Suggestion' : 'Suggest Improvement'}</button>
        </div>;
      })}</section>
      {issueGroups.resolved.length > 0 && <section style={sectionStyle}><h3>Resolved</h3>{issueGroups.resolved.map((issue) => <div key={issue.id} style={resolvedCardStyle}><strong>✓ {issue.title}</strong><div style={detailStyle}>Applied to the design in this session.</div>{suggestedIssueIds.includes(issue.id) && <button style={smallButtonStyle} onClick={() => onRequestChange(issue)}>View applied suggestion</button>}</div>)}</section>}
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
const issueSwitchStyle = { display: 'block', width: '100%', padding: '7px', marginBottom: '5px', textAlign: 'left' as const, border: '1px solid #dbe3ee', borderRadius: '5px', background: '#fff', cursor: 'pointer', fontSize: '12px' };
const resolvedCardStyle = { ...cardStyle, borderColor: '#bbf7d0', background: '#f0fdf4' };
const appliedNoticeStyle = { padding: '8px', borderRadius: '6px', background: '#f0fdf4', color: '#166534', fontSize: '13px' };
const askStyle = { margin: '14px 0', padding: '12px', border: '1px solid #c7d2fe', borderRadius: '8px', background: '#f8faff' };
const clarificationStyle = { padding: '8px', borderRadius: '6px', background: '#fff7ed', color: '#9a3412', fontSize: '13px' };
const historySummaryStyle = { marginTop: '8px', cursor: 'pointer', fontSize: '12px', color: '#475569' };
const historyStyle = { marginTop: '7px', fontSize: '12px', lineHeight: 1.4, color: '#475569' };
