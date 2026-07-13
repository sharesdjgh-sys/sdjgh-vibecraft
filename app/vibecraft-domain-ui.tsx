import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Bot,
  Briefcase,
  Check,
  CheckCircle2,
  Circle,
  ClipboardList,
  FileText,
  GraduationCap,
  Hand,
  Lightbulb,
  Play,
  Presentation,
  Rocket,
  MessageCircle,
  Wrench,
} from "lucide-react";
import { roleOptions } from "@/lib/vibecraft-data";
import type { ResourceId } from "@/lib/vibecraft-navigation";
import type { ChecklistItem, ChecklistStatus, Role } from "@/lib/types";
import { PrimaryButton } from "./vibecraft-ui";

export type StartMode = "plan" | "idea";
export type ShapeTab = "brief" | "tool" | "service";

const roleIcons: Record<Role, LucideIcon> = {
  student: GraduationCap,
  teacher: Presentation,
  adult: Briefcase,
};

const roleHints: Record<Role, string> = {
  student: "쉬운 비유와 단계별 안내",
  teacher: "수업 운영과 지도 기준",
  adult: "빠른 실행과 업무 적용",
};

const roleThemes: Record<Role, string> = {
  student: "tile-blue",
  teacher: "tile-violet",
  adult: "tile-amber",
};

const roleLayouts: Record<Role, string> = {
  student: "md:col-span-5",
  teacher: "md:col-span-4",
  adult: "md:col-span-3",
};

const startModeThemes: Record<StartMode, string> = {
  plan: "tile-cyan",
  idea: "tile-violet",
};

const statusLabels: Record<ChecklistStatus, string> = {
  pending: "대기",
  active: "진행 중",
  done: "완료",
  blocked: "막힘 · 도움받기",
};

const statusClasses: Record<ChecklistStatus, string> = {
  pending: "border-line bg-canvas text-muted",
  active: "border-signal/30 bg-signal-soft text-signal-ink",
  done: "border-success/30 bg-success/10 text-success",
  blocked: "border-warning/30 bg-warning/10 text-warning",
};

const taskRowClasses: Record<ChecklistStatus, string> = {
  pending: "border-line bg-surface",
  active: "border-signal/30 bg-signal-soft/60 shadow-soft",
  done: "border-success/30 bg-success/5",
  blocked: "border-warning/30 bg-warning/5",
};

export const resourceMetadata: Record<
  ResourceId,
  { title: string; eyebrow: string; short: string; icon: LucideIcon }
> = {
  concept: {
    title: "바이브코딩 핵심 원칙",
    eyebrow: "작업 원칙",
    short: "개념",
    icon: Lightbulb,
  },
  terms: {
    title: "초보자 용어 사전",
    eyebrow: "찾아보기",
    short: "용어",
    icon: BookOpen,
  },
  prompts: {
    title: "바로 쓰는 프롬프트",
    eyebrow: "작업 도구",
    short: "프롬프트",
    icon: ClipboardList,
  },
  error: {
    title: "막힘 해결 도우미",
    eyebrow: "문제 해결",
    short: "에러",
    icon: Wrench,
  },
  coach: {
    title: "프로젝트 코치",
    eyebrow: "현재 문맥으로 질문",
    short: "코치",
    icon: MessageCircle,
  },
};

export function RoleSelector({
  onChange,
  role,
}: {
  onChange: (role: Role) => void;
  role: Role | null;
}) {
  return (
    <div className="stagger mt-4 grid grid-cols-1 gap-3 md:grid-cols-12">
      {roleOptions.map((option) => {
        const selected = role === option.id;
        const Icon = roleIcons[option.id];
        return (
          <button
            aria-pressed={selected}
            className={
              `semantic-tile ${roleThemes[option.id]} ${roleLayouts[option.id]} relative flex min-h-24 items-center gap-3 rounded-[1.25rem] px-4 py-4 text-left text-ink hover:-translate-y-1 hover:shadow-soft`
            }
            key={option.id}
            onClick={() => onChange(option.id)}
            type="button"
          >
            <span className="semantic-icon grid h-11 w-11 shrink-0 place-items-center rounded-[0.875rem]"><Icon className="h-5 w-5" /></span>
            <span>
              <span className="type-title block">{option.title}</span>
              <span
                className={
                  "type-label mt-0.5 block text-muted"
                }
              >
                {roleHints[option.id]}
              </span>
            </span>
            {selected ? <CheckCircle2 className="semantic-check absolute right-3 top-3 h-5 w-5" /> : null}
          </button>
        );
      })}
    </div>
  );
}

