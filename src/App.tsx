import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';

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
import RelationshipEdge from './RelationshipEdge';
import HierarchyEdge from './HierarchyEdge';
import NodeInspector from './NodeInspector';
import EdgeInspector from './EdgeInspector';

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

import type {
  AIReviewResult,
  AIIssue,
} from './ai/aiTypes';
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
import { highlightForChangeSet, highlightForIssue, type AssistantHighlight } from './ai/designAssistantHighlights';
import { createProjectMetadata, getProjectExportFilename, migrateProjectDocument, type ProjectMetadata } from './projectState';
import { getAutoLayoutedNodes } from './graph/autoLayout';
import { edgePresentation, relationshipLabel } from './graph/edgePresentation';
import { routeEdges } from './graph/edgeRouting';
import { markIssueApplied } from './ai/issueLifecycle';
import { getVisibleHierarchyGraph, hiddenExternalGameplayConnectionCount, hierarchyParents } from './graph/hierarchy';
import { selectedNodeNeighborhood } from './graph/neighborhood';
import { HierarchyUiContext } from './HierarchyUiContext';
import GameReportPanel from './GameReportPanel';
import type { GameReport } from './ai/gameReportTypes';
import { reportShouldBecomeStale } from './ai/reportStaleness';

// ======================================================
// Custom Node Components
// ======================================================

const nodeTypes = {
  gameNode: GameNodeComponent,
};

