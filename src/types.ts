import type {
  Node,
  Edge,
} from '@xyflow/react';


// ======================================================
// Node Type
// ======================================================

export type GameNodeType =
  | 'activity'
  | 'system'
  | 'resource'
  | 'challenge'
  | 'progression'
  | 'goal';


// ======================================================
// Node Importance
// ======================================================

export type GameNodeImportance =
  | 'core'
  | 'supporting'
  | 'optional';


// ======================================================
// Edge Relationship
// ======================================================

export type GameEdgeType =
  | 'produces'
  | 'consumes'
  | 'requires'
  | 'unlocks'
  | 'improves'
  | 'leads_to';


// ======================================================
// Node Data
// ======================================================

export type GameNodeData =
  Record<string, unknown> & {
    label: string;
    gameType: GameNodeType;
    importance: GameNodeImportance;
    description?: string;

    highlighted?: boolean;
  };


// ======================================================
// Edge Data
// ======================================================

export type GameEdgeData =
  Record<string, unknown> & {

    relation: GameEdgeType;

  };


// ======================================================
// Graph Types
// ======================================================

export type GameNode =
  Node<GameNodeData>;

export type GameEdge =
  Edge<GameEdgeData>;


// ======================================================
// Game State
// ======================================================

export interface GameState {

  version: string;

  name?: string;

  brief?: string;

  project?: {
    id: string;
    name: string;
    brief: string;
    createdAt: string;
    updatedAt: string;
  };

  nodes: GameNode[];

  edges: GameEdge[];

}
