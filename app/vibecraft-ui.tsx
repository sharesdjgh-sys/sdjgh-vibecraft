"use client";

import { useEffect, useRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Check, Cloud, Loader2, X } from "lucide-react";
import {
  phaseMetadata,
  phaseOrder,
  type PhaseId,
  type PhaseProgress,
} from "@/lib/vibecraft-navigation";

export function CraftMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 44 44"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="44" height="44" rx="14" fill="rgb(var(--color-signal))" />
      <path d="M12.5 14.5h12l7 7v9h-19z" fill="none" stroke="white" strokeWidth="2.2" />
      <path d="M24.5 14.5v7h7M17 26h9m-3-3 3 3-3 3" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
    </svg>
  );
}

export function BrandLockup({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <CraftMark className={compact ? "h-8 w-8" : "h-10 w-10"} />
      <div>
        <p className={`${compact ? "text-base" : "text-xl"} font-extrabold tracking-[-0.035em] text-ink`}>
          VibeCraft
        </p>
        {!compact ? <p className="text-[11px] font-semibold text-muted">아이디어를 완성까지</p> : null}
      </div>
    </div>
  );
}

export function ProgressBar({
  label = "전체 진행률",
  value,
}: {
  label?: string;
  value: number;
}) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted">
        <span>{label}</span>
        <span className="font-mono font-semibold text-ink">{safeValue}%</span>
      </div>
      <div
        aria-label={label}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={safeValue}
        className="h-2 overflow-hidden rounded-full bg-line"
        role="progressbar"
      >
        <div className="h-full rounded-full bg-signal shadow-[0_0_14px_rgba(207,92,57,.32)] transition-[width] duration-500" style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}

