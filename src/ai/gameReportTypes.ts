export interface GameReport {
  title: string;
  overview: { supportedFacts: string[]; interpretation: string | null };
  playerFantasy: { statement: string | null; basis: string[] };
  coreGameplayLoop: string[];
  majorSystems: Array<{ name: string; role: string; supportingDesign: string[] }>;
  resourcesEconomy: { summary: string | null; resources: string[]; missingInformation: string[] };
  progression: { summary: string | null; supportingDesign: string[]; missingInformation: string[] };
  challengesFailure: { summary: string | null; challenges: string[]; missingInformation: string[] };
  subsystemHierarchy: Array<{ parent: string; children: string[] }>;
  importantInteractions: string[];
  designGaps: string[];
}
