import type { DesignChangeSet } from './changeSet';

export interface AskDesignResponse {
  interpretation: string;
  reasoning: string | null;
  clarificationQuestion: string | null;
  changeSet: DesignChangeSet | null;
}

export interface AskDesignExchange {
  instruction: string;
  interpretation: string;
  clarificationQuestion: string | null;
}
