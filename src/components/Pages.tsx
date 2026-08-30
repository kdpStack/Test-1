import { useMemo, useState } from "react";
import type { PuzzleCase, GroupKind } from "../lib/generator";
import { LETTERS, evidenceMapOf } from "../lib/generator";
import { peersOf, TIERS } from "../lib/sudoku";
import type { Cells } from "../lib/sudoku";
import { cn, TierChip } from "./ui";
import {
  ShapeCircle, ShapeSquare, ShapeTriangle, IconEye, IconEyeOff, IconCopy, IconCheck,
} from "./icons";

/* ------------------------------------------------------------- */
/* Evidence group meta                                            */
/* ------------------------------------------------------------- */

export const GROUP_META: Record<
  GroupKind,
  { label: string; short: string; color: string; paperColor: string; Shape: (p: { className?: string }) => React.ReactElement }
> = {
  suspect: { label: "The Killer", short: "KILLER", color: "text-blood-400", paperColor: "text-blood-600", Shape: ShapeTriangle },
  weapon: { label: "The Weapon", short: "WEAPON", color: "text-brass-400", paperColor: "text-brass-600", Shape: ShapeCircle },
  location: { label: "The Scene", short: "SCENE", color: "text-chalk-400", paperColor: "text-chalk-600", Shape: ShapeSquare },
};

const pad = (n: number) => String(n).padStart(3, "0");

/* ------------------------------------------------------------- */
/* Sudoku grid on paper                                           */
/* ------------------------------------------------------------- */

interface PaperGridProps {
  values: Cells;
  evidence?: Map<number, { kind: GroupKind; letter: string }>;
  mode: "puzzle" | "solution";
  interactive?: boolean;
  entered?: (number | 0)[];
  conflicts?: Set<number>;
  selected?: number;
  onCellClick?: (i: number) => void;
}

