import { baseChecklist, promptTemplates, serviceTypes, tools } from "./vibecraft-data";
import type { ChecklistItem, ErrorSolution, Recommendation, Role, ServiceType, ToolSlug } from "./types";

const defaultFeatures = ["첫 화면", "사용자 입력", "결과 확인", "모바일 화면", "배포"];

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word.toLowerCase()));
}

function pickServiceType(text: string): ServiceType {
  if (includesAny(text, ["모바일", "앱", "스마트폰", "pwa", "하단", "터치"])) {
    return "mobile-web";
  }

  if (includesAny(text, ["자동화", "파일", "엑셀", "스크립트", "cli", "반복 업무"])) {
    return "software";
  }

  return "web";
}

function pickTool(text: string, role: Role): ToolSlug {
  if (includesAny(text, ["긴 문서", "수업", "활동지", "설명", "자료", "요약"]) || role === "teacher") {
    return "claude";
  }

  if (includesAny(text, ["화면", "디자인", "모바일", "앱", "프로토타입"])) {
    return "antigravity";
  }

  return "codex";
}

function pickDifficulty(text: string): Recommendation["difficulty"] {
  const hardSignals = ["로그인", "결제", "실시간", "채팅", "권한", "관리자", "알림"];
  const mediumSignals = ["db", "데이터", "저장", "api", "검색", "업로드"];

  if (includesAny(text, hardSignals)) {
    return "도전";
  }

  if (includesAny(text, mediumSignals)) {
    return "보통";
  }

  return "입문";
}

function extractSummary(text: string, fallback: string) {
  const firstUsefulLine = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 12);

  if (!firstUsefulLine) {
    return fallback;
  }

  return firstUsefulLine.length > 96 ? `${firstUsefulLine.slice(0, 96)}...` : firstUsefulLine;
}

function extractFeatures(text: string) {
  const featureLines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*0-9.\s]+/, "").trim())
    .filter((line) => line.length > 4 && line.length < 80)
    .filter((line) => includesAny(line.toLowerCase(), ["기능", "화면", "선택", "업로드", "검색", "체크", "챗봇", "추천", "저장"]));

  const unique = Array.from(new Set(featureLines)).slice(0, 5);
  return unique.length > 0 ? unique : defaultFeatures;
}

function targetUsersForRole(role: Role) {
  if (role === "student") {
    return ["고등학생", "코딩 입문자", "PlanCraft 기획서 작성자"];
  }

  if (role === "teacher") {
    return ["수업 운영자", "교사", "프로젝트 지도자"];
  }

  return ["일반 학습자", "개인 프로젝트 제작자", "업무 자동화 사용자"];
}

function roadmapFor(serviceType: ServiceType, difficulty: Recommendation["difficulty"]) {
  const base = [
    "역할과 만들 서비스 목표를 확정합니다.",
    "MVP에 꼭 필요한 화면과 기능만 먼저 고릅니다.",
    "첫 화면과 핵심 입력 흐름을 구현합니다.",
    "Vercel에 빠르게 배포해 실제 링크를 확인합니다.",
  ];

  if (serviceType !== "software") {
    base.splice(3, 0, "모바일 화면에서 카드, 버튼, 입력창이 겹치지 않는지 확인합니다.");
  }

  if (difficulty !== "입문") {
    base.splice(base.length - 1, 0, "Neon DB와 환경변수를 연결하고 저장 기능을 검증합니다.");
  }

  return base;
}

function checklistFor(serviceType: ServiceType): ChecklistItem[] {
  if (serviceType === "software") {
    return baseChecklist.filter((item) => item.id !== "mobile-check");
  }

  return baseChecklist;
}

function stackFor(serviceType: ServiceType, difficulty: Recommendation["difficulty"]) {
  const service = serviceTypes.find((item) => item.id === serviceType) ?? serviceTypes[0];
  const stack = [...service.stack];

  if (difficulty !== "입문" && !stack.includes("Neon DB")) {
    stack.push("Neon DB");
  }

  return Array.from(new Set(stack));
}

