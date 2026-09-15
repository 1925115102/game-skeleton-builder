import type {
  GameNode,
  GameEdge,
} from '../types';

import type {
  AISkeleton,
} from './aiTypes';


export function serializeSkeleton(
  nodes: GameNode[],
  edges: GameEdge[]
): AISkeleton {

  return {

    nodes: nodes.map((node) => ({
      id: node.id,

      label:
        node.data.label,

      type:
        node.data.gameType,

      importance:
        node.data.importance,

      description:
        node.data.description,
    })),


    edges: edges.map((edge) => ({
      source:
        edge.source,

      target:
        edge.target,

      relation:
        edge.data?.relation ??
        'leads_to',
    })),

  };
}