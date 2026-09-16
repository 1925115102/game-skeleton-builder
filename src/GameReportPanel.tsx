import type { GameReport } from './ai/gameReportTypes';
import type { ReactNode } from 'react';
import './NodeInspector.css';

interface Props { report: GameReport | null; loading: boolean; stale: boolean; error: string | null; onGenerate: () => void; onClose: () => void; }

const List = ({ items }: { items: string[] }) => items.length ? <ul style={listStyle}>{items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul> : <p style={mutedStyle}>Not defined yet.</p>;

export default function GameReportPanel({ report, loading, stale, error, onGenerate, onClose }: Props) {
  return <div className="inspector game-report">
    <h2>Game Report</h2>
    <p style={introStyle}>A derived reading of the accepted design. It never changes the skeleton.</p>
    {error && <p role="alert" style={errorStyle}>{error}</p>}
    {loading ? <p>Generating report…</p> : report ? <>
      {stale && <p role="status" style={staleStyle}>This report may be outdated because the accepted design changed.</p>}
      <button style={buttonStyle} onClick={onGenerate}>Regenerate Report</button>
      <h1 style={{ fontSize: '20px' }}>{report.title}</h1>
      <Section title="Overview"><List items={report.overview.supportedFacts} />{report.overview.interpretation && <p style={mutedStyle}>Interpretation: {report.overview.interpretation}</p>}</Section>
      <Section title="Player Fantasy / Role">{report.playerFantasy.statement ? <p>{report.playerFantasy.statement}</p> : <p style={mutedStyle}>Not defined yet.</p>}<List items={report.playerFantasy.basis} /></Section>
      <Section title="Core Gameplay Loop"><List items={report.coreGameplayLoop} /></Section>
      <Section title="Major Systems">{report.majorSystems.map((system) => <div key={system.name} style={cardStyle}><strong>{system.name}</strong><div>{system.role}</div><List items={system.supportingDesign} /></div>)}</Section>
      <Section title="Resources & Economy">{report.resourcesEconomy.summary && <p>{report.resourcesEconomy.summary}</p>}<List items={report.resourcesEconomy.resources} /><Missing items={report.resourcesEconomy.missingInformation} /></Section>
      <Section title="Progression">{report.progression.summary && <p>{report.progression.summary}</p>}<List items={report.progression.supportingDesign} /><Missing items={report.progression.missingInformation} /></Section>
      <Section title="Challenges & Failure">{report.challengesFailure.summary && <p>{report.challengesFailure.summary}</p>}<List items={report.challengesFailure.challenges} /><Missing items={report.challengesFailure.missingInformation} /></Section>
      <Section title="Subsystems">{report.subsystemHierarchy.map((item) => <div key={item.parent} style={cardStyle}><strong>{item.parent}</strong><List items={item.children} /></div>)}</Section>
      <Section title="Important System Interactions"><List items={report.importantInteractions} /></Section>
      <Section title="Design Gaps"><List items={report.designGaps} /></Section>
    </> : <button style={primaryButtonStyle} onClick={onGenerate}>Generate Game Report</button>}
    <button style={buttonStyle} onClick={onClose}>Close</button>
  </div>;
}

const Section = ({ title, children }: { title: string; children: ReactNode }) => <section style={sectionStyle}><h3>{title}</h3>{children}</section>;
const Missing = ({ items }: { items: string[] }) => items.length ? <><h4 style={missingHeadingStyle}>Still undefined</h4><List items={items} /></> : null;
const buttonStyle = { width: '100%', padding: '9px', marginBottom: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white', cursor: 'pointer' };
const primaryButtonStyle = { ...buttonStyle, border: '1px solid #4f6bed', background: '#4f6bed', color: 'white', fontWeight: 700 };
const introStyle = { fontSize: '13px', lineHeight: 1.5, color: '#475569' };
const staleStyle = { padding: '8px', borderRadius: '6px', background: '#fff7ed', color: '#9a3412', fontSize: '13px' };
const errorStyle = { padding: '8px', borderRadius: '6px', background: '#fef2f2', color: '#b91c1c', fontSize: '13px' };
const sectionStyle = { margin: '17px 0', fontSize: '13px', lineHeight: 1.45 };
const listStyle = { margin: '6px 0', paddingLeft: '18px' };
const mutedStyle = { color: '#64748b', fontSize: '12px' };
const cardStyle = { padding: '8px', border: '1px solid #dbe3ee', borderRadius: '6px', marginBottom: '7px', background: '#fff' };
const missingHeadingStyle = { margin: '10px 0 0', fontSize: '12px', color: '#9a3412' };
