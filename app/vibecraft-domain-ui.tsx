import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Bot,
  Check,
  ClipboardList,
  FileText,
  GraduationCap,
  Lightbulb,
  Play,
  Rocket,
  School,
  UserRound,
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
  teacher: School,
  adult: UserRound,
};

const roleHints: Record<Role, string> = {
  student: "쉬운 비유와 단계별 안내",
  teacher: "수업 운영과 지도 기준",
  adult: "빠른 실행과 업무 적용",
};

const statusLabels: Record<ChecklistStatus, string> = {
  pending: "대기",
  active: "진행 중",
  done: "완료",
  blocked: "막힘",
};

const statusClasses: Record<ChecklistStatus, string> = {
  pending: "border-line bg-surface text-muted",
  active: "border-signal/40 bg-signal-soft text-ink",
  done: "border-success/40 bg-success/10 text-success",
  blocked: "border-danger/40 bg-danger/10 text-danger",
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
    icon: Bot,
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
    <div className="mt-4 grid grid-cols-3 gap-px border border-line bg-line">
      {roleOptions.map((option) => {
        const selected = role === option.id;
        const Icon = roleIcons[option.id];
        return (
          <button
            aria-pressed={selected}
            className={
              "flex min-h-16 flex-col items-center justify-center gap-1 px-2 py-2 text-center transition-colors sm:flex-row sm:gap-3 sm:px-4 sm:py-3 sm:text-left " +
              (selected ? "bg-ink text-surface" : "bg-surface text-ink hover:bg-signal-soft")
            }
            key={option.id}
            onClick={() => onChange(option.id)}
            type="button"
          >
            <Icon className={"h-4 w-4 " + (selected ? "text-signal" : "text-muted")} />
            <span>
              <span className="block text-sm font-bold">{option.title}</span>
              <span
                className={
                  "mt-0.5 hidden text-[11px] sm:block " + (selected ? "text-surface/60" : "text-muted")
                }
              >
                {roleHints[option.id]}
              </span>
            </span>
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
      <p className="text-sm font-bold text-ink">출발점을 선택하세요.</p>
      <div className="mt-4 grid grid-cols-2 gap-px border border-line bg-line">
        {options.map((option) => {
          const selected = option.id === mode;
          const Icon = option.icon;
          return (
            <button
              aria-pressed={selected}
              className={
                "min-h-28 p-3 text-left transition-colors sm:min-h-32 sm:p-4 " +
                (selected ? "bg-signal text-ink" : "bg-surface text-ink hover:bg-signal-soft")
              }
              key={option.id}
              onClick={() => onChange(option.id)}
              type="button"
            >
              <span className="flex items-start justify-between">
                <span className="font-mono text-xs font-bold">{option.number}</span>
                <Icon className="h-4 w-4" />
              </span>
              <span className="mt-5 block text-base font-black tracking-[-0.03em] sm:mt-6 sm:text-lg">
                {option.title}
              </span>
              <span className={"mt-1 hidden text-xs sm:block " + (selected ? "text-ink/65" : "text-muted")}>
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
    <aside className="hidden 2xl:block">
      <div className="sticky top-12 border-y border-line py-7">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
          이 프로젝트의 완료 기준
        </p>
        <div className="mt-7 border border-line bg-surface p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center border border-line bg-canvas text-muted">
              <FileText className="h-4 w-4" />
            </span>
            <div>
              <p className="font-mono text-[10px] text-muted">INPUT</p>
              <p className="text-sm font-bold text-ink">기획 또는 아이디어</p>
            </div>
          </div>
          <div className="my-5 flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-line" />
            <span className="font-mono text-xs font-black text-signal-ink">→</span>
            <span className="h-px flex-1 bg-line" />
          </div>
          <div className="flex items-center gap-3 bg-signal p-4 text-ink">
            <span className="grid h-10 w-10 place-items-center bg-ink text-surface">
              <Rocket className="h-4 w-4" />
            </span>
            <div>
              <p className="font-mono text-[10px]">OUTPUT</p>
              <p className="text-sm font-black">실제로 열리는 공유 URL</p>
            </div>
          </div>
        </div>
        <p className="mt-5 text-xs leading-6 text-muted">
          다른 사람이 링크를 열고 핵심 행동을 한 번 성공하면 첫 버전은 완성입니다.
        </p>
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
    <nav aria-label="설계 세부 단계" className="mt-12 flex gap-6 overflow-x-auto border-b border-line">
      {tabs.map((tab) => (
        <button
          aria-current={activeTab === tab.id ? "page" : undefined}
          className={
            "relative shrink-0 pb-3 text-left text-sm font-bold transition-colors " +
            (activeTab === tab.id ? "text-ink" : "text-muted hover:text-ink")
          }
          key={tab.id}
          onClick={() => onChange(tab.id)}
          type="button"
        >
          <span className="mr-2 font-mono text-[9px] text-signal-ink">{tab.number}</span>
          {tab.label}
          {activeTab === tab.id ? (
            <span className="absolute inset-x-0 bottom-[-1px] h-0.5 bg-signal" />
          ) : null}
        </button>
      ))}
    </nav>
  );
}

export function BriefList({
  eyebrow,
  items,
  ordered = false,
  title,
}: {
  eyebrow: string;
  items: string[];
  ordered?: boolean;
  title: string;
}) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <section>
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-signal-ink">
        {eyebrow}
      </p>
      <h3 className="mt-2 text-lg font-black tracking-[-0.025em] text-ink">{title}</h3>
      <Tag className="mt-4">
        {items.map((item, index) => (
          <li className="grid grid-cols-[28px_minmax(0,1fr)] border-t border-line py-3" key={item}>
            <span className="font-mono text-[10px] text-muted">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-sm font-semibold leading-6 text-ink">{item}</span>
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
    <article className="bg-ink px-5 py-7 text-surface sm:px-8 sm:py-9">
      <div>
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-signal">
          다음 작업 · {statusLabels[status]}
        </p>
        <h2 className="mt-4 max-w-3xl text-3xl font-black leading-tight tracking-[-0.03em] sm:text-4xl">
          {item.title}
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-surface/65">{item.description}</p>
        <div className="mt-8 flex flex-col gap-2 sm:flex-row">
          {status !== "active" ? (
            <button
              className="action-button border border-signal bg-signal text-ink hover:bg-surface"
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
            className="action-button border border-surface/25 bg-transparent text-surface hover:border-danger hover:bg-danger/20"
            onClick={onBlocked}
            type="button"
          >
            <Wrench className="h-4 w-4" />
            막혔어요
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
    <article className="grid gap-4 border-b border-line py-5 sm:grid-cols-[44px_minmax(0,1fr)_132px] sm:items-center">
      <span
        className={
          "grid h-9 w-9 place-items-center border font-mono text-[10px] font-semibold " +
          statusClasses[status]
        }
      >
        {status === "done" ? <Check className="h-4 w-4" /> : String(index + 1).padStart(2, "0")}
      </span>
      <div>
        <h3 className="text-sm font-bold text-ink">{item.title}</h3>
        <p className="mt-1 text-sm leading-6 text-muted">{item.description}</p>
      </div>
      <label>
        <span className="sr-only">{item.title} 상태</span>
        <select
          className={"min-h-11 w-full border px-3 text-xs font-bold " + statusClasses[status]}
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
    <section className="grid min-h-[60vh] place-items-center border-y border-line py-16 text-center">
      <div className="max-w-xl">
        <span className="mx-auto grid h-12 w-12 place-items-center bg-signal text-ink">
          <FileText className="h-5 w-5" />
        </span>
        <h1 className="mt-6 text-3xl font-black tracking-[-0.03em] text-ink">
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
      className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] right-3 z-40 inline-flex min-h-12 items-center gap-2 border border-ink bg-ink px-4 text-sm font-bold text-surface shadow-drawer transition-colors hover:border-signal hover:bg-signal hover:text-ink lg:bottom-5 lg:right-5"
      onClick={() => onOpen("coach")}
      type="button"
    >
      <Bot className="h-4 w-4" />
      도움 도구
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
