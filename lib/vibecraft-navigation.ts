import type { ChecklistStatus } from "./types";

export type PhaseId = "start" | "shape" | "build" | "ship";

export type ResourceId = "concept" | "terms" | "prompts" | "error" | "coach";

export interface PhaseMetadata {
  id: PhaseId;
  step: string;
  label: string;
  description: string;
  outcome: string;
}

export const phaseOrder = ["start", "shape", "build", "ship"] as const satisfies readonly PhaseId[];

export const phaseMetadata = {
  start: {
    id: "start",
    step: "01",
    label: "시작하기",
    description: "프로젝트의 출발점을 정하고 아이디어나 기획서를 분석합니다.",
    outcome: "분석 가능한 프로젝트 원문",
  },
  shape: {
    id: "shape",
    step: "02",
    label: "설계하기",
    description: "핵심 기능의 범위를 다듬고 만들 방법과 도구를 결정합니다.",
    outcome: "확정된 MVP 계획",
  },
  build: {
    id: "build",
    step: "03",
    label: "만들기",
    description: "작업을 하나씩 완료하며 실제로 동작하는 결과물을 만듭니다.",
    outcome: "실행 가능한 서비스",
  },
  ship: {
    id: "ship",
    step: "04",
    label: "공개하기",
    description: "배포 전 위험 요소를 점검하고 다른 사람이 쓸 수 있게 공개합니다.",
    outcome: "공유 가능한 결과 URL",
  },
} as const satisfies Record<PhaseId, PhaseMetadata>;

export interface ProjectProgressInput {
  roleSelected: boolean;
  recommendationReady: boolean;
  toolSelected: boolean;
  serviceSelected: boolean;
  checklistItemIds: readonly string[];
  checklistStatuses: Readonly<Partial<Record<string, ChecklistStatus>>>;
  deploymentItemIds: readonly string[];
  deploymentStatuses: Readonly<Partial<Record<string, ChecklistStatus>>>;
  deploymentUrl?: string | null;
}

export interface PhaseProgress {
  percent: number;
  completed: number;
  total: number;
}

export interface ProjectProgress extends PhaseProgress {
  phases: Record<PhaseId, PhaseProgress>;
}

function uniqueItemIds(itemIds: readonly string[]): string[] {
  return [...new Set(itemIds.filter((itemId) => itemId.length > 0))];
}

function countCompletedItems(
  itemIds: readonly string[],
  statuses: Readonly<Partial<Record<string, ChecklistStatus>>>,
): number {
  return uniqueItemIds(itemIds).reduce(
    (completed, itemId) => completed + Number(statuses[itemId] === "done"),
    0,
  );
}

function toProgress(completed: number, total: number): PhaseProgress {
  return {
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
    completed,
    total,
  };
}

/**
 * Calculates progress from completed artifacts instead of the currently opened page.
 * Only checklist items whose status is `done` count as complete.
 */
export function calculateProjectProgress(input: ProjectProgressInput): ProjectProgress {
  const checklistItemIds = uniqueItemIds(input.checklistItemIds);
  const deploymentItemIds = uniqueItemIds(input.deploymentItemIds);

  const phases: Record<PhaseId, PhaseProgress> = {
    start: toProgress(Number(input.roleSelected) + Number(input.recommendationReady), 2),
    shape: toProgress(Number(input.toolSelected) + Number(input.serviceSelected), 2),
    build: toProgress(
      countCompletedItems(checklistItemIds, input.checklistStatuses),
      checklistItemIds.length,
    ),
    ship: toProgress(
      countCompletedItems(deploymentItemIds, input.deploymentStatuses) +
        Number(Boolean(input.deploymentUrl?.trim())),
      deploymentItemIds.length + 1,
    ),
  };

  const completed = phaseOrder.reduce((sum, phaseId) => sum + phases[phaseId].completed, 0);
  const total = phaseOrder.reduce((sum, phaseId) => sum + phases[phaseId].total, 0);

  return {
    ...toProgress(completed, total),
    phases,
  };
}

export type AssistantLinkTargetId = PhaseId | ResourceId;

const assistantLinkTargets: Readonly<Record<string, AssistantLinkTargetId>> = {
  "실습 체크리스트": "build",
  실습: "build",
  "용어 사전": "terms",
  용어: "terms",
  "프롬프트 템플릿": "prompts",
  프롬프트: "prompts",
  "에러 해결": "error",
  에러: "error",
  "배포 점검": "ship",
  배포: "ship",
};

export function mapAssistantLinkLabel(label: string): AssistantLinkTargetId | null {
  return assistantLinkTargets[label.trim()] ?? null;
}
