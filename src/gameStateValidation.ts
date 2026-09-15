import type {
  GameState,
} from './types';


export function isValidGameState(
  value: unknown
): value is GameState {

  if (
    typeof value !== 'object' ||
    value === null
  ) {
    return false;
  }


  const state =
    value as Partial<GameState>;


  if (
    typeof state.version !== 'string'
  ) {
    return false;
  }


  if (
    typeof state.name !== 'string'
  ) {
    return false;
  }


  if (
    !Array.isArray(state.nodes)
  ) {
    return false;
  }


  if (
    !Array.isArray(state.edges)
  ) {
    return false;
  }


  return true;
}