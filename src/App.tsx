import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';

import type {
  IssueFixOption,
} from './analyzer/issueFixMap';


import {
  analyzeSkeleton
} from './analyzer/analyzeSkeleton'

import AnalysisPanel from './AnalysisPanel';

import type {
  AnalysisIssue,
} from './analyzer/analyzerTypes';

import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type ReactFlowInstance,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';

import GameNodeComponent from './GameNode';
import NodeInspector from './NodeInspector';
import EdgeInspector from './EdgeInspector';
import FixPanel from './FixPanel';

import type {
  GameNodeData,
  GameEdgeData,
  GameEdgeType,
  GameNode,
  GameEdge,
  GameState,
} from './types';

import {
  serializeSkeleton,
} from './ai/skeletonSerializer';

import AIAnalysisPanel
  from './AIAnalysisPanel';

import type {
  AIReviewResult,
  AIIssue,
  AISuggestion,
} from './ai/aiTypes';

import AILoadingPanel from './AILoadingPanel';
import ProjectPanel from './ProjectPanel';
import GuidedDesignPanel from './GuidedDesignPanel';

import {
  canApplyProposedRelationship,
  findDuplicateNode,
} from './guidedDesign/proposalApplication';

import type {
  GuidedDesignProposal,
  ProposedDesignNode,
} from './guidedDesign/guidedDesignTypes';
import DesignAssistantPanel from './DesignAssistantPanel';
import { applyDesignChangeSet, type DesignChangeSet } from './ai/changeSet';
import { createProjectMetadata, getProjectExportFilename, migrateProjectDocument, type ProjectMetadata } from './projectState';

// ======================================================
// Custom Node Components
// ======================================================

const nodeTypes = {
  gameNode: GameNodeComponent,
};


// ======================================================
// Initial Nodes
// ======================================================

const initialNodes: GameNode[] = [
  {
    id: 'explore',
    type: 'gameNode',
    position: { x: 100, y: 100 },
    data: {
      label: 'Explore',
      gameType: 'activity',
      importance: 'core',
      description: 'Player explores the world.',
    },
  },

  {
    id: 'material',
    type: 'gameNode',
    position: { x: 350, y: 100 },
    data: {
      label: 'Rare Material',
      gameType: 'resource',
      importance: 'supporting',
      description: 'Obtained through exploration.',
    },
  },

  {
    id: 'alchemy',
    type: 'gameNode',
    position: { x: 600, y: 100 },
    data: {
      label: 'Alchemy',
      gameType: 'system',
      importance: 'supporting',
      description: 'Converts materials into useful resources.',
    },
  },

  {
    id: 'boss',
    type: 'gameNode',
    position: { x: 850, y: 100 },
    data: {
      label: 'Boss',
      gameType: 'challenge',
      importance: 'core',
      description: 'Tests the player build.',
    },
  },

  {
    id: 'breakthrough',
    type: 'gameNode',
    position: { x: 1100, y: 100 },
    data: {
      label: 'Breakthrough',
      gameType: 'progression',
      importance: 'core',
      description: 'Unlocks the next progression stage.',
    },
  },
];


// ======================================================
// Initial Edges
// ======================================================

const initialEdges: GameEdge[] = [
  {
    id: 'explore-material',
    source: 'explore',
    target: 'material',
    label: 'PRODUCES',
    data: {
      relation: 'produces',
    },
  },

  {
    id: 'material-alchemy',
    source: 'material',
    target: 'alchemy',
    label: 'CONSUMES',
    data: {
      relation: 'consumes',
    },
  },

  {
    id: 'alchemy-boss',
    source: 'alchemy',
    target: 'boss',
    label: 'IMPROVES',
    data: {
      relation: 'improves',
    },
  },

  {
    id: 'boss-breakthrough',
    source: 'boss',
    target: 'breakthrough',
    label: 'UNLOCKS',
    data: {
      relation: 'unlocks',
    },
  },
];


// ======================================================
// Shared Button Style
// ======================================================

const toolbarButtonStyle = {
  padding: '10px 14px',
  borderRadius: '8px',
  border: '1px solid #ccc',
  background: 'white',
  color: '#222',
  cursor: 'pointer',
  fontWeight: 600,
};


// ======================================================
// App
// ======================================================

