import type { AIReviewResult, AIIssue } from './ai/aiTypes';
import type { DesignChangeSet } from './ai/changeSet';
import './NodeInspector.css';

interface Props {
  analysis: Pick<AIReviewResult, 'summary' | 'strengths' | 'issues'> | null;
  changeSet: DesignChangeSet | null;
  loading: boolean;
  applying: boolean;
  analysisStale: boolean;
  error: string | null;
  onRequestChange: (issue: AIIssue) => void;
  onAnalyze: () => void;
  onApprove: () => void;
  onReject: () => void;
  onClose: () => void;
}

export default function DesignAssistantPanel({ analysis, changeSet, loading, applying, analysisStale, error, onRequestChange, onAnalyze, onApprove, onReject, onClose }: Props) {
  return <div className="inspector">
    <h2>AI Design Assistant</h2>
    <p style={{ fontSize: '13px', lineHeight: 1.5 }}>AI analyzes and proposes. You approve every graph change.</p>
    {loading && <p>{changeSet ? 'Preparing change set…' : 'Analyzing design…'}</p>}
    {error && <p role="alert">{error}</p>}
    {changeSet ? <>
      <h3>{changeSet.title}</h3>
      <p style={{ fontSize: '13px' }}>{changeSet.rationale}</p>
      <p style={{ fontSize: '13px' }}><strong>Expected effect:</strong> {changeSet.expectedEffect}</p>
      <h3>Proposed Change Set</h3>
      {changeSet.operations.map((operation, index) => <div key={`${operation.type}-${index}`} style={cardStyle}><strong>{operation.type}</strong><pre style={preStyle}>{JSON.stringify(operation, null, 2)}</pre></div>)}
      <button style={buttonStyle} onClick={onApprove} disabled={applying}>{applying ? 'Applying...' : 'Approve Changes'}</button>
      <button style={buttonStyle} onClick={onReject} disabled={applying}>Reject</button>
    </> : analysis && !loading && <>
      {analysisStale && <p role="status">Analysis may be outdated because the design changed.</p>}
      <button style={buttonStyle} onClick={onAnalyze}>Re-analyze</button>
      <h3>Summary</h3><p style={{ fontSize: '13px' }}>{analysis.summary}</p>
      <h3>Strengths</h3>{analysis.strengths.map((strength) => <div key={strength.id} style={cardStyle}><strong>{strength.title}</strong><div>{strength.description}</div></div>)}
      <h3>Issues</h3>{analysis.issues.map((issue) => <div key={issue.id} style={cardStyle}><strong>{issue.title}</strong><div>{issue.description}</div><button style={smallButtonStyle} onClick={() => onRequestChange(issue)}>Suggest Change Set</button></div>)}
    </>}
    {!analysis && !loading && !changeSet && <button style={buttonStyle} onClick={onAnalyze}>Analyze Design</button>}
    <button style={buttonStyle} onClick={onClose}>Close</button>
  </div>;
}

const cardStyle = { padding: '10px', border: '1px solid #ddd', borderRadius: '6px', marginBottom: '10px', background: 'white' };
const buttonStyle = { width: '100%', padding: '9px', marginBottom: '8px', border: '1px solid #ccc', borderRadius: '6px', background: 'white', cursor: 'pointer' };
const smallButtonStyle = { marginTop: '8px', padding: '6px 8px', border: '1px solid #ccc', borderRadius: '4px', background: 'white', cursor: 'pointer' };
const preStyle = { whiteSpace: 'pre-wrap', fontSize: '11px', marginBottom: 0 };