export function StartModePicker({
  mode,
  onChange,
}: {
  mode: StartMode;
  onChange: (mode: StartMode) => void;
}) {
  const options: Array<{
    id: StartMode;
    number: string;
    title: string;
    description: string;
    icon: LucideIcon;
  }> = [
    {
      id: "plan",
      number: "A",
      title: "기획서로 시작",
      description: "작성한 문서를 프로젝트 브리프로 변환",
      icon: FileText,
    },
    {
      id: "idea",
      number: "B",
      title: "아이디어로 시작",
      description: "짧은 질문을 거쳐 프로젝트 범위를 확정",
      icon: Lightbulb,
    },
  ];

  return (
    <div>
      <p className="type-title text-ink">어떻게 시작할까요?</p>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-12">
        {options.map((option) => {
          const selected = option.id === mode;
          const Icon = option.icon;
          return (
            <button
              aria-pressed={selected}
              className={
                `semantic-tile ${startModeThemes[option.id]} ${option.id === "plan" ? "md:col-span-7" : "md:col-span-5"} relative min-h-40 rounded-[1.25rem] p-5 text-left hover:-translate-y-1 hover:shadow-soft sm:p-6`
              }
              key={option.id}
              onClick={() => onChange(option.id)}
              type="button"
            >
              <span className="flex items-start justify-between">
                <span className="semantic-icon grid h-12 w-12 place-items-center rounded-2xl"><Icon className="h-5 w-5" /></span>
                {selected ? <CheckCircle2 className="semantic-check h-5 w-5" /> : <span className="type-label text-muted">{option.number}</span>}
              </span>
              <span className="type-title mt-5 block">
                {option.title}
              </span>
              <span className="type-body mt-1 block text-muted">
                {option.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function JourneySketch() {
  return (
    <aside className="hidden xl:block">
      <div className="hud-panel sticky top-10 overflow-hidden rounded-[1.5rem] p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-signal-ink">
              현재 목표
            </p>
            <h2 className="type-title mt-2 text-ink">첫 번째 서비스 공개</h2>
          </div>
          <span className="rounded-full border border-signal/20 bg-signal-soft px-2.5 py-1 font-mono text-[10px] font-bold text-signal-ink">
            단계 01
          </span>
        </div>
        <div className="mt-6 rounded-2xl border border-line bg-canvas/70 p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-surface text-muted shadow-sm">
              <FileText className="h-4 w-4" />
            </span>
            <div>
              <p className="font-mono text-[10px] font-bold text-muted">시작</p>
              <p className="text-sm font-bold text-ink">기획 또는 아이디어</p>
            </div>
          </div>
          <div className="my-5 flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-line" />
            <span className="grid h-7 w-7 place-items-center rounded-full bg-signal-soft font-mono text-xs font-black text-signal-ink">↓</span>
            <span className="h-px flex-1 bg-line" />
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-ink p-4 text-surface shadow-strong">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-signal text-white shadow-[0_0_24px_rgba(207,92,57,.42)]">
              <Rocket className="h-4 w-4" />
            </span>
            <div>
              <p className="font-mono text-[10px] text-surface/60">완료 조건</p>
              <p className="text-sm font-black">실제로 열리는 공유 URL</p>
            </div>
          </div>
        </div>
        <p className="mt-5 text-xs leading-6 text-muted">
          다른 사람이 링크를 열고 핵심 행동을 한 번 성공하면 첫 버전은 완성입니다.
        </p>
        <div className="mt-5 flex items-center gap-2 border-t border-line pt-4 text-xs font-bold text-success">
          <CheckCircle2 className="h-4 w-4" />
          진행 내용은 자동 저장돼요
        </div>
      </div>
    </aside>
  );
}

export function ShapeTabs({
  activeTab,
  onChange,
}: {
  activeTab: ShapeTab;
  onChange: (tab: ShapeTab) => void;
}) {
  const tabs: Array<{ id: ShapeTab; label: string; number: string }> = [
    { id: "brief", label: "프로젝트 브리프", number: "01" },
    { id: "tool", label: "제작 도구", number: "02" },
    { id: "service", label: "서비스 형태", number: "03" },
  ];
  return (
    <nav aria-label="설계 세부 단계" className="mt-10 flex gap-1 overflow-x-auto rounded-full bg-line/60 p-1">
      {tabs.map((tab) => (
        <button
          aria-current={activeTab === tab.id ? "page" : undefined}
          className={
            "type-label relative min-h-10 flex-1 shrink-0 rounded-full px-4 text-center transition-all duration-300 " +
            (activeTab === tab.id
              ? "bg-surface text-ink shadow-soft"
              : "text-muted hover:text-ink")
          }
          key={tab.id}
          onClick={() => onChange(tab.id)}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

export function BriefList({
  eyebrow,
  icon: Icon,
  items,
  ordered = false,
  tone,
  title,
}: {
  eyebrow: string;
  icon: LucideIcon;
  items: string[];
  ordered?: boolean;
  tone: "tile-blue" | "tile-violet" | "tile-cyan" | "tile-amber";
  title: string;
}) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <section className={`semantic-tile ${tone} rounded-[1.25rem] p-5 sm:p-6`}>
      <div className="flex items-center gap-3">
        <span className="semantic-icon grid h-10 w-10 shrink-0 place-items-center rounded-xl">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            {eyebrow}
          </p>
          <h3 className="type-title mt-1 text-ink">{title}</h3>
        </div>
      </div>
      <Tag className="mt-5 space-y-2">
        {items.map((item, index) => (
          <li
            className="brief-list-item grid grid-cols-[32px_minmax(0,1fr)] items-start gap-2 rounded-xl px-3 py-3"
            key={item}
          >
            <span className="semantic-icon grid h-6 w-6 place-items-center rounded-lg font-mono text-[9px] font-bold">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="type-body font-semibold leading-6 text-ink">{item}</span>
          </li>
        ))}
      </Tag>
    </section>
  );
}

export function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 text-sm font-bold text-ink">{value}</dd>
    </div>
  );
}

export function MissionCard({
  item,
  onBlocked,
  onComplete,
  onStart,
  status,
}: {
  item: ChecklistItem;
  onBlocked: () => void;
  onComplete: () => void;
  onStart: () => void;
  status: ChecklistStatus;
}) {
  return (
    <article className="relative overflow-hidden rounded-[1.75rem] bg-ink px-5 py-7 text-surface shadow-strong before:absolute before:-right-24 before:-top-24 before:h-64 before:w-64 before:rounded-full before:bg-signal/30 before:blur-3xl sm:px-8 sm:py-9">
      <div className="relative z-10">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-signal">
          지금 할 한 가지 · {statusLabels[status]}
        </p>
        <h2 className="type-display mt-4 max-w-3xl">
          {item.title}
        </h2>
        <p className="type-body mt-4 max-w-2xl text-surface/65">{item.description}</p>
        <div className="mt-8 flex flex-col gap-2 sm:flex-row">
          {status !== "active" ? (
            <button
              className="action-button border border-signal bg-signal text-white shadow-[0_12px_30px_rgba(207,92,57,.35)] hover:bg-signal-ink"
              onClick={onStart}
              type="button"
            >
              <Play className="h-4 w-4" />
              작업 시작
            </button>
          ) : null}
          <button
            className="action-button border border-surface/25 bg-surface text-ink hover:border-success hover:bg-success/15 hover:text-surface"
            onClick={onComplete}
            type="button"
          >
            <Check className="h-4 w-4" />
            완료했어요
          </button>
          <button
            className="action-button border border-warning/60 bg-transparent text-surface hover:bg-warning/20"
            onClick={onBlocked}
            type="button"
          >
            <Hand className="h-4 w-4" />
            막힘 · 도움받기
          </button>
        </div>
      </div>
    </article>
  );
}

export function TaskRow({
  index,
  item,
  onChange,
  status,
}: {
  index: number;
  item: ChecklistItem;
  onChange: (status: ChecklistStatus) => void;
  status: ChecklistStatus;
}) {
  return (
    <article
      className={
        "mt-3 grid gap-4 rounded-2xl border p-4 transition-shadow hover:shadow-soft sm:grid-cols-[44px_minmax(0,1fr)_156px] sm:items-center " +
        taskRowClasses[status]
      }
    >
      <span
        className={
          "grid h-9 w-9 place-items-center rounded-xl border text-[10px] font-semibold " +
          statusClasses[status]
        }
      >
        {status === "done" ? <Check className="h-4 w-4" /> : status === "active" ? <Play className="h-3.5 w-3.5" /> : status === "blocked" ? <Hand className="h-4 w-4" /> : <Circle className="h-3.5 w-3.5" />}
      </span>
      <div>
        <h3 className="type-title text-ink">{item.title}</h3>
        <p className="type-body mt-1 text-muted">{item.description}</p>
      </div>
      <label>
        <span className="sr-only">{item.title} 상태</span>
        <select
          className={"min-h-11 w-full rounded-xl border px-3 text-xs font-bold " + statusClasses[status]}
          onChange={(event) => onChange(event.target.value as ChecklistStatus)}
          value={status}
        >
          {(Object.keys(statusLabels) as ChecklistStatus[]).map((nextStatus) => (
            <option key={nextStatus} value={nextStatus}>
              {statusLabels[nextStatus]}
            </option>
          ))}
        </select>
      </label>
    </article>
  );
}

export function ProjectEmptyState({
  description,
  onAction,
}: {
  description: string;
  onAction: () => void;
}) {
  return (
    <section className="grid min-h-[60vh] place-items-center rounded-[1.25rem] border border-line bg-surface px-6 py-16 text-center shadow-soft">
      <div className="max-w-xl">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-signal-soft text-signal">
          <FileText className="h-5 w-5" />
        </span>
        <h1 className="type-display mt-6 text-ink">
          아직 프로젝트 브리프가 없습니다.
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">{description}</p>
        <PrimaryButton className="mt-6" onClick={onAction}>
          시작 화면으로 이동
        </PrimaryButton>
      </div>
    </section>
  );
}

export function ResourceDock({
  onOpen,
}: {
  onOpen: (resource: ResourceId) => void;
}) {
  return (
    <button
      aria-label="프로젝트 코치 열기"
      className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] right-3 z-40 grid h-14 w-14 place-items-center rounded-full border border-signal bg-signal text-white shadow-[0_10px_28px_rgba(207,92,57,.32)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:bg-signal-ink active:scale-[.98] lg:bottom-6 lg:right-6"
      onClick={() => onOpen("coach")}
      type="button"
    >
      <MessageCircle className="h-6 w-6" />
    </button>
  );
}

export function ResourceSwitcher({
  activeResource,
  onChange,
}: {
  activeResource: ResourceId;
  onChange: (resource: ResourceId) => void;
}) {
  const order: ResourceId[] = ["coach", "concept", "terms", "prompts", "error"];
  return (
    <nav aria-label="도움 도구 선택" className="mb-7 flex gap-1 overflow-x-auto border-b border-line">
      {order.map((resourceId) => (
        <button
          aria-current={activeResource === resourceId ? "page" : undefined}
          className={
            "shrink-0 border-b-2 px-2 pb-3 text-xs font-bold transition-colors " +
            (activeResource === resourceId
              ? "border-signal text-ink"
              : "border-transparent text-muted hover:text-ink")
          }
          key={resourceId}
          onClick={() => onChange(resourceId)}
          type="button"
        >
          {resourceMetadata[resourceId].short}
        </button>
      ))}
    </nav>
  );
}
