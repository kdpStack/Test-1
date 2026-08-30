import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ThemeId } from "./lib/caseData";
import { THEMES } from "./lib/caseData";
import { peersOf } from "./lib/sudoku";
import type { PuzzleCase } from "./lib/generator";
import { forgePuzzle, randomSeed } from "./lib/generator";
import { batchToCSV, batchToJSON, download } from "./lib/exporters";
import { Controls } from "./components/Controls";
import { BatchPanel } from "./components/BatchPanel";
import type { BatchRun } from "./components/BatchPanel";
import { CaseBrief, PuzzlePage, SolutionPage } from "./components/Pages";
import type { PlaytestBridge } from "./components/Pages";
import { ToastHost, cn } from "./components/ui";
import type { ToastItem } from "./components/ui";
import {
  IconEraser, IconEye, IconFingerprint, IconPlay, IconPrint, IconRedo, IconX,
} from "./components/icons";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export interface Settings {
  theme: ThemeId;
  targetGivens: number;
  symmetric: boolean;
  evidenceK: number;
  caseStart: number;
  bookTitle: string;
  byline: string;
  seedLocked: boolean;
  seed: number;
}

export interface LogLine {
  id: number;
  time: string;
  tag: string;
  tone: "ok" | "info" | "warn";
  msg: string;
}

type Tab = "puzzle" | "solution" | "brief";

const DEFAULT_SETTINGS: Settings = {
  theme: "manor",
  targetGivens: 31,
  symmetric: true,
  evidenceK: 4,
  caseStart: 1,
  bookTitle: "Murders by the Grid",
  byline: "Inkwell Puzzle Press",
  seedLocked: false,
  seed: 40211357,
};

const LS_SETTINGS = "caseforge.settings.v1";
const LS_BATCH = "caseforge.batch.v1";

const tick = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const now = () => new Date().toTimeString().slice(0, 8);

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/* ------------------------------------------------------------------ */
/* App                                                                */
/* ------------------------------------------------------------------ */

