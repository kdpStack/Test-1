import type { PuzzleCase } from "../lib/generator";
import type { LogLine } from "../App";
import { SectionLabel, Stepper, TierChip, Toggle, cn } from "./ui";
import { MiniGrid } from "./Pages";
import {
  IconBook, IconCheck, IconDownload, IconLayers, IconPrint, IconTrash, IconX,
} from "./icons";

export interface BatchRun {
  running: boolean;
  done: number;
  total: number;
}

export function BatchPanel({
  batch,
  currentUid,
  onSelect,
  onDelete,
  onClear,
  run,
  batchSize,
  onBatchSize,
  includeSolutions,
  onIncludeSolutions,
  onRunBatch,
  onCancel,
  onExportJSON,
  onExportCSV,
  onPrint,
  log,
}: {
  batch: PuzzleCase[];
  currentUid: string | null;
  onSelect: (uid: string) => void;
  onDelete: (uid: string) => void;
  onClear: () => void;
  run: BatchRun;
  batchSize: number;
  onBatchSize: (n: number) => void;
  includeSolutions: boolean;
  onIncludeSolutions: (v: boolean) => void;
  onRunBatch: () => void;
  onCancel: () => void;
  onExportJSON: () => void;
  onExportCSV: () => void;
  onPrint: () => void;
  log: LogLine[];
}) {
  const pct = run.total > 0 ? Math.round((run.done / run.total) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* ---------- batch queue ---------- */}
      <div className="panel p-4 anim-rise" style={{ animationDelay: "120ms" }}>
        <SectionLabel
          right={
            batch.length > 0 && !run.running ? (
              <button
                type="button"
                onClick={onClear}
                className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-ink-400 hover:text-blood-400 transition-colors"
              >
                <IconTrash className="w-3 h-3" /> clear
              </button>
            ) : undefined
          }
        >
          Batch Queue · {batch.length}
        </SectionLabel>

        <div className="grid grid-cols-[1fr_auto] gap-2 items-end mb-2.5">
          <div>
            <label className="text-[11px] text-ink-400 block mb-1">Cases to forge</label>
            <Stepper value={batchSize} onChange={onBatchSize} min={1} max={100} step={1} />
          </div>
          {[10, 20, 50].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onBatchSize(n)}
              className={cn(
                "px-2 py-1.5 rounded-md border font-mono text-[11px] transition-colors",
                batchSize === n
                  ? "border-brass-500/70 bg-brass-500/10 text-brass-300"
                  : "border-ink-700 text-ink-400 hover:text-ink-100 hover:border-ink-500"
              )}
            >
              {n}
            </button>
          ))}
        </div>

        <Toggle
          checked={includeSolutions}
          onChange={onIncludeSolutions}
          label="Include solution pages in print book"
          hint="puzzle page followed by its solution"
        />

        {run.running ? (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono text-[11px] text-brass-300">
                forging {run.done + 1} / {run.total}…
              </span>
              <button
                type="button"
                onClick={onCancel}
                className="font-mono text-[10px] uppercase tracking-wider text-ink-400 hover:text-blood-400 transition-colors"
              >
                cancel
              </button>
            </div>
            <div className="h-2.5 rounded-full bg-ink-900 border border-ink-700 overflow-hidden">
              <div
                className="h-full bg-brass-500 progress-stripes transition-[width] duration-200"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onRunBatch}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-brass-500/50 bg-brass-500/10 text-brass-300 font-display font-bold text-[13.5px] hover:bg-brass-500/20 active:scale-[0.98] transition-all"
          >
            <IconLayers className="w-4 h-4" />
            Forge Batch of {batchSize}
          </button>
        )}

        {/* list */}
        {batch.length > 0 && (
          <div className="mt-3 max-h-[300px] overflow-y-auto slim-scroll pr-1 space-y-1.5">
            {[...batch].reverse().map((pc) => {
              const active = pc.uid === currentUid;
              return (
                <div
                  key={pc.uid}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(pc.uid)}
                  onKeyDown={(e) => e.key === "Enter" && onSelect(pc.uid)}
                  className={cn(
                    "group flex items-center gap-2.5 p-1.5 rounded-lg border cursor-pointer transition-all duration-150 anim-fade",
                    active
                      ? "border-brass-500/60 bg-brass-500/8 shadow-[0_0_0_1px_rgba(214,151,50,0.2)]"
                      : "border-ink-700 bg-ink-900/50 hover:border-ink-500 hover:bg-ink-800"
                  )}
                >
                  <MiniGrid values={pc.puzzle} className="w-10 h-10 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] font-semibold text-ink-100">
                        № {String(pc.caseNumber).padStart(3, "0")}
                      </span>
                      <TierChip tier={pc.tier} />
                      {pc.unique && <IconCheck className="w-3 h-3 text-moss-400" />}
                    </div>
                    <div className="font-mono text-[9.5px] text-ink-400 truncate">
                      {pc.themeName} · {pc.givens} givens · {pc.genMs}ms
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(pc.uid);
                    }}
                    className="p-1 text-ink-500 opacity-0 group-hover:opacity-100 hover:text-blood-400 transition-all"
                    aria-label="delete case"
                  >
                    <IconX className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {batch.length === 0 && !run.running && (
          <p className="mt-3 text-[12px] text-ink-400 font-mono text-center py-3 border border-dashed border-ink-700 rounded-lg">
            queue is empty — forge your first case
          </p>
        )}

        {/* exports */}
        <div className="mt-3 pt-3 border-t border-ink-700 grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={onExportJSON}
            disabled={batch.length === 0}
            className="flex items-center justify-center gap-1.5 py-2 rounded-md border border-ink-600 text-ink-200 font-mono text-[10px] uppercase tracking-wider hover:border-chalk-500/60 hover:text-chalk-300 disabled:opacity-35 disabled:pointer-events-none transition-colors"
          >
            <IconDownload className="w-3.5 h-3.5" /> JSON
          </button>
          <button
            type="button"
            onClick={onExportCSV}
            disabled={batch.length === 0}
            className="flex items-center justify-center gap-1.5 py-2 rounded-md border border-ink-600 text-ink-200 font-mono text-[10px] uppercase tracking-wider hover:border-chalk-500/60 hover:text-chalk-300 disabled:opacity-35 disabled:pointer-events-none transition-colors"
          >
            <IconDownload className="w-3.5 h-3.5" /> CSV
          </button>
          <button
            type="button"
            onClick={onPrint}
            disabled={batch.length === 0}
            className="flex items-center justify-center gap-1.5 py-2 rounded-md border border-ink-600 text-ink-200 font-mono text-[10px] uppercase tracking-wider hover:border-brass-500/60 hover:text-brass-300 disabled:opacity-35 disabled:pointer-events-none transition-colors"
          >
            <IconPrint className="w-3.5 h-3.5" /> Print
          </button>
        </div>
      </div>

      {/* ---------- verifier console ---------- */}
      <div className="panel p-4 anim-rise" style={{ animationDelay: "180ms" }}>
        <SectionLabel
          right={
            <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-moss-400">
              <span className="w-1.5 h-1.5 rounded-full bg-moss-400 pulse-dot" /> live
            </span>
          }
        >
          Verifier Console
        </SectionLabel>
        <div className="h-44 overflow-y-auto slim-scroll font-mono text-[10.5px] leading-[1.7] bg-ink-950/70 border border-ink-800 rounded-lg p-2.5 space-y-0.5">
          {log.length === 0 && (
            <div className="text-ink-500">$ case-forge verify --watch</div>
          )}
          {log.map((l) => (
            <div key={l.id} className="anim-fade">
              <span className="text-ink-500">{l.time}</span>{" "}
              <span
                className={cn(
                  l.tone === "ok" && "text-moss-400",
                  l.tone === "info" && "text-brass-300",
                  l.tone === "warn" && "text-blood-300"
                )}
              >
                [{l.tag}]
              </span>{" "}
              <span className="text-ink-200">{l.msg}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2 font-mono text-[9.5px] text-ink-500">
          <IconBook className="w-3 h-3" />
          every grid is proven unique by a two-solution backtracking count
        </div>
      </div>
    </div>
  );
}
