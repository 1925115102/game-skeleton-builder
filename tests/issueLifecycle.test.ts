import assert from 'node:assert/strict';
import test from 'node:test';
import { markIssueApplied, splitIssuesByLifecycle } from '../src/ai/issueLifecycle';
import type { AIIssue } from '../src/ai/aiTypes';

const issue = (id: string): AIIssue => ({ id, title: id, description: '', affectedNodeIds: [], severity: 'medium' });

test('applied issue moves out of active issues and re-analysis can reset lifecycle state', () => {
  const issues = [issue('duplicate-resources'), issue('missing-feedback')];
  const applied = markIssueApplied([], 'duplicate-resources');
  const split = splitIssuesByLifecycle(issues, applied);
  assert.deepEqual(split.active.map((item) => item.id), ['missing-feedback']);
  assert.deepEqual(split.resolved.map((item) => item.id), ['duplicate-resources']);
  assert.deepEqual(splitIssuesByLifecycle(issues, []).active.map((item) => item.id), ['duplicate-resources', 'missing-feedback']);
});
