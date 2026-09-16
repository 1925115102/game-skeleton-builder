import type { Node } from '@xyflow/react';
import type { GameEdge } from './types';
import { relationshipLabel } from './graph/edgePresentation';
import type {
  GameNodeData,
  GameNodeImportance,
  GameNodeType,
} from './types';

interface NodeInspectorProps {
  node: Node | null;
  edges: GameEdge[];
  nodes: Node[];
  onUpdateNode: (
    nodeId: string,
    updates: Partial<GameNodeData>
  ) => void;
  onDeleteNode: (nodeId: string) => void;
}

const nodeTypes: GameNodeType[] = [
  'activity',
  'system',
  'resource',
  'challenge',
  'progression',
  'goal',
];

const importanceTypes: GameNodeImportance[] = [
  'core',
  'supporting',
  'optional',
];

function NodeInspector({
  node,
  edges,
  nodes,
  onUpdateNode,
  onDeleteNode,
}: NodeInspectorProps) {
  if (!node) {
    return (
      <div className="inspector-empty">
        Select a node to edit it.
      </div>
    );
  }

  const data = node.data as unknown as GameNodeData;
  const nodeById = new Map(nodes.map((graphNode) => [graphNode.id, graphNode]));
  const labelFor = (nodeId: string) => (nodeById.get(nodeId)?.data as GameNodeData | undefined)?.label ?? 'Unknown node';
  const incoming = edges.filter((edge) => edge.target === node.id);
  const outgoing = edges.filter((edge) => edge.source === node.id);

  return (
    <div className="inspector">
      <h2>Node Inspector</h2>

      <label>
        Label
        <input
          value={data.label}
          onChange={(event) =>
            onUpdateNode(node.id, {
              label: event.target.value,
            })
          }
        />
      </label>

      <section className="node-relationship-context">
        <h3>Incoming</h3>
        {incoming.length ? <ul>{incoming.map((edge) => <li key={edge.id}>{labelFor(edge.source)} <strong>— {relationshipLabel(edge.data?.relation ?? 'leads_to')} →</strong> {data.label}</li>)}</ul> : <p>No incoming relationships.</p>}
        <h3>Outgoing</h3>
        {outgoing.length ? <ul>{outgoing.map((edge) => <li key={edge.id}>{data.label} <strong>— {relationshipLabel(edge.data?.relation ?? 'leads_to')} →</strong> {labelFor(edge.target)}</li>)}</ul> : <p>No outgoing relationships.</p>}
      </section>

      <label>
        Type
        <select
          value={data.gameType}
          onChange={(event) =>
            onUpdateNode(node.id, {
              gameType:
                event.target.value as GameNodeType,
            })
          }
        >
          {nodeTypes.map((type) => (
            <option key={type} value={type}>
              {type.toUpperCase()}
            </option>
          ))}
        </select>
      </label>

      <label>
        Importance
        <select
          value={data.importance}
          onChange={(event) =>
            onUpdateNode(node.id, {
              importance:
                event.target
                  .value as GameNodeImportance,
            })
          }
        >
          {importanceTypes.map((importance) => (
            <option
              key={importance}
              value={importance}
            >
              {importance.toUpperCase()}
            </option>
          ))}
        </select>
      </label>

      <label>
        Description
        <textarea
          value={data.description ?? ''}
          rows={6}
          onChange={(event) =>
            onUpdateNode(node.id, {
              description: event.target.value,
            })
          }
        />
      </label>

      <button
        className="delete-button"
        onClick={() => onDeleteNode(node.id)}
      >
        Delete Node
      </button>
    </div>
  );
}

export default NodeInspector;
