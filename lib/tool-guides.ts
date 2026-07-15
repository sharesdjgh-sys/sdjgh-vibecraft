import type { ToolSlug } from "./types";

export type ToolGuideTabId =
  | "start"
  | "workflow"
  | "safety"
  | "commands"
  | "extend"
  | "troubleshoot";

export type ToolGuideStep = {
  title: string;
  body: string;
  command?: string;
};

export type ToolGuideTab = {
  id: ToolGuideTabId;
  label: string;
  summary: string;
  steps: ToolGuideStep[];
  tips?: string[];
};

export type ToolGuide = {
  name: string;
  description: string;
  officialUrl: string;
  tabs: ToolGuideTab[];
};

export const toolGuides: Record<ToolSlug, ToolGuide> = {
  codex: {
    name: "Codex",
    description: "앱·IDE·터미널에서 프로젝트를 분석하고 수정·검증하는 OpenAI 코딩 에이전트",
    officialUrl: "https://developers.openai.com/codex/",
    tabs: [
      {
        id: "start", label: "빠른 시작", summary: "프로젝트를 안전하게 열고 첫 작업을 시작합니다.",
        steps: [
          { title: "CLI 설치", body: "Node.js가 준비된 터미널에서 Codex를 설치합니다.", command: "npm install -g @openai/codex" },
          { title: "프로젝트에서 실행", body: "프로젝트 폴더로 이동한 뒤 Codex를 실행하고 ChatGPT 계정으로 로그인합니다.", command: "cd my-project\ncodex" },
          { title: "읽기부터 시작", body: "처음에는 파일을 바꾸지 말고 구조와 실행 방법만 설명해 달라고 요청하세요." },
        ],
        tips: ["Git 저장소에서 시작하면 변경사항을 되돌리고 비교하기 쉽습니다.", "첫 작업은 한 화면 또는 한 오류처럼 작게 잡으세요."],
      },
      {
        id: "workflow", label: "작업 루틴", summary: "계획, 구현, 테스트, 리뷰 순서로 작업합니다.",
        steps: [
          { title: "계획", body: "큰 변경은 /plan으로 수정 파일, 위험 요소, 검증 방법을 먼저 확인합니다.", command: "/plan" },
          { title: "작은 단위 구현", body: "한 단계만 구현하고 결과를 설명하게 한 뒤 다음 단계로 넘어갑니다." },
          { title: "검증", body: "테스트와 빌드를 실행하고 실패하면 오류 원인부터 분석하게 합니다.", command: "!npm test" },
          { title: "리뷰", body: "커밋 전 Diff와 코드 리뷰로 불필요한 변경을 확인합니다.", command: "/diff\n/review" },
        ],
      },
      {
        id: "safety", label: "권한·안전", summary: "Codex가 읽고 수정하고 실행할 수 있는 범위를 조절합니다.",
        steps: [
          { title: "권한 확인", body: "처음 보는 저장소에서는 읽기 중심으로 시작하고 필요한 작업만 승인합니다.", command: "/permissions" },
          { title: "비밀 정보 보호", body: ".env, API 키, 인증서 내용을 채팅에 붙이거나 Git에 커밋하지 않습니다." },
          { title: "큰 변경 방지", body: "삭제, 마이그레이션, 배포 작업은 계획과 Diff를 확인한 뒤 진행합니다." },
        ],
      },
      {
        id: "commands", label: "핵심 명령", summary: "처음에는 자주 쓰는 명령만 익히면 충분합니다.",
        steps: [
          { title: "상태와 모델", body: "현재 모델, 권한, 컨텍스트 상태를 확인합니다.", command: "/status\n/model" },
          { title: "세션", body: "이전 작업을 이어가거나 새 대화로 전환합니다.", command: "codex resume\n/clear" },
          { title: "컨텍스트", body: "같은 작업이 길어졌을 때 대화를 압축합니다.", command: "/compact" },
          { title: "터미널과 리뷰", body: "!로 명령을 실행하고 /diff와 /review로 결과를 검사합니다.", command: "!npm run build\n/diff\n/review" },
        ],
      },
      {
        id: "extend", label: "확장 기능", summary: "프로젝트 규칙과 반복 작업을 재사용합니다.",
        steps: [
          { title: "AGENTS.md", body: "빌드 명령, 코딩 규칙, 검증 방법을 저장소에 기록해 반복 설명을 줄입니다." },
          { title: "Skills", body: "디자인 검토나 배포 점검처럼 반복되는 작업 절차를 Skill로 만듭니다.", command: "/skills" },
          { title: "MCP·Plugins", body: "외부 데이터나 전문 워크플로가 필요할 때만 연결하고 권한을 먼저 확인합니다." },
        ],
      },
      {
        id: "troubleshoot", label: "문제 해결", summary: "막혔을 때는 상태, 범위, 오류 원문부터 확인합니다.",
        steps: [
          { title: "컨텍스트가 큼", body: "/compact를 사용하거나 다른 작업이면 /clear로 새 대화를 시작합니다." },
          { title: "권한 요청 반복", body: "/permissions에서 현재 모드를 확인하고 필요한 범위만 허용합니다." },
          { title: "변경이 너무 많음", body: "/diff로 확인한 뒤 작업을 더 작은 단계로 다시 요청합니다." },
          { title: "테스트 실패", body: "오류 메시지를 생략하지 말고 재현 → 원인 → 최소 수정 순서로 요청합니다." },
        ],
      },
    ],
  },
  claude: {
    name: "Claude Code",
    description: "긴 문맥과 프로젝트 규칙을 바탕으로 계획·구현·검증을 수행하는 Anthropic 코딩 에이전트",
    officialUrl: "https://code.claude.com/docs/en/overview",
    tabs: [
      { id: "start", label: "빠른 시작", summary: "Desktop 또는 CLI 중 편한 환경에서 시작합니다.", steps: [
        { title: "CLI 설치", body: "공식 설치 방식 또는 npm으로 Claude Code를 설치합니다.", command: "npm install -g @anthropic-ai/claude-code" },
        { title: "실행과 로그인", body: "프로젝트 폴더에서 claude를 실행하고 브라우저 로그인을 완료합니다.", command: "cd my-project\nclaude" },
        { title: "Desktop 선택", body: "터미널이 낯설다면 Claude Desktop의 Code 탭에서 폴더를 열어 시작하세요." },
      ] },
      { id: "workflow", label: "작업 루틴", summary: "조사와 계획을 먼저 하고 검증 가능한 단위로 구현합니다.", steps: [
        { title: "프로젝트 분석", body: "수정 전에 구조, 명령, 관련 파일을 설명하게 합니다." },
        { title: "Plan Mode", body: "큰 작업은 계획을 검토하고 범위를 줄인 뒤 구현합니다.", command: "/plan" },
        { title: "검증", body: "Diff, 코드 리뷰, 실제 실행 검증을 순서대로 수행합니다.", command: "/diff\n/code-review\n/verify" },
      ] },
      { id: "safety", label: "권한·안전", summary: "Permission Mode를 작업 위험도에 맞게 선택합니다.", steps: [
        { title: "처음에는 default 또는 plan", body: "처음 보는 저장소와 큰 변경에서는 읽기·계획 중심 모드를 사용합니다." },
        { title: "자동 승인 제한", body: "bypass 계열 권한은 격리된 환경에서만 사용하고 실제 서비스 데이터에는 적용하지 않습니다." },
        { title: "규칙 확인", body: "반복 승인이 필요하면 전체 허용 대신 필요한 명령과 폴더만 규칙에 추가합니다.", command: "/permissions" },
      ] },
      { id: "commands", label: "핵심 명령", summary: "상태, 세션, 검증 명령부터 익힙니다.", steps: [
        { title: "상태·진단", body: "버전과 연결 상태를 확인하고 설치 문제를 진단합니다.", command: "/status\n/doctor" },
        { title: "세션·컨텍스트", body: "이전 세션 재개, 압축, 새 대화를 구분해 사용합니다.", command: "/resume\n/compact\n/clear" },
        { title: "검증", body: "변경 확인, 리뷰, 실행 검증을 진행합니다.", command: "/diff\n/review\n/verify" },
      ] },
      { id: "extend", label: "확장 기능", summary: "프로젝트 기억과 전문 작업 능력을 추가합니다.", steps: [
        { title: "CLAUDE.md", body: "프로젝트 명령, 구조, 코딩 규칙, Git 규칙을 팀과 공유합니다.", command: "/init" },
        { title: "Skills", body: "반복되는 절차를 .claude/skills 폴더의 SKILL.md로 관리합니다.", command: "/skills" },
        { title: "MCP·Hooks·Plugins", body: "외부 연결, 자동 검사, 재사용 패키지가 필요할 때 단계적으로 추가합니다." },
      ] },
      { id: "troubleshoot", label: "문제 해결", summary: "Claude Code의 진단 기능과 세션 관리로 복구합니다.", steps: [
        { title: "설치 문제", body: "/doctor로 설치와 환경을 확인하고 터미널을 다시 시작합니다." },
        { title: "규칙을 따르지 않음", body: "CLAUDE.md를 구체화하고 /memory에서 실제 로드 여부를 확인합니다." },
        { title: "컨텍스트 초과", body: "/context 확인 후 같은 작업은 /compact, 새 작업은 /clear를 사용합니다." },
      ] },
    ],
  },
  antigravity: {
    name: "Antigravity",
    description: "IDE·터미널·브라우저를 오가며 계획과 Artifact 중심으로 작업하는 Google 개발 플랫폼",
    officialUrl: "https://antigravity.google/docs/overview",
    tabs: [
      { id: "start", label: "빠른 시작", summary: "IDE로 시작하고 필요할 때 agy CLI를 추가합니다.", steps: [
        { title: "IDE 설치", body: "공식 다운로드 페이지에서 앱을 설치하고 Google 계정으로 로그인합니다.", command: "https://antigravity.google/download" },
        { title: "CLI 설치", body: "Windows PowerShell에서는 공식 설치 스크립트를 실행합니다.", command: "irm https://antigravity.google/cli/install.ps1 | iex" },
        { title: "프로젝트 실행", body: "폴더를 연 뒤 읽기 작업부터 요청합니다. CLI는 프로젝트 폴더에서 agy를 실행합니다.", command: "cd my-project\nagy" },
      ] },
      { id: "workflow", label: "작업 루틴", summary: "Planning Mode와 Artifact 검토가 핵심입니다.", steps: [
        { title: "Planning Mode", body: "수정 파일, 위험 요소, 검증 방법이 포함된 Implementation Plan을 요청합니다." },
        { title: "Artifact 검토", body: "계획, Diff, 다이어그램, 브라우저 기록을 확인하고 댓글로 방향을 조정합니다." },
        { title: "브라우저 검증", body: "웹 작업은 별도 Chrome 프로필에서 실제 동작과 반응형 화면을 검사합니다." },
      ] },
      { id: "safety", label: "권한·안전", summary: "프로젝트별 보안 설정과 세부 권한을 관리합니다.", steps: [
        { title: "Request Review", body: "초보자는 계획과 변경을 승인 후 진행하는 정책을 사용합니다." },
        { title: "프로젝트 범위", body: "Full Machine과 Unrestricted는 피하고 필요한 폴더만 접근하게 합니다." },
        { title: "세부 권한", body: "deny, ask, allow 규칙은 Deny > Ask > Allow 순서로 적용됩니다.", command: "/permissions" },
      ] },
      { id: "commands", label: "핵심 명령", summary: "대화, Artifact, Agent 관리 명령을 익힙니다.", steps: [
        { title: "대화", body: "이전 작업을 재개하거나 체크포인트로 돌아갑니다.", command: "/resume\n/rewind\n/rename 작업이름" },
        { title: "검토", body: "변경과 Artifact를 확인합니다.", command: "/diff\n/artifact" },
        { title: "Agent·작업", body: "백그라운드 Agent와 실행 작업을 확인합니다.", command: "/agents\n/tasks" },
      ] },
      { id: "extend", label: "확장 기능", summary: "Skills, Plugins, MCP, Hooks로 전문 기능을 추가합니다.", steps: [
        { title: "Skills", body: "프로젝트 Skill은 .agents/skills, 전역 Skill은 ~/.gemini/config/skills에 둡니다." },
        { title: "Plugins", body: "Skill, Rule, MCP, Hook을 하나의 패키지로 묶습니다." },
        { title: "MCP·Hooks", body: "외부 서비스 연결과 자동 검사를 추가하되 쓰기 권한은 제한합니다." },
      ] },
      { id: "troubleshoot", label: "문제 해결", summary: "프로젝트, 권한, 브라우저, 확장 설정을 순서대로 확인합니다.", steps: [
        { title: "agy를 찾지 못함", body: "새 터미널을 열고 설치 폴더가 PATH에 포함됐는지 확인합니다." },
        { title: "명령 실행이 멈춤", body: "/permissions와 프로젝트 보안 정책의 승인 요청을 확인합니다." },
        { title: "웹 접근 실패", body: "Browser Tools와 도메인 Allowlist를 확인합니다." },
        { title: "Skill·MCP가 안 보임", body: "폴더 위치, 필수 파일, 인증 정보를 확인하고 다시 로드합니다." },
      ] },
    ],
  },
};
