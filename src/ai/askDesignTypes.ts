import type { DesignChangeSet } from './changeSet';

export interface AskDesignResponse {
  interpretation: string;
  reasoning: string | null;
  clarificationQuestion: string | null;
  changeSet: DesignChangeSet | null;
  noChanges: boolean;
}

export interface AskDesignExchange {
  instruction: string;
  interpretation: string;
  clarificationQuestion: string | null;
}
