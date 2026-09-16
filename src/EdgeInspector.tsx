import type {
  Edge,
  Node,
} from '@xyflow/react';

import type {
  GameEdgeData,
  GameEdgeType,
  GameNodeData,
} from './types';

import './NodeInspector.css';


interface EdgeInspectorProps {

  edge: Edge<GameEdgeData>;

  nodes: Node[];

  onUpdateEdge: (
    edgeId: string,
    relation: GameEdgeType
  ) => void;

  onDeleteEdge: (
    edgeId: string
  ) => void;
  onReverseEdge: (edgeId: string) => void;
  error: string | null;
}


const relationTypes: GameEdgeType[] = [
  'produces',
  'consumes',
  'requires',
  'unlocks',
  'improves',
  'leads_to',
  'contains',
];


function EdgeInspector({
  edge,
  nodes,
  onUpdateEdge,
  onDeleteEdge,
  onReverseEdge,
  error,
}: EdgeInspectorProps) {

  const sourceNode =
    nodes.find(
      (node) => node.id === edge.source
    );

  const targetNode =
    nodes.find(
      (node) => node.id === edge.target
    );


  const sourceData =
    sourceNode?.data as unknown as GameNodeData;

  const targetData =
    targetNode?.data as unknown as GameNodeData;


  const relation =
    edge.data?.relation ?? 'leads_to';


  return (
    <div className="inspector">

      <h2>Edge Inspector</h2>


      <label>

        Relationship

        <select
          value={relation}

          onChange={(event) =>
            onUpdateEdge(
              edge.id,
              event.target.value as GameEdgeType
            )
          }
        >

          {relationTypes.map((type) => (

            <option
              key={type}
              value={type}
            >
              {type
                .replace('_', ' ')
                .toUpperCase()}
            </option>

          ))}

        </select>

      </label>


      <label>

        Direction

        <input value={`${sourceData?.label ?? 'Unknown node'} → ${targetData?.label ?? 'Unknown node'}`} disabled />

      </label>

      {error && <p role="alert">{error}</p>}

      <button className="delete-button" onClick={() => onReverseEdge(edge.id)}>
        Reverse Direction
      </button>

      <label>

        Source

        <input
          value={
            sourceData?.label ??
            edge.source
          }

          disabled
        />

      </label>


      <label>

        Target

        <input
          value={
            targetData?.label ??
            edge.target
          }

          disabled
        />

      </label>


      <button
        className="delete-button"

        onClick={() =>
          onDeleteEdge(edge.id)
        }
      >
        Delete Edge
      </button>

    </div>
  );
}


export default EdgeInspector;
