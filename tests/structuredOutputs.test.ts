import assert from 'node:assert/strict';
import test from 'node:test';
import { zodTextFormat } from 'openai/helpers/zod';
import { AIReviewSchema } from '../server/aiReviewSchema';
import { DesignAnalysisSchema, DesignChangeSetSchema } from '../server/designAssistantSchema';
import { GuidedDesignProposalSchema } from '../server/guidedDesignSchema';
import { GameReportSchema } from '../server/gameReportSchema';

test('every AI structured-output schema converts to a strict required JSON schema', () => {
  const schemas = [
    ['ai_review', AIReviewSchema],
    ['guided_design_proposal', GuidedDesignProposalSchema],
    ['design_analysis', DesignAnalysisSchema],
    ['design_change_set', DesignChangeSetSchema],
    ['game_report', GameReportSchema],
  ] as const;

  for (const [name, schema] of schemas) {
    const format = zodTextFormat(schema, name);
    assert.equal(format.strict, true);
    assertRequiredProperties(format.schema as unknown);
  }
});

function assertRequiredProperties(value: unknown): void {
  if (!value || typeof value !== 'object') return;
  const record = value as Record<string, unknown>;
  const properties = record.properties;
  if (properties && typeof properties === 'object') {
    assert.deepEqual(
      [...(record.required as string[] ?? [])].sort(),
      Object.keys(properties as Record<string, unknown>).sort()
    );
  }
  for (const child of Object.values(record)) {
    if (Array.isArray(child)) child.forEach(assertRequiredProperties);
    else assertRequiredProperties(child);
  }
}
