import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';

import type {
  IssueFixOption,
} from './analyzer/issueFixMap';

import {
  isValidGameState,
} from './gameStateValidation';

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

import {
  buildSkeletonReviewPrompt,
} from './ai/skeletonPrompt';

import AIAnalysisPanel
  from './AIAnalysisPanel';

import type {
  AIReviewResult,
  AIIssue,
  AISuggestion,
} from './ai/aiTypes';

import AILoadingPanel from './AILoadingPanel';

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

  const [isAIReviewLoading, setIsAIReviewLoading] =
    useState(false);

  const [aiReviewError, setAIReviewError] =
    useState<string | null>(null);


  // ====================================================
  // GameState
  // ====================================================

  const getGameState = useCallback((): GameState => {
    return {
      version: '0.1',
      name: 'Untitled Game',
      nodes,
      edges,
    };
  }, [nodes, edges]);

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

    anchor.download =
      'game-skeleton.json';

    document.body.appendChild(anchor);

    anchor.click();

    document.body.removeChild(anchor);

    URL.revokeObjectURL(url);

  }, [getGameState]);

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

        if (!isValidGameState(parsed)) {
          throw new Error(
            'Invalid GameState format.'
          );
        }


        // ---------------------------------------------
        // Load Graph
        // ---------------------------------------------

        setNodes(parsed.nodes);
        setEdges(parsed.edges);


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
  // AI
  // ====================================================
  const testAISkeleton = useCallback(
    async () => {
      try {
        setIsAIReviewLoading(true);
        setAIReviewError(null);
        setAIReview(null);

        const skeleton =
          serializeSkeleton(
            nodes,
            edges
          );

        const prompt =
          buildSkeletonReviewPrompt(
            skeleton
          );

        const response =
          await fetch(
            'http://localhost:3001/api/review',
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body: JSON.stringify({
                prompt,
              }),
            }
          );

        if (!response.ok) {
          const errorText =
            await response.text();

          throw new Error(
            `Server returned ${response.status}: ${errorText}`
          );
        }

        const data =
          await response.json();

        const review =
          data.result as AIReviewResult;

        setAIReview(review);

      } catch (error) {

        console.error(
          'AI Review Error:',
          error
        );

        setAIReviewError(
          'AI review failed. Check that the AI server is running and try again.'
        );

      } finally {

        setIsAIReviewLoading(false);

      }
    },
    [
      nodes,
      edges,
    ]
  );


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
                onClick={runAnalysis}
                style={toolbarButtonStyle}
              >
                Analysis
              </button>
              
              <button
                onClick={testAISkeleton}
                style={toolbarButtonStyle}
                disabled={isAIReviewLoading}
              >
                {isAIReviewLoading
                  ? 'Reviewing...'
                  : 'AI Review'}
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

      {isAIReviewLoading ? (

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
