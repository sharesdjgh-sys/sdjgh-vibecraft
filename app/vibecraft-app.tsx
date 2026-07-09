"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bot,
  Check,
  CheckCircle2,
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
  X,
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

const steps: Array<{ id: StepId; label: string; short: string; icon: typeof GraduationCap }> = [
  { id: "role", label: "역할 선택", short: "역할", icon: GraduationCap },
  { id: "start", label: "입력", short: "입력", icon: Upload },
  { id: "recommendation", label: "추천", short: "추천", icon: LayoutDashboard },
  { id: "concept", label: "개념", short: "개념", icon: BookOpen },
  { id: "tools", label: "도구", short: "도구", icon: Code2 },
  { id: "service", label: "유형", short: "유형", icon: Smartphone },
  { id: "checklist", label: "실습", short: "실습", icon: ListChecks },
  { id: "terms", label: "용어", short: "용어", icon: Search },
  { id: "prompts", label: "프롬프트", short: "프롬프트", icon: ClipboardList },
  { id: "error", label: "에러 해결", short: "에러", icon: Wrench },
  { id: "deploy", label: "배포 점검", short: "점검", icon: Rocket },
];

const stepIntro: Record<StepId, { title: string; description: string; action: string }> = {
  role: {
    title: "누구의 눈높이로 코칭할까요?",
    description: "역할에 따라 예시, 안내 문장, 추천 이유가 달라집니다.",
    action: "역할을 선택하면 바로 다음 단계로 이동합니다.",
  },
  start: {
    title: "기획서가 있으면 업로드하고, 없으면 아이디어만 적으세요.",
    description: "PlanCraft 문서를 분석하거나 짧은 아이디어를 질문형 브리프로 바꿉니다.",
    action: "txt, md는 즉시 분석하고 PDF는 핵심 내용을 함께 붙여넣는 방식으로 시작합니다.",
  },
  recommendation: {
    title: "추천 결과를 작업 계획으로 바꿉니다.",
    description: "도구, 서비스 유형, 기술 스택, 난이도, 구현 순서를 한 화면에서 조정합니다.",
    action: "마음에 들지 않으면 도구와 유형 단계에서 직접 바꾸면 됩니다.",
  },
  concept: {
    title: "바이브코딩에서 사람이 해야 할 일을 분리합니다.",
    description: "AI에게 맡길 일과 사용자가 직접 확인해야 할 일을 짧게 정리합니다.",
    action: "개념을 확인한 뒤 도구 선택으로 넘어가세요.",
  },
  tools: {
    title: "Codex, Claude, Antigravity 중 현재 프로젝트에 맞는 도구를 고릅니다.",
    description: "게임형 선택 감각은 살리되, 실제 구현 기준으로 비교합니다.",
    action: "도구 카드를 선택하면 아래 가이드가 즉시 바뀝니다.",
  },
  service: {
    title: "결과물이 쓰일 화면에 맞춰 기술 조합을 고릅니다.",
    description: "웹, 모바일 최적화 웹앱, 자동화 도구 중 가장 맞는 형태를 선택합니다.",
    action: "선택한 유형에 따라 화면 목록과 기술 스택이 바뀝니다.",
  },
  checklist: {
    title: "완성까지 필요한 일을 상태로 관리합니다.",
    description: "대기, 진행, 완료, 막힘을 표시하고 막힌 항목은 에러 해결로 넘깁니다.",
    action: "실제로 끝낸 항목부터 완료로 바꿔보세요.",
  },
  terms: {
    title: "막히는 용어를 바로 찾아봅니다.",
    description: "터미널, GitHub, Vercel, Neon DB 같은 개념을 역할별 예시로 설명합니다.",
    action: "검색창에 모르는 단어를 입력하세요.",
  },
  prompts: {
    title: "AI에게 바로 붙여넣을 요청문을 준비합니다.",
    description: "기획서 구현, 모바일 UI, 에러 해결, 배포 점검 템플릿을 제공합니다.",
    action: "복사 버튼을 누르면 현재 프로젝트 요약이 자동으로 들어갑니다.",
  },
  error: {
    title: "에러 메시지를 다음 행동으로 바꿉니다.",
    description: "원인 후보와 확인 순서를 초보자 기준으로 정리합니다.",
    action: "비밀키와 DB 주소는 제거하고 에러 로그만 붙여넣으세요.",
  },
  deploy: {
    title: "공개 전 마지막 점검을 끝냅니다.",
    description: "모바일 화면, 버튼 동작, 환경변수, DB 연결, 첫 사용자 흐름을 확인합니다.",
    action: "모든 항목이 완료되면 실제 배포 링크를 공유할 준비가 된 상태입니다.",
  },
};

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

