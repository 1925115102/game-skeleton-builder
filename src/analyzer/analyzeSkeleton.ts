import type {
  GameNode,
  GameEdge,
} from '../types';

import type {
  AnalysisIssue,
} from './analyzerTypes';


export function analyzeSkeleton(
  nodes: GameNode[],
  edges: GameEdge[]
): AnalysisIssue[] {

  const issues: AnalysisIssue[] = [];


  // ====================================================
  // Helper functions
  // ====================================================

  const incomingEdges = (nodeId: string) =>
    edges.filter(
      (edge) => edge.target === nodeId
    );

  const outgoingEdges = (nodeId: string) =>
    edges.filter(
      (edge) => edge.source === nodeId
    );


  // ====================================================
  // 1. Isolated Nodes
  // ====================================================

  for (const node of nodes) {

    const incoming =
      incomingEdges(node.id);

    const outgoing =
      outgoingEdges(node.id);

    if (
      incoming.length === 0 &&
      outgoing.length === 0
    ) {

      issues.push({
        id: `isolated-${node.id}`,

        type: 'isolated_node',

        severity: 'warning',

        title: 'Isolated Node',

        message:
          `"${node.data.label}" is not connected to the rest of the skeleton.`,

        nodeIds: [
          node.id,
        ],
      });

    }
  }


  // ====================================================
  // 2. Resource Analysis
  // ====================================================

  const resourceNodes =
    nodes.filter(
      (node) =>
        node.data.gameType === 'resource'
    );


  for (const resource of resourceNodes) {

    const incoming =
      incomingEdges(resource.id);

    const outgoing =
      outgoingEdges(resource.id);


    // -----------------------------------------------
    // Missing Source
    // -----------------------------------------------

    if (
      incoming.length === 0 &&
      outgoing.length > 0
    ) {

      issues.push({
        id: `missing-source-${resource.id}`,

        type: 'missing_resource_source',

        severity: 'warning',

        title: 'Resource Has No Source',

        message:
          `"${resource.data.label}" is used by the game but currently has no defined source.`,

        nodeIds: [
          resource.id,
        ],
      });

    }


    // -----------------------------------------------
    // Dead Resource
    // -----------------------------------------------

    if (
      incoming.length > 0 &&
      outgoing.length === 0
    ) {

      issues.push({
        id: `dead-resource-${resource.id}`,

        type: 'dead_resource',

        severity: 'warning',

        title: 'Resource Has No Use',

        message:
          `"${resource.data.label}" can be obtained but currently has no defined use or sink.`,

        nodeIds: [
          resource.id,
        ],
      });

    }

  }


  // ====================================================
  // 3. Dead-End Progression
  // ====================================================

  const progressionNodes =
    nodes.filter(
      (node) =>
        node.data.gameType ===
        'progression'
    );


  for (const progression of progressionNodes) {

    const outgoing =
      outgoingEdges(progression.id);

    if (outgoing.length === 0) {

      issues.push({
        id: `dead-progression-${progression.id}`,

        type: 'dead_end_progression',

        severity: 'warning',

        title: 'Progression Dead End',

        message:
          `"${progression.data.label}" does not currently unlock or lead to another part of the game.`,

        nodeIds: [
          progression.id,
        ],
      });

    }

  }


  // ====================================================
  // 4. Detached Systems
  // ====================================================

  const coreNodes =
    nodes.filter(
      (node) =>
        node.data.importance === 'core'
    );


  const coreNodeIds =
    new Set(
      coreNodes.map(
        (node) => node.id
      )
    );


  const systemNodes =
    nodes.filter(
      (node) =>
        node.data.gameType === 'system'
    );


  for (const system of systemNodes) {

    const connectedIds =
      getConnectedComponent(
        system.id,
        edges
      );


    const connectedToCore =
      [...connectedIds].some(
        (id) =>
          coreNodeIds.has(id)
      );


    if (!connectedToCore) {

      issues.push({
        id: `detached-system-${system.id}`,

        type: 'detached_system',

        severity: 'warning',

        title: 'Detached System',

        message:
          `"${system.data.label}" is not connected to any core part of the game skeleton.`,

        nodeIds: [
          system.id,
        ],
      });

    }

  }


  return issues;
}


// ======================================================
// Graph traversal helper
// ======================================================

function getConnectedComponent(
  startNodeId: string,
  edges: GameEdge[]
): Set<string> {

  const visited =
    new Set<string>();

  const queue = [
    startNodeId,
  ];


  while (queue.length > 0) {

    const current =
      queue.shift();

    if (!current) {
      continue;
    }


    if (visited.has(current)) {
      continue;
    }


    visited.add(current);


    for (const edge of edges) {

      if (
        edge.source === current &&
        !visited.has(edge.target)
      ) {
        queue.push(
          edge.target
        );
      }


      if (
        edge.target === current &&
        !visited.has(edge.source)
      ) {
        queue.push(
          edge.source
        );
      }

    }

  }


  return visited;
}