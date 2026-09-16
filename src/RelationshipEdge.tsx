import { BaseEdge, EdgeLabelRenderer, type Edge, type EdgeProps } from '@xyflow/react';
import type { GameEdgeData } from './types';

/** Draws opposite-direction relationships on separate, labelled curves. */
export default function RelationshipEdge({ sourceX, sourceY, targetX, targetY, label, markerEnd, style, data }: EdgeProps<Edge<GameEdgeData>>) {
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const length = Math.hypot(dx, dy) || 1;
  const direction = typeof data?.bidirectionalOffset === 'number' ? data.bidirectionalOffset : 1;
  const bend = 52 * direction;
  const controlX = (sourceX + targetX) / 2 + (-dy / length) * bend;
  const controlY = (sourceY + targetY) / 2 + (dx / length) * bend;
  const labelX = (sourceX + 2 * controlX + targetX) / 4;
  const labelY = (sourceY + 2 * controlY + targetY) / 4;
  const path = `M ${sourceX},${sourceY} Q ${controlX},${controlY} ${targetX},${targetY}`;

  return <>
    <BaseEdge path={path} markerEnd={markerEnd} style={style} />
    {label && <EdgeLabelRenderer>
      <div
        className="nodrag nopan"
        style={{
          position: 'absolute', transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          padding: '2px 5px', borderRadius: '4px', background: 'rgba(255,255,255,0.9)',
          fontSize: 11, fontWeight: 600, color: style?.stroke ?? '#475569', pointerEvents: 'all',
        }}
      >{label}</div>
    </EdgeLabelRenderer>}
  </>;
}
