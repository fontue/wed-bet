export function applyFreeSpinMultiplier(clusterPayout: number, multiplier: number): number {
  return clusterPayout * Math.max(1, multiplier);
}
