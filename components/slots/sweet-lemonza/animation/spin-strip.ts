import type { DisplaySymbol } from "./display-grid";

export interface LemonzaSpinStripCell {
  renderKey: string;
  symbol: DisplaySymbol;
  isTarget: boolean;
}

export interface LemonzaSpinStrip {
  cells: LemonzaSpinStripCell[];
  finalOffsetCells: number;
  visibleRows: number;
  key: string;
}

const byRow = (a: DisplaySymbol, b: DisplaySymbol) => a.row - b.row;

export function buildLemonzaSpinStrip(
  column: number,
  symbols: DisplaySymbol[],
  fillerRows = 15,
): LemonzaSpinStrip | undefined {
  const columnSymbols = symbols.filter((symbol) => symbol.column === column),
    targets = columnSymbols.filter((symbol) => symbol.isQueued).sort(byRow);
  if (targets.length !== 5) return undefined;
  const outgoing = columnSymbols
      .filter((symbol) => !symbol.isQueued)
      .sort(byRow),
    source = outgoing.length === 5 ? outgoing : targets;
  const fillers = Array.from(
    { length: fillerRows },
    (_, index) => source[(index * 3 + column * 2) % source.length],
  );
  const cells = [
    ...source.map((symbol, index) => ({
      renderKey: `start-${index}-${symbol.animationId}`,
      symbol,
      isTarget: false,
    })),
    ...fillers.map((symbol, index) => ({
      renderKey: `filler-${index}-${symbol.animationId}`,
      symbol,
      isTarget: false,
    })),
    ...targets.map((symbol, index) => ({
      renderKey: `target-${index}-${symbol.animationId}`,
      symbol,
      isTarget: true,
    })),
  ];
  const finalOffsetCells = cells.length - targets.length,
    key = targets.map((symbol) => symbol.animationId).join(":");
  return { cells, finalOffsetCells, visibleRows: 5, key };
}

export function lemonzaStripTransform(
  strip: LemonzaSpinStrip,
  offsetCells = strip.finalOffsetCells,
) {
  return `translate3d(0, -${(offsetCells / strip.cells.length) * 100}%, 0)`;
}
