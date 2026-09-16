import { BaseEdge, getSmoothStepPath, type Edge, type EdgeProps } from '@xyflow/react';
import type { GameEdgeData } from './types';

export default function HierarchyEdge({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, style }: EdgeProps<Edge<GameEdgeData>>) {
  const [path] = getSmoothStepPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, borderRadius: 10, offset: 18 });
  return <BaseEdge path={path} style={style} />;
}