export function PhaseRail({
  activePhase,
  onSelect,
  overallProgress,
  progress,
}: {
  activePhase: PhaseId;
  onSelect: (phase: PhaseId) => void;
  overallProgress: number;
  progress: Record<PhaseId, PhaseProgress>;
}) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[280px] flex-col border-r border-line bg-surface/85 backdrop-blur-xl lg:flex">
      <div className="px-6 pb-7 pt-8">
        <BrandLockup />
      </div>
      <nav aria-label="프로젝트 진행 단계" className="min-h-0 flex-1 overflow-y-auto px-4">
        <p className="px-3 pb-4 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-muted">
          Mission Route
        </p>
        <ol className="space-y-1">
          {phaseOrder.map((phaseId, index) => {
            const phase = phaseMetadata[phaseId];
            const active = activePhase === phaseId;
            const done = progress[phaseId].percent === 100;
            return (
              <li className="relative" key={phaseId}>
                {index < phaseOrder.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 left-[27px] top-12 w-px bg-line"
                  />
                ) : null}
                <button
                  aria-current={active ? "step" : undefined}
                  className={`relative flex w-full items-start gap-3 rounded-2xl px-3 py-3.5 text-left transition-all duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ${
                    active
                      ? "bg-signal-soft ring-1 ring-signal/20 shadow-soft"
                      : "hover:bg-canvas"
                  }`}
                  onClick={() => onSelect(phaseId)}
                  type="button"
                >
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-full font-mono text-[11px] font-bold transition-colors duration-300 ${
                      active
                        ? "bg-signal text-white shadow-[0_6px_18px_rgba(207,92,57,.35)]"
                        : done
                          ? "border border-success/40 bg-success/15 text-success"
                          : "border border-line bg-canvas text-muted"
                    }`}
                  >
                    {done && !active ? <Check className="h-3.5 w-3.5" /> : phase.step}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm font-bold ${active ? "text-ink" : done ? "text-success" : "text-muted"}`}>
                      {phase.label}
                    </span>
                    <span className="mt-0.5 block font-mono text-[10px] font-semibold text-muted">
                      {progress[phaseId].total > 0
                        ? `${progress[phaseId].completed}/${progress[phaseId].total} · ${progress[phaseId].percent}%`
                        : `${progress[phaseId].percent}%`}
                    </span>
                  </span>
                  {active ? (
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-signal shadow-[0_0_12px_currentColor]" />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
      <div className="border-t border-line px-6 py-6">
        <ProgressBar value={overallProgress} />
        <div className="mt-5 flex items-center gap-2 text-[11px] font-semibold text-success" aria-live="polite">
          <Cloud className="h-4 w-4" />
          자동 저장됐어요
        </div>
      </div>
    </aside>
  );
}

export function MobilePhaseNav({
  activePhase,
  onSelect,
  overallProgress,
  progress,
}: {
  activePhase: PhaseId;
  onSelect: (phase: PhaseId) => void;
  overallProgress: number;
  progress: Record<PhaseId, PhaseProgress>;
}) {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-surface/90 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between">
          <BrandLockup compact />
          <span className="font-mono text-[10px] font-semibold text-muted">
            전체 <strong className="text-ink">{overallProgress}%</strong>
          </span>
        </div>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-signal shadow-[0_0_10px_rgba(207,92,57,.35)] transition-[width] duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </header>
      <nav
        aria-label="프로젝트 진행 단계"
        className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 grid grid-cols-4 gap-1 rounded-2xl border border-line bg-surface/95 p-1.5 shadow-drawer backdrop-blur-xl lg:hidden"
      >
        {phaseOrder.map((phaseId) => {
          const phase = phaseMetadata[phaseId];
          const active = activePhase === phaseId;
          const done = progress[phaseId].percent === 100;
          return (
            <button
              aria-current={active ? "step" : undefined}
              className={`flex min-h-12 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-center transition-all duration-300 ${
                active
                  ? "bg-signal-soft text-ink shadow-soft"
                  : done
                    ? "text-success"
                    : "text-muted"
              }`}
              key={phaseId}
              onClick={() => onSelect(phaseId)}
              type="button"
            >
              <span
                className={`font-mono text-[9px] font-bold ${active ? "text-signal-ink" : ""}`}
              >
                {done && !active ? <Check className="h-3 w-3" /> : phase.step}
              </span>
              <span className="block w-full truncate text-[11px] font-bold">{phase.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: LucideIcon;
  loading?: boolean;
};

export function PrimaryButton({
  children,
  className = "",
  icon: Icon = ArrowRight,
  loading = false,
  ...props
}: ActionButtonProps) {
  return (
    <button className={`action-button action-button--primary group ${className}`} {...props}>
      <span>{children}</span>
      <span className="-mr-2 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/20 transition-transform duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5">
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : Icon ? (
          <Icon className="h-3.5 w-3.5" />
        ) : null}
      </span>
    </button>
  );
}

export function SecondaryButton({
  children,
  className = "",
  icon: Icon,
  loading = false,
  ...props
}: ActionButtonProps) {
  return (
    <button className={`action-button action-button--secondary ${className}`} {...props}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon ? <Icon className="h-4 w-4" /> : null}
      <span>{children}</span>
    </button>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="inline-flex min-h-7 items-center gap-2 rounded-full border border-signal/20 bg-signal-soft px-3.5 text-[11px] font-bold uppercase tracking-[0.15em] text-signal-ink shadow-sm">
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-signal shadow-[0_0_8px_currentColor]" />
      {children}
    </p>
  );
}

export function SectionHeading({
  action,
  description,
  title,
}: {
  action?: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="type-title text-ink">{title}</h2>
        {description ? <p className="type-body mt-2 max-w-2xl text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function ResourceDrawer({
  children,
  eyebrow,
  onClose,
  open,
  title,
}: {
  children: ReactNode;
  eyebrow: string;
  onClose: () => void;
  open: boolean;
  title: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="도움 도구 닫기"
        className="absolute inset-0 bg-ink/35 backdrop-blur-[2px]"
        onClick={onClose}
        type="button"
      />
      <div
        aria-labelledby="resource-drawer-title"
        aria-modal="true"
        className="absolute bottom-0 right-0 flex max-h-[92dvh] w-full flex-col rounded-t-[1.5rem] border border-line bg-surface shadow-drawer sm:inset-y-0 sm:max-h-none sm:max-w-[520px] sm:rounded-none sm:rounded-l-[1.5rem]"
        ref={panelRef}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-5 sm:px-7">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-signal-ink">{eyebrow}</p>
            <h2 className="type-title mt-1 text-ink" id="resource-drawer-title">
              {title}
            </h2>
          </div>
          <button className="icon-button" onClick={onClose} ref={closeRef} type="button" aria-label="닫기">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">{children}</div>
      </div>
    </div>
  );
}

export function InlineNotice({ children }: { children: ReactNode }) {
  return (
    <div aria-live="polite" className="mb-6 rounded-xl border border-signal/20 bg-signal-soft px-4 py-3 text-sm leading-6 text-ink">
      {children}
    </div>
  );
}
