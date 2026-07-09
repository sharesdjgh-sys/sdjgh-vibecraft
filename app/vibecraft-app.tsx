"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  Bot,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  CircleDashed,
  ClipboardList,
  Code2,
  Copy,
  Database,
  FileText,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  Loader2,
  MessageSquare,
  PanelRightOpen,
  Rocket,
  School,
  Search,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Terminal,
  Upload,
  UserRound,
  Wrench,
  XCircle,
} from "lucide-react";
import {
  baseChecklist,
  conceptCards,
  deploymentChecks,
  promptTemplates,
  roleOptions,
  serviceTypes,
  terms,
  tools,
} from "@/lib/vibecraft-data";
import type {
  ChecklistItem,
  ChecklistStatus,
  ErrorSolution,
  Recommendation,
  Role,
  ServiceType,
  ToolSlug,
} from "@/lib/types";

type StepId =
  | "role"
  | "start"
  | "recommendation"
  | "concept"
  | "tools"
  | "service"
  | "checklist"
  | "terms"
  | "prompts"
  | "error"
  | "deploy";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  links?: string[];
};

const stepMeta: Array<{
  id: StepId;
  label: string;
  description: string;
  icon: typeof GraduationCap;
}> = [
  { id: "role", label: "역할", description: "설명 톤 선택", icon: GraduationCap },
  { id: "start", label: "시작", description: "기획서 또는 아이디어", icon: Upload },
  { id: "recommendation", label: "추천", description: "맞춤 로드맵", icon: LayoutDashboard },
  { id: "concept", label: "개념", description: "바이브코딩 이해", icon: BookOpen },
  { id: "tools", label: "도구", description: "Codex, Claude, Antigravity", icon: Code2 },
  { id: "service", label: "유형", description: "웹, 모바일, SW", icon: Smartphone },
  { id: "checklist", label: "실습", description: "완료 상태 추적", icon: ListChecks },
  { id: "terms", label: "용어", description: "초보자 사전", icon: Search },
  { id: "prompts", label: "프롬프트", description: "복사해서 사용", icon: ClipboardList },
  { id: "error", label: "에러", description: "해결 순서", icon: Wrench },
  { id: "deploy", label: "점검", description: "배포 전 확인", icon: Rocket },
];

const roleIcons: Record<Role, typeof GraduationCap> = {
  student: GraduationCap,
  teacher: School,
  adult: UserRound,
};

const toolIcons: Record<ToolSlug, typeof Code2> = {
  codex: Code2,
  claude: MessageSquare,
  antigravity: Sparkles,
};

const serviceIcons: Record<ServiceType, typeof Code2> = {
  web: Code2,
  "mobile-web": Smartphone,
  software: Terminal,
};

const statusMeta: Record<
  ChecklistStatus,
  {
    label: string;
    icon: typeof Circle;
    className: string;
  }
> = {
  pending: {
    label: "대기",
    icon: Circle,
    className: "border-line bg-white text-ink",
  },
  active: {
    label: "진행",
    icon: CircleDashed,
    className: "border-amber/30 bg-amber/10 text-amber",
  },
  done: {
    label: "완료",
    icon: CheckCircle2,
    className: "border-pine/30 bg-mint text-pine",
  },
  blocked: {
    label: "막힘",
    icon: XCircle,
    className: "border-blush/30 bg-blush/10 text-blush",
  },
};

function usePersistentState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored) {
        setValue(JSON.parse(stored) as T);
      }
    } catch {
      setValue(initialValue);
    } finally {
      setReady(true);
    }
  }, [key]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, ready, value]);

  return [value, setValue] as const;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? "요청을 처리하지 못했습니다.");
  }

  return data;
}

function getStepIndex(step: StepId) {
  return Math.max(
    0,
    stepMeta.findIndex((item) => item.id === step),
  );
}

