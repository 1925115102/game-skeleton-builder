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

      {handles.map(({ position, slot, style }) => (
        <Handle key={`target-${position}-${slot}`} id={`target-${position}-${slot}`} type="target" position={position} style={style} />
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


      {handles.map(({ position, slot, style }) => (
        <Handle key={`source-${position}-${slot}`} id={`source-${position}-${slot}`} type="source" position={position} style={style} />
      ))}

    </div>
  );
}

const handleSlots = [20, 40, 60, 80];
const handles = ([Position.Top, Position.Right, Position.Bottom, Position.Left] as const).flatMap((position) =>
  handleSlots.map((offset, slot) => ({
    position,
    slot,
    style: position === Position.Top || position === Position.Bottom
      ? { left: `${offset}%` }
      : { top: `${offset}%` },
  }))
);


export default GameNodeComponent;