export function buildRecommendation(input: {
  role: Role;
  text: string;
  fallbackSummary?: string;
}): Recommendation {
  const normalized = input.text.toLowerCase();
  const recommendedServiceType = pickServiceType(normalized);
  const recommendedTool = pickTool(normalized, input.role);
  const difficulty = pickDifficulty(normalized);
  const tool = tools.find((item) => item.slug === recommendedTool);
  const service = serviceTypes.find((item) => item.id === recommendedServiceType);

  return {
    summary: extractSummary(input.text, input.fallbackSummary ?? "입력한 내용을 바탕으로 구현 가능한 웹앱 MVP를 추천합니다."),
    targetUsers: targetUsersForRole(input.role),
    mainFeatures: extractFeatures(input.text),
    recommendedTool,
    recommendedServiceType,
    recommendedStack: stackFor(recommendedServiceType, difficulty),
    difficulty,
    reasons: [
      `${service?.title ?? "웹 서비스"} 흐름이 입력 내용과 가장 잘 맞습니다.`,
      `${tool?.name ?? "Codex"}는 현재 목표를 구현 단계로 나누는 데 적합합니다.`,
      "초기 버전은 로그인 없이 시작하고, 저장 기능이 필요해질 때 Neon DB를 연결하는 편이 안전합니다.",
    ],
    roadmap: roadmapFor(recommendedServiceType, difficulty),
    checklist: checklistFor(recommendedServiceType),
    promptTemplates: promptTemplates.slice(0, 3).map((template) => template.title),
  };
}

export function createInterview(input: {
  role: Role;
  idea: string;
  answers?: Record<string, string>;
}) {
  const questions = [
    "이 서비스를 가장 자주 사용할 사람은 누구인가요?",
    "사용자가 반드시 할 수 있어야 하는 핵심 행동은 무엇인가요?",
    "데이터를 저장해야 하나요? 저장한다면 어떤 데이터인가요?",
    "모바일 화면에서 사용하는 비중이 큰가요?",
    "처음 공개할 때 꼭 필요한 기능과 나중에 해도 되는 기능을 나눠볼 수 있나요?",
  ];

  if (!input.answers || Object.keys(input.answers).length === 0) {
    return {
      nextQuestions: questions,
      projectBrief: null,
      recommendation: null,
    };
  }

  const answerText = Object.entries(input.answers)
    .map(([question, answer]) => `${question}\n${answer}`)
    .join("\n\n");

  const combined = `${input.idea}\n\n${answerText}`;
  const recommendation = buildRecommendation({
    role: input.role,
    text: combined,
    fallbackSummary: `${input.idea} 아이디어를 바탕으로 한 구현 브리프입니다.`,
  });

  return {
    nextQuestions: [],
    projectBrief: {
      title: input.idea,
      summary: recommendation.summary,
      screens: ["시작 화면", "핵심 입력 화면", "결과 화면", "점검 화면"],
      features: recommendation.mainFeatures,
    },
    recommendation,
  };
}

