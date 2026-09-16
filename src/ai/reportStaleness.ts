export function reportShouldBecomeStale(previousSignature: string, nextSignature: string, hasCachedReport: boolean): boolean {
  return hasCachedReport && previousSignature !== nextSignature;
}