export default function App() {
  const [settings, setSettings] = useState<Settings>(() => ({
    ...DEFAULT_SETTINGS,
    ...loadJSON<Partial<Settings>>(LS_SETTINGS, {}),
  }));
  const [batch, setBatch] = useState<PuzzleCase[]>(() => loadJSON<PuzzleCase[]>(LS_BATCH, []));
  const [currentUid, setCurrentUid] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("puzzle");
  const [forging, setForging] = useState(false);
  const [run, setRun] = useState<BatchRun>({ running: false, done: 0, total: 0 });
  const [batchSize, setBatchSize] = useState(10);
  const [includeSolutions, setIncludeSolutions] = useState(true);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [log, setLog] = useState<LogLine[]>([]);
  const [printScope, setPrintScope] = useState<string>("book"); // 'book' | uid
  const [playtest, setPlaytest] = useState(false);
  const [entered, setEntered] = useState<(number | 0)[]>(() => new Array(81).fill(0));
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [cracked, setCracked] = useState(false);

  const cancelRef = useRef(false);
  const logId = useRef(0);
  const toastId = useRef(0);
  const booted = useRef(false);
  const batchRef = useRef(batch);
  batchRef.current = batch;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  /* ---------- persistence ---------- */
  useEffect(() => {
    try {
      localStorage.setItem(LS_SETTINGS, JSON.stringify(settings));
    } catch { /* quota */ }
  }, [settings]);
  useEffect(() => {
    try {
      localStorage.setItem(LS_BATCH, JSON.stringify(batch.slice(0, 120)));
    } catch { /* quota */ }
  }, [batch]);

  /* ---------- helpers ---------- */
  const pushLog = useCallback((tag: string, tone: LogLine["tone"], msg: string) => {
    logId.current += 1;
    const line: LogLine = { id: logId.current, time: now(), tag, tone, msg };
    setLog((l) => [line, ...l].slice(0, 80));
  }, []);

  const toast = useCallback((kind: ToastItem["kind"], msg: string) => {
    toastId.current += 1;
    const id = toastId.current;
    setToasts((t) => [...t.slice(-3), { id, kind, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  const patch = useCallback((p: Partial<Settings>) => {
    setSettings((s) => ({ ...s, ...p }));
  }, []);

  const resetPlaytest = useCallback(() => {
    setEntered(new Array(81).fill(0));
    setSelectedCell(null);
    setCracked(false);
  }, []);

  const nextCaseNo = settings.caseStart + batch.length;

  const makeSeed = useCallback((offset: number): number => {
    const s = settingsRef.current;
    return s.seedLocked ? (s.seed + offset * 100003) >>> 0 || 1 : randomSeed();
  }, []);

  /* ---------- forging ---------- */
  const forgeSingle = useCallback(async () => {
    if (forging || run.running) return;
    setForging(true);
    await tick(200);
    const s = settingsRef.current;
    const number = s.caseStart + batchRef.current.length;
    const seed = makeSeed(0);
    const pc = forgePuzzle({
      seed,
      theme: s.theme,
      targetGivens: s.targetGivens,
      symmetric: s.symmetric,
      evidenceK: s.evidenceK,
      caseNumber: number,
    });
    setBatch((b) => [...b, pc]);
    setCurrentUid(pc.uid);
    resetPlaytest();
    setTab("puzzle");
    pushLog(
      "FORGE",
      "ok",
      `CASE-${String(number).padStart(3, "0")} · ${pc.theme} · ${pc.givens} givens · unique ✓ · ${pc.genMs}ms`
    );
    if (!pc.analysis.solvedWithSingles)
      pushLog("VERIFY", "info", `CASE-${String(number).padStart(3, "0")} needs advanced technique — verified noir`);
    toast("success", `Case № ${String(number).padStart(3, "0")} forged — unique solution verified`);
    setForging(false);
  }, [forging, run.running, makeSeed, pushLog, resetPlaytest, toast]);

  const reforgeCurrent = useCallback(async () => {
    const cur = batchRef.current.find((b) => b.uid === currentUid);
    if (!cur || forging || run.running) return;
    setForging(true);
    await tick(200);
    const s = settingsRef.current;
    const seed = makeSeed(cur.caseNumber + 17);
    const pc = forgePuzzle({
      seed,
      theme: s.theme,
      targetGivens: s.targetGivens,
      symmetric: s.symmetric,
      evidenceK: s.evidenceK,
      caseNumber: cur.caseNumber,
    });
    setBatch((b) => b.map((x) => (x.uid === cur.uid ? pc : x)));
    setCurrentUid(pc.uid);
    resetPlaytest();
    pushLog("REFORGE", "info", `CASE-${String(pc.caseNumber).padStart(3, "0")} re-forged · seed ${seed} · ${pc.givens} givens · unique ✓`);
    toast("info", `Case № ${String(pc.caseNumber).padStart(3, "0")} re-forged with a fresh grid`);
    setForging(false);
  }, [currentUid, forging, run.running, makeSeed, pushLog, resetPlaytest, toast]);

  const runBatch = useCallback(async () => {
    if (run.running || forging) return;
    cancelRef.current = false;
    const total = batchSize;
    const baseLen = batchRef.current.length;
    setRun({ running: true, done: 0, total });
    pushLog("BATCH", "info", `batch of ${total} queued · theme ${settingsRef.current.theme} · target ${settingsRef.current.targetGivens} givens`);
    const forged: PuzzleCase[] = [];
    for (let i = 0; i < total; i++) {
      if (cancelRef.current) break;
      await tick(30);
      const s = settingsRef.current;
      const number = s.caseStart + baseLen + forged.length;
      const seed = makeSeed(i + 1);
      const pc = forgePuzzle({
        seed,
        theme: s.theme,
        targetGivens: s.targetGivens,
        symmetric: s.symmetric,
        evidenceK: s.evidenceK,
        caseNumber: number,
      });
      forged.push(pc);
      setBatch((b) => [...b, pc]);
      setCurrentUid(pc.uid);
      setRun((r) => ({ ...r, done: i + 1 }));
      pushLog(
        "VERIFY",
        "ok",
        `CASE-${String(number).padStart(3, "0")} · ${pc.givens} givens · unique ✓ · ${pc.genMs}ms`
      );
    }
    setRun({ running: false, done: 0, total: 0 });
    resetPlaytest();
    if (forged.length > 0) {
      const avg = forged.reduce((a, p) => a + p.genMs, 0) / forged.length;
      const msg = cancelRef.current
        ? `Batch stopped — ${forged.length} case${forged.length === 1 ? "" : "s"} forged`
        : `Batch complete — ${forged.length} cases, avg verify ${avg.toFixed(1)}ms`;
      toast(cancelRef.current ? "warn" : "success", msg);
      pushLog("BATCH", cancelRef.current ? "warn" : "ok", `${msg} · all unique`);
    }
  }, [run.running, forging, batchSize, makeSeed, pushLog, resetPlaytest, toast]);

  /* ---------- boot: forge a first case ---------- */
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    if (batchRef.current.length === 0) {
      pushLog("SYS", "info", "Case Forge online — verifier armed, narrative engine loaded");
      void forgeSingle();
    } else {
      setCurrentUid(batchRef.current[batchRef.current.length - 1].uid);
      pushLog("SYS", "info", `restored ${batchRef.current.length} case${batchRef.current.length === 1 ? "" : "s"} from the archive`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- keyboard ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || e.metaKey || e.ctrlKey) return;
      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        void forgeSingle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [forgeSingle]);

  /* ---------- playtest logic ---------- */
  const current = useMemo(
    () => batch.find((b) => b.uid === currentUid) ?? batch[batch.length - 1] ?? null,
    [batch, currentUid]
  );

  const conflicts = useMemo(() => {
    const set = new Set<number>();
    if (!current || !playtest) return set;
    const valueAt = (i: number) => current.puzzle[i] !== 0 ? current.puzzle[i] : entered[i];
    for (let i = 0; i < 81; i++) {
      const v = valueAt(i);
      if (v === 0) continue;
      for (const p of peersOf(i)) {
        if (valueAt(p) === v) {
          set.add(i);
          set.add(p);
        }
      }
    }
    return set;
  }, [current, entered, playtest]);

  useEffect(() => {
    if (!current || !playtest || cracked) return;
    const valueAt = (i: number) => (current.puzzle[i] !== 0 ? current.puzzle[i] : entered[i]);
    const full = current.puzzle.every((v, i) => v !== 0 || entered[i] !== 0);
    if (full && conflicts.size === 0) {
      const correct = current.puzzle.every((v, i) => v !== 0 || entered[i] === current.solution[i]);
      if (correct) {
        setCracked(true);
        toast("success", `Case № ${String(current.caseNumber).padStart(3, "0")} cracked — the letters name the killer`);
        pushLog("PLAYTEST", "ok", `CASE-${String(current.caseNumber).padStart(3, "0")} solved by hand in the browser`);
      }
    }
    void valueAt;
  }, [entered, conflicts, current, playtest, cracked, toast, pushLog]);

  const placeDigit = useCallback(
    (d: number) => {
      if (!current || selectedCell === null) return;
      if (current.puzzle[selectedCell] !== 0) return;
      setEntered((e) => {
        const n = [...e];
        n[selectedCell] = d;
        return n;
      });
    },
    [current, selectedCell]
  );

  const playtestBridge: PlaytestBridge | undefined = useMemo(() => {
    if (!playtest) return undefined;
    return {
      entered,
      conflicts,
      selected: selectedCell,
      onCellClick: (i) => setSelectedCell(i),
    };
  }, [playtest, entered, conflicts, selectedCell]);

  /* ---------- exports ---------- */
  const exportJSON = () => {
    download("caseforge-batch.json", batchToJSON(batch, settings.bookTitle), "application/json");
    toast("success", `Exported ${batch.length} case${batch.length === 1 ? "" : "s"} as JSON`);
    pushLog("EXPORT", "info", `${batch.length} cases → caseforge-batch.json`);
  };
  const exportCSV = () => {
    download("caseforge-batch.csv", batchToCSV(batch), "text/csv");
    toast("success", `Exported ${batch.length} case${batch.length === 1 ? "" : "s"} as CSV`);
    pushLog("EXPORT", "info", `${batch.length} cases → caseforge-batch.csv`);
  };

  const printBook = () => {
    setPrintScope("book");
    setTimeout(() => window.print(), 60);
    pushLog("PRINT", "info", `print book queued · ${batch.length} case${batch.length === 1 ? "" : "s"}${includeSolutions ? " + solutions" : ""}`);
  };
  const printCurrent = () => {
    if (!current) return;
    setPrintScope(current.uid);
    setTimeout(() => window.print(), 60);
  };

  const deleteCase = (uid: string) => {
    const pc = batch.find((b) => b.uid === uid);
    setBatch((b) => b.filter((x) => x.uid !== uid));
    if (currentUid === uid) setCurrentUid(null);
    if (pc) {
      pushLog("TRASH", "warn", `CASE-${String(pc.caseNumber).padStart(3, "0")} shredded`);
      toast("warn", `Case № ${String(pc.caseNumber).padStart(3, "0")} removed`);
    }
  };

  const clearBatch = () => {
    setBatch([]);
    setCurrentUid(null);
    resetPlaytest();
    pushLog("TRASH", "warn", "batch queue cleared");
    toast("warn", "Batch queue cleared");
  };

  /* ---------- stats ---------- */
  const avgMs = batch.length > 0 ? (batch.reduce((a, p) => a + p.genMs, 0) / batch.length).toFixed(1) : "—";
  const themeName = THEMES.find((t) => t.id === settings.theme)?.name ?? "";

  /* ---------- print pages ---------- */
  const printCases = printScope === "book" ? batch : batch.filter((b) => b.uid === printScope);

  return (
    <>
      {/* ============================== APP SHELL ============================== */}
      <div id="app-shell" className="desk-bg min-h-screen relative">
        {/* ambient layers */}
        <div className="desk-lines fixed inset-0 pointer-events-none" />
        <div className="noise-layer fixed inset-0 pointer-events-none" />
        <IconFingerprint className="fixed -bottom-24 -right-24 w-[480px] h-[480px] text-ink-700/25 pointer-events-none rotate-12" />
        <div className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blood-600 via-brass-500 to-chalk-600 z-50" />

        {/* header */}
        <header className="sticky top-0 z-40 border-b border-ink-700 bg-ink-900/90 backdrop-blur-sm">
          <div className="max-w-[1720px] mx-auto px-5 h-[58px] flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brass-400 to-brass-600 text-ink-950 flex items-center justify-center shadow-[0_4px_14px_rgba(214,151,50,0.35)]">
                <IconFingerprint className="w-5.5 h-5.5" />
              </div>
              <div className="leading-none">
                <div className="font-display font-extrabold text-[19px] tracking-tight text-paper-50">
                  CASE<span className="text-blood-400">FORGE</span>
                </div>
                <div className="font-mono text-[8.5px] uppercase tracking-[0.28em] text-ink-400 mt-1">
                  murder-mystery sudoku studio
                </div>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-5 ml-4 font-mono text-[10px] uppercase tracking-wider text-ink-400">
              <span>
                forged <b className="text-paper-50 text-[13px] ml-1">{batch.length}</b>
              </span>
              <span className="w-px h-4 bg-ink-700" />
              <span>
                avg verify <b className="text-brass-300 ml-1">{avgMs}ms</b>
              </span>
              <span className="w-px h-4 bg-ink-700" />
              <span>
                unique rate <b className="text-moss-400 ml-1">{batch.length > 0 ? "100%" : "—"}</b>
              </span>
            </div>

            <div className="ml-auto hidden md:flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-ink-400">
              <span className="px-2 py-1 rounded border border-ink-700 bg-ink-850">
                recipe · {themeName} · {settings.targetGivens} givens · {settings.symmetric ? "sym" : "free"} · {settings.evidenceK}L
              </span>
              <span className="px-2 py-1 rounded border border-ink-700 bg-ink-850 text-ink-500">v1.0</span>
            </div>
          </div>
        </header>

        {/* main */}
        <main className="max-w-[1720px] mx-auto px-5 py-6 grid gap-5 xl:grid-cols-[330px_minmax(0,1fr)_360px] lg:grid-cols-[310px_minmax(0,1fr)] items-start">
          {/* left: recipe */}
          <div className="order-2 lg:order-1">
            <Controls
              settings={settings}
              patch={patch}
              onForge={() => void forgeSingle()}
              forging={forging}
              nextCaseNo={nextCaseNo}
            />
          </div>

          {/* center: preview */}
          <div className="order-1 lg:order-2 min-w-0 anim-rise">
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <div className="flex rounded-lg bg-ink-900 border border-ink-700 p-0.5 gap-0.5">
                {(
                  [
                    { id: "puzzle", label: "Puzzle Page" },
                    { id: "solution", label: "Solution" },
                    { id: "brief", label: "Case Brief" },
                  ] as { id: Tab; label: string }[]
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-md text-[12.5px] font-semibold transition-all",
                      tab === t.id ? "bg-ink-600 text-paper-50 shadow-sm" : "text-ink-300 hover:text-ink-100"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => void reforgeCurrent()}
                  disabled={!current || forging}
                  title="Re-forge this case number with a fresh grid"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-ink-600 text-ink-200 text-[12px] font-semibold hover:border-brass-500/60 hover:text-brass-300 disabled:opacity-35 active:scale-95 transition-all"
                >
                  <IconRedo className={cn("w-3.5 h-3.5", forging && "animate-spin")} />
                  Re-forge
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPlaytest((p) => !p);
                    resetPlaytest();
                  }}
                  disabled={!current}
                  title="Play-test the grid in the browser"
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] font-semibold active:scale-95 transition-all disabled:opacity-35",
                    playtest
                      ? "border-moss-500/70 bg-moss-500/15 text-moss-300"
                      : "border-ink-600 text-ink-200 hover:border-moss-500/60 hover:text-moss-300"
                  )}
                >
                  <IconPlay className="w-3.5 h-3.5" />
                  {playtest ? "Exit playtest" : "Playtest"}
                </button>
                <button
                  type="button"
                  onClick={printCurrent}
                  disabled={!current}
                  title="Print only this case (puzzle + solution)"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-ink-600 text-ink-200 text-[12px] font-semibold hover:border-chalk-500/60 hover:text-chalk-300 disabled:opacity-35 active:scale-95 transition-all"
                >
                  <IconPrint className="w-3.5 h-3.5" />
                  Print case
                </button>
              </div>
            </div>

            {current ? (
              <div className="max-w-[640px] mx-auto">
                <div key={current.uid + tab} className="anim-fade">
                  {tab === "puzzle" && (
                    <PuzzlePage
                      pc={current}
                      bookTitle={settings.bookTitle}
                      byline={settings.byline}
                      pageNumber={current.caseNumber * 2 - 1}
                      playtest={playtestBridge}
                    />
                  )}
                  {tab === "solution" && (
                    <SolutionPage
                      pc={current}
                      bookTitle={settings.bookTitle}
                      byline={settings.byline}
                      pageNumber={current.caseNumber * 2}
                    />
                  )}
                  {tab === "brief" && <CaseBrief pc={current} />}
                </div>

                {/* verify strip */}
                <div className="mt-3 flex items-center justify-center gap-3 flex-wrap font-mono text-[10.5px] uppercase tracking-wider text-ink-400">
                  <span className="flex items-center gap-1.5 text-moss-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-moss-400" /> unique solution proven
                  </span>
                  <span>{current.givens} givens</span>
                  <span>
                    forged in <b className="text-ink-200">{current.genMs}ms</b>
                  </span>
                  <span>
                    singles {current.analysis.nakedSingles + current.analysis.hiddenSingles}
                    {current.analysis.solvedWithSingles ? "" : " · advanced required"}
                  </span>
                  {cracked && playtest && <span className="text-brass-300">★ cracked by hand</span>}
                </div>

                {/* playtest pad */}
                {playtest && tab === "puzzle" && (
                  <div className="mt-4 panel p-3.5 anim-rise">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="panel-title">Playtest Console</span>
                      <span className="font-mono text-[10px] text-ink-400">
                        {selectedCell === null ? "select an empty cell" : `cell ${selectedCell + 1} · R${Math.floor(selectedCell / 9) + 1}C${(selectedCell % 9) + 1}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => placeDigit(d)}
                          disabled={selectedCell === null}
                          className="w-9 h-9 rounded-lg border border-ink-600 bg-ink-900 font-display font-bold text-[16px] text-ink-100 hover:border-brass-500/70 hover:text-brass-300 active:scale-90 disabled:opacity-30 transition-all"
                        >
                          {d}
                        </button>
                      ))}
                      <span className="w-px h-7 bg-ink-700 mx-1" />
                      <button
                        type="button"
                        onClick={() => selectedCell !== null && setEntered((e) => { const n = [...e]; n[selectedCell] = 0; return n; })}
                        title="Erase cell"
                        className="w-9 h-9 rounded-lg border border-ink-600 bg-ink-900 text-ink-300 hover:text-blood-300 hover:border-blood-500/60 active:scale-90 transition-all flex items-center justify-center"
                      >
                        <IconEraser className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => current && setEntered(current.solution.map((v, i) => (current.puzzle[i] !== 0 ? 0 : v)))}
                        title="Fill the solution (peek)"
                        className="w-9 h-9 rounded-lg border border-ink-600 bg-ink-900 text-ink-300 hover:text-chalk-300 hover:border-chalk-500/60 active:scale-90 transition-all flex items-center justify-center"
                      >
                        <IconEye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={resetPlaytest}
                        title="Clear all entries"
                        className="w-9 h-9 rounded-lg border border-ink-600 bg-ink-900 text-ink-300 hover:text-blood-300 hover:border-blood-500/60 active:scale-90 transition-all flex items-center justify-center"
                      >
                        <IconX className="w-4 h-4" />
                      </button>
                      <span className="ml-auto font-mono text-[10px] text-ink-500">
                        {conflicts.size > 0 ? (
                          <span className="text-blood-300">{conflicts.size} conflicted cells</span>
                        ) : cracked ? (
                          <span className="text-brass-300">case cracked ✓</span>
                        ) : (
                          `${entered.filter((v) => v !== 0).length} / ${81 - current.givens} placed`
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="max-w-[640px] mx-auto panel p-14 text-center anim-fade">
                <IconFingerprint className="w-12 h-12 mx-auto text-ink-600" />
                <h3 className="font-display font-bold text-[20px] text-ink-100 mt-4">The desk is clear</h3>
                <p className="text-[13px] text-ink-400 mt-1.5 max-w-sm mx-auto">
                  Forge a case to open your first investigation, or run a batch to fill the queue.
                </p>
                <button
                  type="button"
                  onClick={() => void forgeSingle()}
                  className="mt-5 px-5 py-2.5 rounded-lg bg-blood-500 text-paper-50 font-display font-bold hover:bg-blood-400 active:scale-95 transition-all"
                >
                  Forge the first case
                </button>
              </div>
            )}
          </div>

          {/* right: queue + console */}
          <div className="order-3 xl:col-auto lg:col-span-2 xl:col-span-1">
            <BatchPanel
              batch={batch}
              currentUid={current?.uid ?? null}
              onSelect={(uid) => {
                setCurrentUid(uid);
                setPlaytest(false);
                resetPlaytest();
                setTab("puzzle");
              }}
              onDelete={deleteCase}
              onClear={clearBatch}
              run={run}
              batchSize={batchSize}
              onBatchSize={setBatchSize}
              includeSolutions={includeSolutions}
              onIncludeSolutions={setIncludeSolutions}
              onRunBatch={() => void runBatch()}
              onCancel={() => {
                cancelRef.current = true;
              }}
              onExportJSON={exportJSON}
              onExportCSV={exportCSV}
              onPrint={printBook}
              log={log}
            />
          </div>
        </main>

        <footer className="max-w-[1720px] mx-auto px-5 pb-6 pt-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-ink-500">
          <span>case forge · story-sudoku foundry for kdp publishers</span>
          <span>every grid proven unique · seeds reproducible · pages print-ready</span>
        </footer>

        <ToastHost toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
      </div>

      {/* ============================== PRINT BOOK ============================== */}
      <div id="print-book">
        {printCases.length > 1 && printScope === "book" && (
          <div className="print-page bg-white text-[#241f17] flex flex-col items-center justify-center text-center px-16" style={{ fontFamily: "var(--font-display)" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "10pt", letterSpacing: "0.3em", textTransform: "uppercase", color: "#5d5442" }}>
              A Case Forge casebook
            </div>
            <h1 style={{ fontSize: "42pt", fontWeight: 800, lineHeight: 1.05, margin: "18pt 0 10pt" }}>
              {settings.bookTitle || "Untitled Case Book"}
            </h1>
            <div style={{ fontFamily: "var(--font-type)", fontSize: "13pt", color: "#5d5442" }}>
              {printCases.length} murder-mystery sudoku cases · solved grids reveal the killer, weapon and scene
            </div>
            <div style={{ marginTop: "28pt", fontFamily: "var(--font-mono)", fontSize: "10pt", color: "#5d5442" }}>
              {settings.byline}
            </div>
          </div>
        )}
        {printCases.map((pc, idx) => (
          <div key={pc.uid}>
            <PuzzlePage
              pc={pc}
              bookTitle={settings.bookTitle}
              byline={settings.byline}
              pageNumber={idx * 2 + 1}
              forPrint
            />
            {includeSolutions && (
              <SolutionPage
                pc={pc}
                bookTitle={settings.bookTitle}
                byline={settings.byline}
                pageNumber={idx * 2 + 2}
                forPrint
              />
            )}
          </div>
        ))}
      </div>
    </>
  );
}
