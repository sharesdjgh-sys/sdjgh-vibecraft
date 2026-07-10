import { baseChecklist, promptTemplates, serviceTypes, softwareChecklist } from "./vibecraft-data";
import type { ChecklistItem, ErrorSolution, Recommendation, Role, ServiceType, ToolSlug } from "./types";

const mobileSignals = ["모바일", "스마트폰", "휴대폰", "pwa", "하단 탭", "하단 네비게이션", "터치", "오프라인"];
const softwareSignals = ["자동화", "파일", "엑셀", "csv", "스크립트", "cli", "반복 업무", "문서 변환"];
const documentSignals = ["긴 문서", "기획서", "수업", "활동지", "설명 자료", "요약", "보고서", "문서 정리"];
const visualSignals = ["디자인", "모바일", "프로토타입", "사용자 흐름", "ui", "ux", "와이어프레임"];
const hardSignals = ["로그인", "회원가입", "계정", "결제", "구독", "실시간", "채팅", "권한", "관리자", "알림"];
const mediumSignals = ["db", "데이터", "저장", "기록", "api", "검색", "업로드", "외부 서비스", "연동"];
const persistenceSignals = ["db", "데이터", "저장", "로그인", "회원가입", "계정", "관리자", "기록"];

function includesAny(text: string, words: readonly string[]) {
  return words.some((word) => {
    const signal = word.toLowerCase();
    const index = text.indexOf(signal);
    if (index < 0) return false;
    const context = text.slice(Math.max(0, index - 10), index + signal.length + 16);
    const escaped = signal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const negated = new RegExp(
      `(?:안|없는|불필요).{0,8}${escaped}|${escaped}.{0,12}(?:안 |않|없|불필요|필요\\s*없|하지\\s*않)`,
    ).test(context);
    return !negated;
  });
}

function firstMatchingSignal(text: string, words: readonly string[]) {
  return words.find((word) => includesAny(text, [word]));
}

function isStandaloneAppIdea(text: string) {
  return includesAny(text, ["앱"]) && !text.includes("웹앱");
}

function defaultFeaturesFor(serviceType: ServiceType) {
  if (serviceType === "mobile-web") {
    return ["모바일 홈", "핵심 입력", "결과 확인", "간편한 탐색", "배포"];
  }

  if (serviceType === "software") {
    return ["자료 입력", "작업 실행", "결과 확인", "실패 안내", "실행 방법"];
  }

  return ["첫 화면", "사용자 입력", "결과 확인", "모바일 화면", "배포"];
}

function pickServiceType(text: string): ServiceType {
  if (includesAny(text, mobileSignals) || isStandaloneAppIdea(text)) {
    return "mobile-web";
  }

  if (includesAny(text, softwareSignals)) {
    return "software";
  }

  return "web";
}

function pickTool(text: string, role: Role): ToolSlug {
  if (includesAny(text, documentSignals) || role === "teacher") {
    return "claude";
  }

  if (includesAny(text, visualSignals) || isStandaloneAppIdea(text)) {
    return "antigravity";
  }

  return "codex";
}

function pickDifficulty(text: string): Recommendation["difficulty"] {
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

function extractFeatures(text: string, serviceType: ServiceType) {
  const featureLines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*0-9.\s]+/, "").trim())
    .filter((line) => line.length > 4 && line.length < 80)
    .filter((line) => includesAny(line.toLowerCase(), ["기능", "화면", "선택", "업로드", "검색", "체크", "챗봇", "추천", "저장"]));

  const detectedFeatures = [
    { label: "사용자 로그인", signals: ["로그인", "회원가입", "계정"] },
    { label: "검색과 필터", signals: ["검색", "필터"] },
    { label: "데이터 저장", signals: ["db", "데이터", "저장", "기록"] },
    { label: "파일 업로드", signals: ["업로드", "파일", "엑셀", "csv"] },
    { label: "맞춤 추천", signals: ["추천", "맞춤"] },
    { label: "진행 체크", signals: ["체크", "진행률", "체크리스트"] },
    { label: "채팅", signals: ["채팅", "챗봇"] },
    { label: "결제", signals: ["결제", "구독"] },
    { label: "관리 화면", signals: ["관리자", "관리 화면"] },
  ]
    .filter((feature) => includesAny(text, feature.signals))
    .map((feature) => feature.label);

  const unique = Array.from(new Set([...featureLines, ...detectedFeatures])).slice(0, 5);
  return unique.length > 0 ? unique : defaultFeaturesFor(serviceType);
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

