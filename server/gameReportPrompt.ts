import type { z } from 'zod/v4';
import type { GameReportRequestSchema } from './gameReportSchema';

export function gameReportPrompt(request: z.infer<typeof GameReportRequestSchema>) {
  return `Create a concise structured Game Report for the accepted user-owned design below. It is a semantic design document, not a pitch. Ground every supported fact in PROJECT or SKELETON. Clearly separate reasonable interpretation from facts using the provided fields. Do not invent major mechanics, resources, failure conditions, platforms, combat, or progression: put undefined information in the appropriate missingInformation or designGaps array. Gameplay edges (produces, consumes, requires, unlocks, improves, leads_to) describe game behavior. contains means parent → child subsystem decomposition only; it is not gameplay flow. Include all meaningful hierarchy in subsystemHierarchy.\nPROJECT\n${JSON.stringify(request.project)}\nSKELETON\n${JSON.stringify(request.skeleton)}`;
}
