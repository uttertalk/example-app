import type { ReactNode } from "react";

export type Tone = "good" | "warn" | "bad" | "info" | "neutral";

const TONES: Record<Tone, string> = {
  good: "bg-good-soft text-good",
  warn: "bg-warn-soft text-warn",
  bad: "bg-bad-soft text-bad",
  info: "bg-info-soft text-info",
  neutral: "bg-panel-2 text-muted",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex h-[22px] items-center rounded-[5px] px-2 text-[12px] font-medium ${TONES[tone]}`}>
      {children}
    </span>
  );
}

export const STATUS_TONE: Record<string, Tone> = {
  new: "info",
  contacted: "neutral",
  qualified: "good",
  unqualified: "bad",
};

export const STAGE_TONE: Record<string, Tone> = {
  discovery: "neutral",
  proposal: "info",
  negotiation: "warn",
  won: "good",
  lost: "bad",
};

export function PageHeader({ title, sub, actions }: { title: string; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line bg-panel px-6 py-5">
      <div>
        <h1 className="text-[20px] font-semibold tracking-[-0.01em]">{title}</h1>
        {sub && <p className="mt-1 text-[13px] text-muted">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Avatar({ name, size = 24 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-panel-2 font-medium text-muted"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-hidden
    >
      {initials}
    </span>
  );
}