export function VibeCraftApp() {
  const [sessionId] = usePersistentState("vc-session-id", "local-session");
  const [role, setRole] = usePersistentState<Role | null>("vc-role", null);
  const [step, setStep] = usePersistentState<StepId>("vc-step", "role");
  const [recommendation, setRecommendation] = usePersistentState<Recommendation | null>("vc-recommendation", null);
  const [selectedTool, setSelectedTool] = usePersistentState<ToolSlug | null>("vc-tool", null);
  const [selectedServiceType, setSelectedServiceType] = usePersistentState<ServiceType | null>("vc-service-type", null);
  const [checklistStatuses, setChecklistStatuses] = usePersistentState<Record<string, ChecklistStatus>>("vc-checklist", {});
  const [deploymentStatuses, setDeploymentStatuses] = usePersistentState<Record<string, ChecklistStatus>>("vc-deploy-checks", {});
  const [planText, setPlanText] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [idea, setIdea] = useState("");
  const [interviewQuestions, setInterviewQuestions] = useState<string[]>([]);
  const [interviewAnswers, setInterviewAnswers] = useState<Record<string, string>>({});
  const [termSearch, setTermSearch] = useState("");
  const [promptSearch, setPromptSearch] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [errorSolution, setErrorSolution] = useState<ErrorSolution | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "현재 단계에서 막힌 내용을 적어주세요. 선택한 역할과 도구 흐름에 맞춰 다음 행동을 제안합니다.",
      links: ["실습", "용어", "에러"],
    },
  ]);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const activeRole = role ?? "student";
  const activeTool = selectedTool ?? recommendation?.recommendedTool ?? "codex";
  const activeServiceType = selectedServiceType ?? recommendation?.recommendedServiceType ?? "web";
  const selectedToolInfo = tools.find((tool) => tool.slug === activeTool) ?? tools[0];
  const selectedServiceInfo = serviceTypes.find((item) => item.id === activeServiceType) ?? serviceTypes[0];
  const currentStep = stepMeta[getStepIndex(step)];

  const filteredTerms = useMemo(() => {
    const query = termSearch.trim().toLowerCase();
    if (!query) {
      return terms;
    }

    return terms.filter((item) => {
      return (
        item.term.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.plainDescription.toLowerCase().includes(query)
      );
    });
  }, [termSearch]);

  const filteredPrompts = useMemo(() => {
    const query = promptSearch.trim().toLowerCase();

    return promptTemplates.filter((item) => {
      const matchesTool = item.tool === "all" || item.tool === activeTool;
      const matchesQuery =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query);

      return matchesTool && matchesQuery;
    });
  }, [activeTool, promptSearch]);

  const checklistItems = recommendation?.checklist ?? baseChecklist;

  function moveStep(delta: number) {
    const nextIndex = Math.min(stepMeta.length - 1, Math.max(0, getStepIndex(step) + delta));
    setStep(stepMeta[nextIndex].id);
  }

  function updateChecklistStatus(item: ChecklistItem, status: ChecklistStatus) {
    setChecklistStatuses((current) => ({
      ...current,
      [item.id]: status,
    }));

    void fetch("/api/checklist-progress", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId,
        checklistId: item.id,
        status,
      }),
    });
  }

  function updateDeploymentStatus(item: ChecklistItem, status: ChecklistStatus) {
    setDeploymentStatuses((current) => ({
      ...current,
      [item.id]: status,
    }));
  }

  async function handleFileUpload(file: File) {
    setUploadedFileName(file.name);
    setNotice(null);

    if (file.size > 1024 * 1024 * 4) {
      setNotice("파일은 4MB 이하로 준비해주세요. 긴 기획서는 핵심 부분만 붙여넣는 편이 안전합니다.");
      return;
    }

    if (file.name.toLowerCase().endsWith(".pdf")) {
      setPlanText(
        `[PDF 파일명: ${file.name}]\n현재 MVP는 txt, md 텍스트 추출을 우선 지원합니다. PDF는 핵심 내용을 아래 입력창에 붙여넣으면 같은 방식으로 분석할 수 있습니다.`,
      );
      setNotice("PDF 파일은 선택됐습니다. 정확한 분석을 위해 PlanCraft 요약문을 입력창에 함께 붙여넣어주세요.");
      return;
    }

    const text = await file.text();
    setPlanText(text);
  }

  async function analyzePlan() {
    if (!role) {
      setNotice("먼저 역할을 선택해주세요.");
      setStep("role");
      return;
    }

    if (planText.trim().length < 10) {
      setNotice("기획서 내용이 너무 짧습니다. 핵심 기능과 사용자를 포함해 입력해주세요.");
      return;
    }

    setBusy("analyze");
    setNotice(null);

    try {
      const result = await postJson<Recommendation>("/api/analyze-plan", {
        role,
        extractedText: planText,
      });
      setRecommendation(result);
      setSelectedTool(result.recommendedTool);
      setSelectedServiceType(result.recommendedServiceType);
      setStep("recommendation");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "추천 결과를 만들지 못했습니다.");
    } finally {
      setBusy(null);
    }
  }

  async function requestInterviewQuestions() {
    if (!role) {
      setNotice("먼저 역할을 선택해주세요.");
      setStep("role");
      return;
    }

    if (idea.trim().length < 4) {
      setNotice("만들고 싶은 서비스를 한 문장 이상으로 입력해주세요.");
      return;
    }

    setBusy("idea-questions");
    setNotice(null);

    try {
      const result = await postJson<{
        nextQuestions: string[];
        projectBrief: null;
        recommendation: null;
      }>("/api/idea-interview", {
        role,
        idea,
      });
      setInterviewQuestions(result.nextQuestions);
      setInterviewAnswers({});
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "질문을 만들지 못했습니다.");
    } finally {
      setBusy(null);
    }
  }

  async function finishInterview() {
    if (!role) {
      setNotice("먼저 역할을 선택해주세요.");
      setStep("role");
      return;
    }

    setBusy("idea-result");
    setNotice(null);

    try {
      const result = await postJson<{
        nextQuestions: string[];
        projectBrief: unknown;
        recommendation: Recommendation;
      }>("/api/idea-interview", {
        role,
        idea,
        answers: interviewAnswers,
      });

      setRecommendation(result.recommendation);
      setSelectedTool(result.recommendation.recommendedTool);
      setSelectedServiceType(result.recommendation.recommendedServiceType);
      setStep("recommendation");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "추천 결과를 만들지 못했습니다.");
    } finally {
      setBusy(null);
    }
  }

  async function solveCurrentError() {
    if (errorMessage.trim().length < 1) {
      setNotice("에러 메시지를 입력해주세요.");
      return;
    }

    setBusy("error");
    setNotice(null);

    try {
      const result = await postJson<ErrorSolution>("/api/solve-error", {
        role: activeRole,
        selectedTool: activeTool,
        currentStep: currentStep.label,
        errorMessage,
      });
      setErrorSolution(result);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "에러를 분석하지 못했습니다.");
    } finally {
      setBusy(null);
    }
  }

  async function sendChatMessage() {
    const message = chatInput.trim();
    if (!message) {
      return;
    }

    setChatInput("");
    setChatMessages((current) => [...current, { role: "user", content: message }]);

    try {
      const result = await postJson<{ answer: string; relatedLinks: string[] }>("/api/chat", {
        role: activeRole,
        message,
        currentPage: currentStep.label,
        selectedTool: activeTool,
        selectedServiceType: activeServiceType,
        projectSummary: recommendation?.summary,
      });

      setChatMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: result.answer,
          links: result.relatedLinks,
        },
      ]);
    } catch {
      setChatMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "답변을 만들지 못했습니다. 질문을 조금 더 짧게 나눠서 다시 보내주세요.",
        },
      ]);
    }
  }

  function copyPrompt(template: string) {
    const filled = template
      .replaceAll("{{projectSummary}}", recommendation?.summary ?? "내 프로젝트 설명을 여기에 붙여넣습니다.")
      .replaceAll("{{errorMessage}}", errorMessage || "에러 메시지를 여기에 붙여넣습니다.");
    void navigator.clipboard.writeText(filled);
    setNotice("프롬프트를 복사했습니다.");
  }

  function renderStep() {
    if (step === "role") {
      return (
        <section className="space-y-6">
          <SectionHeader
            eyebrow="1단계"
            title="역할을 선택하세요"
            description="선택한 역할에 따라 예시와 설명 방식이 달라집니다."
          />
          <div className="grid gap-4 md:grid-cols-3">
            {roleOptions.map((option) => {
              const Icon = roleIcons[option.id];
              const selected = role === option.id;

              return (
                <button
                  key={option.id}
                  className={`rounded-lg border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-panel ${
                    selected ? "border-pine ring-2 ring-pine/20" : "border-line"
                  }`}
                  onClick={() => {
                    setRole(option.id);
                    setStep("start");
                  }}
                  type="button"
                >
                  <Icon className="mb-4 h-7 w-7 text-pine" />
                  <h3 className="text-lg font-semibold">{option.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-ink/70">{option.description}</p>
                  <p className="mt-4 rounded-md bg-paper p-3 text-sm leading-6 text-ink/75">{option.example}</p>
                </button>
              );
            })}
          </div>
        </section>
      );
    }

    if (step === "start") {
      return (
        <section className="space-y-6">
          <SectionHeader
            eyebrow="2단계"
            title="기획서 또는 아이디어로 시작하세요"
            description="PlanCraft 기획서가 있으면 업로드하고, 없다면 만들고 싶은 서비스를 입력하세요."
          />
          <div className="grid gap-4 xl:grid-cols-2">
            <Panel title="PlanCraft 기획서 업로드" icon={Upload}>
              <div className="space-y-4">
                <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-line bg-paper p-5 text-center transition hover:border-pine">
                  <FileText className="mb-3 h-8 w-8 text-pine" />
                  <span className="text-sm font-semibold">txt, md, pdf 파일 선택</span>
                  <span className="mt-1 text-xs text-ink/60">PDF는 핵심 내용을 입력창에 함께 붙여넣으면 더 정확합니다.</span>
                  <input
                    accept=".txt,.md,.pdf,text/plain,text/markdown,application/pdf"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        void handleFileUpload(file);
                      }
                    }}
                    type="file"
                  />
                </label>
                {uploadedFileName ? <p className="text-sm text-ink/65">선택한 파일: {uploadedFileName}</p> : null}
                <textarea
                  className="min-h-44 w-full rounded-lg border border-line bg-white p-4 text-sm leading-6"
                  onChange={(event) => setPlanText(event.target.value)}
                  placeholder="기획서 핵심 내용을 붙여넣거나 업로드한 txt, md 내용을 확인하세요."
                  value={planText}
                />
                <PrimaryButton disabled={busy === "analyze"} icon={FileText} onClick={analyzePlan}>
                  {busy === "analyze" ? "분석 중" : "기획서 분석하기"}
                </PrimaryButton>
              </div>
            </Panel>

            <Panel title="기획서 없이 아이디어로 시작" icon={MessageSquare}>
              <div className="space-y-4">
                <textarea
                  className="min-h-28 w-full rounded-lg border border-line bg-white p-4 text-sm leading-6"
                  onChange={(event) => setIdea(event.target.value)}
                  placeholder="예: 동아리 모집 신청을 받고 선생님이 확인할 수 있는 모바일 웹앱을 만들고 싶어요."
                  value={idea}
                />
                <SecondaryButton disabled={busy === "idea-questions"} icon={MessageSquare} onClick={requestInterviewQuestions}>
                  {busy === "idea-questions" ? "질문 생성 중" : "AI 질문 받기"}
                </SecondaryButton>
                {interviewQuestions.length > 0 ? (
                  <div className="space-y-3">
                    {interviewQuestions.map((question) => (
                      <label className="block" key={question}>
                        <span className="text-sm font-medium">{question}</span>
                        <input
                          className="mt-2 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
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
                    <PrimaryButton disabled={busy === "idea-result"} icon={LayoutDashboard} onClick={finishInterview}>
                      {busy === "idea-result" ? "추천 생성 중" : "답변 기반 추천 만들기"}
                    </PrimaryButton>
                  </div>
                ) : null}
              </div>
            </Panel>
          </div>
        </section>
      );
    }

    if (step === "recommendation") {
      return (
        <section className="space-y-6">
          <SectionHeader
            eyebrow="3단계"
            title="맞춤 구현 로드맵"
            description="AI 추천은 시작점을 잡기 위한 제안입니다. 필요하면 도구와 서비스 유형을 직접 바꿀 수 있습니다."
          />
          {recommendation ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-pine">서비스 요약</p>
                <h3 className="mt-2 text-xl font-semibold leading-8">{recommendation.summary}</h3>
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                <MetricCard label="추천 도구" value={selectedToolInfo.name} icon={toolIcons[activeTool]} />
                <MetricCard label="추천 유형" value={selectedServiceInfo.title} icon={serviceIcons[activeServiceType]} />
                <MetricCard label="예상 난이도" value={recommendation.difficulty} icon={ShieldCheck} />
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                <Panel title="추천 이유" icon={CheckCircle2}>
                  <List items={recommendation.reasons} />
                </Panel>
                <Panel title="구현 순서" icon={ListChecks}>
                  <List items={recommendation.roadmap} ordered />
                </Panel>
              </div>
              <Panel title="추천 기술 스택" icon={Database}>
                <div className="flex flex-wrap gap-2">
                  {recommendation.recommendedStack.map((stack) => (
                    <span className="rounded-md border border-line bg-paper px-3 py-2 text-sm font-medium" key={stack}>
                      {stack}
                    </span>
                  ))}
                </div>
              </Panel>
              <div className="flex flex-wrap gap-2">
                <PrimaryButton icon={BookOpen} onClick={() => setStep("concept")}>
                  개념부터 학습하기
                </PrimaryButton>
                <SecondaryButton icon={Code2} onClick={() => setStep("tools")}>
                  도구 바로 보기
                </SecondaryButton>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="아직 추천 결과가 없습니다"
              description="기획서를 업로드하거나 아이디어 질문에 답하면 로드맵을 생성합니다."
              actionLabel="시작 화면으로 이동"
              onAction={() => setStep("start")}
            />
          )}
        </section>
      );
    }

    if (step === "concept") {
      return (
        <section className="space-y-6">
          <SectionHeader
            eyebrow="4단계"
            title="바이브코딩 핵심 개념"
            description="AI에게 맡길 일과 사람이 결정해야 할 일을 분리해서 이해합니다."
          />
          <div className="grid gap-4 md:grid-cols-2">
            {conceptCards.map((card) => (
              <div className="rounded-lg border border-line bg-white p-5 shadow-sm" key={card.title}>
                <BookOpen className="mb-4 h-6 w-6 text-pine" />
                <h3 className="text-lg font-semibold">{card.title}</h3>
                <p className="mt-3 text-sm leading-6 text-ink/70">{card.body}</p>
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (step === "tools") {
      return (
        <section className="space-y-6">
          <SectionHeader
            eyebrow="5단계"
            title="바이브코딩 도구 선택"
            description="세 도구의 성격을 비교하고 현재 프로젝트에 맞는 도구를 선택하세요."
          />
          <div className="grid gap-4 xl:grid-cols-3">
            {tools.map((tool) => {
              const Icon = toolIcons[tool.slug];
              const selected = activeTool === tool.slug;

              return (
                <button
                  className={`rounded-lg border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-panel ${
                    selected ? "border-pine ring-2 ring-pine/20" : "border-line"
                  }`}
                  key={tool.slug}
                  onClick={() => setSelectedTool(tool.slug)}
                  type="button"
                >
                  <Icon className="mb-4 h-7 w-7 text-pine" />
                  <h3 className="text-xl font-semibold">{tool.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-ink/70">{tool.tagline}</p>
                  <p className="mt-4 rounded-md bg-paper p-3 text-sm leading-6 text-ink/75">{tool.bestFor}</p>
                </button>
              );
            })}
          </div>
          <Panel title={`${selectedToolInfo.name} 단계별 가이드`} icon={toolIcons[activeTool]}>
            <div className="grid gap-3 md:grid-cols-2">
              {selectedToolInfo.guide.map((section) => (
                <div className="rounded-lg border border-line bg-paper p-4" key={section.title}>
                  <h4 className="font-semibold">{section.title}</h4>
                  <List items={section.items} />
                </div>
              ))}
            </div>
          </Panel>
        </section>
      );
    }

    if (step === "service") {
      return (
        <section className="space-y-6">
          <SectionHeader
            eyebrow="6단계"
            title="개발 서비스 유형 선택"
            description="결과물의 사용 환경에 맞춰 화면 구성과 기술 조합을 정합니다."
          />
          <div className="grid gap-4 lg:grid-cols-3">
            {serviceTypes.map((service) => {
              const Icon = serviceIcons[service.id];
              const selected = activeServiceType === service.id;

              return (
                <button
                  className={`rounded-lg border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-panel ${
                    selected ? "border-pine ring-2 ring-pine/20" : "border-line"
                  }`}
                  key={service.id}
                  onClick={() => setSelectedServiceType(service.id)}
                  type="button"
                >
                  <Icon className="mb-4 h-7 w-7 text-pine" />
                  <h3 className="text-lg font-semibold">{service.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-ink/70">{service.description}</p>
                </button>
              );
            })}
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <Panel title="추천 기술 조합" icon={Database}>
              <div className="flex flex-wrap gap-2">
                {selectedServiceInfo.stack.map((stack) => (
                  <span className="rounded-md border border-line bg-white px-3 py-2 text-sm font-medium" key={stack}>
                    {stack}
                  </span>
                ))}
              </div>
            </Panel>
            <Panel title="필요한 화면" icon={LayoutDashboard}>
              <List items={selectedServiceInfo.screens} />
            </Panel>
          </div>
        </section>
      );
    }

    if (step === "checklist") {
      return (
        <section className="space-y-6">
          <SectionHeader
            eyebrow="7단계"
            title="체크리스트 기반 실습 모드"
            description="실제 작업 상태를 표시하고 막힌 항목은 에러 해결 도우미로 넘기세요."
          />
          <div className="space-y-3">
            {checklistItems.map((item) => (
              <ChecklistRow
                item={item}
                key={item.id}
                onChange={(status) => updateChecklistStatus(item, status)}
                status={checklistStatuses[item.id] ?? "pending"}
              />
            ))}
          </div>
        </section>
      );
    }

    if (step === "terms") {
      return (
        <section className="space-y-6">
          <SectionHeader
            eyebrow="8단계"
            title="용어 사전"
            description="초보자가 자주 막히는 개발 용어를 역할별 예시와 함께 확인합니다."
          />
          <SearchBox onChange={setTermSearch} placeholder="터미널, Vercel, 환경변수 검색" value={termSearch} />
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredTerms.map((term) => (
              <div className="rounded-lg border border-line bg-white p-5 shadow-sm" key={term.term}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-pine">{term.category}</p>
                    <h3 className="mt-1 text-lg font-semibold">{term.term}</h3>
                  </div>
                  <BookOpen className="h-5 w-5 shrink-0 text-pine" />
                </div>
                <p className="mt-3 text-sm leading-6 text-ink/70">{term.plainDescription}</p>
                <p className="mt-3 rounded-md bg-paper p-3 text-sm leading-6 text-ink/75">{term.examples[activeRole]}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {term.related.map((related) => (
                    <span className="rounded-md bg-mint px-2 py-1 text-xs font-medium text-pine" key={related}>
                      {related}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (step === "prompts") {
      return (
        <section className="space-y-6">
          <SectionHeader
            eyebrow="9단계"
            title="프롬프트 템플릿"
            description="현재 프로젝트 정보를 넣어 바로 복사할 수 있는 요청문을 제공합니다."
          />
          <SearchBox onChange={setPromptSearch} placeholder="배포, 에러, 모바일 검색" value={promptSearch} />
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredPrompts.map((prompt) => (
              <div className="rounded-lg border border-line bg-white p-5 shadow-sm" key={prompt.id}>
                <p className="text-xs font-semibold uppercase tracking-wide text-pine">{prompt.category}</p>
                <h3 className="mt-2 text-lg font-semibold">{prompt.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink/70">{prompt.description}</p>
                <pre className="mt-4 max-h-40 overflow-auto rounded-lg border border-line bg-paper p-3 text-xs leading-5 text-ink/75">
                  {prompt.template}
                </pre>
                <button
                  className="mt-4 inline-flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold transition hover:border-pine hover:text-pine"
                  onClick={() => copyPrompt(prompt.template)}
                  type="button"
                >
                  <Copy className="h-4 w-4" />
                  복사
                </button>
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (step === "error") {
      return (
        <section className="space-y-6">
          <SectionHeader
            eyebrow="10단계"
            title="에러 해결 도우미"
            description="에러 메시지를 붙여넣으면 가능한 원인과 다음 확인 순서를 정리합니다."
          />
          <Panel title="에러 메시지 입력" icon={AlertTriangle}>
            <div className="space-y-4">
              <textarea
                className="min-h-44 w-full rounded-lg border border-line bg-white p-4 text-sm leading-6"
                onChange={(event) => setErrorMessage(event.target.value)}
                placeholder="터미널, Vercel, 브라우저 콘솔의 에러 메시지를 붙여넣으세요. 비밀키와 DB 주소는 제거하세요."
                value={errorMessage}
              />
              <PrimaryButton disabled={busy === "error"} icon={Wrench} onClick={solveCurrentError}>
                {busy === "error" ? "분석 중" : "해결 순서 보기"}
              </PrimaryButton>
            </div>
          </Panel>
          {errorSolution ? (
            <div className="grid gap-4 xl:grid-cols-2">
              <Panel title={errorSolution.summary} icon={AlertTriangle}>
                <h4 className="font-semibold">가능한 원인</h4>
                <List items={errorSolution.possibleCauses} />
                <h4 className="mt-4 font-semibold">해결 순서</h4>
                <List items={errorSolution.solutionSteps} ordered />
              </Panel>
              <Panel title="복사용 프롬프트" icon={ClipboardList}>
                <pre className="rounded-lg border border-line bg-paper p-3 text-xs leading-5 text-ink/75">
                  {errorSolution.suggestedPrompt.replaceAll("{{errorMessage}}", errorMessage)}
                </pre>
                <div className="mt-4 flex flex-wrap gap-2">
                  {errorSolution.relatedTerms.map((term) => (
                    <span className="rounded-md bg-mint px-2 py-1 text-xs font-medium text-pine" key={term}>
                      {term}
                    </span>
                  ))}
                </div>
              </Panel>
            </div>
          ) : null}
        </section>
      );
    }

    return (
      <section className="space-y-6">
        <SectionHeader
          eyebrow="11단계"
          title="배포 전 최종 점검"
          description="서비스 공개 전에 모바일, 보안, 환경변수, 버튼 동작을 마지막으로 확인합니다."
        />
        <div className="space-y-3">
          {deploymentChecks.map((item) => (
            <ChecklistRow
              item={item}
              key={item.id}
              onChange={(status) => updateDeploymentStatus(item, status)}
              status={deploymentStatuses[item.id] ?? "pending"}
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <div className="min-h-screen pb-28 lg:pb-0">
      <div className="mx-auto grid min-h-screen w-full max-w-[1500px] gap-4 px-4 py-4 lg:grid-cols-[280px_minmax(0,1fr)_340px] lg:px-6">
        <aside className="hidden rounded-lg border border-line bg-white p-4 shadow-sm lg:block">
          <div className="mb-5">
            <p className="text-sm font-semibold text-pine">VibeCraft</p>
            <h1 className="mt-1 text-2xl font-bold tracking-normal">구현 코치</h1>
          </div>
          <nav className="space-y-2">
            {stepMeta.map((item, index) => {
              const Icon = item.icon;
              const active = item.id === step;
              const passed = index < getStepIndex(step);

              return (
                <button
                  className={`flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition ${
                    active
                      ? "border-pine bg-mint text-pine"
                      : passed
                        ? "border-line bg-paper text-ink"
                        : "border-transparent text-ink/65 hover:bg-paper"
                  }`}
                  key={item.id}
                  onClick={() => setStep(item.id)}
                  type="button"
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{item.label}</span>
                    <span className="block truncate text-xs opacity-75">{item.description}</span>
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0">
          <header className="mb-4 rounded-lg border border-line bg-white p-4 shadow-sm lg:hidden">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-pine">VibeCraft</p>
                <h1 className="text-xl font-bold">{currentStep.label}</h1>
              </div>
              <button
                className="rounded-md border border-line p-2 text-ink"
                onClick={() => setChatOpen(true)}
                type="button"
                aria-label="챗봇 열기"
              >
                <Bot className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-paper">
              <div
                className="h-full rounded-full bg-pine transition-all"
                style={{ width: `${((getStepIndex(step) + 1) / stepMeta.length) * 100}%` }}
              />
            </div>
          </header>

          {notice ? (
            <div className="mb-4 rounded-lg border border-amber/30 bg-amber/10 p-4 text-sm leading-6 text-amber">
              {notice}
            </div>
          ) : null}

          <div className="rounded-lg border border-line bg-white/80 p-4 shadow-sm backdrop-blur md:p-6">{renderStep()}</div>
        </main>

        <aside className="hidden lg:block">
          <ChatPanel
            chatInput={chatInput}
            messages={chatMessages}
            onChangeInput={setChatInput}
            onSend={sendChatMessage}
            projectSummary={recommendation?.summary}
            selectedService={selectedServiceInfo.title}
            selectedTool={selectedToolInfo.name}
            stepLabel={currentStep.label}
          />
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 p-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-md border border-line bg-white px-3 py-3 text-sm font-semibold disabled:opacity-40"
            disabled={getStepIndex(step) === 0}
            onClick={() => moveStep(-1)}
            type="button"
          >
            <ChevronLeft className="h-4 w-4" />
            이전
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-md border border-pine bg-pine px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
            disabled={getStepIndex(step) === stepMeta.length - 1}
            onClick={() => moveStep(1)}
            type="button"
          >
            다음
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <button
        className="fixed bottom-24 right-4 z-30 rounded-full border border-pine bg-pine p-4 text-white shadow-panel lg:hidden"
        onClick={() => setChatOpen(true)}
        type="button"
        aria-label="챗봇 열기"
      >
        <PanelRightOpen className="h-5 w-5" />
      </button>

      {chatOpen ? (
        <div className="fixed inset-0 z-40 bg-ink/35 p-3 lg:hidden">
          <div className="ml-auto flex h-full max-w-md flex-col rounded-lg bg-white p-4 shadow-panel">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-pine">AI 도우미</p>
                <h2 className="text-lg font-bold">{currentStep.label}</h2>
              </div>
              <button className="rounded-md border border-line p-2" onClick={() => setChatOpen(false)} type="button">
                닫기
              </button>
            </div>
            <ChatPanel
              chatInput={chatInput}
              compact
              messages={chatMessages}
              onChangeInput={setChatInput}
              onSend={sendChatMessage}
              projectSummary={recommendation?.summary}
              selectedService={selectedServiceInfo.title}
              selectedTool={selectedToolInfo.name}
              stepLabel={currentStep.label}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-semibold text-pine">{eyebrow}</p>
      <h2 className="mt-1 text-2xl font-bold tracking-normal md:text-3xl">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-ink/70 md:text-base">{description}</p>
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof GraduationCap;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <Icon className="h-5 w-5 text-pine" />
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function PrimaryButton({
  children,
  disabled,
  icon: Icon,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  icon: typeof GraduationCap;
  onClick: () => void;
}) {
  return (
    <button
      className="inline-flex items-center justify-center gap-2 rounded-md border border-pine bg-pine px-4 py-3 text-sm font-semibold text-white transition hover:bg-pine/90 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
}

function SecondaryButton({
  children,
  disabled,
  icon: Icon,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  icon: typeof GraduationCap;
  onClick: () => void;
}) {
  return (
    <button
      className="inline-flex items-center justify-center gap-2 rounded-md border border-line bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:border-pine hover:text-pine disabled:cursor-not-allowed disabled:opacity-60"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof GraduationCap;
}) {
  return (
    <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <Icon className="mb-4 h-6 w-6 text-pine" />
      <p className="text-sm text-ink/60">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

function List({ items, ordered = false }: { items: string[]; ordered?: boolean }) {
  const Component = ordered ? "ol" : "ul";

  return (
    <Component className={`mt-3 space-y-2 text-sm leading-6 text-ink/75 ${ordered ? "list-decimal pl-5" : "list-disc pl-5"}`}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </Component>
  );
}

function ChecklistRow({
  item,
  status,
  onChange,
}: {
  item: ChecklistItem;
  status: ChecklistStatus;
  onChange: (status: ChecklistStatus) => void;
}) {
  const StatusIcon = statusMeta[status].icon;

  return (
    <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <StatusIcon className="h-5 w-5 shrink-0 text-pine" />
            <h3 className="font-semibold">{item.title}</h3>
          </div>
          <p className="mt-2 text-sm leading-6 text-ink/65">{item.description}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          {(Object.keys(statusMeta) as ChecklistStatus[]).map((nextStatus) => (
            <button
              className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
                status === nextStatus ? statusMeta[nextStatus].className : "border-line bg-white text-ink/65 hover:border-pine"
              }`}
              key={nextStatus}
              onClick={() => onChange(nextStatus)}
              type="button"
            >
              {statusMeta[nextStatus].label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="relative block">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink/45" />
      <input
        className="w-full rounded-lg border border-line bg-white py-3 pl-10 pr-3 text-sm"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: typeof GraduationCap;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-paper p-8 text-center">
      <Icon className="mx-auto mb-4 h-8 w-8 text-pine" />
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-ink/70">{description}</p>
      <button
        className="mt-5 rounded-md border border-pine bg-pine px-4 py-3 text-sm font-semibold text-white"
        onClick={onAction}
        type="button"
      >
        {actionLabel}
      </button>
    </div>
  );
}

function ChatPanel({
  messages,
  chatInput,
  onChangeInput,
  onSend,
  stepLabel,
  selectedTool,
  selectedService,
  projectSummary,
  compact = false,
}: {
  messages: ChatMessage[];
  chatInput: string;
  onChangeInput: (value: string) => void;
  onSend: () => void;
  stepLabel: string;
  selectedTool: string;
  selectedService: string;
  projectSummary?: string;
  compact?: boolean;
}) {
  return (
    <div className={`flex ${compact ? "h-full" : "sticky top-4 h-[calc(100vh-32px)]"} flex-col rounded-lg border border-line bg-white shadow-sm`}>
      <div className="border-b border-line p-4">
        <div className="flex items-center gap-3">
          <Bot className="h-5 w-5 text-pine" />
          <div>
            <h2 className="font-semibold">AI 학습 도우미</h2>
            <p className="text-xs text-ink/60">{stepLabel} 단계</p>
          </div>
        </div>
        <div className="mt-4 grid gap-2 text-xs text-ink/65">
          <span className="rounded-md bg-paper px-2 py-1">도구: {selectedTool}</span>
          <span className="rounded-md bg-paper px-2 py-1">유형: {selectedService}</span>
          {projectSummary ? <span className="rounded-md bg-paper px-2 py-1">요약: {projectSummary}</span> : null}
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((message, index) => (
          <div
            className={`rounded-lg border p-3 text-sm leading-6 ${
              message.role === "user" ? "ml-6 border-pine/30 bg-mint text-ink" : "mr-6 border-line bg-paper text-ink/78"
            }`}
            key={`${message.role}-${index}`}
          >
            {message.content}
            {message.links?.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {message.links.map((link) => (
                  <span className="rounded-md bg-white px-2 py-1 text-xs font-medium text-pine" key={link}>
                    {link}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <div className="border-t border-line p-3">
        <div className="flex gap-2">
          <input
            className="min-w-0 flex-1 rounded-md border border-line px-3 py-2 text-sm"
            onChange={(event) => onChangeInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onSend();
              }
            }}
            placeholder="질문 입력"
            value={chatInput}
          />
          <button
            className="rounded-md border border-pine bg-pine px-3 text-white"
            onClick={onSend}
            type="button"
            aria-label="질문 보내기"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
