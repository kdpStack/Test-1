import type { ThemeId } from "../lib/caseData";
import { THEMES } from "../lib/caseData";
import { TIERS } from "../lib/sudoku";
import type { TierId } from "../lib/sudoku";
import type { Settings } from "../App";
import { SectionLabel, Segmented, Stepper, Toggle, cn } from "./ui";
import {
  IconBolt, IconCards, IconDice, IconFrame, IconLock, IconManor, IconMask, IconMountain, IconShip, IconUnlock,
} from "./icons";

const THEME_ICONS: Record<ThemeId, (p: { className?: string }) => React.ReactElement> = {
  manor: IconManor,
  cruise: IconShip,
  casino: IconCards,
  theater: IconMask,
  alpine: IconMountain,
  gallery: IconFrame,
};

export function Controls({
  settings,
  patch,
  onForge,
  forging,
  nextCaseNo,
}: {
  settings: Settings;
  patch: (p: Partial<Settings>) => void;
  onForge: () => void;
  forging: boolean;
  nextCaseNo: number;
}) {
  const activeTier = (Object.keys(TIERS) as TierId[]).find(
    (t) => TIERS[t].givens === settings.targetGivens
  );

  return (
    <div className="panel p-4 space-y-5 anim-rise" style={{ animationDelay: "60ms" }}>
      <div className="flex items-center justify-between">
        <SectionLabel>Case Recipe</SectionLabel>
        <span className="font-mono text-[10px] text-ink-400">
          next <b className="text-brass-400">№ {String(nextCaseNo).padStart(3, "0")}</b>
        </span>
      </div>

      {/* theme */}
      <div>
        <SectionLabel>Setting</SectionLabel>
        <div className="grid grid-cols-2 gap-1.5">
          {THEMES.map((t) => {
            const I = THEME_ICONS[t.id];
            const active = settings.theme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => patch({ theme: t.id })}
                title={t.tagline}
                className={cn(
                  "flex items-center gap-2 px-2.5 py-2 rounded-lg border text-left transition-all duration-150",
                  active
                    ? "border-brass-500/70 bg-brass-500/10 text-brass-300 shadow-[0_0_0_1px_rgba(214,151,50,0.25)]"
                    : "border-ink-700 bg-ink-900/60 text-ink-300 hover:border-ink-500 hover:text-ink-100"
                )}
              >
                <I className="w-4 h-4 shrink-0" />
                <span className="text-[11.5px] font-semibold leading-tight">{t.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* difficulty */}
      <div>
        <SectionLabel
          right={
            activeTier ? (
              <span className="text-[10px] font-mono text-ink-400">{TIERS[activeTier].blurb}</span>
            ) : (
              <span className="text-[10px] font-mono text-brass-400">custom</span>
            )
          }
        >
          Difficulty
        </SectionLabel>
        <Segmented
          options={(Object.keys(TIERS) as TierId[]).map((t) => ({
            value: t,
            label: TIERS[t].label,
          }))}
          value={activeTier ?? "none"}
          onChange={(t) => {
            if (t !== "none") patch({ targetGivens: TIERS[t as TierId].givens });
          }}
        />
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11.5px] text-ink-300 font-medium">Clues on the grid</span>
            <span className="font-mono text-[12px] font-semibold text-brass-300 tabular-nums">
              {settings.targetGivens}
            </span>
          </div>
          <input
            type="range"
            min={22}
            max={40}
            value={settings.targetGivens}
            onChange={(e) => patch({ targetGivens: Number(e.target.value) })}
            style={{
              ["--fill" as string]: `${((settings.targetGivens - 22) / 18) * 100}%`,
            }}
          />
          <div className="flex justify-between font-mono text-[9px] text-ink-500 mt-1">
            <span>22 · fiendish</span>
            <span>40 · gentle</span>
          </div>
        </div>
      </div>

      {/* structure */}
      <div className="space-y-2.5">
        <SectionLabel>Grid & Evidence</SectionLabel>
        <Toggle
          checked={settings.symmetric}
          onChange={(v) => patch({ symmetric: v })}
          label="Symmetric clue layout"
          hint="180° rotational symmetry, classic book look"
        />
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11.5px] text-ink-300 font-medium">Answer word length</span>
            <span className="font-mono text-[10px] text-ink-400">marked cells per clue</span>
          </div>
          <Segmented
            options={[
              { value: 3, label: "3 letters" },
              { value: 4, label: "4 letters" },
              { value: 5, label: "5 letters" },
            ]}
            value={settings.evidenceK}
            onChange={(v) => patch({ evidenceK: v })}
          />
        </div>
      </div>

      {/* book + seed */}
      <div className="space-y-2.5">
        <SectionLabel>Book Imprint</SectionLabel>
        <div>
          <label className="text-[11px] text-ink-400 block mb-1">Book title (page footer)</label>
          <input
            className="field-input"
            value={settings.bookTitle}
            onChange={(e) => patch({ bookTitle: e.target.value })}
            placeholder="Murders by the Grid, Vol. 1"
          />
        </div>
        <div>
          <label className="text-[11px] text-ink-400 block mb-1">Byline</label>
          <input
            className="field-input"
            value={settings.byline}
            onChange={(e) => patch({ byline: e.target.value })}
            placeholder="Inkwell Puzzle Press"
          />
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
          <div>
            <label className="text-[11px] text-ink-400 block mb-1">First case №</label>
            <Stepper value={settings.caseStart} onChange={(v) => patch({ caseStart: v })} min={1} max={999} />
          </div>
          <div className="pt-5">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => patch({ seed: Math.floor(Math.random() * 0x7fffffff) })}
                title="Roll a new seed"
                className="p-2 rounded-lg border border-ink-600 bg-ink-900 text-ink-300 hover:text-brass-300 hover:border-brass-500/60 active:scale-95 transition-all"
              >
                <IconDice className="w-4 h-4" />
              </button>
              <div
                className={cn(
                  "px-2 py-1.5 rounded-lg border font-mono text-[11px] tabular-nums cursor-pointer",
                  settings.seedLocked
                    ? "border-brass-500/60 bg-brass-500/10 text-brass-300"
                    : "border-ink-600 bg-ink-900 text-ink-300"
                )}
                onClick={() => patch({ seedLocked: !settings.seedLocked })}
                title="Click to lock / unlock seed (locked seeds reproduce identical cases)"
              >
                <span className="flex items-center gap-1.5">
                  {settings.seedLocked ? (
                    <IconLock className="w-3 h-3 text-brass-400" />
                  ) : (
                    <IconUnlock className="w-3 h-3 text-ink-500" />
                  )}
                  {settings.seed}
                </span>
              </div>
            </div>
          </div>
        </div>
        {settings.seedLocked && (
          <p className="text-[10.5px] text-brass-300/80 font-mono anim-fade">
            Seed locked — batches derive seeds deterministically from it.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onForge}
        disabled={forging}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-3 rounded-lg font-display font-bold text-[15px] tracking-wide transition-all duration-150",
          "bg-blood-500 text-paper-50 shadow-[0_6px_20px_rgba(207,63,43,0.35)] hover:bg-blood-400 active:scale-[0.98]",
          forging && "opacity-60 cursor-wait"
        )}
      >
        {forging ? (
          <>
            <span className="w-4 h-4 border-2 border-paper-50/40 border-t-paper-50 rounded-full animate-spin" />
            Forging…
          </>
        ) : (
          <>
            <IconBolt className="w-4.5 h-4.5" />
            Forge Case № {String(nextCaseNo).padStart(3, "0")}
          </>
        )}
      </button>
      <p className="text-center font-mono text-[10px] text-ink-500 -mt-2">
        press <kbd className="px-1 py-0.5 rounded bg-ink-800 border border-ink-600 text-ink-300">R</kbd> to forge from anywhere
      </p>
    </div>
  );
}