export function PaperGrid({
  values, evidence, mode, interactive, entered, conflicts, selected, onCellClick,
}: PaperGridProps) {
  const [hover, setHover] = useState<number | null>(null);
  const peerSet = useMemo(
    () => (hover === null ? null : new Set(peersOf(hover))),
    [hover]
  );

  return (
    <div className="pg-grid w-full select-none" onMouseLeave={() => setHover(null)}>
      {values.map((v, i) => {
        const r = Math.floor(i / 9);
        const c = i % 9;
        const ev = evidence?.get(i);
        const enteredVal = entered?.[i] ?? 0;
        const display = v !== 0 ? v : enteredVal;
        const isConflict = conflicts?.has(i) ?? false;
        const Meta = ev ? GROUP_META[ev.kind] : null;

        return (
          <div
            key={i}
            onClick={interactive ? () => onCellClick?.(i) : undefined}
            onMouseEnter={() => setHover(i)}
            className={cn(
              "pg-cell",
              c === 8 && "col-end",
              r === 8 && "row-end",
              c === 2 || c === 5 ? "box-r" : "",
              r === 2 || r === 5 ? "box-b" : "",
              interactive && "pg-interactive",
              selected === i && "pg-selected",
              selected !== i && peerSet?.has(i) && "pg-peer",
              isConflict && "pg-conflict"
            )}
          >
            {mode === "solution" ? (
              ev ? (
                <span className="flex flex-col items-center leading-none">
                  <span className="text-[10px] font-mono text-paperink-soft">{v}</span>
                  <span className={cn("evidence-letter text-[17px]", Meta!.paperColor)}>
                    {ev.letter}
                  </span>
                </span>
              ) : (
                <span className="pg-given text-[17px]">{v}</span>
              )
            ) : display !== 0 ? (
              <span className={cn("text-[19px]", v !== 0 ? "pg-given" : "pg-entered")}>
                {display}
              </span>
            ) : ev && Meta ? (
              <Meta.Shape className={cn("evidence-mark", Meta.paperColor)} />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------- */
/* Letter key (digit -> letter)                                   */
/* ------------------------------------------------------------- */

function LetterKey() {
  return (
    <div className="flex items-center gap-1 justify-center flex-wrap">
      <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-paperink-soft mr-2">
        Digit key
      </span>
      {Array.from({ length: 9 }, (_, i) => (
        <span
          key={i}
          className="flex flex-col items-center border border-paper-400/70 bg-paper-50 rounded-sm px-1.5 py-0.5 leading-none"
        >
          <span className="font-display font-bold text-[11px] text-paperink">{i + 1}</span>
          <span className="font-mono text-[10px] text-blood-600">{LETTERS[i]}</span>
        </span>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------- */
/* Legend of the three evidence marks                             */
/* ------------------------------------------------------------- */

function Legend() {
  return (
    <div className="flex items-center justify-center gap-5">
      {(Object.keys(GROUP_META) as GroupKind[]).map((k) => {
        const m = GROUP_META[k];
        return (
          <span key={k} className="flex items-center gap-1.5">
            <m.Shape className={cn("w-3 h-3", m.paperColor)} />
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-paperink-soft">
              spells the {m.short.toLowerCase()}
            </span>
          </span>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------- */
/* PUZZLE PAGE                                                    */
/* ------------------------------------------------------------- */

export interface PlaytestBridge {
  entered: (number | 0)[];
  conflicts: Set<number>;
  selected: number | null;
  onCellClick: (i: number) => void;
}

export function PuzzlePage({
  pc,
  bookTitle,
  byline,
  pageNumber,
  forPrint,
  playtest,
}: {
  pc: PuzzleCase;
  bookTitle: string;
  byline: string;
  pageNumber: number;
  forPrint?: boolean;
  playtest?: PlaytestBridge;
}) {
  const evidence = useMemo(() => evidenceMapOf(pc), [pc]);
  return (
    <div className={cn("paper relative overflow-hidden", forPrint && "print-page", !forPrint && "rounded-md")}>
      <div className={cn(!forPrint && "px-9 py-8", "flex flex-col h-full")}>
        {/* header */}
        <div className="flex items-start justify-between gap-4 pb-3 border-b-2 border-paperink/80">
          <div>
            <div className="font-mono text-[9px] tracking-[0.3em] uppercase text-paperink-soft">
              Murder-Mystery Sudoku
            </div>
            <h2 className="font-display font-extrabold text-[27px] leading-tight text-paperink mt-0.5">
              {pc.themeName}
            </h2>
          </div>
          <div className="paper-stamp text-blood-600 text-[11px] font-semibold rotate-2 shrink-0">
            Case № {pad(pc.caseNumber)}
          </div>
        </div>

        {/* story */}
        <p className="font-type text-[13px] leading-[1.75] text-paperink mt-4">
          {pc.story.intro}
        </p>

        {/* suspects */}
        <div className="mt-3.5">
          <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-paperink-soft mb-1.5">
            The suspects — all six had motive
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-1">
            {pc.story.cast.map((m) => (
              <div key={m.name} className="flex items-baseline gap-1.5 text-[11.5px] leading-snug">
                <span className="font-display font-bold text-paperink whitespace-nowrap">
                  {m.title} {m.name}
                </span>
                <span className="font-type text-paperink-soft italic">— {m.flavor}</span>
              </div>
            ))}
          </div>
        </div>

        {/* grid */}
        <div className="mt-5 flex justify-center">
          <div className="pg-wrap w-[min(100%,430px)]">
            <PaperGrid
              values={pc.puzzle}
              evidence={evidence}
              mode="puzzle"
              interactive={!!playtest}
              entered={playtest?.entered}
              conflicts={playtest?.conflicts}
              selected={playtest?.selected ?? undefined}
              onCellClick={playtest?.onCellClick}
            />
          </div>
        </div>
        <div className="mt-3">
          <Legend />
        </div>
        <div className="mt-2.5">
          <LetterKey />
        </div>

        {/* how to play */}
        <p className="font-type text-[11px] leading-relaxed text-paperink-soft mt-4 text-center px-4">
          Fill every row, column and 3×3 box with the digits 1–9. Then read the marked cells
          left-to-right: their letters spell the killer, the weapon and the scene of the crime.
        </p>

        {/* footer */}
        <div className="mt-auto pt-4 border-t border-paper-400/60 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.18em] text-paperink-soft">
          <span>{bookTitle || "Untitled Case Book"}</span>
          <span>{byline}</span>
          <span>Puzzle {pad(pc.caseNumber)} · pg {pageNumber}</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- */
/* SOLUTION PAGE                                                  */
/* ------------------------------------------------------------- */

export function SolutionPage({
  pc,
  bookTitle,
  byline,
  pageNumber,
  forPrint,
}: {
  pc: PuzzleCase;
  bookTitle: string;
  byline: string;
  pageNumber: number;
  forPrint?: boolean;
}) {
  const evidence = useMemo(() => evidenceMapOf(pc), [pc]);
  return (
    <div className={cn("paper relative overflow-hidden", forPrint && "print-page", !forPrint && "rounded-md")}>
      <div className={cn(!forPrint && "px-9 py-8", "flex flex-col h-full")}>
        <div className="flex items-start justify-between gap-4 pb-3 border-b-2 border-paperink/80">
          <div>
            <div className="font-mono text-[9px] tracking-[0.3em] uppercase text-paperink-soft">
              Solution — Case № {pad(pc.caseNumber)}
            </div>
            <h2 className="font-display font-extrabold text-[27px] leading-tight text-paperink mt-0.5">
              {pc.themeName}
            </h2>
          </div>
          <div className="paper-stamp text-moss-500 text-[11px] font-semibold -rotate-2 shrink-0">
            Case Closed
          </div>
        </div>

        <p className="font-type text-[13px] leading-[1.75] text-paperink mt-4">
          <span className="font-bold">The verdict: </span>
          {pc.story.verdict}
        </p>

        <div className="mt-5 flex justify-center">
          <div className="pg-wrap w-[min(100%,430px)]">
            <PaperGrid values={pc.solution} evidence={evidence} mode="solution" />
          </div>
        </div>
        <div className="mt-3">
          <LetterKey />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {(Object.keys(GROUP_META) as GroupKind[]).map((k) => {
            const m = GROUP_META[k];
            const g = pc.groups.find((x) => x.kind === k)!;
            return (
              <div key={k} className="border border-paper-400/70 bg-paper-50 rounded-sm px-2.5 py-2">
                <div className={cn("flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.18em]", m.paperColor)}>
                  <m.Shape className="w-2.5 h-2.5" /> {m.short}
                </div>
                <div className="font-display font-bold text-[15px] text-paperink mt-0.5">
                  {k === "suspect" ? `${pc.story.killerTitle} ${g.word}` : g.word}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-auto pt-4 border-t border-paper-400/60 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.18em] text-paperink-soft">
          <span>{bookTitle || "Untitled Case Book"}</span>
          <span>{byline}</span>
          <span>Solution {pad(pc.caseNumber)} · pg {pageNumber}</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- */
/* CASE BRIEF — publisher reference (screen only)                 */
/* ------------------------------------------------------------- */

export function CaseBrief({ pc }: { pc: PuzzleCase }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const copySeed = async () => {
    try {
      await navigator.clipboard.writeText(String(pc.seed));
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="paper rounded-md overflow-hidden">
      <div className="px-8 py-7">
        <div className="flex items-start justify-between gap-4 pb-3 border-b-2 border-paperink/80">
          <div>
            <div className="font-mono text-[9px] tracking-[0.3em] uppercase text-paperink-soft">
              Publisher Case Brief — do not print
            </div>
            <h2 className="font-display font-extrabold text-[24px] leading-tight text-paperink mt-0.5">
              {pc.themeName} · Case № {pad(pc.caseNumber)}
            </h2>
          </div>
          <TierChip tier={pc.tier} className="shrink-0 !normal-case" />
        </div>

        {/* answers */}
        <div className="grid grid-cols-2 gap-2.5 mt-5">
          {(Object.keys(GROUP_META) as GroupKind[]).map((k) => {
            const m = GROUP_META[k];
            const g = pc.groups.find((x) => x.kind === k)!;
            return (
              <div key={k} className="border border-paper-400/70 bg-paper-50 rounded-sm px-3 py-2.5">
                <div className={cn("flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.18em]", m.paperColor)}>
                  <m.Shape className="w-2.5 h-2.5" /> {m.short} · {g.word.length} letters
                </div>
                <div className={cn("font-display font-bold text-[17px] text-paperink mt-0.5", !revealed && "blur-[5px] select-none")}>
                  {k === "suspect" ? `${pc.story.killerTitle} ${g.word}` : g.word}
                </div>
              </div>
            );
          })}
          <div className="border border-paper-400/70 bg-paper-50 rounded-sm px-3 py-2.5">
            <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-paperink-soft">Motive</div>
            <div className={cn("font-type text-[12.5px] text-paperink mt-0.5 leading-snug", !revealed && "blur-[5px] select-none")}>
              {pc.story.motive}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setRevealed(!revealed)}
          className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-paperink/30 bg-paper-50 font-mono text-[10px] uppercase tracking-[0.16em] text-paperink hover:bg-paper-200 transition-colors"
        >
          {revealed ? <IconEyeOff className="w-3.5 h-3.5" /> : <IconEye className="w-3.5 h-3.5" />}
          {revealed ? "Conceal the truth" : "Reveal the culprit"}
        </button>

        {/* cast */}
        <div className="mt-5">
          <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-paperink-soft mb-2">
            Cast dossier
          </div>
          <div className="space-y-1">
            {pc.story.cast.map((m) => (
              <div key={m.name} className="flex items-center gap-2 text-[12.5px]">
                <span className="font-display font-bold text-paperink w-36 shrink-0">
                  {m.title} {m.name}
                </span>
                <span className="font-type italic text-paperink-soft">— {m.flavor}</span>
                {m.isKiller && revealed && (
                  <span className="ml-auto font-mono text-[9px] uppercase tracking-widest text-blood-600 border border-blood-600 rounded px-1">
                    guilty
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* forensics */}
        <div className="mt-5 pt-4 border-t border-paper-400/60 grid grid-cols-3 gap-x-4 gap-y-2 font-mono text-[10.5px] text-paperink-soft">
          <span>SEED <b className="text-paperink">{pc.seed}</b></span>
          <span>GIVENS <b className="text-paperink">{pc.givens}</b></span>
          <span>FORGED IN <b className="text-paperink">{pc.genMs}ms</b></span>
          <span>NAKED SINGLES <b className="text-paperink">{pc.analysis.nakedSingles}</b></span>
          <span>HIDDEN SINGLES <b className="text-paperink">{pc.analysis.hiddenSingles}</b></span>
          <span>ADVANCED NEEDED <b className="text-paperink">{pc.analysis.solvedWithSingles ? "no" : "yes"}</b></span>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={copySeed}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-paperink/30 bg-paper-50 font-mono text-[10px] uppercase tracking-[0.14em] text-paperink hover:bg-paper-200 transition-colors"
          >
            {copied ? <IconCheck className="w-3 h-3 text-moss-500" /> : <IconCopy className="w-3 h-3" />}
            {copied ? "copied" : "copy seed"}
          </button>
          <span className="font-mono text-[10px] text-paperink-soft">
            same seed + recipe reproduces this exact case
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- */
/* Mini grid thumbnail for batch cards                            */
/* ------------------------------------------------------------- */

export function MiniGrid({ values, className }: { values: Cells; className?: string }) {
  return (
    <svg viewBox="0 0 92 92" className={cn("text-ink-200", className)} aria-hidden>
      <rect x="1" y="1" width="90" height="90" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.55" />
      {[1, 2, 4, 5, 7, 8].map((i) => (
        <line key={`v${i}`} x1={i * 10 + 1} y1="1" x2={i * 10 + 1} y2="91" stroke="currentColor" strokeWidth="0.6" opacity="0.25" />
      ))}
      {[1, 2, 4, 5, 7, 8].map((i) => (
        <line key={`h${i}`} x1="1" y1={i * 10 + 1} x2="91" y2={i * 10 + 1} stroke="currentColor" strokeWidth="0.6" opacity="0.25" />
      ))}
      {[3, 6].map((i) => (
        <line key={`V${i}`} x1={i * 10 + 1} y1="1" x2={i * 10 + 1} y2="91" stroke="currentColor" strokeWidth="1.4" opacity="0.5" />
      ))}
      {[3, 6].map((i) => (
        <line key={`H${i}`} x1="1" y1={i * 10 + 1} x2="91" y2={i * 10 + 1} stroke="currentColor" strokeWidth="1.4" opacity="0.5" />
      ))}
      {values.map((v, i) =>
        v !== 0 ? (
          <rect
            key={i}
            x={(i % 9) * 10 + 3.4}
            y={Math.floor(i / 9) * 10 + 3.4}
            width="3.2"
            height="3.2"
            rx="0.6"
            fill="currentColor"
            opacity="0.8"
          />
        ) : null
      )}
    </svg>
  );
}

export { TIERS };