function roadmapFor(serviceType: ServiceType, difficulty: Recommendation["difficulty"], text: string) {
  if (serviceType === "software") {
    const steps = [
      "반복할 작업의 입력과 기대 결과를 한 사례로 정합니다.",
      "자료 한 개로 입력 → 처리 → 결과 흐름을 구현합니다.",
      "잘못된 입력과 실패 메시지를 점검합니다.",
      "서로 다른 자료 세 개로 실행 결과를 확인합니다.",
      "다른 사람도 따라 할 수 있게 실행 방법을 정리합니다.",
    ];

    if (includesAny(text, ["api", "외부 서비스", "연동"])) {
      steps.splice(2, 0, "외부 서비스 연결 정보는 환경변수로 분리하고 응답을 확인합니다.");
    }

    if (difficulty === "도전") {
      steps.splice(steps.length - 1, 0, "핵심 운영 기능의 정상·실패 상황과 접근 범위를 따로 점검합니다.");
    }

    return steps;
  }

  const base = [
    "역할과 만들 서비스 목표를 확정합니다.",
    "MVP에 꼭 필요한 화면과 기능만 먼저 고릅니다.",
    "첫 화면과 핵심 입력 흐름을 구현합니다.",
    "Vercel에 빠르게 배포해 실제 링크를 확인합니다.",
  ];

  base.splice(3, 0, "모바일 화면에서 카드, 버튼, 입력창이 겹치지 않는지 확인합니다.");

  if (includesAny(text, persistenceSignals)) {
    base.splice(base.length - 1, 0, "Neon DB와 환경변수를 연결하고 저장 기능을 검증합니다.");
  }

  if (difficulty === "도전") {
    base.splice(base.length - 1, 0, "핵심 운영 기능의 정상·실패 상황과 공개 범위를 각각 확인합니다.");
  }

  return base;
}

function checklistFor(serviceType: ServiceType): ChecklistItem[] {
  if (serviceType === "software") {
    return softwareChecklist;
  }

  return baseChecklist;
}

function stackFor(serviceType: ServiceType, text: string) {
  const service = serviceTypes.find((item) => item.id === serviceType) ?? serviceTypes[0];
  let stack = [...service.stack];

  if (!includesAny(text, persistenceSignals)) {
    stack = stack.filter((item) => item !== "Neon DB");
  } else if (!stack.includes("Neon DB")) {
    stack.push("Neon DB");
  }

  if (serviceType === "mobile-web" && !includesAny(text, ["pwa", "오프라인", "설치"])) {
    stack = stack.filter((item) => item !== "PWA 확장");
  }

  if (serviceType === "software" && !includesAny(text, ["api", "외부 서비스", "연동"])) {
    stack = stack.filter((item) => item !== "외부 API");
  }

  return Array.from(new Set(stack));
}

function serviceReason(serviceType: ServiceType, text: string) {
  if (serviceType === "mobile-web") {
    const signal = firstMatchingSignal(text, mobileSignals) ?? (isStandaloneAppIdea(text) ? "앱" : undefined);
    return `${signal ? `'${signal}' 사용 맥락이 있어` : "스마트폰 사용이 중심이라"} 작은 화면과 터치 흐름을 우선한 모바일 웹앱이 적합합니다.`;
  }

  if (serviceType === "software") {
    const signal = firstMatchingSignal(text, softwareSignals);
    return `${signal ? `'${signal}' 작업이 핵심이라` : "반복 작업 처리가 중심이라"} 입력 → 실행 → 결과가 분명한 자동화 도구가 적합합니다.`;
  }

  return "설치가 필요한 앱이나 파일 자동화보다 링크로 입력과 결과를 공유하는 흐름에 가까워 웹 서비스가 적합합니다.";
}

