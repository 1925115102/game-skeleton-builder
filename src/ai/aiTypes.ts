// ======================================================
// Skeleton Input Types
// ======================================================

export interface AISkeletonNode {
  id: string;

  label: string;

  type: string;

  importance: string;

  description?: string;
}


export interface AISkeletonEdge {
  id: string;

  source: string;

  target: string;

  relation: string;
}


export interface AISkeleton {
  nodes: AISkeletonNode[];

  edges: AISkeletonEdge[];
}


// ======================================================
// AI Review Types
// ======================================================

export type AISeverity =
  | 'low'
  | 'medium'
  | 'high';


export type AIScopeImpact =
  | 'low'
  | 'medium'
  | 'high';


export type AISuggestionCategory =
  | 'core_loop'
  | 'resource_loop'
  | 'progression'
  | 'system_connection'
  | 'player_motivation'
  | 'scope'
  | 'other';


// ======================================================
// Strength
// ======================================================

export interface AIStrength {
  id: string;

  title: string;

  description: string;

  affectedNodeIds: string[];
}


// ======================================================
// Issue
// ======================================================

export interface AIIssue {
  id: string;

  title: string;

  description: string;

  affectedNodeIds: string[];

  severity: AISeverity;
}


// ======================================================
// Suggestion
// ======================================================

export interface AISuggestion {
  id: string;

  title: string;

  description: string;

  affectedNodeIds: string[];

  scopeImpact: AIScopeImpact;

  category: AISuggestionCategory;
}


// ======================================================
// Complete Review
// ======================================================

export interface AIReviewResult {
  summary: string;

  strengths: AIStrength[];

  issues: AIIssue[];

  suggestions: AISuggestion[];
}
