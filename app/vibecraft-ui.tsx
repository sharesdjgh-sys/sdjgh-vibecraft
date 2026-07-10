"use client";

import { useEffect, useRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Check, Loader2, X } from "lucide-react";
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
      <path d="M6.5 5.5h20l11 11v22h-31z" fill="currentColor" />
      <path d="M26.5 5.5v11h11" stroke="rgb(var(--color-canvas))" strokeWidth="2" />
      <path d="M13 28h16" stroke="rgb(var(--color-signal))" strokeWidth="3" />
      <path d="m25 23 5 5-5 5" stroke="rgb(var(--color-signal))" strokeLinecap="square" strokeWidth="3" />
    </svg>
  );
}

export function BrandLockup({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <CraftMark className={compact ? "h-8 w-8" : "h-10 w-10"} />
      <div>
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
          Plan → Build
        </p>
        <p className={`${compact ? "text-base" : "text-xl"} font-extrabold tracking-[-0.035em] text-ink`}>
          VibeCraft
        </p>
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
        className="h-1.5 overflow-hidden bg-line"
        role="progressbar"
      >
        <div className="h-full bg-signal transition-[width] duration-300" style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}

export function PhaseRail({
  activePhase,
  onSelect,
  progress,
}: {
  activePhase: PhaseId;
  onSelect: (phase: PhaseId) => void;
  progress: Record<PhaseId, PhaseProgress>;
}) {
  return (
    <aside className="hidden w-[232px] shrink-0 border-r border-line bg-canvas lg:flex lg:min-h-screen lg:flex-col">
      <div className="sticky top-0 flex h-screen flex-col px-5 py-6">
        <BrandLockup />
        <nav aria-label="프로젝트 진행 단계" className="mt-12 space-y-1">
          {phaseOrder.map((phaseId) => {
            const phase = phaseMetadata[phaseId];
            const active = activePhase === phaseId;
            const done = progress[phaseId].percent === 100;
            return (
              <button
                aria-current={active ? "step" : undefined}
                className={`group relative flex w-full gap-3 px-2 py-3 text-left transition-colors ${
                  active ? "text-ink" : "text-muted hover:text-ink"
                }`}
                key={phaseId}
                onClick={() => onSelect(phaseId)}
                type="button"
              >
                <span
                  className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center border font-mono text-[10px] font-semibold ${
                    active
                      ? "border-ink bg-ink text-canvas"
                      : done
                        ? "border-success bg-success text-white"
                        : "border-line bg-surface text-muted"
                  }`}
                >
                  {done && !active ? <Check className="h-3.5 w-3.5" /> : phase.step}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold">{phase.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-muted">{phase.outcome}</span>
                  <span className="mt-2 block h-px w-full overflow-hidden bg-line">
                    <span
                      className={`block h-full ${active ? "bg-signal" : "bg-ink/35"}`}
                      style={{ width: `${progress[phaseId].percent}%` }}
                    />
                  </span>
                </span>
              </button>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-line pt-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">작업 원칙</p>
          <p className="mt-2 text-xs leading-5 text-muted">한 번에 하나씩. 실제로 끝낸 작업만 진행률에 반영됩니다.</p>
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
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/95 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur lg:hidden">
      <div className="flex items-center justify-between">
        <BrandLockup compact />
        <span className="font-mono text-[10px] font-semibold text-muted">
          전체 <strong className="text-ink">{overallProgress}%</strong>
        </span>
      </div>
      <nav aria-label="프로젝트 진행 단계" className="mt-3 grid grid-cols-4 gap-1">
        {phaseOrder.map((phaseId) => {
          const phase = phaseMetadata[phaseId];
          const active = activePhase === phaseId;
          const done = progress[phaseId].percent === 100;
          return (
            <button
              aria-current={active ? "step" : undefined}
              className={`border-t-2 px-1 pt-2 text-left text-[11px] font-bold transition-colors ${
                active ? "border-signal text-ink" : done ? "border-success text-muted" : "border-line text-muted"
              }`}
              key={phaseId}
              onClick={() => onSelect(phaseId)}
              type="button"
            >
              <span className="font-mono text-[9px] font-medium">{phase.step}</span>
              <span className="block truncate">{phase.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="mt-3 h-px bg-line">
        <div className="h-full bg-signal" style={{ width: `${overallProgress}%` }} />
      </div>
    </header>
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
    <button className={`action-button action-button--primary ${className}`} {...props}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon ? <Icon className="h-4 w-4" /> : null}
      <span>{children}</span>
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
    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-signal-ink">{children}</p>
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
    <div className="flex flex-col gap-3 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-2xl font-extrabold tracking-[-0.035em] text-ink">{title}</h2>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p> : null}
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
        className="absolute inset-y-0 right-0 flex w-full max-w-[520px] flex-col border-l border-line bg-surface shadow-drawer"
        ref={panelRef}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-5 sm:px-7">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-signal-ink">{eyebrow}</p>
            <h2 className="mt-1 text-xl font-extrabold tracking-[-0.03em] text-ink" id="resource-drawer-title">
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
    <div aria-live="polite" className="mb-6 border-l-2 border-signal bg-signal-soft px-4 py-3 text-sm leading-6 text-ink">
      {children}
    </div>
  );
}
