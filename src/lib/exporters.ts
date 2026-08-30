import { gridToString } from "./sudoku";
import type { PuzzleCase } from "./generator";

export function download(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 400);
}

export function batchToJSON(batch: PuzzleCase[], bookTitle: string): string {
  return JSON.stringify(
    {
      tool: "Case Forge",
      version: 1,
      bookTitle,
      exportedAt: new Date().toISOString(),
      count: batch.length,
      cases: batch.map((pc) => ({
        caseNumber: pc.caseNumber,
        seed: pc.seed,
        theme: pc.theme,
        themeName: pc.themeName,
        givens: pc.givens,
        tier: pc.tier,
        unique: pc.unique,
        puzzle: gridToString(pc.puzzle),
        solution: gridToString(pc.solution),
        evidence: pc.groups.map((g) => ({
          kind: g.kind,
          answer: g.word,
          cells: g.cells,
        })),
        story: pc.story,
      })),
    },
    null,
    2
  );
}

const csvEscape = (s: string | number): string => {
  const v = String(s);
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
};

export function batchToCSV(batch: PuzzleCase[]): string {
  const header = [
    "case", "theme", "tier", "givens", "seed",
    "puzzle", "solution",
    "killer", "weapon", "location", "motive", "victim",
  ].join(",");
  const rows = batch.map((pc) =>
    [
      pc.caseNumber,
      pc.themeName,
      pc.tier,
      pc.givens,
      pc.seed,
      gridToString(pc.puzzle),
      gridToString(pc.solution),
      `${pc.story.killerTitle} ${pc.story.killer}`,
      pc.story.weapon,
      pc.story.location,
      pc.story.motive,
      pc.story.victim,
    ]
      .map(csvEscape)
      .join(",")
  );
  return [header, ...rows].join("\n");
}
