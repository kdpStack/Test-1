/* ------------------------------------------------------------------ */
/* Sudoku engine: seeded generation, uniqueness proof, difficulty read */
/* ------------------------------------------------------------------ */

export type Cells = number[]; // 81 entries, 0 = empty
export type Rng = () => number;
export type TierId = "rookie" | "classic" | "hardboiled" | "noir";

export const TIERS: Record<TierId, { label: string; givens: number; blurb: string }> = {
  rookie: { label: "Rookie", givens: 36, blurb: "Warm-up stakeout" },
  classic: { label: "Classic", givens: 31, blurb: "Standard deduction" },
  hardboiled: { label: "Hardboiled", givens: 27, blurb: "Pairs & pointing" },
  noir: { label: "Noir", givens: 24, blurb: "Deep technique work" },
};

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(arr: readonly T[], rng: Rng): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const PEERS: number[][] = (() => {
  const peers: number[][] = [];
  for (let i = 0; i < 81; i++) {
    const r = Math.floor(i / 9);
    const c = i % 9;
    const s = new Set<number>();
    for (let k = 0; k < 9; k++) {
      s.add(r * 9 + k);
      s.add(k * 9 + c);
    }
    const br = Math.floor(r / 3) * 3;
    const bc = Math.floor(c / 3) * 3;
    for (let a = 0; a < 3; a++)
      for (let b = 0; b < 3; b++) s.add((br + a) * 9 + bc + b);
    s.delete(i);
    peers.push([...s]);
  }
  return peers;
})();

export const peersOf = (i: number): number[] => PEERS[i];

const UNITS: number[][] = (() => {
  const u: number[][] = [];
  for (let r = 0; r < 9; r++) u.push(Array.from({ length: 9 }, (_, c) => r * 9 + c));
  for (let c = 0; c < 9; c++) u.push(Array.from({ length: 9 }, (_, r) => r * 9 + c));
  for (let br = 0; br < 9; br += 3)
    for (let bc = 0; bc < 9; bc += 3) {
      const cells: number[] = [];
      for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) cells.push((br + a) * 9 + bc + b);
      u.push(cells);
    }
  return u;
})();

export function isValid(grid: Cells, i: number, d: number): boolean {
  for (const p of PEERS[i]) if (grid[p] === d) return false;
  return true;
}

function fill(grid: Cells, rng: Rng): boolean {
  const i = grid.indexOf(0);
  if (i === -1) return true;
  for (const d of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rng)) {
    if (isValid(grid, i, d)) {
      grid[i] = d;
      if (fill(grid, rng)) return true;
      grid[i] = 0;
    }
  }
  return false;
}

export function generateSolved(rng: Rng): Cells {
  const g: Cells = new Array(81).fill(0);
  fill(g, rng);
  return g;
}

/** Count solutions up to `cap` (MRV backtracker). cap=2 proves uniqueness. */
export function countSolutions(grid: Cells, cap = 2): number {
  const g = [...grid];
  let count = 0;
  const solve = (): void => {
    if (count >= cap) return;
    let best = -1;
    let bestCands: number[] | null = null;
    for (let i = 0; i < 81; i++) {
      if (g[i] !== 0) continue;
      const cands: number[] = [];
      for (let d = 1; d <= 9; d++) if (isValid(g, i, d)) cands.push(d);
      if (cands.length === 0) return;
      if (!bestCands || cands.length < bestCands.length) {
        best = i;
        bestCands = cands;
        if (cands.length === 1) break;
      }
    }
    if (best === -1) {
      count++;
      return;
    }
    for (const d of bestCands!) {
      g[best] = d;
      solve();
      g[best] = 0;
      if (count >= cap) return;
    }
  };
  solve();
  return count;
}

export interface DigResult {
  puzzle: Cells;
  givens: number;
}

/** Remove givens while preserving a unique solution. Optional 180° symmetry. */
export function dig(solved: Cells, target: number, symmetric: boolean, rng: Rng): DigResult {
  const puzzle = [...solved];
  const order = shuffle(
    Array.from({ length: 81 }, (_, i) => i),
    rng
  );
  let givens = 81;
  for (const i of order) {
    if (givens <= target) break;
    if (puzzle[i] === 0) continue;
    const j = symmetric ? 80 - i : i;
    const hadJ = j !== i && puzzle[j] !== 0;
    const a = puzzle[i];
    const b = puzzle[j];
    puzzle[i] = 0;
    if (hadJ) puzzle[j] = 0;
    if (countSolutions(puzzle, 2) === 1) {
      givens -= hadJ ? 2 : 1;
    } else {
      puzzle[i] = a;
      if (hadJ) puzzle[j] = b;
    }
  }
  return { puzzle, givens };
}

export interface Analysis {
  ms: number;
  nakedSingles: number;
  hiddenSingles: number;
  solvedWithSingles: boolean;
  placements: number;
}

/** Human-technique read: how far naked/hidden singles alone can carry a solver. */
export function analyze(puzzle: Cells): Analysis {
  const t0 = performance.now();
  const g = [...puzzle];
  let naked = 0;
  let hidden = 0;
  let progress = true;
  while (progress) {
    progress = false;
    const cands: number[][] = g.map((v, i) => {
      if (v !== 0) return [];
      const cs: number[] = [];
      for (let d = 1; d <= 9; d++) if (isValid(g, i, d)) cs.push(d);
      return cs;
    });
    for (let i = 0; i < 81; i++) {
      if (g[i] === 0 && cands[i].length === 1) {
        g[i] = cands[i][0];
        naked++;
        progress = true;
      }
    }
    for (const unit of UNITS) {
      for (let d = 1; d <= 9; d++) {
        const spots = unit.filter((i) => g[i] === 0 && cands[i].includes(d));
        if (spots.length === 1 && g[spots[0]] === 0) {
          g[spots[0]] = d;
          hidden++;
          progress = true;
        }
      }
    }
  }
  const solved = g.every((v) => v !== 0);
  return {
    ms: Math.round((performance.now() - t0) * 10) / 10,
    nakedSingles: naked,
    hiddenSingles: hidden,
    solvedWithSingles: solved,
    placements: naked + hidden,
  };
}

export function tierFor(givens: number, solvedWithSingles: boolean): TierId {
  if (!solvedWithSingles) return "noir";
  if (givens >= 33) return "rookie";
  if (givens >= 28) return "classic";
  return "hardboiled";
}

export const gridToString = (c: Cells): string => c.join("");
