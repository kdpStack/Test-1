/* ------------------------------------------------------------------ */
/* Case Forge generator: sudoku + evidence layer + narrative wrapper   */
/* ------------------------------------------------------------------ */

import { analyze, countSolutions, dig, generateSolved, mulberry32, shuffle, tierFor } from "./sudoku";
import type { Analysis, Cells, Rng, TierId } from "./sudoku";
import {
  LOCATIONS, MOTIVES, SUSPECT_FLAVORS, SUSPECT_NAMES, THEMES, TITLES, WEAPONS,
} from "./caseData";
import type { ThemeId } from "./caseData";

export const LETTERS = "ABCDEFGHI"; // digit d maps to LETTERS[d-1]
export type GroupKind = "suspect" | "weapon" | "location";

export interface EvidenceGroup {
  kind: GroupKind;
  word: string; // the answer spelled by the marked cells
  cells: number[]; // ascending cell indices, letter order
}

export interface CastMember {
  name: string;
  title: string;
  flavor: string;
  isKiller: boolean;
}

export interface CaseStory {
  setting: string;
  victim: string;
  epithet: string;
  intro: string;
  cast: CastMember[];
  killer: string;
  killerTitle: string;
  weapon: string;
  location: string;
  motive: string;
  verdict: string;
}

export interface PuzzleCase {
  uid: string;
  caseNumber: number;
  seed: number;
  theme: ThemeId;
  themeName: string;
  puzzle: Cells;
  solution: Cells;
  givens: number;
  analysis: Analysis;
  tier: TierId;
  unique: boolean;
  groups: EvidenceGroup[];
  story: CaseStory;
  genMs: number;
  createdAt: number;
}

export interface ForgeOptions {
  seed: number;
  theme: ThemeId;
  targetGivens: number;
  symmetric: boolean;
  evidenceK: number;
  caseNumber: number;
}

const pick = <T,>(arr: readonly T[], rng: Rng): T => arr[Math.floor(rng() * arr.length)];

const boxOf = (i: number): number =>
  Math.floor(Math.floor(i / 9) / 3) * 3 + Math.floor((i % 9) / 3);

/**
 * Choose 3 groups of k distinct empty cells, spread across boxes
 * so the marked evidence reads cleanly on the printed page.
 */
function pickEvidenceCells(empties: number[], k: number, rng: Rng): number[][] {
  let available = shuffle(empties, rng);
  const boxUse = new Array(9).fill(0);
  const out: number[][] = [];
  for (let g = 0; g < 3; g++) {
    const ranked = [...available].sort(
      (a, b) => boxUse[boxOf(a)] - boxUse[boxOf(b)] || rng() - 0.5
    );
    const chosen = ranked.slice(0, k).sort((a, b) => a - b);
    chosen.forEach((c) => {
      boxUse[boxOf(c)]++;
    });
    available = available.filter((c) => !chosen.includes(c));
    out.push(chosen);
  }
  return out;
}

let uidCounter = 0;

export function forgePuzzle(o: ForgeOptions): PuzzleCase {
  const t0 = performance.now();
  const rng = mulberry32((o.seed >>> 0) || 1);
  const theme = THEMES.find((t) => t.id === o.theme) ?? THEMES[0];

  // --- grid -------------------------------------------------------
  const solution = generateSolved(rng);
  const { puzzle, givens } = dig(solution, o.targetGivens, o.symmetric, rng);
  const analysis = analyze(puzzle);
  const unique = countSolutions(puzzle, 2) === 1;
  const tier = tierFor(givens, analysis.solvedWithSingles);

  // --- narrative --------------------------------------------------
  const k = (Math.min(5, Math.max(3, o.evidenceK)) as 3 | 4 | 5);
  const killerName = pick(SUSPECT_NAMES[k], rng);
  const killerTitle = pick(TITLES, rng);
  const weapon = pick(WEAPONS[k], rng);
  const location = pick(LOCATIONS[k], rng);
  const motive = pick(MOTIVES, rng);
  const victim = pick(theme.victims, rng);

  const othersPool = [
    ...SUSPECT_NAMES[3],
    ...SUSPECT_NAMES[4],
    ...SUSPECT_NAMES[5],
  ].filter((n) => n !== killerName);
  const others = shuffle(othersPool, rng).slice(0, 5);

  const cast: CastMember[] = shuffle(
    [
      { name: killerName, title: killerTitle, flavor: pick(SUSPECT_FLAVORS, rng), isKiller: true },
      ...others.map((n) => ({
        name: n,
        title: pick(TITLES, rng),
        flavor: pick(SUSPECT_FLAVORS, rng),
        isKiller: false,
      })),
    ],
    rng
  );

  const intro = pick(theme.intros, rng)
    .replace(/\{setting\}/g, theme.setting)
    .replace(/\{victim\}/g, victim.name)
    .replace(/\{epithet\}/g, victim.epithet)
    .replace(/\{time\}/g, pick(theme.times, rng));

  const verdict =
    `The letters never lie. ${killerTitle} ${killerName} struck with the ` +
    `${weapon.toLowerCase()} in the ${location.toLowerCase()}, driven by ${motive}. ` +
    `The ${victim.name} case is closed.`;

  // --- evidence layer ----------------------------------------------
  const empties = puzzle.map((v, i) => (v === 0 ? i : -1)).filter((i) => i >= 0);
  const cellSets = pickEvidenceCells(empties, k, rng);
  const groups: EvidenceGroup[] = [
    { kind: "suspect", word: killerName, cells: cellSets[0] },
    { kind: "weapon", word: weapon, cells: cellSets[1] },
    { kind: "location", word: location, cells: cellSets[2] },
  ];

  uidCounter += 1;
  return {
    uid: `c${o.caseNumber}-${o.seed}-${uidCounter}-${Date.now().toString(36)}`,
    caseNumber: o.caseNumber,
    seed: o.seed,
    theme: theme.id,
    themeName: theme.name,
    puzzle,
    solution,
    givens,
    analysis,
    tier,
    unique,
    groups,
    story: {
      setting: theme.setting,
      victim: victim.name,
      epithet: victim.epithet,
      intro,
      cast,
      killer: killerName,
      killerTitle,
      weapon,
      location,
      motive,
      verdict,
    },
    genMs: Math.round((performance.now() - t0) * 10) / 10,
    createdAt: Date.now(),
  };
}

export const randomSeed = (): number => Math.floor(Math.random() * 0x7fffffff);

/** Deterministic evidence lookup: cell -> group kind + revealed letter. */
export function evidenceMapOf(pc: PuzzleCase): Map<number, { kind: GroupKind; letter: string }> {
  const m = new Map<number, { kind: GroupKind; letter: string }>();
  for (const g of pc.groups) {
    g.cells.forEach((cell, idx) => {
      m.set(cell, { kind: g.kind, letter: g.word[idx] });
    });
  }
  return m;
}
