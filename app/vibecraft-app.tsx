"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Code2,
  Copy,
  ExternalLink,
  FileText,
  Flag,
  Layers3,
  Lightbulb,
  MessageSquare,
  Pencil,
  Play,
  Rocket,
  Save,
  Search,
  Send,
  Smartphone,
  Terminal,
  Upload,
  Wrench,
} from "lucide-react";
import {
  baseChecklist,
  conceptCards,
  deploymentChecks,
  promptTemplates,
  serviceTypes,
  softwareChecklist,
  terms,
  tools,
} from "@/lib/vibecraft-data";
import {
  calculateProjectProgress,
  mapAssistantLinkLabel,
  phaseMetadata,
  phaseOrder,
  type PhaseId,
  type ResourceId,
} from "@/lib/vibecraft-navigation";
import type {
  ChecklistItem,
  ChecklistStatus,
  ErrorSolution,
  Recommendation,
  Role,
  ServiceType,
  ToolSlug,
} from "@/lib/types";
import {
  BriefList,
  JourneySketch,
  MissionCard,
  ProjectEmptyState,
  ResourceDock,
  ResourceSwitcher,
  RoleSelector,
  ShapeTabs,
  StartModePicker,
  TaskRow,
  resourceMetadata,
  type ShapeTab,
  type StartMode,
} from "./vibecraft-domain-ui";
import {
  Eyebrow,
  InlineNotice,
  MobilePhaseNav,
  PhaseRail,
  PrimaryButton,
  ProgressBar,
  ResourceDrawer,
  SecondaryButton,
  SectionHeading,
} from "./vibecraft-ui";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  links?: string[];
};

const initialChatMessages: ChatMessage[] = [
  {
    role: "assistant",
    content:
      "지금 하고 있는 작업과 막힌 지점을 적어주세요. 프로젝트 문맥을 기준으로 다음 행동 하나를 정리해드릴게요.",
    links: ["실습", "용어", "에러"],
  },
];

const MAX_PLAN_CHARACTERS = 200_000;

const serviceRoadmaps: Record<ServiceType, string[]> = {
  web: [
    "핵심 사용자가 처음 만나는 화면과 행동을 정합니다.",
    "입력 → 처리 → 결과의 한 흐름을 먼저 구현합니다.",
    "필요한 경우 데이터 저장과 외부 연동을 연결합니다.",
    "모바일과 데스크톱에서 주요 흐름을 확인합니다.",
    "공개 URL에서 첫 사용자 흐름을 다시 점검합니다.",
  ],
  "mobile-web": [
    "스마트폰에서 가장 먼저 할 행동을 한 가지로 정합니다.",
    "엄지손가락으로 입력 → 결과 흐름을 완료할 수 있게 만듭니다.",
    "작은 화면의 키보드·하단 영역·긴 텍스트를 점검합니다.",
    "필요한 경우 데이터 저장과 알림 흐름을 연결합니다.",
    "실제 스마트폰에서 공개 URL을 열어 확인합니다.",
  ],
  software: [
    "처리할 입력 자료와 기대 결과를 한 사례로 정합니다.",
    "입력 → 실행 → 결과의 한 흐름을 구현합니다.",
    "잘못된 입력과 실패 메시지를 점검합니다.",
    "서로 다른 자료로 실행 결과를 반복 확인합니다.",
    "저장소 또는 다운로드 주소와 실행 방법을 공유합니다.",
  ],
};

const toolIcons: Record<ToolSlug, LucideIcon> = {
  codex: Code2,
  claude: MessageSquare,
  antigravity: Layers3,
};

const serviceIcons: Record<ServiceType, LucideIcon> = {
  web: Code2,
  "mobile-web": Smartphone,
  software: Terminal,
};

const toolThemes: Record<ToolSlug, string> = {
  codex: "tile-blue",
  claude: "tile-amber",
  antigravity: "tile-violet",
};

const serviceThemes: Record<ServiceType, string> = {
  web: "tile-blue",
  "mobile-web": "tile-violet",
  software: "tile-amber",
};

const serviceLayouts: Record<ServiceType, string> = {
  web: "lg:col-span-5",
  "mobile-web": "lg:col-span-4",
  software: "lg:col-span-3",
};

function usePersistentState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored) setValue(JSON.parse(stored) as T);
    } catch {
      setValue(initialValue);
    } finally {
      setReady(true);
    }
  }, [key]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Private browsing or a full quota should not break the working session.
    }
  }, [key, ready, value]);

  return [value, setValue] as const;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? "요청을 처리하지 못했습니다.");
  return data;
}

function linesFromText(value: string) {
  return Array.from(
    new Set(
      value
        .split(/\r?\n/)
        .map((line) => line.replace(/^(?:[-*•]\s+|\d+[.)]\s+)/, "").trim())
        .filter(Boolean),
    ),
  );
}

function validWebUrl(value: string) {
  try {
    const url = new URL(value.trim());
    const localHost =
      url.hostname === "localhost" ||
      url.hostname === "0.0.0.0" ||
      url.hostname === "127.0.0.1" ||
      url.hostname.endsWith(".local");
    return url.protocol === "https:" && !localHost ? url.toString() : "";
  } catch {
    return "";
  }
}

