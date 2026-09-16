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

      {([Position.Top, Position.Right, Position.Bottom, Position.Left] as const).map((position) => (
        <Handle key={`target-${position}`} id={`target-${position}`} type="target" position={position} />
      ))}


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


      {([Position.Top, Position.Right, Position.Bottom, Position.Left] as const).map((position) => (
        <Handle key={`source-${position}`} id={`source-${position}`} type="source" position={position} />
      ))}

    </div>
  );
}


export default GameNodeComponent;
