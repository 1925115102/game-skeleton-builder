import { createContext, useContext } from 'react';

export interface HierarchyUiState {
  parentIds: Set<string>;
  collapsedParentIds: Set<string>;
  blockedCollapseParentIds: Set<string>;
  toggleParent: (nodeId: string) => void;
}

export const HierarchyUiContext = createContext<HierarchyUiState | null>(null);
export const useHierarchyUi = () => useContext(HierarchyUiContext);