function App() {

  // ====================================================
  // Graph State
  // ====================================================

  const [nodes, setNodes, onNodesChange] =
    useNodesState<GameNode>(initialNodes);

  const [edges, setEdges, onEdgesChange] =
    useEdgesState<GameEdge>(initialEdges);


  // ====================================================
  // Selection State
  // ====================================================

  const [selectedNodeId, setSelectedNodeId] =
    useState<string | null>(null);

  const [selectedEdgeId, setSelectedEdgeId] =
    useState<string | null>(null);


  const selectedNode =
    nodes.find(
      (node) => node.id === selectedNodeId
    ) ?? null;


  const selectedEdge =
    edges.find(
      (edge) => edge.id === selectedEdgeId
    ) ?? null;

  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance<GameNode, GameEdge> | null>(
      null
    );

  const [isAIReviewLoading] =
    useState(false);

  const [aiReviewError, setAIReviewError] =
    useState<string | null>(null);

  const [projectName, setProjectName] =
    useState('Untitled Game');

  const [projectBrief, setProjectBrief] =
    useState('');

  const [projectMetadata, setProjectMetadata] =
    useState<ProjectMetadata>(() => createProjectMetadata());

  const [showDesignAssistant, setShowDesignAssistant] = useState(false);
  const [designAssistantLoading, setDesignAssistantLoading] = useState(false);
  const [designAssistantError, setDesignAssistantError] = useState<string | null>(null);
  const [designAssistantAnalysis, setDesignAssistantAnalysis] = useState<Pick<AIReviewResult, 'summary' | 'strengths' | 'issues'> | null>(null);
  const [designChangeSet, setDesignChangeSet] = useState<DesignChangeSet | null>(null);

  const [showProjectPanel, setShowProjectPanel] =
    useState(false);

  const [showGuidedDesign, setShowGuidedDesign] =
    useState(false);

  const [guidedDesignProposal, setGuidedDesignProposal] =
    useState<GuidedDesignProposal | null>(null);

  const [isGuidedDesignLoading, setIsGuidedDesignLoading] =
    useState(false);

  const [guidedDesignError, setGuidedDesignError] =
    useState<string | null>(null);

  const [acceptedProposalNodeIds, setAcceptedProposalNodeIds] =
    useState<Record<string, string>>({});

  const [acceptedProposalRelationshipIds, setAcceptedProposalRelationshipIds] =
    useState<string[]>([]);

  const [rejectedProposalNodeIds, setRejectedProposalNodeIds] =
    useState<string[]>([]);

  const [rejectedProposalRelationshipIds, setRejectedProposalRelationshipIds] =
    useState<string[]>([]);


  // ====================================================
  // GameState
  // ====================================================

  const getGameState = useCallback((): GameState => {
    return {
      version: '0.2',
      project: {
        ...projectMetadata,
        name: projectName,
        brief: projectBrief,
        updatedAt: new Date().toISOString(),
      },
      nodes,
      edges,
    };
  }, [projectName, projectBrief, projectMetadata, nodes, edges]);

  const importInputRef =
    useRef<HTMLInputElement | null>(null);

  const [
    aiReview,
    setAIReview,
  ] = useState<
    AIReviewResult | null
  >(null);


  // ====================================================
  // Export JSON
  // ====================================================

  const exportGameState = useCallback(() => {

    const gameState = getGameState();

    const json = JSON.stringify(
      gameState,
      null,
      2
    );

    const blob = new Blob(
      [json],
      {
        type: 'application/json',
      }
    );

    const url =
      URL.createObjectURL(blob);

    const anchor =
      document.createElement('a');

    anchor.href = url;

    anchor.download = getProjectExportFilename(projectName);

    document.body.appendChild(anchor);

    anchor.click();

    document.body.removeChild(anchor);

    URL.revokeObjectURL(url);

  }, [getGameState, projectName]);

  // ====================================================
  // Import JSON
  // ====================================================

  const openImportDialog = useCallback(() => {
    importInputRef.current?.click();
  }, []);


  const importGameState = useCallback(
    async (
      event: ChangeEvent<HTMLInputElement>
    ) => {

      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }


      try {

        const text =
          await file.text();

        const parsed =
          JSON.parse(text) as unknown;


        // ---------------------------------------------
        // Basic Validation
        // ---------------------------------------------

        const migrated = migrateProjectDocument(parsed);
        if (!migrated) {
          throw new Error(
            'Invalid GameState format.'
          );
        }


        // ---------------------------------------------
        // Load Graph
        // ---------------------------------------------

        setNodes(migrated.nodes);
        setEdges(migrated.edges);
        setProjectName(migrated.project.name);
        setProjectBrief(migrated.project.brief);
        setProjectMetadata(migrated.project);


        // ---------------------------------------------
        // Clear Current Selection
        // ---------------------------------------------

        setSelectedNodeId(null);

        setSelectedEdgeId(null);


        console.log(
          'GameState imported:',
          parsed
        );

      } catch (error) {

        console.error(
          'Failed to import GameState:',
          error
        );

        window.alert(
          'Failed to import JSON. Please make sure the file is a valid Game Skeleton file.'
        );

      }


      // Important:
      // Reset file input so the same file can be imported again.
      event.target.value = '';

    },
    [
      setNodes,
      setEdges,
    ]
  );

  // ====================================================
  // analyze skeleton
  // ====================================================
  const runAnalysis = useCallback(() => {

    const issues =
      analyzeSkeleton(
        nodes,
        edges
      );

    setAnalysisIssues(
      issues
    );

    setShowAnalysis(
      true
    );


    // Analysis mode should not
    // keep a node or edge selected.

    setSelectedNodeId(
      null
    );

    setSelectedEdgeId(
      null
    );


    console.log(
      'Skeleton Analysis:'
    );

    console.table(
      issues
    );

  }, [nodes, edges]);

  const [analysisIssues, setAnalysisIssues] =
  useState<AnalysisIssue[]>([]);

  const [showAnalysis, setShowAnalysis] =
    useState(false);

  const selectSuggestedFix = useCallback(
    (
      issue: AnalysisIssue,
      fix: IssueFixOption
    ) => {

      setActiveFix({
        issue,
        fix,
      });

      const nodeId =
        issue.nodeIds?.[0];

      if (nodeId) {
        setNodes((currentNodes) =>
          currentNodes.map((node) => ({
            ...node,

            data: {
              ...node.data,
              highlighted:
                node.id === nodeId,
            },
          }))
        );
      }

    },
    [setNodes]
  );

  // ====================================================
  // Fix Issue
  // ====================================================

  const [activeFix, setActiveFix] = useState<{
    issue: AnalysisIssue;
    fix: IssueFixOption;
  } | null>(null);

  const applyConnectExistingFix = useCallback(
    (
      targetNodeId: string,
      relation: GameEdgeType
    ) => {

      if (!activeFix) {
        return;
      }


      const problemNodeId =
        activeFix.issue.nodeIds?.[0];

      if (!problemNodeId) {
        return;
      }


      const isMissingResourceSourceFix =
        activeFix.issue.type ===
        'missing_resource_source';

      const sourceNodeId =
        isMissingResourceSourceFix
          ? targetNodeId
          : problemNodeId;

      const resolvedTargetNodeId =
        isMissingResourceSourceFix
          ? problemNodeId
          : targetNodeId;


      if (sourceNodeId === resolvedTargetNodeId) {
        return;
      }


      const hasEquivalentEdge =
        edges.some(
          (edge) =>
            edge.source === sourceNodeId &&
            edge.target === resolvedTargetNodeId &&
            edge.data?.relation === relation
        );

      if (hasEquivalentEdge) {
        return;
      }


      const newEdge: GameEdge = {
        id: crypto.randomUUID(),

        source: sourceNodeId,

        target: resolvedTargetNodeId,

        label: relation
          .replaceAll('_', ' ')
          .toUpperCase(),

        data: {
          relation,
        },
      };


      setEdges((currentEdges) => {
        const alreadyExists =
          currentEdges.some(
            (edge) =>
              edge.source === newEdge.source &&
              edge.target === newEdge.target &&
              edge.data?.relation === relation
          );

        return alreadyExists
          ? currentEdges
          : [...currentEdges, newEdge];
      });


      // Clear highlight
      setNodes((currentNodes) =>
        currentNodes.map((node) => ({
          ...node,

          data: {
            ...node.data,
            highlighted: false,
          },
        }))
      );


      setActiveFix(null);


      // Re-run analysis after fixing
      const nextEdges = [
        ...edges,
        newEdge,
      ];

      const newIssues =
        analyzeSkeleton(
          nodes,
          nextEdges
        );

      setAnalysisIssues(
        newIssues
      );

      setShowAnalysis(true);

    },
    [
      activeFix,
      edges,
      nodes,
      setEdges,
      setNodes,
    ]
  );

  const cancelFix =
    useCallback(() => {

      setActiveFix(null);

      setNodes((currentNodes) =>
        currentNodes.map((node) => ({
          ...node,

          data: {
            ...node.data,
            highlighted: false,
          },
        }))
      );

    }, [setNodes]);

  // ====================================================
  // Edge Creation
  // ====================================================

  const onConnect = useCallback(
    (connection: Connection) => {

      const newEdge: GameEdge = {
        id: crypto.randomUUID(),

        source: connection.source,
        target: connection.target,

        sourceHandle:
          connection.sourceHandle,

        targetHandle:
          connection.targetHandle,

        label: 'LEADS TO',

        data: {
          relation: 'leads_to',
        },
        type: 'smoothstep',
      };


      setEdges((currentEdges) =>
        addEdge(
          newEdge,
          currentEdges
        )
      );

    },
    [setEdges]
  );

  useEffect(() => {
    setEdges((currentEdges) => currentEdges.map((edge) => {
      const source = nodes.find((node) => node.id === edge.source);
      const target = nodes.find((node) => node.id === edge.target);
      if (!source || !target) return edge;
      const dx = target.position.x - source.position.x;
      const dy = target.position.y - source.position.y;
      const direction = Math.abs(dx) >= Math.abs(dy)
        ? dx >= 0 ? ['Right', 'Left'] : ['Left', 'Right']
        : dy >= 0 ? ['Bottom', 'Top'] : ['Top', 'Bottom'];
      const sourceHandle = `source-${direction[0].toLowerCase()}`;
      const targetHandle = `target-${direction[1].toLowerCase()}`;
      return edge.sourceHandle === sourceHandle && edge.targetHandle === targetHandle && edge.type === 'smoothstep'
        ? edge
        : { ...edge, sourceHandle, targetHandle, type: 'smoothstep' };
    }));
  }, [nodes, setEdges]);


  // ====================================================
  // Node Operations
  // ====================================================

  const updateNode = useCallback(
    (
      nodeId: string,
      updates: Partial<GameNodeData>
    ) => {

      setNodes((currentNodes) =>
        currentNodes.map((node) => {

          if (node.id !== nodeId) {
            return node;
          }

          return {
            ...node,

            data: {
              ...node.data,
              ...updates,
            },
          };

        })
      );

    },
    [setNodes]
  );


  const deleteNode = useCallback(
    (nodeId: string) => {

      setNodes((currentNodes) =>
        currentNodes.filter(
          (node) =>
            node.id !== nodeId
        )
      );


      // Delete connected edges
      setEdges((currentEdges) =>
        currentEdges.filter(
          (edge) =>
            edge.source !== nodeId &&
            edge.target !== nodeId
        )
      );


      setSelectedNodeId(null);
      setSelectedEdgeId(null);

    },
    [setNodes, setEdges]
  );


  const addNode = useCallback(() => {

    const id =
      crypto.randomUUID();


    const newNode: GameNode = {
      id,

      type: 'gameNode',

      position: {
        x: 200 + nodes.length * 30,
        y: 200 + nodes.length * 30,
      },

      data: {
        label: 'New Activity',

        gameType: 'activity',

        importance: 'supporting',

        description: '',
      },
    };


    setNodes((currentNodes) => [
      ...currentNodes,
      newNode,
    ]);


    // Select the new node immediately
    setSelectedNodeId(id);

    setSelectedEdgeId(null);

  }, [nodes.length, setNodes]);


  // ====================================================
  // Edge Operations
  // ====================================================

  const updateEdge = useCallback(
    (
      edgeId: string,
      relation: GameEdgeType
    ) => {

      setEdges((currentEdges) =>
        currentEdges.map((edge) => {

          if (edge.id !== edgeId) {
            return edge;
          }


          return {
            ...edge,

            label: relation
              .replaceAll('_', ' ')
              .toUpperCase(),

            data: {
              ...edge.data,
              relation,
            } satisfies GameEdgeData,
          };

        })
      );

    },
    [setEdges]
  );


  const deleteEdge = useCallback(
    (edgeId: string) => {

      setEdges((currentEdges) =>
        currentEdges.filter(
          (edge) =>
            edge.id !== edgeId
        )
      );


      setSelectedEdgeId(null);

    },
    [setEdges]
  );

  // ---------------------------------------------
  // Select  Analysis Issue
  // ---------------------------------------------
  const selectAnalysisIssue = useCallback(
    (issue: AnalysisIssue) => {

      const nodeId =
        issue.nodeIds[0];

      if (!nodeId) {
        return;
      }


      const targetNode =
        nodes.find(
          (node) =>
            node.id === nodeId
        );

      if (!targetNode) {
        return;
      }

      // Highlight target node
      setNodes((currentNodes) =>
        currentNodes.map((node) => ({
          ...node,

          data: {
            ...node.data,

            highlighted:
              node.id === nodeId,
          },
        }))
      );


      // Select the target node
      setSelectedNodeId(
        nodeId
      );

      setSelectedEdgeId(
        null
      );


      // Keep Analysis Panel open for now
      setShowAnalysis(
        true
      );

      // Move viewport to node
      reactFlowInstance?.setCenter(
        targetNode.position.x + 80,
        targetNode.position.y + 40,
        {
          zoom: 1.3,
          duration: 500,
        }
      );

    },
    [
      nodes,
      reactFlowInstance,
    ]
  );

  // ====================================================
  // Select AI Issue
  // ====================================================

  const selectAIIssue = useCallback(
    (issue: AIIssue) => {

      const affectedIds =
        new Set(issue.affectedNodeIds);

      setNodes((currentNodes) =>
        currentNodes.map((node) => ({
          ...node,

          data: {
            ...node.data,

            highlighted:
              affectedIds.has(node.id),
          },
        }))
      );


      // 如果至少有一个相关节点，
      // 自动把镜头移动过去
      const firstNodeId =
        issue.affectedNodeIds[0];

      if (firstNodeId) {

        const targetNode =
          nodes.find(
            (node) =>
              node.id === firstNodeId
          );

        if (targetNode) {

          reactFlowInstance?.setCenter(
            targetNode.position.x + 80,
            targetNode.position.y + 40,
            {
              zoom: 1.3,
              duration: 500,
            }
          );

        }
      }

    },
    [
      nodes,
      setNodes,
      reactFlowInstance,
    ]
  );


  // ====================================================
  // Select AI Suggestion
  // ====================================================

  const selectAISuggestion = useCallback(
    (
      suggestion: AISuggestion
    ) => {

      const affectedIds =
        new Set(
          suggestion.affectedNodeIds
        );

      setNodes((currentNodes) =>
        currentNodes.map((node) => ({
          ...node,

          data: {
            ...node.data,

            highlighted:
              affectedIds.has(node.id),
          },
        }))
      );


      const firstNodeId =
        suggestion.affectedNodeIds[0];

      if (firstNodeId) {

        const targetNode =
          nodes.find(
            (node) =>
              node.id === firstNodeId
          );

        if (targetNode) {

          reactFlowInstance?.setCenter(
            targetNode.position.x + 80,
            targetNode.position.y + 40,
            {
              zoom: 1.3,
              duration: 500,
            }
          );

        }
      }

    },
    [
      nodes,
      setNodes,
      reactFlowInstance,
    ]
  );  

  // ====================================================
  // Guided Design
  // ====================================================

  const requestGuidedDesign = useCallback(
    async (latestAnswer = '') => {
      try {
        setShowGuidedDesign(true);
        setIsGuidedDesignLoading(true);
        setGuidedDesignError(null);
        setGuidedDesignProposal(null);
        setAIReview(null);

        const response = await fetch(
          'http://localhost:3001/api/guided-design',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              project: {
                name: projectName,
                brief: projectBrief,
              },
              skeleton: serializeSkeleton(nodes, edges),
              latestAnswer: latestAnswer || undefined,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(
            `Server returned ${response.status}.`
          );
        }

        const data = await response.json() as {
          result: GuidedDesignProposal;
        };

        setGuidedDesignProposal(data.result);
        setAcceptedProposalNodeIds({});
        setAcceptedProposalRelationshipIds([]);
        setRejectedProposalNodeIds([]);
        setRejectedProposalRelationshipIds([]);
      } catch (error) {
        console.error('Guided Design Error:', error);
        setGuidedDesignError(
          'Guided Design failed. Check that the AI server is running and try again.'
        );
      } finally {
        setIsGuidedDesignLoading(false);
      }
    },
    [projectName, projectBrief, nodes, edges]
  );

  const createNodeFromProposal = useCallback(
    (
      proposal: ProposedDesignNode,
      id: string,
      index = nodes.length
    ): GameNode => ({
      id,
      type: 'gameNode',
      position: {
        x: 200 + index * 30,
        y: 200 + index * 30,
      },
      data: {
        label: proposal.label,
        gameType: proposal.gameType,
        importance: proposal.importance,
        description: proposal.description,
      },
    }),
    [nodes.length]
  );

  const acceptProposedNode = useCallback(
    (proposalId: string) => {
      const proposal = guidedDesignProposal?.proposedNodes.find(
        (node) => node.proposalId === proposalId
      );

      if (!proposal || acceptedProposalNodeIds[proposalId]) {
        return;
      }

      const duplicate = findDuplicateNode(nodes, proposal);
      const nodeId = duplicate?.id ?? crypto.randomUUID();

      if (!duplicate) {
        setNodes((currentNodes) => [
          ...currentNodes,
          createNodeFromProposal(proposal, nodeId),
        ]);
      }

      setAcceptedProposalNodeIds((current) => ({
        ...current,
        [proposalId]: nodeId,
      }));
    },
    [
      acceptedProposalNodeIds,
      createNodeFromProposal,
      guidedDesignProposal,
      nodes,
      setNodes,
    ]
  );

  const rejectProposedNode = useCallback((proposalId: string) => {
    setRejectedProposalNodeIds((current) => [
      ...current.filter((id) => id !== proposalId),
      proposalId,
    ]);
  }, []);

  const acceptProposedRelationship = useCallback(
    (proposalId: string) => {
      const proposal =
        guidedDesignProposal?.proposedRelationships.find(
          (relationship) => relationship.proposalId === proposalId
        );

      if (!proposal || acceptedProposalRelationshipIds.includes(proposalId)) {
        return;
      }

      const result = canApplyProposedRelationship(
        proposal,
        nodes,
        edges,
        acceptedProposalNodeIds
      );

      if (!result.canApply || !result.sourceId || !result.targetId) {
        return;
      }

      const newEdge: GameEdge = {
        id: crypto.randomUUID(),
        source: result.sourceId,
        target: result.targetId,
        label: proposal.relation.replaceAll('_', ' ').toUpperCase(),
        data: { relation: proposal.relation },
      };

      setEdges((currentEdges) => {
        const duplicate = currentEdges.some(
          (edge) =>
            edge.source === newEdge.source &&
            edge.target === newEdge.target &&
            edge.data?.relation === proposal.relation
        );

        return duplicate ? currentEdges : [...currentEdges, newEdge];
      });

      setAcceptedProposalRelationshipIds((current) => [
        ...current,
        proposalId,
      ]);
    },
    [
      acceptedProposalNodeIds,
      acceptedProposalRelationshipIds,
      edges,
      guidedDesignProposal,
      nodes,
      setEdges,
    ]
  );

  const rejectProposedRelationship = useCallback((proposalId: string) => {
    setRejectedProposalRelationshipIds((current) => [
      ...current.filter((id) => id !== proposalId),
      proposalId,
    ]);
  }, []);

  const acceptAllAvailableProposals = useCallback(() => {
    if (!guidedDesignProposal) {
      return;
    }

    const nextNodes = [...nodes];
    const nextNodeIds = { ...acceptedProposalNodeIds };

    for (const proposal of guidedDesignProposal.proposedNodes) {
      if (
        rejectedProposalNodeIds.includes(proposal.proposalId) ||
        nextNodeIds[proposal.proposalId]
      ) {
        continue;
      }

      const duplicate = findDuplicateNode(nextNodes, proposal);
      const nodeId = duplicate?.id ?? crypto.randomUUID();

      if (!duplicate) {
        nextNodes.push(
          createNodeFromProposal(
            proposal,
            nodeId,
            nextNodes.length
          )
        );
      }

      nextNodeIds[proposal.proposalId] = nodeId;
    }

    const newNodes = nextNodes.slice(nodes.length);
    if (newNodes.length > 0) {
      setNodes((currentNodes) => [
        ...currentNodes,
        ...newNodes,
      ]);
    }

    const nextEdges = [...edges];
    const acceptedRelationshipIds = [
      ...acceptedProposalRelationshipIds,
    ];

    for (const proposal of guidedDesignProposal.proposedRelationships) {
      if (
        rejectedProposalRelationshipIds.includes(proposal.proposalId) ||
        acceptedRelationshipIds.includes(proposal.proposalId)
      ) {
        continue;
      }

      const result = canApplyProposedRelationship(
        proposal,
        nextNodes,
        nextEdges,
        nextNodeIds
      );

      if (!result.canApply || !result.sourceId || !result.targetId) {
        continue;
      }

      nextEdges.push({
        id: crypto.randomUUID(),
        source: result.sourceId,
        target: result.targetId,
        label: proposal.relation.replaceAll('_', ' ').toUpperCase(),
        data: { relation: proposal.relation },
      });
      acceptedRelationshipIds.push(proposal.proposalId);
    }

    const newEdges = nextEdges.slice(edges.length);
    if (newEdges.length > 0) {
      setEdges((currentEdges) => [
        ...currentEdges,
        ...newEdges,
      ]);
    }

    setAcceptedProposalNodeIds(nextNodeIds);
    setAcceptedProposalRelationshipIds(acceptedRelationshipIds);
  }, [
    acceptedProposalNodeIds,
    acceptedProposalRelationshipIds,
    createNodeFromProposal,
    edges,
    guidedDesignProposal,
    nodes,
    rejectedProposalNodeIds,
    rejectedProposalRelationshipIds,
    setEdges,
    setNodes,
  ]);

  const requestDesignAnalysis = useCallback(async () => {
    try {
      setShowDesignAssistant(true);
      setDesignAssistantLoading(true);
      setDesignAssistantError(null);
      setDesignChangeSet(null);
      const response = await fetch('http://localhost:3001/api/design-assistant/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: { name: projectName, brief: projectBrief }, skeleton: serializeSkeleton(nodes, edges) }),
      });
      if (!response.ok) throw new Error(`Server returned ${response.status}.`);
      const data = await response.json() as { result: Pick<AIReviewResult, 'summary' | 'strengths' | 'issues'> };
      setDesignAssistantAnalysis(data.result);
    } catch (error) {
      console.error('Design Assistant analysis error:', error);
      setDesignAssistantError('Design analysis failed. Check that the AI server is running and try again.');
    } finally {
      setDesignAssistantLoading(false);
    }
  }, [projectName, projectBrief, nodes, edges]);

  const requestDesignChangeSet = useCallback(async (issue: AIIssue) => {
    try {
      setDesignAssistantLoading(true);
      setDesignAssistantError(null);
      const response = await fetch('http://localhost:3001/api/design-assistant/change-set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: { name: projectName, brief: projectBrief }, skeleton: serializeSkeleton(nodes, edges), issue }),
      });
      if (!response.ok) throw new Error(`Server returned ${response.status}.`);
      const data = await response.json() as { result: DesignChangeSet };
      setDesignChangeSet(data.result);
    } catch (error) {
      console.error('Design Assistant change-set error:', error);
      setDesignAssistantError('Design change proposal failed. Try again.');
    } finally {
      setDesignAssistantLoading(false);
    }
  }, [projectName, projectBrief, nodes, edges]);

  const approveDesignChangeSet = useCallback(() => {
    if (!designChangeSet) return;
    const result = applyDesignChangeSet(nodes, edges, designChangeSet);
    if (!result.success) {
      setDesignAssistantError(`Change set was not applied: ${result.error}`);
      return;
    }
    setNodes(result.nodes);
    setEdges(result.edges);
    setDesignChangeSet(null);
    setDesignAssistantAnalysis(null);
  }, [designChangeSet, nodes, edges, setNodes, setEdges]);


  // ====================================================
  // Render
  // ====================================================

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',

        display: 'flex',

        overflow: 'hidden',
      }}
    >

      {/* =================================================
          GRAPH
      ================================================= */}

      <div
        style={{
          flex: 1,

          minWidth: 0,

          height: '100%',
        }}
      >

        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}

          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}

          onNodeClick={(_, node) => {
            setSelectedNodeId(node.id);
            setSelectedEdgeId(null);
            setShowAnalysis(false);
            setActiveFix(null);
          }}

          onEdgeClick={(_, edge) => {
            setSelectedEdgeId(edge.id);
            setSelectedNodeId(null);
            setShowAnalysis(false);
            setActiveFix(null);
          }}

          onPaneClick={() => {
            setSelectedNodeId(null);
            setSelectedEdgeId(null);
            setShowAnalysis(false);
            setActiveFix(null);
          }}

          onInit={(instance) =>
            setReactFlowInstance(instance)
          }

          fitView
        >

          <Background />

          <Controls />

          <MiniMap />


          {/* =============================================
              TOOLBAR
          ============================================= */}

          <Panel position="top-left">

            <div
              style={{
                display: 'flex',
                gap: '8px',
              }}
            >

              <button
                onClick={addNode}
                style={toolbarButtonStyle}
              >
                + Add Node
              </button>


              <button
                onClick={exportGameState}
                style={toolbarButtonStyle}
              >
                Export JSON
              </button>


              <button
                onClick={openImportDialog}
                style={toolbarButtonStyle}
              >
                Import JSON
              </button>

              <button
                onClick={() => {
                  setShowProjectPanel(true);
                  setShowGuidedDesign(false);
                  setShowDesignAssistant(false);
                }}
                style={toolbarButtonStyle}
              >
                Project: {projectName || 'Untitled Game'}
              </button>

              <button
                onClick={runAnalysis}
                style={toolbarButtonStyle}
              >
                Analysis
              </button>
              
              <button
                onClick={requestDesignAnalysis}
                style={toolbarButtonStyle}
                disabled={designAssistantLoading}
              >
                {designAssistantLoading
                  ? 'Analyzing...'
                  : 'AI Design Assistant'}
              </button>

              <input
                ref={importInputRef}

                type="file"

                accept=".json,application/json"

                onChange={importGameState}

                style={{
                  display: 'none',
                }}
              />

            </div>

          </Panel>

        </ReactFlow>

      </div>


      {/* =================================================
          INSPECTOR
      ================================================= */}

      {showDesignAssistant ? (

        <DesignAssistantPanel
          analysis={designAssistantAnalysis}
          changeSet={designChangeSet}
          loading={designAssistantLoading}
          error={designAssistantError}
          onRequestChange={requestDesignChangeSet}
          onApprove={approveDesignChangeSet}
          onReject={() => setDesignChangeSet(null)}
          onClose={() => setShowDesignAssistant(false)}
        />

      ) : isAIReviewLoading ? (

        <AILoadingPanel />

      ) : aiReview ? (

        <AIAnalysisPanel
          review={aiReview}
          onSelectIssue={selectAIIssue}
          onSelectSuggestion={selectAISuggestion}
          onClose={() => {
            setAIReview(null);

            setNodes((currentNodes) =>
              currentNodes.map((node) => ({
                ...node,

                data: {
                  ...node.data,
                  highlighted: false,
                },
              }))
            );
          }}
        />

      ) : showGuidedDesign ? (

        <GuidedDesignPanel
          proposal={guidedDesignProposal}
          nodes={nodes}
          edges={edges}
          acceptedNodeIds={acceptedProposalNodeIds}
          acceptedRelationshipIds={
            acceptedProposalRelationshipIds
          }
          rejectedNodeIds={rejectedProposalNodeIds}
          rejectedRelationshipIds={
            rejectedProposalRelationshipIds
          }
          isLoading={isGuidedDesignLoading}
          error={guidedDesignError}
          onAcceptNode={acceptProposedNode}
          onRejectNode={rejectProposedNode}
          onAcceptRelationship={
            acceptProposedRelationship
          }
          onRejectRelationship={
            rejectProposedRelationship
          }
          onAcceptAll={acceptAllAvailableProposals}
          onRequestFollowUp={requestGuidedDesign}
          onClose={() => setShowGuidedDesign(false)}
        />

      ) : showProjectPanel ? (

        <ProjectPanel
          name={projectName}
          brief={projectBrief}
          projectId={projectMetadata.id}
          onNameChange={setProjectName}
          onBriefChange={setProjectBrief}
          onClose={() => setShowProjectPanel(false)}
        />

      ) : aiReviewError ? (

        <div className="inspector">
          <h2>AI Review</h2>

          <p role="alert">
            {aiReviewError}
          </p>

          <button
            onClick={() => setAIReviewError(null)}
            style={toolbarButtonStyle}
          >
            Dismiss
          </button>
        </div>

      ) : activeFix &&
        activeFix.fix.actionType ===
          'connect_existing' ? (

        <FixPanel
          issue={activeFix.issue}
          fix={activeFix.fix}
          nodes={nodes}
          onApply={applyConnectExistingFix}
          onCancel={cancelFix}
        />

      ) : showAnalysis ? (

        <AnalysisPanel
          issues={analysisIssues}
          onSelectIssue={selectAnalysisIssue}
          onSelectFix={selectSuggestedFix}
        />

      ) : selectedEdge ? (

        <EdgeInspector
          edge={selectedEdge}
          nodes={nodes}
          onUpdateEdge={updateEdge}
          onDeleteEdge={deleteEdge}
        />

      ) : (

        <NodeInspector
          node={selectedNode}
          onUpdateNode={updateNode}
          onDeleteNode={deleteNode}
        />

      )}

    </div>
  );
}


export default App;
