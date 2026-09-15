import {
  Handle,
  Position,
  type NodeProps,
} from '@xyflow/react';

import type {
  GameNodeData,
  GameNode,
} from './types';

import './GameNode.css';


function GameNodeComponent({
  data,
}: NodeProps<GameNode>) {

  const nodeData =
    data as GameNodeData;


  return (
    <div
      className={[
        'game-node',

        `game-node-${nodeData.gameType}`,

        nodeData.highlighted
          ? 'game-node-highlighted'
          : '',
      ].join(' ')}
    >

      <Handle
        type="target"
        position={Position.Left}
      />


      <div className="game-node-type">
        {nodeData.gameType.toUpperCase()}
      </div>


      <div className="game-node-label">
        {nodeData.label}
      </div>


      <div className="game-node-importance">
        {nodeData.importance.toUpperCase()}
      </div>


      {nodeData.description && (
        <div className="game-node-description">
          {nodeData.description}
        </div>
      )}


      <Handle
        type="source"
        position={Position.Right}
      />

    </div>
  );
}


export default GameNodeComponent;