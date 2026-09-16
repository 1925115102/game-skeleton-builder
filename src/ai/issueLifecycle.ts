import type { AIIssue } from './aiTypes';

export function splitIssuesByLifecycle(issues: AIIssue[], appliedIssueIds: string[]) {
  const applied = new Set(appliedIssueIds);
  return {
    active: issues.filter((issue) => !applied.has(issue.id)),
    resolved: issues.filter((issue) => applied.has(issue.id)),
  };
}

export function markIssueApplied(appliedIssueIds: string[], issueId: string): string[] {
  return appliedIssueIds.includes(issueId) ? appliedIssueIds : [...appliedIssueIds, issueId];
}
