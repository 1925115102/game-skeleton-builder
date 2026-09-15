export type AnalysisIssueType =
  | 'isolated_node'
  | 'dead_resource'
  | 'missing_resource_source'
  | 'dead_end_progression'
  | 'detached_system';

export type AnalysisSeverity =
  | 'info'
  | 'warning'
  | 'error';

export interface AnalysisIssue {
  id: string;
  type: AnalysisIssueType;
  severity: AnalysisSeverity;

  title: string;
  message: string;

  nodeIds: string[];
  edgeIds?: string[];
}