function toolReason(tool: ToolSlug, role: Role, serviceType: ServiceType, difficulty: Recommendation["difficulty"], text: string) {
  if (tool === "claude") {
    return role === "teacher"
      ? "수업 자료를 정리하고 학생용 안내로 바꾸는 일이 중요해 긴 문맥을 구조화하기 좋은 Claude가 잘 맞습니다."
      : "기획서·자료처럼 긴 내용을 화면과 기능으로 먼저 정리해야 해 Claude가 잘 맞습니다.";
  }

  if (tool === "antigravity") {
    return serviceType === "mobile-web"
      ? "모바일 화면과 터치 순서를 먼저 눈으로 확인해야 해 시각적 흐름을 잡기 좋은 Antigravity가 잘 맞습니다."
      : "화면·디자인 요구가 드러나 초기 사용자 흐름을 빠르게 확인하기 좋은 Antigravity가 잘 맞습니다.";
  }

  if (difficulty !== "입문" || includesAny(text, ["next.js", "typescript", "api", "db"])) {
    if (difficulty === "도전") {
      const signal = firstMatchingSignal(text, hardSignals);
      return `${signal ? `'${signal}' 같은` : ""} 운영 기능의 상태와 예외 처리를 실제 코드에서 검증하기 좋아 Codex가 잘 맞습니다.`;
    }

    if (includesAny(text, persistenceSignals) && includesAny(text, ["api", "외부 서비스", "연동"])) {
      return "데이터 저장과 외부 연동을 실제 코드 구조 안에서 함께 구현하고 검증하기 좋아 Codex가 잘 맞습니다.";
    }

    if (includesAny(text, persistenceSignals)) {
      return "데이터 저장과 배포 흐름을 파일 단위로 구현하고 검증하기 좋아 Codex가 잘 맞습니다.";
    }

    if (includesAny(text, ["api", "외부 서비스", "연동"])) {
      return "외부 서비스 연동과 오류 처리를 실제 코드에서 검증하기 좋아 Codex가 잘 맞습니다.";
    }

    return "운영 기능과 예외 처리를 파일 단위로 구현하고 검증하기 좋아 Codex가 잘 맞습니다.";
  }

  return "작은 기능부터 파일을 수정하고 실행 결과를 확인하는 과정을 이어가기 좋아 Codex가 잘 맞습니다.";
}

function difficultyReason(difficulty: Recommendation["difficulty"], serviceType: ServiceType, text: string) {
  if (difficulty === "도전") {
    const labels = [
      { label: "로그인", signals: ["로그인", "회원가입", "계정"] },
      { label: "결제", signals: ["결제", "구독"] },
      { label: "실시간 기능", signals: ["실시간", "채팅"] },
      { label: "권한 관리", signals: ["권한", "관리자"] },
      { label: "알림", signals: ["알림"] },
    ]
      .filter((item) => includesAny(text, item.signals))
      .map((item) => item.label)
      .slice(0, 2);

    return `${labels.join("·") || "운영 기능"}에는 보안과 실패 상황 점검이 필요해 난이도를 '도전'으로 잡았습니다.`;
  }

  if (difficulty === "보통") {
    const labels = [
      { label: "데이터 저장", signals: ["db", "데이터", "저장", "기록"] },
      { label: "외부 연동", signals: ["api", "외부 서비스", "연동"] },
      { label: "검색", signals: ["검색"] },
      { label: "업로드", signals: ["업로드"] },
    ]
      .filter((item) => includesAny(text, item.signals))
      .map((item) => item.label)
      .slice(0, 2);

    return `${labels.join("·") || "데이터 기능"}을 연결하고 오류를 확인해야 해 난이도를 '보통'으로 잡았습니다.`;
  }

  return serviceType === "software"
    ? "로그인·결제·DB 같은 운영 기능이 없어 입력 → 결과 한 흐름부터 만드는 '입문' 범위로 시작할 수 있습니다."
    : "로그인·결제·DB 같은 운영 기능이 없어 화면과 핵심 동작부터 만드는 '입문' 범위로 시작할 수 있습니다.";
}

