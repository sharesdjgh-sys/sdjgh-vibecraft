"use client";

import { useEffect, useRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Check, Cloud, Loader2, Sparkles, X } from "lucide-react";
import {
  phaseMetadata,
  phaseOrder,
  type PhaseId,
  type PhaseProgress,
} from "@/lib/vibecraft-navigation";
import vibecraftLogo from "./vibecraft-logo.png";

export function CraftMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <Image
      alt=""
      aria-hidden="true"
      className={`${className} object-contain drop-shadow-[0_5px_10px_rgba(164,62,35,.18)]`}
      height={200}
      priority
      src={vibecraftLogo}
      width={214}
    />
  );
}

export function BrandLockup({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3.5">
      <CraftMark className={compact ? "h-9 w-9" : "h-11 w-11"} />
      <div>
        <p className={`${compact ? "text-xl" : "text-2xl"} font-sans font-black leading-none tracking-[-0.045em] text-signal-ink`}>
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
  progress,
}: {
  activePhase: PhaseId;
  onSelect: (phase: PhaseId) => void;
  progress: Record<PhaseId, PhaseProgress>;
}) {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-4 z-40 hidden px-6 lg:block">
      <div className="pointer-events-auto mx-auto grid h-14 max-w-[1240px] grid-cols-[180px_minmax(0,1fr)_180px] items-center gap-6 rounded-2xl border border-line/80 bg-surface/80 px-4 shadow-[0_18px_48px_rgba(104,66,47,.12)] backdrop-blur-xl">
        <BrandLockup compact />
        <nav aria-label="프로젝트 진행 단계" className="mx-auto flex items-center gap-1 rounded-full bg-canvas p-1">
          {phaseOrder.map((phaseId) => {
            const phase = phaseMetadata[phaseId];
            const active = activePhase === phaseId;
            const done = progress[phaseId].percent === 100;
            return (
              <button
                aria-current={active ? "step" : undefined}
                className={`flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-bold transition-all duration-300 ${
                  active ? "bg-surface text-ink shadow-[0_6px_20px_rgba(104,66,47,.12)]" : done ? "text-success" : "text-muted opacity-60 hover:opacity-100"
                }`}
                key={phaseId}
                onClick={() => onSelect(phaseId)}
                type="button"
              >
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-bold ${
                  active ? "bg-signal text-white" : done ? "bg-success text-white" : "bg-line text-muted"
                }`}>
                  {done && !active ? <Check className="h-3.5 w-3.5" /> : Number(phase.step)}
                </span>
                <span>{phase.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="flex items-center justify-end gap-2 text-xs font-semibold text-success" aria-live="polite">
          <Cloud className="h-4 w-4" />
          자동 저장됐어요
        </div>
      </div>
    </header>
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
    <header className="sticky top-0 z-30 overflow-hidden border-b border-line bg-surface/95 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur lg:hidden">
      <div className="flex items-center justify-between">
        <BrandLockup compact />
        <span className="font-mono text-[10px] font-semibold text-muted">
          전체 <strong className="text-ink">{overallProgress}%</strong>
        </span>
      </div>
      <nav aria-label="프로젝트 진행 단계" className="mt-3 grid grid-cols-4 gap-1 rounded-full bg-canvas p-1">
        {phaseOrder.map((phaseId) => {
          const phase = phaseMetadata[phaseId];
          const active = activePhase === phaseId;
          const done = progress[phaseId].percent === 100;
          return (
            <button
              aria-current={active ? "step" : undefined}
              className={`min-h-9 min-w-0 rounded-full px-1 text-center text-[11px] font-bold transition-colors ${
                active ? "bg-surface text-ink shadow-soft" : done ? "text-success" : "text-muted opacity-60"
              }`}
              key={phaseId}
              onClick={() => onSelect(phaseId)}
              type="button"
            >
              <span className="block truncate">{done && !active ? "✓ " : ""}{phase.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-signal transition-[width] duration-500" style={{ width: `${overallProgress}%` }} />
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
  icon: HeaderIcon = Sparkles,
  onClose,
  open,
  title,
  wide = false,
}: {
  children: ReactNode;
  eyebrow: string;
  icon?: LucideIcon;
  onClose: () => void;
  open: boolean;
  title: string;
  wide?: boolean;
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
    <div className="resource-drawer-layer fixed inset-0 z-50">
      <button
        aria-label="도움 도구 닫기"
        className="resource-drawer-backdrop absolute inset-0 bg-ink/35 backdrop-blur-[3px]"
        onClick={onClose}
        type="button"
      />
      <div
        aria-labelledby="resource-drawer-title"
        aria-modal="true"
        className={
          "resource-drawer absolute bottom-0 right-0 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[1.75rem] border border-line bg-surface shadow-drawer sm:inset-y-3 sm:max-h-none sm:rounded-[1.75rem_0_0_1.75rem] " +
          (wide ? "sm:max-w-[960px] xl:max-w-[1040px]" : "sm:max-w-[520px]")
        }
        ref={panelRef}
        role="dialog"
      >
        <span aria-hidden="true" className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-ink/15 sm:hidden" />
        <div className="resource-drawer-header relative flex items-start justify-between gap-4 border-b border-line px-5 pb-5 pt-4 sm:px-7 sm:py-7">
          <div className="relative flex min-w-0 items-start gap-3.5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[0.9rem] border border-signal/15 bg-signal-soft text-signal-ink shadow-[inset_0_1px_0_rgb(255_255_255/.8)]">
              <HeaderIcon className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-signal-ink">{eyebrow}</p>
              <h2 className="mt-0.5 text-[1.3rem] font-extrabold leading-tight tracking-[-0.025em] text-ink" id="resource-drawer-title">
                {title}
              </h2>
              <p className="mt-1 hidden text-xs leading-5 text-muted sm:block">
                작업 흐름을 유지한 채 필요한 도움을 바로 확인하세요.
              </p>
            </div>
          </div>
          <button className="icon-button relative shrink-0 bg-surface/80" onClick={onClose} ref={closeRef} type="button" aria-label="닫기">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="resource-drawer-body min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">{children}</div>
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
