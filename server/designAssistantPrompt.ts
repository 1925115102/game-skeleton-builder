import type { z } from 'zod/v4';
import type { DesignAnalysisRequestSchema, DesignChangeRequestSchema } from './designAssistantSchema';

export function analysisPrompt(request: z.infer<typeof DesignAnalysisRequestSchema>) {
  return `Analyze this user-owned game design skeleton. Return strengths and a small number of concrete structural issues. Do not propose changes yet. Focus on loops, resources, progression, and redundant or disconnected design. Gameplay edges (produces, consumes, requires, unlocks, improves, leads_to) describe flow, dependency, or progression. The contains edge is different: parent → child decomposition only, not gameplay flow.\nPROJECT\n${JSON.stringify(request.project)}\nSKELETON\n${JSON.stringify(request.skeleton)}`;
}

export function changePrompt(request: z.infer<typeof DesignChangeRequestSchema>) {
  return `Propose one focused, atomic design change set for the selected issue. The user will review every operation. You may add, update, or remove nodes and edges; do not add unnecessary features. Gameplay edges (produces, consumes, requires, unlocks, improves, leads_to) express game behavior; contains expresses parent → child subsystem decomposition only. Use only IDs already in the skeleton for updates/removals. For REMOVE_EDGE and UPDATE_EDGE, copy the exact canonical edge ID from SKELETON.edges[].id; never invent an edge ID. For new IDs use short unique IDs. If removing a node, explicitly remove or replace all of its attached edges. UPDATE_NODE is a complete replacement of label, gameType, importance, and description; use description null only to clear that description.\nPROJECT\n${JSON.stringify(request.project)}\nSKELETON\n${JSON.stringify(request.skeleton)}\nSELECTED ISSUE\n${JSON.stringify(request.issue)}`;
}