const edgeTypes = {
  relationshipEdge: RelationshipEdge,
  hierarchyEdge: HierarchyEdge,
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
    label: 'Produces',
    data: {
      relation: 'produces',
    },
  },

  {
    id: 'material-alchemy',
    source: 'material',
    target: 'alchemy',
    label: 'Consumes',
    data: {
      relation: 'consumes',
    },
  },

  {
    id: 'alchemy-boss',
    source: 'alchemy',
    target: 'boss',
    label: 'Improves',
    data: {
      relation: 'improves',
    },
  },

  {
    id: 'boss-breakthrough',
    source: 'boss',
    target: 'breakthrough',
    label: 'Unlocks',
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
  const [suggestionsByIssue, setSuggestionsByIssue] = useState<Record<string, DesignChangeSet>>({});
  const [appliedSuggestionIssueIds, setAppliedSuggestionIssueIds] = useState<string[]>([]);
  const [selectedDesignIssue, setSelectedDesignIssue] = useState<AIIssue | null>(null);
  const [analysisStale, setAnalysisStale] = useState(false);
  const [isApplyingChangeSet, setIsApplyingChangeSet] = useState(false);
  const [assistantHighlight, setAssistantHighlight] = useState<AssistantHighlight>({ nodeIds: [], edgeIds: [] });
  const [collapsedHierarchyParentIds, setCollapsedHierarchyParentIds] = useState<string[]>([]);
  const [showGameReport, setShowGameReport] = useState(false);
  const [gameReport, setGameReport] = useState<GameReport | null>(null);
  const [gameReportLoading, setGameReportLoading] = useState(false);
  const [gameReportError, setGameReportError] = useState<string | null>(null);
  const [gameReportStale, setGameReportStale] = useState(false);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const applyingRef = useRef(false);

  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);

  const visibleHierarchyGraph = useMemo(
    () => getVisibleHierarchyGraph(nodes, edges, collapsedHierarchyParentIds),
    [nodes, edges, collapsedHierarchyParentIds]
  );
  const hierarchyParentIds = useMemo(() => hierarchyParents(edges), [edges]);
  const blockedCollapseParentIds = useMemo(() => new Set(
    [...hierarchyParentIds].filter((parentId) => hiddenExternalGameplayConnectionCount(parentId, edges) > 0)
  ), [hierarchyParentIds, edges]);

  const selectionContext = useMemo(() => {
    return selectedNodeNeighborhood(selectedNodeId, edges);
  }, [selectedNodeId, edges]);

  const displayedNodes = useMemo<GameNode[]>(() => visibleHierarchyGraph.nodes.map((node): GameNode => ({
    ...node,
    data: {
      ...node.data,
      selectionFocus: selectedNodeId ? (node.id === selectedNodeId ? 'selected' : selectionContext.nodeIds.has(node.id) ? 'connected' : undefined) : undefined,
      deEmphasized: Boolean(selectedNodeId && !selectionContext.nodeIds.has(node.id)),
    },
  })), [visibleHierarchyGraph.nodes, selectedNodeId, selectionContext]);

  const displayedEdges = useMemo<GameEdge[]>(() => visibleHierarchyGraph.edges.map((edge): GameEdge => {
    if (!selectedNodeId) return edge;
    const related = selectionContext.edgeIds.has(edge.id);
    const presentation = edgePresentation(edge, visibleHierarchyGraph.edges, related);
    return { ...edge, ...presentation, style: { ...presentation.style, opacity: related ? 1 : 0.12 } };
  }), [visibleHierarchyGraph.edges, selectedNodeId, selectionContext]);

  const reportSemanticSignature = useMemo(() => JSON.stringify({
    projectName,
    projectBrief,
    nodes: nodes.map(({ id, data }) => ({ id, label: data.label, type: data.gameType, importance: data.importance, description: data.description })),
    edges: edges.map((edge) => ({ id: edge.id, source: edge.source, target: edge.target, relation: edge.data?.relation })),
  }), [projectName, projectBrief, nodes, edges]);
  const previousReportSemanticSignature = useRef(reportSemanticSignature);
  useEffect(() => {
    if (previousReportSemanticSignature.current !== reportSemanticSignature) {
      const previousSignature = previousReportSemanticSignature.current;
      previousReportSemanticSignature.current = reportSemanticSignature;
      if (reportShouldBecomeStale(previousSignature, reportSemanticSignature, Boolean(gameReport))) setGameReportStale(true);
    }
  }, [reportSemanticSignature, gameReport]);

  useEffect(() => {
    const nodeIds = new Set(assistantHighlight.nodeIds);
    const edgeIds = new Set(assistantHighlight.edgeIds);
    setNodes((currentNodes) => currentNodes.map((node) => ({
      ...node,
      data: { ...node.data, highlighted: nodeIds.has(node.id) },
    })));
    setEdges((currentEdges) => currentEdges.map((edge) => {
      const highlighted = edgeIds.has(edge.id);
      const enrichedEdge: GameEdge = {
        ...edge,
        data: { ...edge.data, relation: edge.data?.relation ?? 'leads_to', highlighted },
      };
      return { ...enrichedEdge, ...edgePresentation(enrichedEdge, currentEdges, highlighted) };
    }));
  }, [assistantHighlight, setNodes, setEdges]);

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

        label: relationshipLabel('leads_to'),

        data: {
          relation: 'leads_to',
        },
        type: 'smoothstep',
      };


      setEdges((currentEdges) => addEdge(
        { ...newEdge, ...edgePresentation(newEdge, currentEdges) },
        currentEdges
      ));

    },
    [setEdges]
  );

  useEffect(() => {
    setEdges((currentEdges) => routeEdges(nodes, currentEdges).map((edge) => {
      const presentation = edgePresentation(edge, currentEdges, Boolean(edge.data?.highlighted));
      return {
        ...edge,
        ...presentation,
      };
    }));
  }, [nodes, setEdges]);

  const autoLayout = useCallback(() => {
    const layoutedVisibleNodes = getAutoLayoutedNodes(visibleHierarchyGraph.nodes, visibleHierarchyGraph.edges);
    const positions = new Map(layoutedVisibleNodes.map((node) => [node.id, node.position]));
    setNodes((currentNodes) => currentNodes.map((node) => positions.has(node.id)
      ? { ...node, position: positions.get(node.id)! }
      : node));
    window.setTimeout(() => {
      reactFlowInstance?.fitView({ padding: 0.18, duration: 350 });
    }, 0);
  }, [visibleHierarchyGraph, reactFlowInstance, setNodes]);

  const toggleHierarchyParent = useCallback((nodeId: string) => {
    if (blockedCollapseParentIds.has(nodeId)) return;
    setCollapsedHierarchyParentIds((current) => {
      const next = new Set(current);
      if (next.has(nodeId)) next.delete(nodeId); else next.add(nodeId);
      return [...next];
    });
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, [blockedCollapseParentIds]);


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

            label: relationshipLabel(relation),

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
        label: relationshipLabel(proposal.relation),
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
        label: relationshipLabel(proposal.relation),
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
      setSelectedDesignIssue(null);
      setSuggestionsByIssue({});
      setAppliedSuggestionIssueIds([]);
      setAssistantHighlight({ nodeIds: [], edgeIds: [] });
      setAnalysisStale(false);
    } catch (error) {
      console.error('Design Assistant analysis error:', error);
      setDesignAssistantError('Design analysis failed. Check that the AI server is running and try again.');
    } finally {
      setDesignAssistantLoading(false);
    }
  }, [projectName, projectBrief, nodes, edges]);

  const requestGameReport = useCallback(async () => {
    try {
      setShowGameReport(true);
      setGameReportLoading(true);
      setGameReportError(null);
      const response = await fetch('http://localhost:3001/api/game-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: { name: projectName, brief: projectBrief }, skeleton: serializeSkeleton(nodes, edges) }),
      });
      if (!response.ok) throw new Error(`Server returned ${response.status}.`);
      const data = await response.json() as { result: GameReport };
      setGameReport(data.result);
      setGameReportStale(false);
    } catch (error) {
      console.error('Game Report generation error:', error);
      setGameReportError('Game Report generation failed. Check that the AI server is running and try again.');
    } finally {
      setGameReportLoading(false);
    }
  }, [projectName, projectBrief, nodes, edges]);

  const requestDesignChangeSet = useCallback(async (issue: AIIssue) => {
    const cached = suggestionsByIssue[issue.id];
    if (cached) {
      setDesignAssistantError(null);
      setSelectedDesignIssue(issue);
      setDesignChangeSet(cached);
      setAssistantHighlight(
        appliedSuggestionIssueIds.includes(issue.id)
          ? { nodeIds: [], edgeIds: [] }
          : highlightForChangeSet(cached, nodesRef.current, edgesRef.current)
      );
      return;
    }
    if (appliedSuggestionIssueIds.includes(issue.id)) return;
    try {
      setDesignAssistantLoading(true);
      setDesignAssistantError(null);
      setSelectedDesignIssue(issue);
      setDesignChangeSet(null);
      setAssistantHighlight(highlightForIssue(issue));
      const response = await fetch('http://localhost:3001/api/design-assistant/change-set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: { name: projectName, brief: projectBrief }, skeleton: serializeSkeleton(nodes, edges), issue }),
      });
      if (!response.ok) throw new Error(`Server returned ${response.status}.`);
      const data = await response.json() as { result: DesignChangeSet };
      setDesignChangeSet(data.result);
      setSuggestionsByIssue((current) => ({ ...current, [issue.id]: data.result }));
      setAssistantHighlight(
        highlightForChangeSet(data.result, nodesRef.current, edgesRef.current)
      );
    } catch (error) {
      console.error('Design Assistant change-set error:', error);
      setDesignAssistantError('Design change proposal failed. Try again.');
    } finally {
      setDesignAssistantLoading(false);
    }
  }, [projectName, projectBrief, nodes, edges, suggestionsByIssue, appliedSuggestionIssueIds]);

  const approveDesignChangeSet = useCallback(() => {
    if (!designChangeSet || applyingRef.current) return;
    applyingRef.current = true;
    setIsApplyingChangeSet(true);
    setDesignAssistantError(null);

    window.setTimeout(() => {
      try {
        const result = applyDesignChangeSet(
          nodesRef.current,
          edgesRef.current,
          designChangeSet
        );
        if (!result.success) {
          setDesignAssistantError(`Could not apply this change set: ${result.error}`);
          return;
        }
        setNodes(result.nodes);
        setEdges(result.edges);
        setDesignChangeSet(null);
        if (selectedDesignIssue) setAppliedSuggestionIssueIds((current) => markIssueApplied(current, selectedDesignIssue.id));
        setAssistantHighlight({ nodeIds: [], edgeIds: [] });
        setAnalysisStale(true);
      } finally {
        applyingRef.current = false;
        setIsApplyingChangeSet(false);
      }
    }, 0);
  }, [designChangeSet, selectedDesignIssue, setNodes, setEdges]);


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

        <HierarchyUiContext.Provider value={{ parentIds: hierarchyParentIds, collapsedParentIds: new Set(collapsedHierarchyParentIds), blockedCollapseParentIds, toggleParent: toggleHierarchyParent }}>
        <ReactFlow
          nodes={displayedNodes}
          edges={displayedEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}

          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}

          onNodeClick={(_, node) => {
            setSelectedNodeId(node.id);
            setSelectedEdgeId(null);
          }}

          onEdgeClick={(_, edge) => {
            setSelectedEdgeId(edge.id);
            setSelectedNodeId(null);
          }}

          onPaneClick={() => {
            setSelectedNodeId(null);
            setSelectedEdgeId(null);
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
                onClick={autoLayout}
                style={toolbarButtonStyle}
                disabled={nodes.length < 2}
                title="Arrange the current graph without changing its design"
              >
                Auto Layout
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
                  setAssistantHighlight({ nodeIds: [], edgeIds: [] });
                }}
                style={toolbarButtonStyle}
              >
                Project: {projectName || 'Untitled Game'}
              </button>

              <button
                onClick={() => {
                  setShowDesignAssistant(true);
                  setDesignAssistantError(null);
                }}
                style={toolbarButtonStyle}
              >
                AI Design Assistant
              </button>

              <button
                onClick={() => { setShowGameReport(true); setGameReportError(null); }}
                style={toolbarButtonStyle}
              >
                Game Report
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
        </HierarchyUiContext.Provider>

      </div>


      {/* =================================================
          INSPECTOR
      ================================================= */}

      {showGameReport ? (

        <GameReportPanel
          report={gameReport}
          loading={gameReportLoading}
          stale={gameReportStale}
          error={gameReportError}
          onGenerate={requestGameReport}
          onClose={() => setShowGameReport(false)}
        />

      ) : showDesignAssistant ? (

        <DesignAssistantPanel
          analysis={designAssistantAnalysis}
          changeSet={designChangeSet}
          selectedIssue={selectedDesignIssue}
          suggestedIssueIds={Object.keys(suggestionsByIssue)}
          appliedIssueIds={appliedSuggestionIssueIds}
          nodes={nodes}
          edges={edges}
          loading={designAssistantLoading}
          applying={isApplyingChangeSet}
          analysisStale={analysisStale}
          error={designAssistantError}
          onRequestChange={requestDesignChangeSet}
          onAnalyze={requestDesignAnalysis}
          onApprove={approveDesignChangeSet}
          onReject={() => {
            setDesignChangeSet(null);
            setAssistantHighlight(
              selectedDesignIssue
                ? highlightForIssue(selectedDesignIssue)
                : { nodeIds: [], edgeIds: [] }
            );
          }}
          onBack={() => {
            setDesignChangeSet(null);
            setDesignAssistantError(null);
            setAssistantHighlight(
              selectedDesignIssue
                ? highlightForIssue(selectedDesignIssue)
                : { nodeIds: [], edgeIds: [] }
            );
          }}
          onClose={() => {
            setShowDesignAssistant(false);
            setAssistantHighlight({ nodeIds: [], edgeIds: [] });
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
          edges={edges}
          nodes={nodes}
          onUpdateNode={updateNode}
          onDeleteNode={deleteNode}
        />

      )}

    </div>
  );
}


export default App;
