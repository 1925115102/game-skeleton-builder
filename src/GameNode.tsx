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
import { useHierarchyUi } from './HierarchyUiContext';


function GameNodeComponent({
  data,
  id,
}: NodeProps<GameNode>) {

  const nodeData =
    data as GameNodeData;
  const hierarchyUi = useHierarchyUi();
  const isParent = hierarchyUi?.parentIds.has(id) ?? false;
  const isCollapsed = hierarchyUi?.collapsedParentIds.has(id) ?? false;
  const collapseBlocked = hierarchyUi?.blockedCollapseParentIds.has(id) ?? false;


  return (
    <div
      className={[
        'game-node',

        `game-node-${nodeData.gameType}`,

        nodeData.highlighted
          ? 'game-node-highlighted'
          : '',
        (nodeData as GameNodeData & { selectionFocus?: 'selected' | 'connected'; deEmphasized?: boolean }).selectionFocus === 'selected' ? 'game-node-selected-focus' : '',
        (nodeData as GameNodeData & { selectionFocus?: 'selected' | 'connected'; deEmphasized?: boolean }).selectionFocus === 'connected' ? 'game-node-connected-focus' : '',
        (nodeData as GameNodeData & { selectionFocus?: 'selected' | 'connected'; deEmphasized?: boolean }).deEmphasized ? 'game-node-deemphasized' : '',
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

      {isParent && <button
        className="game-node-collapse"
        title={collapseBlocked ? 'This subsystem has external gameplay relationships and cannot be collapsed yet.' : isCollapsed ? 'Expand subsystem' : 'Collapse subsystem'}
        disabled={collapseBlocked}
        onClick={(event) => { event.stopPropagation(); hierarchyUi?.toggleParent(id); }}
      >{isCollapsed ? '+' : '−'}</button>}


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