function interviewQuestions(role: Role, idea: string) {
  const text = idea.toLowerCase();
  const serviceType = pickServiceType(text);
  const questions: string[] = [];

  if (role === "teacher") {
    questions.push("교사와 학생 중 누가 주로 쓰고, 수업의 어느 순간에 쓰나요?");
  } else if (role === "student") {
    questions.push("누가 이 결과물을 쓰고, 어떤 불편을 해결하나요?");
  } else {
    questions.push("누가 이 서비스를 쓰고, 어떤 시간이나 불편을 줄이려 하나요?");
  }

  if (serviceType === "software") {
    questions.push("어떤 자료를 넣으면 어떤 결과가 나와야 하나요?");
  } else if (serviceType === "mobile-web") {
    questions.push("스마트폰에서 사용자가 가장 먼저 할 일은 무엇인가요?");
  } else {
    questions.push("사용자가 첫 화면에서 가장 먼저 할 일은 무엇인가요?");
  }

  if (includesAny(text, ["결제", "구독"])) {
    questions.push("첫 버전에 실제 결제가 꼭 필요한가요, 신청만 받아도 되나요?");
  } else if (includesAny(text, ["로그인", "회원가입", "계정", "권한", "관리자"])) {
    questions.push("로그인이 꼭 필요한가요? 사용자마다 볼 내용이 다른가요?");
  } else if (includesAny(text, ["실시간", "채팅", "알림"])) {
    questions.push("실시간 기능이 꼭 필요한가요, 새로고침 방식으로 시작해도 되나요?");
  } else if (includesAny(text, ["추천", "맞춤"])) {
    questions.push("추천 결과를 정하려면 어떤 입력과 기준이 필요한가요?");
  } else if (includesAny(text, ["api", "외부 서비스", "연동"])) {
    questions.push("어떤 외부 서비스와 어떤 정보를 주고받아야 하나요?");
  } else if (serviceType !== "software" && includesAny(text, ["업로드", "파일", "엑셀", "csv"])) {
    questions.push("어떤 파일을 받고, 처리한 뒤 무엇을 보여줘야 하나요?");
  } else if (includesAny(text, persistenceSignals)) {
    questions.push("무엇을 저장하고, 누가 다시 보거나 수정하나요?");
  } else {
    questions.push("입력한 내용이나 결과를 나중에도 저장해야 하나요?");
  }

  if (role === "teacher") {
    questions.push("한 차시 안에 확인할 최소 결과는 무엇인가요?");
  } else if (role === "student") {
    questions.push("발표나 제출 때 꼭 보여줘야 할 기능은 무엇인가요?");
  } else {
    questions.push("첫 버전에서 시간을 가장 많이 줄여줄 기능은 무엇인가요?");
  }

  if (idea.trim().length < 24) {
    questions.push("완성되었을 때 어떤 결과가 보이면 성공인가요?");
  }

  return Array.from(new Set(questions)).slice(0, 5);
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
  const serviceTitle = serviceTypes.find((item) => item.id === recommendedServiceType)?.title ?? "웹 서비스";

  return {
    summary: extractSummary(input.text, input.fallbackSummary ?? `입력한 내용을 바탕으로 구현 가능한 ${serviceTitle} MVP를 추천합니다.`),
    targetUsers: targetUsersForRole(input.role),
    mainFeatures: extractFeatures(normalized, recommendedServiceType),
    recommendedTool,
    recommendedServiceType,
    recommendedStack: stackFor(recommendedServiceType, normalized),
    difficulty,
    reasons: [
      serviceReason(recommendedServiceType, normalized),
      toolReason(recommendedTool, input.role, recommendedServiceType, difficulty, normalized),
      difficultyReason(difficulty, recommendedServiceType, normalized),
    ],
    roadmap: roadmapFor(recommendedServiceType, difficulty, normalized),
    checklist: checklistFor(recommendedServiceType),
    promptTemplates: promptTemplates.slice(0, 3).map((template) => template.title),
  };
}

export function createInterview(input: {
  role: Role;
  idea: string;
  answers?: Record<string, string>;
}) {
  const questions = interviewQuestions(input.role, input.idea);

  if (!input.answers || Object.keys(input.answers).length === 0) {
    return {
      nextQuestions: questions,
      projectBrief: null,
      recommendation: null,
    };
  }

  // Generated questions are navigation, not user requirements. Feeding their wording
  // back into the recommender would falsely detect features such as login or storage.
  const answerText = Object.values(input.answers)
    .map((answer, index) => `사용자 답변 ${index + 1}: ${answer.trim()}`)
    .filter((answer) => !answer.endsWith(":"))
    .join("\n");

  const combined = `${input.idea}\n\n${answerText}`;
  const recommendation = buildRecommendation({
    role: input.role,
    text: combined,
    fallbackSummary: `${input.idea} 아이디어를 바탕으로 한 구현 브리프입니다.`,
  });
  recommendation.summary =
    input.idea.trim().length >= 8
      ? input.idea.trim()
      : `${input.idea.trim()} 아이디어를 실제로 구현하는 첫 번째 버전`;

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