export function solveError(input: {
  role: Role;
  selectedTool?: ToolSlug;
  currentStep?: string;
  errorMessage: string;
}): ErrorSolution {
  const message = input.errorMessage.toLowerCase();

  if (message.trim().length < 8) {
    return {
      summary: "에러 내용이 너무 짧습니다.",
      possibleCauses: ["실제 에러 메시지의 핵심 줄이 빠졌을 수 있습니다."],
      solutionSteps: ["터미널이나 배포 화면의 에러 문장을 더 길게 붙여넣습니다.", "실행한 명령어도 함께 적습니다."],
      suggestedPrompt: "아래 에러와 실행한 명령어를 보고 원인과 해결 순서를 알려주세요.\n\n[명령어]\n\n[에러]\n",
      relatedTerms: ["터미널", "명령어"],
    };
  }

  if (includesAny(message, ["env", "environment", "database_url", "api_key", "undefined"])) {
    return {
      summary: "환경변수 또는 비밀키 설정 문제일 가능성이 높습니다.",
      possibleCauses: ["Vercel 환경변수 누락", ".env.local 파일 누락", "변수 이름 오타", "서버 재시작 누락"],
      solutionSteps: [
        ".env.local에 필요한 값이 있는지 확인합니다.",
        "Vercel 프로젝트의 Environment Variables에도 같은 이름으로 등록합니다.",
        "변수 이름의 대소문자와 밑줄을 확인합니다.",
        "개발 서버 또는 Vercel 배포를 다시 실행합니다.",
      ],
      suggestedPrompt: "환경변수 관련 에러입니다. 필요한 변수 이름과 설정 위치를 점검해주세요.\n\n[에러]\n{{errorMessage}}",
      relatedTerms: ["환경변수", "Vercel", "API"],
    };
  }

  if (includesAny(message, ["npm", "enoent", "module not found", "cannot find module"])) {
    return {
      summary: "의존성 설치 또는 파일 경로 문제일 가능성이 높습니다.",
      possibleCauses: ["npm install 미실행", "패키지 이름 누락", "import 경로 오타", "파일 위치 변경"],
      solutionSteps: [
        "프로젝트 루트에서 npm install을 실행합니다.",
        "에러에 나온 패키지 이름이 package.json에 있는지 확인합니다.",
        "import 경로와 실제 파일 위치가 맞는지 확인합니다.",
        "다시 npm run dev를 실행합니다.",
      ],
      suggestedPrompt: "아래 module not found 계열 에러를 보고 설치해야 할 패키지 또는 고쳐야 할 import 경로를 알려주세요.\n\n[에러]\n{{errorMessage}}",
      relatedTerms: ["npm", "Node.js", "명령어"],
    };
  }

  if (includesAny(message, ["vercel", "build failed", "deployment", "next build"])) {
    return {
      summary: "배포 빌드 과정에서 실패한 것으로 보입니다.",
      possibleCauses: ["TypeScript 에러", "환경변수 누락", "로컬에서는 무시된 빌드 오류", "서버 전용 코드의 클라이언트 사용"],
      solutionSteps: [
        "로컬에서 npm run build를 실행해 같은 에러가 나는지 확인합니다.",
        "에러 파일명과 줄 번호를 먼저 고칩니다.",
        "Vercel 환경변수를 확인합니다.",
        "수정 후 다시 배포합니다.",
      ],
      suggestedPrompt: "Vercel 배포 실패 에러입니다. 빌드 로그에서 가장 먼저 고쳐야 할 파일과 해결 순서를 알려주세요.\n\n[에러]\n{{errorMessage}}",
      relatedTerms: ["Vercel", "배포", "환경변수"],
    };
  }

  return {
    summary: "입력한 에러를 단계별로 확인해야 합니다.",
    possibleCauses: ["명령어 실행 위치 문제", "설치 누락", "설정값 누락", "코드 문법 오류"],
    solutionSteps: [
      "에러가 난 명령어와 현재 폴더를 확인합니다.",
      "에러 메시지의 첫 번째 파일명과 줄 번호를 찾습니다.",
      "최근 수정한 파일부터 확인합니다.",
      "해결이 안 되면 전체 로그보다 핵심 에러 20줄을 AI 도구에 전달합니다.",
    ],
    suggestedPrompt: "아래 에러를 초보자 기준으로 분석하고 해결 순서를 알려주세요.\n\n[현재 단계]\n" + (input.currentStep ?? "알 수 없음") + "\n\n[에러]\n{{errorMessage}}",
    relatedTerms: ["터미널", "명령어", "배포"],
  };
}

export function chatAnswer(input: {
  role: Role;
  message: string;
  currentPage?: string;
  selectedTool?: ToolSlug;
  selectedServiceType?: ServiceType;
  projectSummary?: string;
}) {
  const text = input.message.trim();

  if (text.length < 5) {
    return {
      answer: "질문을 조금 더 자세히 적어주세요. 예를 들어 어떤 화면에서 막혔는지, 어떤 명령어를 실행했는지를 함께 알려주면 더 정확히 안내할 수 있습니다.",
      relatedLinks: ["용어 사전", "에러 해결"],
    };
  }

  if (includesAny(text.toLowerCase(), ["터미널", "git", "github", "vercel", "db", "api", "환경변수", "에러"])) {
    return {
      answer:
        "현재 단계에서 먼저 확인할 것은 목표, 실행한 명령어, 에러 메시지입니다. 비밀키나 DB 주소는 직접 붙여넣지 말고 변수 이름만 공유하세요. 막힌 내용이 에러라면 에러 해결 도우미에 전체 메시지를 넣는 것이 가장 빠릅니다.",
      relatedLinks: ["에러 해결", "용어 사전", "배포 점검"],
    };
  }

  const roleTone =
    input.role === "teacher"
      ? "수업에서는 이 내용을 활동 단계와 점검 질문으로 나눠 안내하면 좋습니다."
      : input.role === "adult"
        ? "빠른 완성을 위해 지금 필요한 기능과 나중에 할 기능을 분리하는 편이 좋습니다."
        : "처음에는 한 번에 완성하려고 하지 말고 첫 화면과 버튼 하나부터 확인하는 편이 좋습니다.";

  return {
    answer: `${roleTone} 현재 선택한 도구와 서비스 유형을 기준으로 다음 행동을 하나만 정하고, 완료되면 체크리스트에 표시하세요.`,
    relatedLinks: ["실습 체크리스트", "프롬프트 템플릿"],
  };
}