const statusMeta: Record<ChecklistStatus, { label: string; icon: typeof Circle; className: string }> = {
  pending: { label: "대기", icon: Circle, className: "border-line bg-surface text-muted" },
  active: { label: "진행", icon: CircleDashed, className: "border-blue/40 bg-blue/10 text-blue" },
  done: { label: "완료", icon: CheckCircle2, className: "border-leaf/40 bg-leaf/10 text-leaf" },
  blocked: { label: "막힘", icon: XCircle, className: "border-coral/40 bg-coral/10 text-coral" },
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
    if (ready) window.localStorage.setItem(key, JSON.stringify(value));
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

function stepIndex(step: StepId) {
  return Math.max(
    0,
    steps.findIndex((item) => item.id === step),
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
      content: "막힌 내용을 적어주세요. 현재 단계와 선택한 도구 기준으로 다음 행동을 짧게 정리해드릴게요.",
      links: ["실습", "용어", "에러"],
    },
  ]);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const activeRole = role ?? "student";
  const activeTool = selectedTool ?? recommendation?.recommendedTool ?? "codex";
  const activeServiceType = selectedServiceType ?? recommendation?.recommendedServiceType ?? "web";
  const currentIndex = stepIndex(step);
  const currentStep = steps[currentIndex];
  const currentIntro = stepIntro[step];
  const progress = Math.round(((currentIndex + 1) / steps.length) * 100);
  const selectedToolInfo = tools.find((tool) => tool.slug === activeTool) ?? tools[0];
  const selectedServiceInfo = serviceTypes.find((item) => item.id === activeServiceType) ?? serviceTypes[0];
  const checklistItems = recommendation?.checklist ?? baseChecklist;

  const filteredTerms = useMemo(() => {
    const query = termSearch.trim().toLowerCase();
    if (!query) return terms;
    return terms.filter((item) =>
      [item.term, item.category, item.plainDescription, ...item.related].some((value) => value.toLowerCase().includes(query)),
    );
  }, [termSearch]);

  const filteredPrompts = useMemo(() => {
    const query = promptSearch.trim().toLowerCase();
    return promptTemplates.filter((item) => {
      const matchesTool = item.tool === "all" || item.tool === activeTool;
      const matchesQuery =
        !query ||
        [item.title, item.category, item.description].some((value) => value.toLowerCase().includes(query));
      return matchesTool && matchesQuery;
    });
  }, [activeTool, promptSearch]);

  function go(delta: number) {
    setStep(steps[Math.min(steps.length - 1, Math.max(0, currentIndex + delta))].id);
  }

  function setChecklist(item: ChecklistItem, status: ChecklistStatus) {
    setChecklistStatuses((current) => ({ ...current, [item.id]: status }));
    void fetch("/api/checklist-progress", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, checklistId: item.id, status }),
    });
  }

  function setDeployCheck(item: ChecklistItem, status: ChecklistStatus) {
    setDeploymentStatuses((current) => ({ ...current, [item.id]: status }));
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
        `[PDF 파일명: ${file.name}]\n현재 MVP는 txt, md 텍스트 추출을 우선 지원합니다. PDF는 PlanCraft 요약문을 아래 입력창에 붙여넣으면 같은 방식으로 분석할 수 있습니다.`,
      );
      setNotice("PDF는 선택됐습니다. 정확한 추천을 위해 핵심 내용을 입력창에 함께 붙여넣어주세요.");
      return;
    }

    setPlanText(await file.text());
  }

  async function analyzePlan() {
    if (!role) {
      setNotice("먼저 역할을 선택해주세요.");
      setStep("role");
      return;
    }
    if (planText.trim().length < 10) {
      setNotice("기획서 내용이 너무 짧습니다. 사용자와 핵심 기능을 포함해 입력해주세요.");
      return;
    }

    setBusy("analyze");
    setNotice(null);
    try {
      const result = await postJson<Recommendation>("/api/analyze-plan", { role, extractedText: planText });
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
      const result = await postJson<{ nextQuestions: string[] }>("/api/idea-interview", { role, idea });
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
      const result = await postJson<{ recommendation: Recommendation }>("/api/idea-interview", {
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
    if (!message) return;

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
        { role: "assistant", content: result.answer, links: result.relatedLinks },
      ]);
    } catch {
      setChatMessages((current) => [
        ...current,
        { role: "assistant", content: "답변을 만들지 못했습니다. 질문을 조금 더 짧게 나눠 다시 보내주세요." },
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
    switch (step) {
      case "role":
        return (
          <div className="grid gap-3 md:grid-cols-3">
            {roleOptions.map((option) => {
              const Icon = roleIcons[option.id];
              const selected = role === option.id;
              return (
                <ChoiceCard
                  description={option.description}
                  icon={Icon}
                  key={option.id}
                  meta={option.example}
                  onClick={() => {
                    setRole(option.id);
                    setStep("start");
                  }}
                  selected={selected}
                  title={option.title}
                />
              );
            })}
          </div>
        );

      case "start":
        return (
          <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <WorkSurface
              action={
                <PrimaryButton disabled={busy === "analyze"} icon={FileText} onClick={analyzePlan}>
                  {busy === "analyze" ? "분석 중" : "기획서 분석"}
                </PrimaryButton>
              }
              icon={Upload}
              title="PlanCraft 기획서"
            >
              <label className="group flex min-h-32 cursor-pointer flex-col justify-between rounded-lg border border-dashed border-line bg-canvas p-4 transition hover:border-teal hover:bg-teal/5">
                <span className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-md bg-teal text-white">
                    <Upload className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">txt, md, pdf 선택</span>
                    <span className="mt-1 block text-xs text-muted">PDF는 요약문을 함께 붙여넣으면 더 정확합니다.</span>
                  </span>
                </span>
                <input
                  accept=".txt,.md,.pdf,text/plain,text/markdown,application/pdf"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void handleFileUpload(file);
                  }}
                  type="file"
                />
                {uploadedFileName ? <span className="mt-3 text-xs font-medium text-teal">{uploadedFileName}</span> : null}
              </label>
              <textarea
                className="field min-h-56"
                onChange={(event) => setPlanText(event.target.value)}
                placeholder="기획서 핵심 내용을 붙여넣으세요. 사용자, 핵심 기능, 데이터 저장 여부가 들어가면 추천이 좋아집니다."
                value={planText}
              />
            </WorkSurface>

            <WorkSurface
              action={
                <SecondaryButton disabled={busy === "idea-questions"} icon={MessageSquare} onClick={requestInterviewQuestions}>
                  {busy === "idea-questions" ? "질문 생성 중" : "질문 받기"}
                </SecondaryButton>
              }
              icon={MessageSquare}
              title="아이디어 인터뷰"
            >
              <textarea
                className="field min-h-28"
                onChange={(event) => setIdea(event.target.value)}
                placeholder="예: 동아리 모집 신청을 받고 선생님이 확인하는 모바일 웹앱을 만들고 싶어요."
                value={idea}
              />
              {interviewQuestions.length ? (
                <div className="space-y-3">
                  {interviewQuestions.map((question, index) => (
                    <label className="block" key={question}>
                      <span className="mb-2 flex items-center gap-2 text-sm font-semibold">
                        <span className="grid h-6 w-6 place-items-center rounded-md bg-blue/10 text-xs text-blue">{index + 1}</span>
                        {question}
                      </span>
                      <input
                        className="field h-11"
                        onChange={(event) =>
                          setInterviewAnswers((current) => ({ ...current, [question]: event.target.value }))
                        }
                        value={interviewAnswers[question] ?? ""}
                      />
                    </label>
                  ))}
                  <PrimaryButton disabled={busy === "idea-result"} icon={LayoutDashboard} onClick={finishInterview}>
                    {busy === "idea-result" ? "추천 생성 중" : "답변으로 로드맵 생성"}
                  </PrimaryButton>
                </div>
              ) : (
                <InsightStrip
                  icon={Sparkles}
                  text="질문을 받으면 서비스 목적, 사용자, 저장 기능, 모바일 중요도를 짧게 확인합니다."
                />
              )}
            </WorkSurface>
          </div>
        );

      case "recommendation":
        if (!recommendation) {
          return (
            <EmptyState
              actionLabel="입력 단계로 이동"
              description="기획서나 아이디어를 입력하면 추천 도구, 서비스 유형, 구현 순서가 생성됩니다."
              icon={FileText}
              onAction={() => setStep("start")}
              title="아직 로드맵이 없습니다"
            />
          );
        }
        return (
          <div className="space-y-4">
            <div className="rounded-lg border border-line bg-ink p-5 text-white">
              <p className="text-xs font-semibold uppercase text-lemon">Project Brief</p>
              <h3 className="mt-3 text-2xl font-bold leading-9">{recommendation.summary}</h3>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <StatusTile icon={toolIcons[activeTool]} label="추천 도구" value={selectedToolInfo.name} />
                <StatusTile icon={serviceIcons[activeServiceType]} label="추천 유형" value={selectedServiceInfo.title} />
                <StatusTile icon={ShieldCheck} label="예상 난이도" value={recommendation.difficulty} />
              </div>
            </div>
            <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
              <WorkSurface icon={CheckCircle2} title="추천 이유">
                <BulletList items={recommendation.reasons} />
              </WorkSurface>
              <WorkSurface icon={ListChecks} title="구현 순서">
                <NumberList items={recommendation.roadmap} />
              </WorkSurface>
            </div>
            <WorkSurface icon={Database} title="기술 조합">
              <TokenGrid items={recommendation.recommendedStack} />
            </WorkSurface>
          </div>
        );

      case "concept":
        return (
          <div className="grid gap-3 md:grid-cols-2">
            {conceptCards.map((card, index) => (
              <FeatureTile
                accent={index % 2 === 0 ? "teal" : "blue"}
                description={card.body}
                icon={index % 2 === 0 ? BookOpen : Sparkles}
                key={card.title}
                title={card.title}
              />
            ))}
          </div>
        );

      case "tools":
        return (
          <div className="space-y-4">
            <div className="grid gap-3 xl:grid-cols-3">
              {tools.map((tool) => (
                <ChoiceCard
                  description={tool.tagline}
                  icon={toolIcons[tool.slug]}
                  key={tool.slug}
                  meta={tool.bestFor}
                  onClick={() => setSelectedTool(tool.slug)}
                  selected={activeTool === tool.slug}
                  title={tool.name}
                />
              ))}
            </div>
            <WorkSurface icon={toolIcons[activeTool]} title={`${selectedToolInfo.name} 실행 가이드`}>
              <div className="grid gap-3 md:grid-cols-2">
                {selectedToolInfo.guide.map((section) => (
                  <StepNote items={section.items} key={section.title} title={section.title} />
                ))}
              </div>
            </WorkSurface>
          </div>
        );

      case "service":
        return (
          <div className="space-y-4">
            <div className="grid gap-3 lg:grid-cols-3">
              {serviceTypes.map((service) => (
                <ChoiceCard
                  description={service.description}
                  icon={serviceIcons[service.id]}
                  key={service.id}
                  meta={service.stack.join(" · ")}
                  onClick={() => setSelectedServiceType(service.id)}
                  selected={activeServiceType === service.id}
                  title={service.title}
                />
              ))}
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              <WorkSurface icon={Database} title="추천 기술 조합">
                <TokenGrid items={selectedServiceInfo.stack} />
              </WorkSurface>
              <WorkSurface icon={LayoutDashboard} title="필요한 화면">
                <BulletList items={selectedServiceInfo.screens} />
              </WorkSurface>
            </div>
          </div>
        );

      case "checklist":
        return (
          <div className="space-y-3">
            {checklistItems.map((item) => (
              <ChecklistRow
                item={item}
                key={item.id}
                onChange={(status) => setChecklist(item, status)}
                status={checklistStatuses[item.id] ?? "pending"}
              />
            ))}
          </div>
        );

      case "terms":
        return (
          <div className="space-y-4">
            <SearchBox onChange={setTermSearch} placeholder="터미널, Vercel, 환경변수 검색" value={termSearch} />
            <div className="grid gap-3 lg:grid-cols-2">
              {filteredTerms.map((term) => (
                <TermTile key={term.term} role={activeRole} term={term} />
              ))}
            </div>
          </div>
        );

      case "prompts":
        return (
          <div className="space-y-4">
            <SearchBox onChange={setPromptSearch} placeholder="배포, 에러, 모바일 검색" value={promptSearch} />
            <div className="grid gap-3 lg:grid-cols-2">
              {filteredPrompts.map((prompt) => (
                <PromptTile key={prompt.id} onCopy={() => copyPrompt(prompt.template)} prompt={prompt} />
              ))}
            </div>
          </div>
        );

      case "error":
        return (
          <div className="space-y-4">
            <WorkSurface
              action={
                <PrimaryButton disabled={busy === "error"} icon={Wrench} onClick={solveCurrentError}>
                  {busy === "error" ? "분석 중" : "해결 순서 보기"}
                </PrimaryButton>
              }
              icon={AlertTriangle}
              title="에러 메시지"
            >
              <textarea
                className="field min-h-48"
                onChange={(event) => setErrorMessage(event.target.value)}
                placeholder="터미널, Vercel, 브라우저 콘솔의 에러 메시지를 붙여넣으세요. 비밀키와 DB 주소는 제거하세요."
                value={errorMessage}
              />
            </WorkSurface>
            {errorSolution ? (
              <div className="grid gap-4 xl:grid-cols-2">
                <WorkSurface icon={AlertTriangle} title={errorSolution.summary}>
                  <h4 className="text-sm font-semibold">가능한 원인</h4>
                  <BulletList items={errorSolution.possibleCauses} />
                  <h4 className="mt-5 text-sm font-semibold">해결 순서</h4>
                  <NumberList items={errorSolution.solutionSteps} />
                </WorkSurface>
                <WorkSurface icon={ClipboardList} title="AI에게 다시 물어볼 프롬프트">
                  <CodeBlock text={errorSolution.suggestedPrompt.replaceAll("{{errorMessage}}", errorMessage)} />
                  <TokenGrid items={errorSolution.relatedTerms} />
                </WorkSurface>
              </div>
            ) : null}
          </div>
        );

      case "deploy":
        return (
          <div className="space-y-3">
            {deploymentChecks.map((item) => (
              <ChecklistRow
                item={item}
                key={item.id}
                onChange={(status) => setDeployCheck(item, status)}
                status={deploymentStatuses[item.id] ?? "pending"}
              />
            ))}
          </div>
        );
    }
  }

  return (
    <div className="min-h-screen pb-24 lg:pb-0">
      <div className="mx-auto grid min-h-screen max-w-[1580px] gap-4 px-3 py-3 md:px-5 lg:grid-cols-[260px_minmax(0,1fr)_360px]">
        <aside className="hidden lg:block">
          <div className="sticky top-3 space-y-3">
            <BrandPanel progress={progress} />
            <nav className="rounded-lg border border-line bg-surface p-2 shadow-soft">
              {steps.map((item, index) => (
                <StepButton
                  active={item.id === step}
                  done={index < currentIndex}
                  icon={item.icon}
                  key={item.id}
                  label={item.label}
                  onClick={() => setStep(item.id)}
                  stepNumber={index + 1}
                />
              ))}
            </nav>
          </div>
        </aside>

        <main className="min-w-0">
          <MobileTopBar
            currentStep={currentStep.short}
            onChat={() => setChatOpen(true)}
            progress={progress}
            title="VibeCraft"
          />
          <div className="mb-3 rounded-lg border border-line bg-surface p-4 shadow-soft md:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <StepBadge icon={currentStep.icon} label={`${currentIndex + 1}/${steps.length} ${currentStep.label}`} />
                  {role ? <MiniPill label={roleOptions.find((item) => item.id === role)?.title ?? "역할"} /> : null}
                  <MiniPill label={selectedToolInfo.name} />
                  <MiniPill label={selectedServiceInfo.title} />
                </div>
                <h1 className="text-2xl font-bold leading-tight tracking-normal text-ink md:text-4xl">{currentIntro.title}</h1>
                <p className="mt-3 text-sm leading-6 text-muted md:text-base">{currentIntro.description}</p>
              </div>
              <div className="rounded-lg border border-line bg-canvas p-3 text-sm leading-6 text-muted xl:w-72">
                <p className="font-semibold text-ink">현재 행동</p>
                <p className="mt-1">{currentIntro.action}</p>
              </div>
            </div>
          </div>

          {notice ? (
            <div className="mb-3 flex items-start gap-3 rounded-lg border border-lemon/50 bg-lemon/15 p-3 text-sm leading-6 text-ink">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-coral" />
              <p>{notice}</p>
            </div>
          ) : null}

          <section className="rounded-lg border border-line bg-surface p-3 shadow-soft md:p-5">{renderStep()}</section>
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

      <MobileBottomBar
        canGoBack={currentIndex > 0}
        canGoNext={currentIndex < steps.length - 1}
        currentLabel={currentStep.short}
        onBack={() => go(-1)}
        onChat={() => setChatOpen(true)}
        onNext={() => go(1)}
      />

      {chatOpen ? (
        <div className="fixed inset-0 z-50 bg-ink/45 p-3 lg:hidden">
          <div className="ml-auto flex h-full max-w-md flex-col rounded-lg border border-line bg-surface shadow-strong">
            <div className="flex items-center justify-between border-b border-line p-4">
              <div>
                <p className="text-xs font-semibold uppercase text-teal">Assistant</p>
                <h2 className="font-bold">AI 학습 도우미</h2>
              </div>
              <button className="icon-button" onClick={() => setChatOpen(false)} type="button" aria-label="챗봇 닫기">
                <X className="h-5 w-5" />
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

function BrandPanel({ progress }: { progress: number }) {
  return (
    <div className="rounded-lg border border-line bg-ink p-4 text-white shadow-soft">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-md bg-teal">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-lemon">Plan to Build</p>
          <h2 className="text-xl font-bold">VibeCraft</h2>
        </div>
      </div>
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-xs text-white/70">
          <span>전체 진행률</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/15">
          <div className="h-full rounded-full bg-lemon transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}

function StepButton({
  active,
  done,
  icon: Icon,
  label,
  onClick,
  stepNumber,
}: {
  active: boolean;
  done: boolean;
  icon: typeof GraduationCap;
  label: string;
  onClick: () => void;
  stepNumber: number;
}) {
  return (
    <button
      className={`group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition ${
        active ? "bg-teal text-white shadow-soft" : done ? "bg-canvas text-ink" : "text-muted hover:bg-canvas hover:text-ink"
      }`}
      onClick={onClick}
      type="button"
    >
      <span
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-md border text-xs font-bold ${
          active ? "border-white/20 bg-white/15" : done ? "border-leaf/30 bg-leaf/10 text-leaf" : "border-line bg-surface"
        }`}
      >
        {done && !active ? <Check className="h-4 w-4" /> : stepNumber}
      </span>
      <Icon className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate text-sm font-semibold">{label}</span>
      {active ? <ChevronRight className="h-4 w-4 shrink-0" /> : null}
    </button>
  );
}

function MobileTopBar({
  currentStep,
  onChat,
  progress,
  title,
}: {
  currentStep: string;
  onChat: () => void;
  progress: number;
  title: string;
}) {
  return (
    <header className="mb-3 rounded-lg border border-line bg-surface p-3 shadow-soft lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-teal">{currentStep}</p>
          <h1 className="text-lg font-bold">{title}</h1>
        </div>
        <button className="icon-button" onClick={onChat} type="button" aria-label="챗봇 열기">
          <Bot className="h-5 w-5" />
        </button>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-canvas">
        <div className="h-full rounded-full bg-teal transition-all" style={{ width: `${progress}%` }} />
      </div>
    </header>
  );
}

function MobileBottomBar({
  canGoBack,
  canGoNext,
  currentLabel,
  onBack,
  onChat,
  onNext,
}: {
  canGoBack: boolean;
  canGoNext: boolean;
  currentLabel: string;
  onBack: () => void;
  onChat: () => void;
  onNext: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 p-3 backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-xl grid-cols-[1fr_auto_1fr] items-center gap-2">
        <button className="nav-button" disabled={!canGoBack} onClick={onBack} type="button">
          <ArrowLeft className="h-4 w-4" />
          이전
        </button>
        <button className="icon-button h-11 w-11" onClick={onChat} type="button" aria-label="챗봇 열기">
          <PanelRightOpen className="h-5 w-5" />
        </button>
        <button className="nav-button justify-end bg-ink text-white" disabled={!canGoNext} onClick={onNext} type="button">
          {currentLabel}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function WorkSurface({
  action,
  children,
  icon: Icon,
  title,
}: {
  action?: React.ReactNode;
  children: React.ReactNode;
  icon: typeof GraduationCap;
  title: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4 shadow-soft">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-canvas text-teal">
            <Icon className="h-5 w-5" />
          </span>
          <h3 className="text-lg font-bold">{title}</h3>
        </div>
        {action}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function ChoiceCard({
  description,
  icon: Icon,
  meta,
  onClick,
  selected,
  title,
}: {
  description: string;
  icon: typeof GraduationCap;
  meta: string;
  onClick: () => void;
  selected: boolean;
  title: string;
}) {
  return (
    <button
      className={`group relative min-h-52 rounded-lg border p-4 text-left transition ${
        selected
          ? "border-teal bg-teal text-white shadow-strong"
          : "border-line bg-surface hover:-translate-y-1 hover:border-teal hover:shadow-strong"
      }`}
      onClick={onClick}
      type="button"
    >
      <span
        className={`mb-5 grid h-11 w-11 place-items-center rounded-md ${
          selected ? "bg-white/15 text-white" : "bg-canvas text-teal group-hover:bg-teal group-hover:text-white"
        }`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className={`mt-3 text-sm leading-6 ${selected ? "text-white/82" : "text-muted"}`}>{description}</p>
      <p className={`mt-5 text-xs leading-5 ${selected ? "text-white/72" : "text-muted"}`}>{meta}</p>
      {selected ? (
        <span className="absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-full bg-white text-teal">
          <Check className="h-4 w-4" />
        </span>
      ) : null}
    </button>
  );
}

function FeatureTile({
  accent,
  description,
  icon: Icon,
  title,
}: {
  accent: "teal" | "blue";
  description: string;
  icon: typeof GraduationCap;
  title: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-surface p-5 shadow-soft">
      <div className={`mb-5 grid h-10 w-10 place-items-center rounded-md ${accent === "teal" ? "bg-teal text-white" : "bg-blue text-white"}`}>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-muted">{description}</p>
    </div>
  );
}

function StatusTile({ icon: Icon, label, value }: { icon: typeof GraduationCap; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/8 p-4">
      <Icon className="mb-3 h-5 w-5 text-lemon" />
      <p className="text-xs text-white/60">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}

function StepBadge({ icon: Icon, label }: { icon: typeof GraduationCap; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-md bg-teal/10 px-3 py-1.5 text-xs font-bold text-teal">
      <Icon className="h-4 w-4" />
      {label}
    </span>
  );
}

function MiniPill({ label }: { label: string }) {
  return <span className="rounded-md border border-line bg-canvas px-3 py-1.5 text-xs font-semibold text-muted">{label}</span>;
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
    <button className="action-button bg-ink text-white" disabled={disabled} onClick={onClick} type="button">
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
    <button className="action-button border border-line bg-surface text-ink hover:border-blue hover:text-blue" disabled={disabled} onClick={onClick} type="button">
      {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
}

function InsightStrip({ icon: Icon, text }: { icon: typeof GraduationCap; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-blue/20 bg-blue/8 p-3 text-sm leading-6 text-muted">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-blue" />
      <p>{text}</p>
    </div>
  );
}

function StepNote({ items, title }: { items: string[]; title: string }) {
  return (
    <div className="rounded-lg border border-line bg-canvas p-4">
      <h4 className="font-bold">{title}</h4>
      <BulletList items={items} />
    </div>
  );
}

function ChecklistRow({
  item,
  onChange,
  status,
}: {
  item: ChecklistItem;
  onChange: (status: ChecklistStatus) => void;
  status: ChecklistStatus;
}) {
  const StatusIcon = statusMeta[status].icon;
  return (
    <div className="rounded-lg border border-line bg-surface p-4 shadow-soft">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
        <div className="flex min-w-0 gap-3">
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-md border ${statusMeta[status].className}`}>
            <StatusIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="font-bold">{item.title}</h3>
            <p className="mt-1 text-sm leading-6 text-muted">{item.description}</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(statusMeta) as ChecklistStatus[]).map((nextStatus) => (
            <button
              className={`rounded-md border px-2 py-2 text-xs font-bold transition ${
                status === nextStatus ? statusMeta[nextStatus].className : "border-line bg-canvas text-muted hover:border-teal hover:text-teal"
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
  onChange,
  placeholder,
  value,
}: {
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <label className="relative block">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
      <input className="field h-12 pl-10" onChange={(event) => onChange(event.target.value)} placeholder={placeholder} value={value} />
    </label>
  );
}

function TermTile({ role, term }: { role: Role; term: (typeof terms)[number] }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase text-teal">{term.category}</p>
          <h3 className="mt-1 text-lg font-bold">{term.term}</h3>
        </div>
        <BookOpen className="h-5 w-5 shrink-0 text-teal" />
      </div>
      <p className="mt-3 text-sm leading-6 text-muted">{term.plainDescription}</p>
      <p className="mt-3 rounded-md bg-canvas p-3 text-sm leading-6 text-ink">{term.examples[role]}</p>
      <TokenGrid items={term.related} />
    </div>
  );
}

function PromptTile({ onCopy, prompt }: { onCopy: () => void; prompt: (typeof promptTemplates)[number] }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4 shadow-soft">
      <p className="text-xs font-bold uppercase text-teal">{prompt.category}</p>
      <h3 className="mt-2 text-lg font-bold">{prompt.title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{prompt.description}</p>
      <CodeBlock text={prompt.template} />
      <button className="action-button mt-4 border border-line bg-surface text-ink hover:border-teal hover:text-teal" onClick={onCopy} type="button">
        <Copy className="h-4 w-4" />
        복사
      </button>
    </div>
  );
}

function TokenGrid({ items }: { items: string[] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {items.map((item) => (
        <span className="rounded-md border border-line bg-canvas px-3 py-1.5 text-xs font-bold text-ink" key={item}>
          {item}
        </span>
      ))}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
      {items.map((item) => (
        <li className="flex gap-2" key={item}>
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function NumberList({ items }: { items: string[] }) {
  return (
    <ol className="mt-3 space-y-3 text-sm leading-6 text-muted">
      {items.map((item, index) => (
        <li className="flex gap-3" key={item}>
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-ink text-xs font-bold text-white">{index + 1}</span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

function CodeBlock({ text }: { text: string }) {
  return <pre className="mt-4 max-h-44 overflow-auto rounded-lg border border-line bg-ink p-4 text-xs leading-5 text-white/82">{text}</pre>;
}

function EmptyState({
  actionLabel,
  description,
  icon: Icon,
  onAction,
  title,
}: {
  actionLabel: string;
  description: string;
  icon: typeof GraduationCap;
  onAction: () => void;
  title: string;
}) {
  return (
    <div className="grid min-h-80 place-items-center rounded-lg border border-dashed border-line bg-canvas p-8 text-center">
      <div>
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-md bg-teal text-white">
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="mt-5 text-xl font-bold">{title}</h3>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted">{description}</p>
        <button className="action-button mx-auto mt-5 bg-ink text-white" onClick={onAction} type="button">
          <ArrowRight className="h-4 w-4" />
          {actionLabel}
        </button>
      </div>
    </div>
  );
}

function ChatPanel({
  chatInput,
  compact = false,
  messages,
  onChangeInput,
  onSend,
  projectSummary,
  selectedService,
  selectedTool,
  stepLabel,
}: {
  chatInput: string;
  compact?: boolean;
  messages: ChatMessage[];
  onChangeInput: (value: string) => void;
  onSend: () => void;
  projectSummary?: string;
  selectedService: string;
  selectedTool: string;
  stepLabel: string;
}) {
  return (
    <div className={`flex ${compact ? "h-full border-0 shadow-none" : "sticky top-3 h-[calc(100vh-24px)]"} flex-col rounded-lg border border-line bg-surface shadow-soft`}>
      <div className="border-b border-line p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-blue text-white">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-blue">Context helper</p>
            <h2 className="font-bold">AI 학습 도우미</h2>
          </div>
        </div>
        <div className="mt-4 grid gap-2 text-xs">
          <MiniPill label={`단계: ${stepLabel}`} />
          <MiniPill label={`도구: ${selectedTool}`} />
          <MiniPill label={`유형: ${selectedService}`} />
          {projectSummary ? <MiniPill label={`요약: ${projectSummary}`} /> : null}
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((message, index) => (
          <div
            className={`max-w-[92%] rounded-lg border p-3 text-sm leading-6 ${
              message.role === "user" ? "ml-auto border-teal/30 bg-teal/10 text-ink" : "border-line bg-canvas text-ink"
            }`}
            key={`${message.role}-${index}`}
          >
            {message.content}
            {message.links?.length ? <TokenGrid items={message.links} /> : null}
          </div>
        ))}
      </div>
      <div className="border-t border-line p-3">
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <input
            className="field h-11"
            onChange={(event) => onChangeInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onSend();
            }}
            placeholder="질문 입력"
            value={chatInput}
          />
          <button className="icon-button h-11 w-11 bg-ink text-white" onClick={onSend} type="button" aria-label="질문 보내기">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
