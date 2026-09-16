import { z } from 'zod/v4';
import { DesignAnalysisRequestSchema } from './designAssistantSchema';

const nullableText = z.string().nullable();

export const GameReportRequestSchema = DesignAnalysisRequestSchema;

export const GameReportSchema = z.object({
  title: z.string(),
  overview: z.object({ supportedFacts: z.array(z.string()), interpretation: nullableText }),
  playerFantasy: z.object({ statement: nullableText, basis: z.array(z.string()) }),
  coreGameplayLoop: z.array(z.string()),
  majorSystems: z.array(z.object({ name: z.string(), role: z.string(), supportingDesign: z.array(z.string()) })),
  resourcesEconomy: z.object({ summary: nullableText, resources: z.array(z.string()), missingInformation: z.array(z.string()) }),
  progression: z.object({ summary: nullableText, supportingDesign: z.array(z.string()), missingInformation: z.array(z.string()) }),
  challengesFailure: z.object({ summary: nullableText, challenges: z.array(z.string()), missingInformation: z.array(z.string()) }),
  subsystemHierarchy: z.array(z.object({ parent: z.string(), children: z.array(z.string()) })),
  importantInteractions: z.array(z.string()),
  designGaps: z.array(z.string()),
});
