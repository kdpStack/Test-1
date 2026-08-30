import type { ReactNode } from "react";
import type { TierId } from "../lib/sudoku";
import { TIERS } from "../lib/sudoku";
import { IconCheck, IconX } from "./icons";

export const cn = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(" ");

/* ---------- section label ---------- */
export function SectionLabel({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <span className="panel-title">{children}</span>
      {right}
    </div>
  );
}

/* ---------- segmented control ---------- */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex rounded-lg bg-ink-900 border border-ink-700 p-0.5 gap-0.5", className)}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "flex-1 px-2 py-1.5 rounded-md text-[12px] font-semibold font-mono tracking-wide transition-all duration-150",
            value === o.value
              ? "bg-ink-600 text-paper-50 shadow-sm"
              : "text-ink-300 hover:text-ink-100 hover:bg-ink-800"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- toggle ---------- */
export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between gap-3 py-1 group"
    >
      <span className="text-left">
        <span className="block text-[13px] font-medium text-ink-100">{label}</span>
        {hint && <span className="block text-[11px] text-ink-400">{hint}</span>}
      </span>
      <span
        className={cn(
          "relative shrink-0 w-9 h-5 rounded-full border transition-colors duration-200",
          checked ? "bg-brass-500 border-brass-400" : "bg-ink-800 border-ink-600"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 w-3.5 h-3.5 rounded-full bg-paper-50 transition-all duration-200",
            checked ? "left-[18px]" : "left-0.5"
          )}
        />
      </span>
    </button>
  );
}

/* ---------- stepper ---------- */
export function Stepper({
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  return (
    <div className="flex items-center rounded-lg bg-ink-900 border border-ink-700 overflow-hidden">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - step))}
        className="px-2.5 py-1.5 text-ink-300 hover:text-paper-50 hover:bg-ink-700 transition-colors"
        aria-label="decrease"
      >
        −
      </button>
      <span className="flex-1 text-center font-mono text-[13px] font-semibold text-ink-100 tabular-nums">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + step))}
        className="px-2.5 py-1.5 text-ink-300 hover:text-paper-50 hover:bg-ink-700 transition-colors"
        aria-label="increase"
      >
        +
      </button>
    </div>
  );
}

/* ---------- tier chip ---------- */
const TIER_STYLE: Record<TierId, string> = {
  rookie: "text-moss-300 border-moss-500/50 bg-moss-500/10",
  classic: "text-chalk-300 border-chalk-500/50 bg-chalk-500/10",
  hardboiled: "text-brass-300 border-brass-500/50 bg-brass-500/10",
  noir: "text-blood-300 border-blood-500/50 bg-blood-500/10",
};

export function TierChip({ tier, className }: { tier: TierId; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-mono font-semibold uppercase tracking-wider",
        TIER_STYLE[tier],
        className
      )}
    >
      {TIERS[tier].label}
    </span>
  );
}

/* ---------- toasts ---------- */
export type ToastKind = "success" | "info" | "warn";
export interface ToastItem {
  id: number;
  kind: ToastKind;
  msg: string;
}

const TOAST_BORDER: Record<ToastKind, string> = {
  success: "border-l-moss-400",
  info: "border-l-brass-400",
  warn: "border-l-blood-400",
};

export function ToastHost({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div className="fixed bottom-5 right-5 z-[90] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "anim-toast pointer-events-auto flex items-center gap-3 pl-3 pr-2 py-2.5 rounded-lg border border-ink-600 border-l-4 bg-ink-800/95 shadow-[0_12px_30px_rgba(0,0,0,0.5)] max-w-xs",
            TOAST_BORDER[t.kind]
          )}
        >
          {t.kind === "success" && <IconCheck className="w-4 h-4 text-moss-400 shrink-0" />}
          {t.kind === "info" && <IconCheck className="w-4 h-4 text-brass-400 shrink-0" />}
          {t.kind === "warn" && <IconX className="w-4 h-4 text-blood-400 shrink-0" />}
          <span className="text-[13px] text-ink-100 leading-snug">{t.msg}</span>
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            className="ml-1 p-1 text-ink-400 hover:text-ink-100 transition-colors"
            aria-label="dismiss"
          >
            <IconX className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