export function VibeCraftApp() {
  const [sessionId] = usePersistentState("vc-session-id", "local-session");
  const [phase, setPhase] = usePersistentState<PhaseId>("vc-phase", "start");
  const [role, setRole] = usePersistentState<Role | null>("vc-role", null);
  const [recommendation, setRecommendation] = usePersistentState<Recommendation | null>(
    "vc-recommendation",
    null,
  );
  const [selectedTool, setSelectedTool] = usePersistentState<ToolSlug | null>("vc-tool", null);
  const [selectedServiceType, setSelectedServiceType] = usePersistentState<ServiceType | null>(
    "vc-service-type",
    null,
  );
  const [checklistStatuses, setChecklistStatuses] = usePersistentState<Record<string, ChecklistStatus>>(
    "vc-checklist",
    {},
  );
  const [deploymentStatuses, setDeploymentStatuses] = usePersistentState<
    Record<string, ChecklistStatus>
  >("vc-deploy-checks", {});
  const [deploymentUrl, setDeploymentUrl] = usePersistentState("vc-deployment-url", "");
  const [deploymentUrlConfirmed, setDeploymentUrlConfirmed] = usePersistentState(
    "vc-deployment-url-confirmed",
    false,
  );

  const [startMode, setStartMode] = useState<StartMode>("plan");
  const [shapeTab, setShapeTab] = useState<ShapeTab>("brief");
  const [resource, setResource] = useState<ResourceId | null>(null);
  const [planText, setPlanText] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [idea, setIdea] = useState("");
  const [interviewQuestions, setInterviewQuestions] = useState<string[]>([]);
  const [interviewAnswers, setInterviewAnswers] = useState<Record<string, string>>({});
  const [termSearch, setTermSearch] = useState("");
  const [promptSearch, setPromptSearch] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [errorSolution, setErrorSolution] = useState<ErrorSolution | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialChatMessages);
  const [editingBrief, setEditingBrief] = useState(false);
  const [briefDraft, setBriefDraft] = useState({
    summary: "",
    targetUsers: "",
    mainFeatures: "",
  });
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const safePhase = (phaseOrder as readonly string[]).includes(phase) ? phase : "start";
  const activeRole = role ?? "student";
  const activeTool = selectedTool ?? recommendation?.recommendedTool ?? "codex";
  const activeServiceType =
    selectedServiceType ?? recommendation?.recommendedServiceType ?? "web";
  const selectedToolInfo = tools.find((tool) => tool.slug === activeTool) ?? tools[0];
  const recommendedToolInfo =
    tools.find((tool) => tool.slug === recommendation?.recommendedTool) ?? tools[0];
  const selectedServiceInfo =
    serviceTypes.find((item) => item.id === activeServiceType) ?? serviceTypes[0];
  const recommendedServiceInfo =
    serviceTypes.find((item) => item.id === recommendation?.recommendedServiceType) ??
    serviceTypes[0];
  const displayedStack =
    selectedServiceType && selectedServiceType !== recommendation?.recommendedServiceType
      ? selectedServiceInfo.stack
      : recommendation?.recommendedStack ?? selectedServiceInfo.stack;
  const checklistItems = useMemo(() => {
    return activeServiceType === "software"
      ? softwareChecklist
      : baseChecklist;
  }, [activeServiceType]);
  const deploymentItems = useMemo(() => {
    const stack = new Set(displayedStack);
    return deploymentChecks.filter((item) => {
      if (item.id === "mobile-layout" && activeServiceType === "software") return false;
      if (item.id === "db-ready" && !stack.has("Neon DB")) return false;
      if (
        item.id === "env-ready" &&
        !stack.has("Neon DB") &&
        !stack.has("외부 API")
      )
        return false;
      return true;
    });
  }, [activeServiceType, displayedStack]);
  const displayedRoadmap =
    selectedServiceType && selectedServiceType !== recommendation?.recommendedServiceType
      ? serviceRoadmaps[selectedServiceType]
      : recommendation?.roadmap ?? serviceRoadmaps[activeServiceType];
  const verifiedDeploymentUrl = useMemo(() => validWebUrl(deploymentUrl), [deploymentUrl]);

  const projectProgress = useMemo(
    () =>
      calculateProjectProgress({
        roleSelected: Boolean(role),
        recommendationReady: Boolean(recommendation),
        toolSelected: Boolean(selectedTool),
        serviceSelected: Boolean(selectedServiceType),
        checklistItemIds: checklistItems.map((item) => item.id),
        checklistStatuses,
        deploymentItemIds: deploymentItems.map((item) => item.id),
        deploymentStatuses,
        deploymentUrl: deploymentUrlConfirmed ? verifiedDeploymentUrl : "",
      }),
    [
      checklistItems,
      checklistStatuses,
      deploymentStatuses,
      deploymentItems,
      deploymentUrlConfirmed,
      verifiedDeploymentUrl,
      recommendation,
      role,
      selectedServiceType,
      selectedTool,
    ],
  );

  const currentMission = useMemo(
    () =>
      checklistItems.find((item) => checklistStatuses[item.id] === "active") ??
      checklistItems.find((item) => (checklistStatuses[item.id] ?? "pending") === "pending") ??
      checklistItems.find((item) => checklistStatuses[item.id] === "blocked") ??
      null,
    [checklistItems, checklistStatuses],
  );

  const filteredTerms = useMemo(() => {
    const query = termSearch.trim().toLowerCase();
    if (!query) return terms;
    return terms.filter((item) =>
      [item.term, item.category, item.plainDescription, ...item.related].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [termSearch]);

  const filteredPrompts = useMemo(() => {
    const query = promptSearch.trim().toLowerCase();
    return promptTemplates.filter((item) => {
      const matchesTool = item.tool === "all" || item.tool === activeTool;
      const matchesQuery =
        !query ||
        [item.title, item.category, item.description].some((value) =>
          value.toLowerCase().includes(query),
        );
      return matchesTool && matchesQuery;
    });
  }, [activeTool, promptSearch]);

  const closeResource = useCallback(() => setResource(null), []);

  useEffect(() => {
    if (phase !== safePhase) setPhase("start");
  }, [phase, safePhase, setPhase]);

  function scrollToTop() {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }

  function applyNewRecommendation(nextRecommendation: Recommendation) {
    setRecommendation(nextRecommendation);
    // Recommendations remain suggestions until the user explicitly confirms both choices.
    setSelectedTool(null);
    setSelectedServiceType(null);
    setChecklistStatuses({});
    setDeploymentStatuses({});
    setDeploymentUrl("");
    setDeploymentUrlConfirmed(false);
    setEditingBrief(false);
    setBriefDraft({ summary: "", targetUsers: "", mainFeatures: "" });
    setErrorMessage("");
    setErrorSolution(null);
    setChatInput("");
    setChatMessages([...initialChatMessages]);
    setResource(null);
  }

  function handleRoleChange(nextRole: Role) {
    setRole(nextRole);
    if (interviewQuestions.length) {
      setInterviewQuestions([]);
      setInterviewAnswers({});
      setNotice("역할이 바뀌어 아이디어 확인 질문을 새로 받아야 합니다.");
    }
  }

  function handleIdeaChange(nextIdea: string) {
    setIdea(nextIdea);
    if (interviewQuestions.length) {
      setInterviewQuestions([]);
      setInterviewAnswers({});
    }
  }

  function startBuild() {
    if (!selectedTool) {
      setShapeTab("tool");
      setNotice("추천을 확인한 뒤 이번 프로젝트에 사용할 제작 도구를 직접 선택해주세요.");
      return;
    }
    if (!selectedServiceType) {
      setShapeTab("service");
      setNotice("결과물이 사용될 환경에 맞춰 서비스 형태를 직접 선택해주세요.");
      return;
    }
    navigatePhase("build");
  }

  function selectServiceType(nextServiceType: ServiceType) {
    if (selectedServiceType && selectedServiceType !== nextServiceType) {
      setChecklistStatuses({});
      setDeploymentStatuses({});
      setDeploymentUrl("");
      setDeploymentUrlConfirmed(false);
      setNotice("서비스 형태가 바뀌어 제작·공개 체크 상태를 새 기준으로 초기화했습니다.");
    } else {
      setNotice(null);
    }
    setSelectedServiceType(nextServiceType);
  }

  function navigatePhase(nextPhase: PhaseId) {
    setNotice(null);
    if (nextPhase !== "start" && !recommendation) {
      setNotice("먼저 기획서나 아이디어를 분석해 프로젝트 브리프를 만들어주세요.");
      setPhase("start");
      return;
    }
    if (
      (nextPhase === "build" || nextPhase === "ship") &&
      (!selectedTool || !selectedServiceType)
    ) {
      setPhase("shape");
      setShapeTab(!selectedTool ? "tool" : "service");
      setNotice("제작을 시작하기 전에 도구와 서비스 형태를 직접 확정해주세요.");
      return;
    }
    setPhase(nextPhase);
    scrollToTop();
  }

  async function handleFileUpload(file: File) {
    setUploadedFileName(file.name);
    setNotice(null);

    if (file.size > 1024 * 1024) {
      setNotice("파일은 1MB 이하로 준비해주세요. 긴 기획서는 핵심 범위만 남기는 편이 정확합니다.");
      return;
    }

    if (file.name.toLowerCase().endsWith(".pdf")) {
      setPlanText(
        "[PDF 파일: " +
          file.name +
          "]\nPDF 본문 자동 추출은 아직 지원하지 않습니다. PlanCraft의 핵심 요약을 이 아래에 붙여넣어주세요.",
      );
      setNotice("PDF 파일명만 불러왔습니다. 정확한 분석을 위해 핵심 내용을 함께 붙여넣어주세요.");
      return;
    }

    const text = await file.text();
    if (text.length > MAX_PLAN_CHARACTERS) {
      setNotice("기획서가 200,000자를 넘습니다. 첫 버전에 필요한 범위만 남겨주세요.");
      return;
    }
    setPlanText(text);
  }

  async function analyzePlan() {
    if (!role) {
      setNotice("설명 방식을 맞추기 위해 먼저 역할을 선택해주세요.");
      return;
    }
    if (planText.trim().length < 10) {
      setNotice("사용자와 핵심 기능이 드러나도록 기획서 내용을 조금 더 입력해주세요.");
      return;
    }
    if (planText.length > MAX_PLAN_CHARACTERS) {
      setNotice("기획서가 200,000자를 넘습니다. 첫 버전에 필요한 범위만 남겨주세요.");
      return;
    }

    setBusy("analyze");
    setNotice(null);
    try {
      const result = await postJson<Recommendation>("/api/analyze-plan", {
        role,
        extractedText: planText,
      });
      applyNewRecommendation(result);
      setShapeTab("brief");
      setPhase("shape");
      scrollToTop();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "프로젝트 브리프를 만들지 못했습니다.");
      scrollToTop();
    } finally {
      setBusy(null);
    }
  }

  async function requestInterviewQuestions() {
    if (!role) {
      setNotice("설명 방식을 맞추기 위해 먼저 역할을 선택해주세요.");
      return;
    }
    if (idea.trim().length < 4) {
      setNotice("만들고 싶은 서비스를 한 문장 이상으로 적어주세요.");
      return;
    }

    setBusy("idea-questions");
    setNotice(null);
    try {
      const result = await postJson<{ nextQuestions: string[] }>("/api/idea-interview", {
        role,
        idea,
      });
      setInterviewQuestions(result.nextQuestions);
      setInterviewAnswers({});
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "확인 질문을 만들지 못했습니다.");
    } finally {
      setBusy(null);
    }
  }

  async function finishInterview() {
    if (!role) return;
    const unanswered = interviewQuestions.some(
      (question) => !interviewAnswers[question]?.trim(),
    );
    if (unanswered) {
      setNotice("프로젝트 범위를 정확히 잡을 수 있도록 모든 질문에 답해주세요.");
      return;
    }

    setBusy("idea-result");
    setNotice(null);
    try {
      const result = await postJson<{ recommendation: Recommendation }>(
        "/api/idea-interview",
        {
          role,
          idea,
          answers: interviewAnswers,
        },
      );
      applyNewRecommendation(result.recommendation);
      setInterviewQuestions([]);
      setInterviewAnswers({});
      setShapeTab("brief");
      setPhase("shape");
      scrollToTop();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "프로젝트 브리프를 만들지 못했습니다.");
    } finally {
      setBusy(null);
    }
  }

  function beginBriefEdit() {
    if (!recommendation) return;
    setBriefDraft({
      summary: recommendation.summary,
      targetUsers: recommendation.targetUsers.join("\n"),
      mainFeatures: recommendation.mainFeatures.join("\n"),
    });
    setEditingBrief(true);
  }

  function saveBrief() {
    if (!recommendation) return;
    const nextUsers = linesFromText(briefDraft.targetUsers);
    const nextFeatures = linesFromText(briefDraft.mainFeatures);
    if (briefDraft.summary.trim().length < 4 || !nextUsers.length || !nextFeatures.length) {
      setNotice("한 줄 설명, 핵심 사용자, 핵심 기능을 각각 하나 이상 입력해주세요.");
      return;
    }
    setRecommendation({
      ...recommendation,
      summary: briefDraft.summary.trim(),
      targetUsers: nextUsers,
      mainFeatures: nextFeatures,
    });
    setEditingBrief(false);
    setNotice("프로젝트 브리프를 저장했습니다.");
  }

  function setChecklist(item: ChecklistItem, status: ChecklistStatus) {
    setChecklistStatuses((current) => {
      const next = { ...current };
      if (status === "active") {
        checklistItems.forEach((candidate) => {
          if (candidate.id !== item.id && next[candidate.id] === "active") {
            next[candidate.id] = "pending";
          }
        });
      }
      next[item.id] = status;
      return next;
    });
    void fetch("/api/checklist-progress", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, checklistId: item.id, status }),
    });
    if (status === "blocked") openBlockedItem(item);
  }

  function setDeployCheck(item: ChecklistItem, status: ChecklistStatus) {
    setDeploymentStatuses((current) => ({ ...current, [item.id]: status }));
    if (status === "blocked") openBlockedItem(item);
  }

  function openBlockedItem(item: ChecklistItem) {
    setErrorMessage(
      "현재 작업: " +
        item.title +
        "\n하려던 일: " +
        item.description +
        "\n\n실행한 명령어 또는 에러 메시지:\n",
    );
    setErrorSolution(null);
    setResource("error");
  }

  async function solveCurrentError() {
    if (errorMessage.trim().length < 1) {
      setNotice("에러 메시지나 막힌 상황을 입력해주세요.");
      return;
    }

    setBusy("error");
    setNotice(null);
    try {
      const result = await postJson<ErrorSolution>("/api/solve-error", {
        role: activeRole,
        selectedTool: activeTool,
        currentStep: phaseMetadata[safePhase].label,
        errorMessage,
      });
      setErrorSolution(result);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "막힌 원인을 분석하지 못했습니다.");
    } finally {
      setBusy(null);
    }
  }

  async function sendChatMessage() {
    const message = chatInput.trim();
    if (!message || busy === "chat") return;

    setChatInput("");
    setChatMessages((current) => [...current, { role: "user", content: message }]);
    setBusy("chat");
    try {
      const result = await postJson<{ answer: string; relatedLinks: string[] }>("/api/chat", {
        role: activeRole,
        message,
        currentPage: phaseMetadata[safePhase].label,
        selectedTool: activeTool,
        selectedServiceType: activeServiceType,
        projectSummary: recommendation?.summary,
      });
      setChatMessages((current) => [
        ...current,
        { role: "assistant", content: result.answer, links: result.relatedLinks },
      ]);
    } catch {
      setChatMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "답변을 만들지 못했습니다. 질문을 더 짧게 나눠 다시 보내주세요.",
        },
      ]);
    } finally {
      setBusy(null);
    }
  }

  async function copyText(text: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(text);
      setNotice(successMessage);
    } catch {
      setNotice("복사하지 못했습니다. 브라우저의 클립보드 권한을 확인해주세요.");
    }
  }

  function copyPrompt(template: string) {
    const filled = template
      .replaceAll(
        "{{projectSummary}}",
        recommendation?.summary ?? "내 프로젝트 설명을 여기에 붙여넣습니다.",
      )
      .replaceAll("{{errorMessage}}", errorMessage || "에러 메시지를 여기에 붙여넣습니다.");
    void copyText(filled, "현재 프로젝트 내용으로 프롬프트를 복사했습니다.");
  }

  function followAssistantLink(label: string) {
    const target = mapAssistantLinkLabel(label);
    if (!target) return;
    if ((phaseOrder as readonly string[]).includes(target)) {
      closeResource();
      navigatePhase(target as PhaseId);
      return;
    }
    setResource(target as ResourceId);
  }

  function renderStartPhase() {
    return (
      <section className="grid w-full min-w-0 gap-10 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <div>
          <Eyebrow>새 프로젝트 · 01</Eyebrow>
          <h1 className="type-display mt-4 text-ink">
            기획을 멈추지 말고,
            <br />
            실제 서비스로 만드세요.
          </h1>
          <p className="type-body mt-6 max-w-2xl text-muted">
            VibeCraft는 많은 개발 지식을 한꺼번에 보여주지 않습니다. 지금 프로젝트에 필요한
            다음 행동 하나를 정하고, 배포 링크가 생길 때까지 함께 갑니다.
          </p>

          {recommendation ? (
            <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-success/20 bg-success/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold text-success">진행 중인 프로젝트</p>
                <p className="mt-1 line-clamp-1 text-sm font-semibold text-ink">
                  {recommendation.summary}
                </p>
              </div>
              <SecondaryButton
                className="shrink-0"
                icon={ArrowRight}
                onClick={() => navigatePhase("shape")}
              >
                계속 만들기
              </SecondaryButton>
            </div>
          ) : null}

          <div className="hud-panel relative mt-10 rounded-[1.25rem] p-5 sm:p-6">
            <p className="type-title text-ink">누구의 상황에 맞춰 설명할까요?</p>
            <p className="type-body mt-1 text-muted">
              역할은 추천의 말투와 예시를 바꿉니다. 언제든 다시 선택할 수 있습니다.
            </p>
            <RoleSelector role={role} onChange={handleRoleChange} />
          </div>

          <div className="hud-panel relative mt-6 rounded-[1.25rem] p-5 sm:p-6">
            <StartModePicker mode={startMode} onChange={setStartMode} />
            {startMode === "plan" ? (
              <div className="mt-6">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-ink">기획서 내용</span>
                  <span className="mb-3 block text-xs leading-5 text-muted">
                    txt·md는 바로 읽습니다. PDF는 파일명만 불러오므로 핵심 요약을 함께
                    붙여넣어주세요.
                  </span>
                  <span className="mb-3 flex min-h-28 cursor-pointer flex-col items-start justify-between gap-4 rounded-2xl border-2 border-dashed border-line bg-canvas px-4 py-4 transition-colors hover:border-signal hover:bg-signal-soft focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-signal sm:flex-row sm:items-center">
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-signal-soft text-signal">
                        <Upload className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-bold text-ink">
                          파일을 선택하거나 내용을 붙여넣으세요
                        </span>
                        <span className="mt-1 block text-xs text-muted">
                          최대 1MB · txt, md, pdf
                        </span>
                      </span>
                    </span>
                    {uploadedFileName ? (
                      <span className="max-w-full truncate font-mono text-[10px] text-signal-ink sm:max-w-36">
                        {uploadedFileName}
                      </span>
                    ) : null}
                    <input
                      accept=".txt,.md,.pdf,text/plain,text/markdown,application/pdf"
                      className="sr-only"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void handleFileUpload(file);
                      }}
                      type="file"
                    />
                  </span>
                </label>
                <label className="block">
                  <span className="sr-only">기획서 핵심 내용</span>
                  <textarea
                    className="field min-h-64 resize-y"
                    onChange={(event) => setPlanText(event.target.value)}
                    placeholder="누가 사용하는지, 무엇을 해결하는지, 꼭 필요한 기능은 무엇인지 적어주세요."
                    value={planText}
                  />
                </label>
                <PrimaryButton
                  className="mt-4 w-full sm:w-auto"
                  disabled={busy === "analyze"}
                  icon={FileText}
                  loading={busy === "analyze"}
                  onClick={analyzePlan}
                >
                  프로젝트 브리프 만들기
                </PrimaryButton>
              </div>
            ) : (
              <div className="mt-6">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-ink">
                    어떤 서비스를 만들고 싶나요?
                  </span>
                  <textarea
                    className="field min-h-36 resize-y"
                    onChange={(event) => handleIdeaChange(event.target.value)}
                    placeholder="예: 동아리 모집 신청을 받고 선생님이 확인하는 모바일 웹앱"
                    value={idea}
                  />
                </label>
                {!interviewQuestions.length ? (
                  <PrimaryButton
                    className="mt-4 w-full sm:w-auto"
                    disabled={busy === "idea-questions"}
                    icon={MessageSquare}
                    loading={busy === "idea-questions"}
                    onClick={requestInterviewQuestions}
                  >
                    필요한 질문 받기
                  </PrimaryButton>
                ) : (
                  <div className="mt-8 space-y-6 border-t border-line pt-6">
                    <div>
                      <p className="text-sm font-bold text-ink">프로젝트 범위를 확인합니다.</p>
                      <p className="mt-1 text-xs text-muted">
                        기술 용어보다 실제 사용 상황을 기준으로 답해주세요.
                      </p>
                    </div>
                    {interviewQuestions.map((question, index) => (
                      <label className="block" key={question}>
                        <span className="mb-2 flex gap-3 text-sm font-bold leading-6 text-ink">
                          <span className="font-mono text-xs text-signal-ink">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          {question}
                        </span>
                        <input
                          className="field"
                          onChange={(event) =>
                            setInterviewAnswers((current) => ({
                              ...current,
                              [question]: event.target.value,
                            }))
                          }
                          value={interviewAnswers[question] ?? ""}
                        />
                      </label>
                    ))}
                    <PrimaryButton
                      className="w-full sm:w-auto"
                      disabled={busy === "idea-result"}
                      icon={ArrowRight}
                      loading={busy === "idea-result"}
                      onClick={finishInterview}
                    >
                      답변으로 브리프 만들기
                    </PrimaryButton>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <JourneySketch />
      </section>
    );
  }

  function renderShapePhase() {
    if (!recommendation) {
      return (
        <ProjectEmptyState
          description="프로젝트를 설계하려면 먼저 기획서나 아이디어를 분석해야 합니다."
          onAction={() => navigatePhase("start")}
        />
      );
    }

    return (
      <section>
        <Eyebrow>프로젝트 설계 · 02</Eyebrow>
        <h1 className="type-display mt-4 text-ink">
          만들 수 있는 크기로
          <br />
          프로젝트를 다듬습니다.
        </h1>
        <p className="type-body mt-5 max-w-2xl text-muted">
          추천은 정답이 아니라 출발점입니다. 프로젝트의 목적을 먼저 확인하고 도구와 구현
          형태를 직접 결정하세요.
        </p>

        <ShapeTabs activeTab={shapeTab} onChange={setShapeTab} />

        {shapeTab === "brief" ? (
          <div className="mt-8">
            <SectionHeading
              action={
                editingBrief ? (
                  <div className="flex gap-2">
                    <SecondaryButton onClick={() => setEditingBrief(false)}>취소</SecondaryButton>
                    <PrimaryButton icon={Save} onClick={saveBrief}>
                      저장
                    </PrimaryButton>
                  </div>
                ) : (
                  <SecondaryButton icon={Pencil} onClick={beginBriefEdit}>
                    브리프 수정
                  </SecondaryButton>
                )
              }
              description="AI 추천보다 먼저 확인해야 할 프로젝트의 기준입니다."
              title="프로젝트 브리프"
            />

            {editingBrief ? (
              <div className="brief-shell mt-8 grid gap-7 p-5 sm:p-8">
                <label>
                  <span className="type-label mb-2 block text-ink">한 줄 설명</span>
                  <textarea
                    className="field min-h-28"
                    onChange={(event) =>
                      setBriefDraft((current) => ({ ...current, summary: event.target.value }))
                    }
                    value={briefDraft.summary}
                  />
                </label>
                <div className="grid gap-7 md:grid-cols-2">
                  <label>
                    <span className="type-label mb-2 block text-ink">
                      핵심 사용자 · 한 줄에 하나
                    </span>
                    <textarea
                      className="field min-h-44"
                      onChange={(event) =>
                        setBriefDraft((current) => ({
                          ...current,
                          targetUsers: event.target.value,
                        }))
                      }
                      value={briefDraft.targetUsers}
                    />
                  </label>
                  <label>
                    <span className="type-label mb-2 block text-ink">
                      핵심 기능 · 한 줄에 하나
                    </span>
                    <textarea
                      className="field min-h-44"
                      onChange={(event) =>
                        setBriefDraft((current) => ({
                          ...current,
                          mainFeatures: event.target.value,
                        }))
                      }
                      value={briefDraft.mainFeatures}
                    />
                  </label>
                </div>
              </div>
            ) : (
              <article className="brief-shell mt-8">
                <header className="brief-hero px-5 py-7 sm:px-8 sm:py-9">
                  <div className="relative z-10">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-surface/60">
                        <FileText className="h-4 w-4 text-signal" />
                        프로젝트 브리프 // AI 분석
                      </div>
                      <span className="inline-flex items-center gap-2 rounded-full border border-success/35 bg-success/10 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-success">
                        <span className="h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_10px_currentColor]" />
                        분석 완료
                      </span>
                    </div>

                    <p className="type-label mt-9 text-signal">핵심 목표</p>
                    <h2 className="type-display mt-3 max-w-4xl text-surface">
                      {recommendation.summary}
                    </h2>

                    <dl className="mt-8 grid gap-2 sm:grid-cols-3">
                      <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
                        <dt className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-surface/45">
                          핵심 사용자
                        </dt>
                        <dd className="type-title mt-1 text-surface">
                          {recommendation.targetUsers.length}개 사용자군
                        </dd>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
                        <dt className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-surface/45">
                          MVP 범위
                        </dt>
                        <dd className="type-title mt-1 text-surface">
                          {recommendation.mainFeatures.length}개 핵심 기능
                        </dd>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
                        <dt className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-surface/45">
                          제작 난이도
                        </dt>
                        <dd className="type-title mt-1 text-surface">{recommendation.difficulty}</dd>
                      </div>
                    </dl>
                  </div>
                </header>

                <div className="p-5 sm:p-8">
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
                    <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
                      <BriefList
                        eyebrow="누구를 위한 서비스인가"
                        icon={Flag}
                        items={recommendation.targetUsers}
                        tone="tile-blue"
                        title="핵심 사용자"
                      />
                      <BriefList
                        eyebrow="무엇을 먼저 만들 것인가"
                        icon={ClipboardList}
                        items={recommendation.mainFeatures}
                        ordered
                        tone="tile-violet"
                        title="MVP 핵심 기능"
                      />
                    </div>

                    <aside className="relative overflow-hidden rounded-[1.25rem] bg-ink p-5 text-surface shadow-strong before:absolute before:-right-16 before:-top-16 before:h-44 before:w-44 before:rounded-full before:bg-signal/25 before:blur-3xl sm:p-6">
                      <div className="relative z-10">
                        <div className="flex items-center gap-2">
                          <Wrench className="h-4 w-4 text-signal" />
                          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-surface/55">
                            빌드 사양
                          </p>
                        </div>
                        <dl className="mt-6 space-y-5">
                          <div className="border-b border-white/10 pb-4">
                            <dt className="type-label text-surface/45">제작 도구</dt>
                            <dd className="type-title mt-1 text-surface">
                              {selectedTool ? selectedToolInfo.name : recommendedToolInfo.name}
                            </dd>
                            {!selectedTool ? (
                              <span className="mt-1 block text-xs font-semibold text-signal">AI 추천</span>
                            ) : null}
                          </div>
                          <div className="border-b border-white/10 pb-4">
                            <dt className="type-label text-surface/45">서비스 형태</dt>
                            <dd className="type-title mt-1 text-surface">
                              {selectedServiceType
                                ? selectedServiceInfo.title
                                : recommendedServiceInfo.title}
                            </dd>
                            {!selectedServiceType ? (
                              <span className="mt-1 block text-xs font-semibold text-signal">AI 추천</span>
                            ) : null}
                          </div>
                          <div>
                            <dt className="type-label text-surface/45">추천 스택</dt>
                            <dd className="mt-3 flex flex-wrap gap-1.5">
                              {displayedStack.map((item) => (
                                <span
                                  className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-surface/75"
                                  key={item}
                                >
                                  {item}
                                </span>
                              ))}
                            </dd>
                          </div>
                        </dl>
                        <button
                          className="mt-7 flex items-center gap-2 text-sm font-bold text-signal hover:text-surface"
                          onClick={() => setResource("concept")}
                          type="button"
                        >
                          <Lightbulb className="h-4 w-4" />
                          시작 전 핵심 원칙 보기
                          <ChevronRight className="ml-auto h-4 w-4" />
                        </button>
                      </div>
                    </aside>
                  </div>

                  <section className="mt-8 border-t border-line pt-8">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-signal-soft text-signal-ink">
                        <Rocket className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-signal-ink">
                          미션 루트
                        </p>
                        <h3 className="type-title mt-1 text-ink">구현 경로</h3>
                      </div>
                    </div>
                    <ol className="stagger mt-5 grid gap-3 lg:grid-cols-5">
                      {displayedRoadmap.map((item, index) => (
                        <li
                          className={
                            "relative rounded-xl border p-4 " +
                            (index === 0
                              ? "border-signal/35 bg-signal-soft"
                              : "border-line bg-canvas")
                          }
                          key={item}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] font-bold text-signal-ink">
                              M-{String(index + 1).padStart(2, "0")}
                            </span>
                            <span className="h-1.5 w-1.5 rounded-full bg-signal/50" />
                          </div>
                          <p className="mt-3 text-sm font-semibold leading-6 text-ink">{item}</p>
                        </li>
                      ))}
                    </ol>
                  </section>
                </div>
              </article>
            )}
          </div>
        ) : null}

        {shapeTab === "tool" ? (
          <div className="mt-8">
            <SectionHeading
              description="화려한 결과보다 현재 프로젝트를 끝까지 다루기 좋은 도구를 고릅니다."
              title="빌드 파트너 선택"
            />
            <div className="mt-6 rounded-xl border border-signal/20 bg-signal-soft px-4 py-3">
              <p className="text-xs font-bold text-signal-ink">
                추천 · {recommendedToolInfo.name}
              </p>
              <p className="mt-1 text-sm leading-6 text-ink">{recommendation.reasons[1]}</p>
            </div>
            <div className="stagger mt-4 space-y-3">
              {tools.map((tool, index) => {
                const selected = selectedTool === tool.slug;
                const recommended = recommendation.recommendedTool === tool.slug;
                const Icon = toolIcons[tool.slug];
                return (
                  <div
                    className={
                      `semantic-tile ${toolThemes[tool.slug]} overflow-hidden rounded-[1.125rem] text-ink transition-all hover:shadow-soft ` +
                      (selected ? "is-selected" : "")
                    }
                    key={tool.slug}
                  >
                    <button
                      aria-pressed={selected}
                      className="grid w-full gap-4 px-4 py-6 text-left sm:grid-cols-[56px_48px_minmax(0,1fr)_auto] sm:items-center"
                      onClick={() => {
                        setSelectedTool(tool.slug);
                        setNotice(null);
                      }}
                      type="button"
                    >
                      <span
                        className={
                          "font-mono text-xs font-semibold " +
                          (selected ? "text-signal" : "text-muted")
                        }
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span
                        className={
                          "grid h-10 w-10 place-items-center border " +
                          (selected
                            ? "semantic-icon border-transparent"
                            : "border-line bg-surface/70 text-muted")
                        }
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="type-title block">
                          {tool.name}
                        </span>
                        <span
                          className={
                            "type-body mt-1 block text-muted"
                          }
                        >
                          {tool.tagline}
                        </span>
                      </span>
                      <span className="flex items-center gap-2 text-xs font-bold">
                        {selected ? "선택됨" : recommended ? "추천 · 선택" : "선택"}
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    </button>
                    {selected ? (
                      <div className="grid gap-8 border-t border-line px-4 py-7 sm:ml-[104px] md:grid-cols-2">
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-signal">
                            잘 맞는 이유
                          </p>
                          <p className="mt-3 text-sm font-semibold leading-6">{tool.bestFor}</p>
                          <ul className="type-body mt-4 space-y-2 text-muted">
                            {tool.strengths.map((item) => (
                              <li className="flex gap-2" key={item}>
                                <Check className="mt-1 h-4 w-4 shrink-0 text-signal" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-signal">
                            먼저 알아둘 점
                          </p>
                          <ul className="type-body mt-3 space-y-3 text-muted">
                            {tool.cautions.map((item) => (
                              <li className="flex gap-2" key={item}>
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-signal" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {shapeTab === "service" ? (
          <div className="mt-8">
            <SectionHeading
              description="사용 환경을 기준으로 결과물의 형태와 필요한 화면을 결정합니다."
              title="서비스 형태 선택"
            />
            <div className="mt-6 rounded-xl border border-signal/20 bg-signal-soft px-4 py-3">
              <p className="text-xs font-bold text-signal-ink">
                추천 · {recommendedServiceInfo.title}
              </p>
              <p className="mt-1 text-sm leading-6 text-ink">{recommendation.reasons[0]}</p>
            </div>
            <div className="stagger mt-6 grid gap-3 lg:grid-cols-12">
              {serviceTypes.map((service, index) => {
                const selected = selectedServiceType === service.id;
                const recommended = recommendation.recommendedServiceType === service.id;
                const Icon = serviceIcons[service.id];
                return (
                  <button
                    aria-pressed={selected}
                    className={
                      `semantic-tile ${serviceThemes[service.id]} ${serviceLayouts[service.id]} min-h-64 rounded-[1.25rem] p-6 text-left text-ink hover:-translate-y-1 hover:shadow-soft ` +
                      (selected ? "is-selected" : "")
                    }
                    key={service.id}
                    onClick={() => selectServiceType(service.id)}
                    type="button"
                  >
                    <span className="flex items-start justify-between">
                      <span className="font-mono text-xs font-semibold">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {selected ? (
                        <span className="grid h-7 w-7 place-items-center rounded-full bg-signal text-white">
                          <Check className="h-4 w-4" />
                        </span>
                      ) : recommended ? (
                        <span className="font-mono text-[10px] font-bold text-signal-ink">추천</span>
                      ) : (
                        <Icon className="h-5 w-5 text-muted" />
                      )}
                    </span>
                    <span className="type-title mt-14 block">
                      {service.title}
                    </span>
                    <span
                      className={
                        "type-body mt-3 block text-muted"
                      }
                    >
                      {service.description}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-signal-ink">
                  기술이 연결되는 순서
                </p>
                <div className="mt-5 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                  {displayedStack.map((item, index) => (
                    <div className="contents" key={item}>
                      <span className="border border-line bg-surface px-3 py-3 text-center text-xs font-bold text-ink">
                        {item}
                      </span>
                      {index < displayedStack.length - 1 ? (
                        <ArrowRight className="mx-auto h-4 w-4 rotate-90 text-signal-ink sm:rotate-0" />
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-l border-line pl-6">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                  필요한 화면
                </p>
                <ul className="mt-4 space-y-3">
                  {selectedServiceInfo.screens.map((screen) => (
                    <li className="flex gap-3 text-sm font-semibold text-ink" key={screen}>
                      <span className="mt-2 h-1.5 w-1.5 bg-signal" />
                      {screen}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-line pt-6 sm:flex-row sm:items-center">
          <p className="max-w-xl text-sm leading-6 text-muted">
            브리프와 제작 방식을 확인했다면 첫 번째 실제 작업을 시작하세요. 이후 선택은 언제든
            이 화면에서 바꿀 수 있습니다.
          </p>
          <PrimaryButton icon={Play} onClick={startBuild}>
            제작 시작하기
          </PrimaryButton>
        </div>
      </section>
    );
  }

  function renderBuildPhase() {
    if (!recommendation) {
      return (
        <ProjectEmptyState
          description="먼저 프로젝트 브리프를 만들면 현재 프로젝트에 맞는 작업 목록이 준비됩니다."
          onAction={() => navigatePhase("start")}
        />
      );
    }

    const doneCount = checklistItems.filter(
      (item) => checklistStatuses[item.id] === "done",
    ).length;

    return (
      <section>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Eyebrow>실제 제작 · 03</Eyebrow>
            <h1 className="type-display mt-4 text-ink">
              오늘 필요한 한 단계에만
              <br />
              집중하세요.
            </h1>
          </div>
          <div className="w-full max-w-xs">
            <ProgressBar
              label={"완료한 작업 " + doneCount + "/" + checklistItems.length}
              value={projectProgress.phases.build.percent}
            />
          </div>
        </div>

        <div className="mt-10">
          {currentMission ? (
            <MissionCard
              item={currentMission}
              onBlocked={() => setChecklist(currentMission, "blocked")}
              onComplete={() => setChecklist(currentMission, "done")}
              onStart={() => setChecklist(currentMission, "active")}
              status={checklistStatuses[currentMission.id] ?? "pending"}
            />
          ) : (
            <div className="rounded-[1.25rem] border border-success/20 bg-success/10 px-5 py-8 sm:px-8">
              <CheckCircle2 className="h-8 w-8 text-success" />
              <h2 className="type-display mt-5 text-ink">
                제작 체크리스트를 모두 완료했습니다.
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                이제 실제 공개 전에 비밀 정보, 핵심 사용자 흐름, 공유 주소를 마지막으로 점검하세요.
              </p>
              <PrimaryButton className="mt-6" icon={Rocket} onClick={() => navigatePhase("ship")}>
                공개 준비하기
              </PrimaryButton>
            </div>
          )}
        </div>

        <div className="mt-14">
          <SectionHeading
            description="진행 중인 작업은 하나만 두는 것이 좋습니다. 막히면 해당 문맥이 해결 도우미로 자동 전달됩니다."
            title="전체 작업"
          />
          <div className="stagger mt-2">
            {checklistItems.map((item, index) => (
              <TaskRow
                index={index}
                item={item}
                key={item.id}
                onChange={(status) => setChecklist(item, status)}
                status={checklistStatuses[item.id] ?? "pending"}
              />
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-3 border-t border-line pt-6">
          <SecondaryButton icon={ClipboardList} onClick={() => setResource("prompts")}>
            작업 프롬프트 열기
          </SecondaryButton>
          <SecondaryButton icon={BookOpen} onClick={() => setResource("terms")}>
            용어 찾아보기
          </SecondaryButton>
          <SecondaryButton icon={Wrench} onClick={() => setResource("error")}>
            막힌 내용 해결하기
          </SecondaryButton>
        </div>
      </section>
    );
  }

  function renderShipPhase() {
    if (!recommendation) {
      return (
        <ProjectEmptyState
          description="프로젝트 브리프와 제작 작업이 있어야 공개 준비도를 계산할 수 있습니다."
          onAction={() => navigatePhase("start")}
        />
      );
    }

    const deployDone = deploymentItems.filter(
      (item) => deploymentStatuses[item.id] === "done",
    ).length;
    const ready =
      projectProgress.phases.build.percent === 100 &&
      projectProgress.phases.ship.percent === 100;
    const remainingRisks =
      checklistItems.filter((item) => checklistStatuses[item.id] !== "done").length +
      deploymentItems.filter((item) => deploymentStatuses[item.id] !== "done").length +
      Number(!verifiedDeploymentUrl || !deploymentUrlConfirmed);

    return (
      <section>
        <Eyebrow>세상에 공개 · 04</Eyebrow>
        <div className="mt-4 grid gap-8 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-end">
          <div>
            <h1 className="type-display text-ink">
              링크를 공유할 수 있을 때
              <br />
              프로젝트는 비로소 완성됩니다.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted">
              체크박스를 여는 것만으로 진행률이 오르지 않습니다. 실제 점검 완료와 배포 URL이
              있어야 공개 단계가 끝납니다.
            </p>
          </div>
          <div className="border-l-2 border-signal pl-5">
            <p className="font-mono text-5xl font-black tracking-[-0.06em] text-ink">
              {projectProgress.phases.ship.percent}%
            </p>
            <p className="mt-2 text-xs font-bold text-muted">
              공개 준비 · {remainingRisks}개 확인 필요
            </p>
          </div>
        </div>

        {ready ? (
          <div className="mt-10 rounded-[1.25rem] border border-success/20 bg-success/10 px-5 py-8 sm:px-8 sm:py-10">
            <Flag className="h-8 w-8 text-success" />
            <h2 className="type-display mt-5 text-ink">
              서비스가 세상에 나왔습니다.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
              {recommendation.summary}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                className="action-button action-button--primary"
                href={verifiedDeploymentUrl}
                rel="noreferrer"
                target="_blank"
              >
                <ExternalLink className="h-4 w-4" />
                공개 결과 열기
              </a>
              <SecondaryButton
                icon={Copy}
                onClick={() =>
                  void copyText(
                    recommendation.summary + "\n" + verifiedDeploymentUrl,
                    "프로젝트 소개와 배포 URL을 복사했습니다.",
                  )
                }
              >
                공유 문구 복사
              </SecondaryButton>
            </div>
          </div>
        ) : null}

        <div className="mt-12 grid gap-12 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <SectionHeading
              description={"완료한 점검 " + deployDone + "/" + deploymentItems.length}
              title="공개 전 최종 점검"
            />
            <div className="stagger mt-2">
              {deploymentItems.map((item, index) => (
                <TaskRow
                  index={index}
                  item={item}
                  key={item.id}
                  onChange={(status) => setDeployCheck(item, status)}
                  status={deploymentStatuses[item.id] ?? "pending"}
                />
              ))}
            </div>
          </div>
          <aside className="rounded-[1.25rem] border border-line bg-surface p-6 shadow-soft">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-signal-ink">
              최종 산출물
            </p>
            <h2 className="type-title mt-3 text-ink">
              {activeServiceType === "software" ? "공유 URL 기록" : "배포 URL 기록"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              {activeServiceType === "software"
                ? "저장소나 다운로드 페이지의 실제 주소를 넣고 직접 열리는지 확인하세요."
                : "Vercel 등에서 발급된 실제 주소를 넣고 직접 열리는지 확인하세요."}
            </p>
            <label className="mt-6 block">
              <span className="mb-2 block text-xs font-bold text-ink">공유 주소</span>
              <input
                className="field"
                aria-invalid={Boolean(deploymentUrl && !verifiedDeploymentUrl)}
                inputMode="url"
                onChange={(event) => {
                  setDeploymentUrl(event.target.value);
                  setDeploymentUrlConfirmed(false);
                }}
                placeholder="https://my-project.vercel.app"
                type="url"
                value={deploymentUrl}
              />
            </label>
            {deploymentUrl ? (
              verifiedDeploymentUrl ? (
                <a
                  className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-signal-ink hover:underline"
                  href={verifiedDeploymentUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  새 탭에서 주소 확인하기
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : (
                <p className="mt-3 text-xs font-semibold text-danger">
                  localhost가 아닌 https:// 전체 주소를 입력해주세요.
                </p>
              )
            ) : null}

            {verifiedDeploymentUrl ? (
              <label className="mt-5 flex cursor-pointer items-start gap-3 border border-line bg-surface p-3 text-sm leading-6 text-ink">
                <input
                  checked={deploymentUrlConfirmed}
                  className="mt-1 h-4 w-4 accent-[rgb(var(--color-signal))]"
                  onChange={(event) => setDeploymentUrlConfirmed(event.target.checked)}
                  type="checkbox"
                />
                <span>새 탭에서 주소가 실제로 열리고 핵심 화면이 보이는 것을 확인했습니다.</span>
              </label>
            ) : null}

            <div className="mt-8 border-t border-line pt-6">
              <p className="text-xs font-bold text-muted">프로젝트 전체 진행률</p>
              <div className="mt-3">
                <ProgressBar value={projectProgress.percent} />
              </div>
            </div>
          </aside>
        </div>
      </section>
    );
  }

  function renderResource() {
    if (!resource) return null;

    if (resource === "concept") {
      return (
        <div className="divide-y divide-line border-y border-line">
          {conceptCards.map((card, index) => (
            <section className="grid grid-cols-[40px_minmax(0,1fr)] gap-3 py-6" key={card.title}>
              <span className="font-mono text-xs font-semibold text-signal-ink">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="type-title text-ink">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{card.body}</p>
              </div>
            </section>
          ))}
        </div>
      );
    }

    if (resource === "terms") {
      return (
        <div>
          <label className="relative block">
            <span className="sr-only">용어 검색</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              className="field pl-10"
              onChange={(event) => setTermSearch(event.target.value)}
              placeholder="터미널, Vercel, 환경변수 검색"
              value={termSearch}
            />
          </label>
          <div className="mt-7 divide-y divide-line border-y border-line">
            {filteredTerms.map((term) => (
              <article className="py-6" key={term.term}>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-signal-ink">
                  {term.category}
                </p>
                <h3 className="type-title mt-2 text-ink">
                  {term.term}
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted">{term.plainDescription}</p>
                <p className="mt-4 border-l-2 border-line pl-4 text-sm leading-6 text-ink">
                  {term.examples[activeRole]}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {term.related.map((item) => (
                    <span
                      className="border border-line bg-canvas px-2 py-1 font-mono text-[10px] text-muted"
                      key={item}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      );
    }

    if (resource === "prompts") {
      return (
        <div>
          <label className="relative block">
            <span className="sr-only">프롬프트 검색</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              className="field pl-10"
              onChange={(event) => setPromptSearch(event.target.value)}
              placeholder="배포, 에러, 모바일 검색"
              value={promptSearch}
            />
          </label>
          <p className="mt-3 text-xs leading-5 text-muted">
            현재 선택한 {selectedToolInfo.name}에 맞는 템플릿을 보여줍니다.
          </p>
          <div className="mt-7 space-y-9">
            {filteredPrompts.map((prompt) => (
              <article className="border-t border-line pt-6" key={prompt.id}>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-signal-ink">
                  {prompt.category}
                </p>
                <h3 className="type-title mt-2 text-ink">
                  {prompt.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted">{prompt.description}</p>
                <pre className="mt-4 max-h-64 overflow-auto whitespace-pre-wrap rounded-xl border border-ink bg-ink p-4 text-xs leading-6 text-surface">
                  {prompt.template}
                </pre>
                <SecondaryButton
                  className="mt-3"
                  icon={Copy}
                  onClick={() => copyPrompt(prompt.template)}
                >
                  프로젝트 내용으로 복사
                </SecondaryButton>
              </article>
            ))}
          </div>
        </div>
      );
    }

    if (resource === "error") {
      return (
        <div>
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-ink">
              에러 메시지 또는 막힌 상황
            </span>
            <span className="mb-3 block text-xs leading-5 text-muted">
              API 키와 DB 주소는 지우고, 실행한 명령어와 에러의 첫 부분을 함께 적어주세요.
            </span>
            <textarea
              className="field min-h-52 resize-y font-mono text-xs"
              onChange={(event) => setErrorMessage(event.target.value)}
              placeholder="예: npm run build 실행 후 Module not found..."
              value={errorMessage}
            />
          </label>
          <PrimaryButton
            className="mt-4 w-full"
            disabled={busy === "error"}
            icon={Wrench}
            loading={busy === "error"}
            onClick={solveCurrentError}
          >
            해결 순서 만들기
          </PrimaryButton>

          {errorSolution ? (
            <div className="mt-9 border-t border-line pt-7">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-danger">
                분석 결과
              </p>
              <h3 className="type-title mt-2 text-ink">
                {errorSolution.summary}
              </h3>
              <h4 className="type-label mt-7 text-ink">가능성이 높은 원인</h4>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
                {errorSolution.possibleCauses.map((item) => (
                  <li className="flex gap-3" key={item}>
                    <AlertTriangle className="mt-1 h-4 w-4 shrink-0 text-danger" />
                    {item}
                  </li>
                ))}
              </ul>
              <h4 className="type-label mt-7 text-ink">확인 순서</h4>
              <ol className="mt-3">
                {errorSolution.solutionSteps.map((item, index) => (
                  <li
                    className="grid grid-cols-[32px_minmax(0,1fr)] border-t border-line py-3 text-sm leading-6"
                    key={item}
                  >
                    <span className="font-mono text-xs text-signal-ink">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {item}
                  </li>
                ))}
              </ol>
              <SecondaryButton
                className="mt-5"
                icon={Copy}
                onClick={() =>
                  void copyText(
                    errorSolution.suggestedPrompt.replaceAll(
                      "{{errorMessage}}",
                      errorMessage,
                    ),
                    "에러 해결 프롬프트를 복사했습니다.",
                  )
                }
              >
                AI에게 물어볼 문장 복사
              </SecondaryButton>
            </div>
          ) : null}
        </div>
      );
    }

    return (
      <div className="flex min-h-full flex-col">
        <div className="border-l-2 border-signal bg-signal-soft px-4 py-3">
          <p className="text-xs font-bold text-ink">현재 알고 있는 문맥</p>
          <p className="mt-1 text-xs leading-5 text-muted">
            {phaseMetadata[safePhase].label} · {selectedToolInfo.name} ·{" "}
            {selectedServiceInfo.title}
          </p>
        </div>
        <div
          aria-live="polite"
          className="mt-6 min-h-0 flex-1 space-y-4 overflow-y-auto"
        >
          {chatMessages.map((message, index) => (
            <div
              className={
                "max-w-[92%] border px-4 py-3 text-sm leading-6 " +
                (message.role === "user"
                  ? "ml-auto border-ink bg-ink text-surface"
                  : "border-line bg-canvas text-ink")
              }
              key={message.role + "-" + index}
            >
              <p>{message.content}</p>
              {message.links?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {message.links.map((link) => (
                    <button
                      className={
                        "border px-2 py-1 text-[11px] font-bold " +
                        (message.role === "user"
                          ? "border-surface/30 text-surface"
                          : "border-line bg-surface text-signal-ink")
                      }
                      key={link}
                      onClick={() => followAssistantLink(link)}
                      type="button"
                    >
                      {link}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
        <div className="sticky bottom-0 mt-6 border-t border-line bg-surface pt-4 safe-area-bottom">
          <label className="grid grid-cols-[minmax(0,1fr)_44px] gap-2">
            <span className="sr-only">프로젝트 코치에게 질문</span>
            <input
              className="field"
              onChange={(event) => setChatInput(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.nativeEvent.isComposing &&
                  !event.shiftKey
                ) {
                  event.preventDefault();
                  void sendChatMessage();
                }
              }}
              placeholder="지금 막힌 내용을 적어주세요"
              value={chatInput}
            />
            <button
              aria-label="질문 보내기"
              className="icon-button border-ink bg-ink text-surface"
              disabled={busy === "chat"}
              onClick={() => void sendChatMessage()}
              type="button"
            >
              <Send className="h-4 w-4" />
            </button>
          </label>
        </div>
      </div>
    );
  }

  const phaseContent =
    safePhase === "start"
      ? renderStartPhase()
      : safePhase === "shape"
        ? renderShapePhase()
        : safePhase === "build"
          ? renderBuildPhase()
          : renderShipPhase();

  const activeResourceMeta = resource ? resourceMetadata[resource] : null;

  return (
    <div className="game-shell min-h-screen text-ink">
      <MobilePhaseNav
        activePhase={safePhase}
        onSelect={navigatePhase}
        overallProgress={projectProgress.percent}
        progress={projectProgress.phases}
      />
      <PhaseRail
        activePhase={safePhase}
        onSelect={navigatePhase}
        overallProgress={projectProgress.percent}
        progress={projectProgress.phases}
      />
      <main className="min-w-0 pb-36 lg:pb-16 lg:pl-[280px]">
        <div className="mx-auto max-w-[1120px] px-4 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16">
          {notice ? <InlineNotice>{notice}</InlineNotice> : null}
          <div className="phase-enter" key={safePhase}>
            {phaseContent}
          </div>
        </div>
      </main>

      <ResourceDock onOpen={setResource} />

      {activeResourceMeta ? (
        <ResourceDrawer
          eyebrow={activeResourceMeta.eyebrow}
          onClose={closeResource}
          open={Boolean(resource)}
          title={activeResourceMeta.title}
        >
          <ResourceSwitcher activeResource={resource ?? "coach"} onChange={setResource} />
          {notice ? <InlineNotice>{notice}</InlineNotice> : null}
          {renderResource()}
        </ResourceDrawer>
      ) : null}
    </div>
  );
}
