import type { Node } from '@xyflow/react';
import type {
  GameNodeData,
  GameNodeImportance,
  GameNodeType,
} from './types';

interface NodeInspectorProps {
  node: Node | null;
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