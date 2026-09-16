import type { GameEdge, GameNode } from './types';

export interface ProjectMetadata {
  id: string;
  name: string;
  brief: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDocument {
  version: '0.2';
  project: ProjectMetadata;
  nodes: GameNode[];
  edges: GameEdge[];
}

export function createProjectMetadata(): ProjectMetadata {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: 'Untitled Game',
    brief: '',
    createdAt: now,
    updatedAt: now,
  };
}

export function migrateProjectDocument(
  value: unknown
): ProjectDocument | null {
  if (!isObject(value) || !Array.isArray(value.nodes) || !Array.isArray(value.edges)) {
    return null;
  }

  if (value.version === '0.2' && isProjectMetadata(value.project)) {
    return {
      version: '0.2',
      project: value.project,
      nodes: value.nodes as GameNode[],
      edges: value.edges as GameEdge[],
    };
  }

  if (
    value.version === '0.1' &&
    typeof value.name === 'string'
  ) {
    const now = new Date().toISOString();
    return {
      version: '0.2',
      project: {
        id: crypto.randomUUID(),
        name: value.name,
        brief: typeof value.brief === 'string' ? value.brief : '',
        createdAt: now,
        updatedAt: now,
      },
      nodes: value.nodes as GameNode[],
      edges: value.edges as GameEdge[],
    };
  }

  return null;
}

export function getProjectExportFilename(
  name: string,
  date = new Date()
): string {
  const safeName = name
    .trim()
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'Game-Skeleton';
  const day = date.toISOString().slice(0, 10);

  return `${safeName}_${day}.json`;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isProjectMetadata(value: unknown): value is ProjectMetadata {
  return isObject(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.brief === 'string' &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string';
}
