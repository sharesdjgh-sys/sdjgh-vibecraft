import type {
  ChecklistItem,
  PromptTemplate,
  RoleOption,
  ServiceTypeInfo,
  TermInfo,
  ToolInfo,
} from "./types";

export const roleOptions: RoleOption[] = [
  {
    id: "student",
    title: "학생",
    description: "기획서는 있지만 개발 도구와 용어가 낯선 학습자",
    example: "동아리, 수행평가, 개인 아이디어를 실제 웹앱으로 옮기는 흐름에 맞춰 설명합니다.",
  },
  {
    id: "teacher",
    title: "선생님",
    description: "수업에서 학생의 구현 과정을 지도해야 하는 운영자",
    example: "수업 진행, 과제 안내, 학생 질문 대응에 바로 쓸 수 있는 관점으로 정리합니다.",
  },
  {
    id: "adult",
    title: "일반인",
    description: "개인 프로젝트나 업무 도구를 직접 만들어보고 싶은 사용자",
    example: "빠른 실행, 업무 적용, 작은 서비스 출시 중심으로 안내합니다.",
  },
];

export const tools: ToolInfo[] = [
  {
    slug: "codex",
    name: "Codex",
    tagline: "코드베이스를 직접 다루며 구현 순서를 세우기 좋은 도구",
    bestFor: "Next.js, TypeScript, API, DB처럼 실제 코드 구조를 함께 정리해야 하는 프로젝트",
    strengths: ["파일 단위 수정 흐름이 명확함", "계획과 구현을 나눠 진행하기 좋음", "터미널과 Git 흐름을 익히기 좋음"],
    cautions: ["터미널 용어가 낯설면 초반 안내가 필요함", "한 번에 너무 큰 요구를 주면 검토가 어려움"],
    guide: [
      {
        title: "특징",
        items: ["기획서를 구현 단계로 쪼개기 좋습니다.", "코드 변경과 검증 과정을 대화 안에서 이어갈 수 있습니다."],
      },
      {
        title: "설치 전 준비",
        items: ["Node.js와 Git 설치 여부를 먼저 확인합니다.", "작업 폴더와 GitHub 저장소를 준비합니다."],
      },
      {
        title: "기본 사용법",
        items: ["먼저 구현 계획을 요청합니다.", "작은 단위로 기능을 맡기고 실행 결과를 확인합니다.", "에러 메시지는 그대로 붙여넣습니다."],
      },
      {
        title: "실전 팁",
        items: ["기획서, 현재 목표, 실패한 명령어를 함께 전달합니다.", "보안 키와 DB URL은 채팅에 직접 노출하지 않습니다."],
      },
    ],
  },
  {
    slug: "claude",
    name: "Claude",
    tagline: "긴 기획서와 설명 자료를 읽고 구조화하는 데 강한 도구",
    bestFor: "기획서 분석, 화면 구성 정리, 수업 자료 변환, 설명형 문서 작성",
    strengths: ["긴 문서를 정리하기 좋음", "초보자 눈높이 설명에 강함", "프롬프트 템플릿을 만들기 좋음"],
    cautions: ["실제 파일 수정 환경은 사용하는 제품에 따라 다름", "코드 실행 검증은 별도로 확인해야 함"],
    guide: [
      {
        title: "특징",
        items: ["기획서의 핵심 사용자와 기능을 뽑아내기 좋습니다.", "선생님용 설명 자료나 학생용 안내문을 만들기 좋습니다."],
      },
      {
        title: "설치 전 준비",
        items: ["사용할 Claude 제품과 파일 업로드 가능 여부를 확인합니다.", "기획서와 원하는 결과물을 함께 준비합니다."],
      },
      {
        title: "기본 사용법",
        items: ["긴 기획서를 먼저 요약하게 합니다.", "MVP 범위와 나중에 할 일을 나누게 합니다.", "코드는 단계별로 요청합니다."],
      },
      {
        title: "실전 팁",
        items: ["결과를 바로 믿지 말고 실행 가능한 작업 목록으로 바꿉니다.", "최신 설치법은 공식 문서로 다시 확인합니다."],
      },
    ],
  },
  {
    slug: "antigravity",
    name: "Antigravity",
    tagline: "시각적 흐름과 앱 제작 경험을 빠르게 확인하기 좋은 도구",
    bestFor: "처음 보는 사용자가 화면 흐름을 빠르게 잡고 결과물을 확인해야 하는 프로젝트",
    strengths: ["프로젝트 흐름을 시각적으로 이해하기 좋음", "앱 형태의 결과물을 상상하기 쉬움", "초기 탐색에 적합함"],
    cautions: ["세밀한 코드 품질 검토는 별도 과정이 필요함", "배포와 DB 연결은 단계별 확인이 필요함"],
    guide: [
      {
        title: "특징",
        items: ["아이디어를 화면 흐름으로 빠르게 바꿔보는 데 적합합니다.", "초보자가 결과물을 상상하기 쉽습니다."],
      },
      {
        title: "설치 전 준비",
        items: ["만들 화면 목록과 사용자 흐름을 먼저 적습니다.", "로그인, DB 저장, 배포가 필요한지 표시합니다."],
      },
      {
        title: "기본 사용법",
        items: ["첫 화면부터 핵심 행동까지 순서대로 요청합니다.", "모바일 화면 기준을 별도로 말합니다.", "완성 후 코드와 배포 과정을 점검합니다."],
      },
      {
        title: "실전 팁",
        items: ["시각 결과가 좋아도 버튼 동작과 데이터 저장은 따로 확인합니다.", "Vercel 배포 전 최종 체크리스트를 거칩니다."],
      },
    ],
  },
];

export const serviceTypes: ServiceTypeInfo[] = [
  {
    id: "web",
    title: "웹 서비스",
    description: "데스크톱과 모바일 브라우저에서 모두 쓰는 일반 웹앱",
    stack: ["Next.js", "TypeScript", "Tailwind CSS", "Vercel", "Neon DB"],
    screens: ["첫 화면", "목록 또는 대시보드", "상세 화면", "입력 폼", "관리 또는 점검 화면"],
  },
  {
    id: "mobile-web",
    title: "모바일 최적화 웹앱",
    description: "스마트폰에서 자주 쓰는 서비스에 맞춘 웹앱",
    stack: ["Next.js", "TypeScript", "Tailwind CSS", "하단 네비게이션", "PWA 확장"],
    screens: ["모바일 홈", "단계형 입력", "하단 탭", "전체화면 시트", "완료 화면"],
  },
  {
    id: "game",
    title: "게임",
    description: "브라우저에서 바로 실행하고 친구에게 링크로 공유하는 게임",
    stack: ["Next.js", "TypeScript", "Canvas", "Tailwind CSS", "Vercel"],
    screens: ["시작 화면", "게임 화면", "조작 안내", "점수 또는 결과", "다시 하기"],
  },
  {
    id: "software",
    title: "SW 또는 자동화 도구",
    description: "파일 처리, 반복 업무, 간단한 내부 도구에 맞춘 형태",
    stack: ["Node.js", "TypeScript", "CLI 또는 웹 UI", "외부 API", "파일 처리"],
    screens: ["작업 선택", "입력 화면", "실행 결과", "로그", "설정"],
  },
];

export const conceptCards = [
  {
    title: "바이브코딩의 의미",
    body: "AI에게 한 번에 모든 것을 맡기는 방식이 아니라, 사람이 목표와 기준을 정하고 AI와 함께 구현하는 개발 방식입니다.",
    example: "‘쇼핑몰을 만들어줘’보다 ‘상품 카드에 이름·가격·구매 버튼을 보여줘’처럼 결과를 구체적으로 요청합니다.",
    action: "만들고 싶은 결과를 사용자의 행동 한 문장으로 적어보세요.",
  },
  {
    title: "사람이 맡는 일",
    body: "무엇을 만들지 정하고, 결과가 맞는지 확인하고, 보안 정보와 배포 상태를 점검합니다.",
    example: "로그인 버튼이 보이는 것만 확인하지 않고, 잘못된 비밀번호를 입력했을 때 안내가 나오는지도 직접 눌러봅니다.",
    action: "기능마다 ‘정상일 때’와 ‘실패할 때’ 확인할 항목을 하나씩 정하세요.",
  },
  {
    title: "AI가 잘하는 일",
    body: "기획서를 기능 단위로 나누고, 코드 초안을 만들고, 에러 원인을 추정하고, 다음 작업 순서를 제안합니다.",
    example: "긴 기획서를 화면 목록과 구현 순서로 바꾸거나, 에러 원문에서 확인할 파일 후보를 빠르게 좁힐 수 있습니다.",
    action: "반복되거나 막막한 작업은 먼저 AI에게 작은 단계로 나눠달라고 요청하세요.",
  },
  {
    title: "기획서가 중요한 이유",
    body: "기획서가 명확할수록 AI가 화면, 데이터, 기술 스택을 더 일관되게 추천할 수 있습니다.",
    example: "대상 사용자와 핵심 기능이 정해져 있으면 AI가 불필요한 관리자 화면이나 복잡한 데이터베이스를 덜 제안합니다.",
    action: "사용자, 해결할 문제, 핵심 기능 세 가지가 기획서에 있는지 확인하세요.",
  },
  {
    title: "작게 나누어 요청하기",
    body: "한 번에 전체 서비스를 완성해 달라고 하기보다 화면 하나, 기능 하나씩 요청하면 결과를 확인하고 고치기 쉽습니다.",
    example: "로그인 전체를 한 번에 만들기보다 입력창 → 유효성 검사 → 로그인 요청 → 실패 안내 순서로 나눕니다.",
    action: "한 작업이 30분 안에 직접 확인 가능한 크기인지 살펴보세요.",
  },
  {
    title: "완료 기준 먼저 정하기",
    body: "‘잘 만들어줘’ 대신 버튼을 누르면 무엇이 보여야 하는지처럼 확인 가능한 기준을 적으면 결과가 훨씬 선명해집니다.",
    example: "‘모바일을 개선해줘’ 대신 ‘390px 화면에서 가로 스크롤이 없고 주요 버튼이 한 화면에 보여야 해’라고 적습니다.",
    action: "요청 끝에 ‘완료되면 확인할 수 있는 방법도 알려줘’를 덧붙이세요.",
  },
  {
    title: "변경 기록 남기기",
    body: "작동하는 시점마다 Git으로 변경을 저장하면 다음 수정이 실패해도 안전한 상태로 돌아갈 수 있습니다.",
    example: "첫 화면 완성, 폼 연결, 모바일 수정처럼 의미 있는 단위마다 커밋하면 문제가 생긴 변경을 찾기 쉽습니다.",
    action: "새 기능을 시작하기 전에 현재 작동 상태를 커밋하세요.",
  },
  {
    title: "직접 확인해야 하는 것",
    body: "AI가 코드를 만들었더라도 실제 화면, 모바일 크기, 버튼 동작, 비밀키 노출 여부는 사람이 마지막으로 확인해야 합니다.",
    example: "빌드가 성공해도 빈 검색 결과, 느린 네트워크, 긴 문장처럼 실제 사용 중 만나는 상황은 별도로 확인해야 합니다.",
    action: "정상·빈 상태·오류·모바일 네 가지 조건으로 결과를 확인하세요.",
  },
];

export const baseChecklist: ChecklistItem[] = [
  { id: "git-install", title: "Git 설치 확인", description: "Git을 설치하고 터미널에서 git --version 명령이 실행되는지 확인합니다." },
  { id: "github-account", title: "GitHub 계정 준비", description: "프로젝트 저장소를 만들 계정과 이메일을 확인합니다." },
  { id: "project-create", title: "프로젝트 생성", description: "Next.js, TypeScript, Tailwind 기반 프로젝트를 시작합니다." },
  { id: "local-run", title: "로컬 실행", description: "개발 서버를 실행하고 첫 화면이 뜨는지 확인합니다." },
  { id: "first-screen", title: "첫 화면 구현", description: "사용자가 처음 해야 할 행동이 보이는 화면을 만듭니다." },
  { id: "deploy-vercel", title: "Vercel 배포", description: "저장소를 연결하고 배포 URL을 확인합니다." },
  { id: "neon-db", title: "Neon DB 준비", description: "데이터 저장이 필요한 경우 Postgres DB와 환경변수를 준비합니다." },
  { id: "mobile-check", title: "모바일 화면 확인", description: "작은 화면에서 텍스트와 버튼이 겹치지 않는지 확인합니다." },
  { id: "error-review", title: "에러 해결", description: "에러 메시지를 해결 도우미에 붙여넣고 다음 행동을 정리합니다." },
  { id: "final-check", title: "배포 전 점검", description: "보안, 환경변수, 버튼 동작, 모바일 화면을 최종 확인합니다." },
];

export const softwareChecklist: ChecklistItem[] = [
  { id: "git-install", title: "Git 설치 확인", description: "Git을 설치하고 터미널에서 git --version 명령이 실행되는지 확인합니다." },
  { id: "github-account", title: "GitHub 계정 준비", description: "프로젝트와 변경 기록을 보관할 계정을 확인합니다." },
  { id: "automation-sample", title: "입력 사례 준비", description: "실제로 처리할 자료 한 개와 기대 결과를 나란히 준비합니다." },
  { id: "project-create", title: "자동화 프로젝트 생성", description: "Node.js와 TypeScript 기반으로 실행 가능한 프로젝트를 시작합니다." },
  { id: "local-run", title: "로컬 실행", description: "개발 환경에서 입력 → 처리 → 결과 흐름이 한 번 끝나는지 확인합니다." },
  { id: "core-process", title: "핵심 처리 구현", description: "가장 반복되는 작업 하나를 안정적으로 자동화합니다." },
  { id: "failure-message", title: "실패 상황 안내", description: "잘못된 입력과 외부 연동 실패 시 다음 행동을 알려줍니다." },
  { id: "error-review", title: "에러 해결", description: "실행 로그를 해결 도우미에 붙여넣고 원인을 확인합니다." },
  { id: "share-runbook", title: "실행 방법 공유", description: "다른 사람이 설치하고 실행할 수 있는 짧은 안내를 작성합니다." },
  { id: "final-check", title: "공개 전 점검", description: "비밀 정보, 입력 사례, 실패 메시지, 공유 주소를 최종 확인합니다." },
];

export const gameChecklist: ChecklistItem[] = [
  { id: "git-install", title: "Git 설치 확인", description: "Git을 설치하고 터미널에서 git --version 명령이 실행되는지 확인합니다." },
  { id: "github-account", title: "GitHub 계정 준비", description: "게임 프로젝트를 저장하고 공유할 계정을 확인합니다." },
  { id: "game-rule", title: "게임 규칙 정하기", description: "플레이어의 목표, 조작 방법, 성공과 실패 조건을 한 문장씩 정합니다." },
  { id: "project-create", title: "게임 프로젝트 생성", description: "브라우저에서 실행할 TypeScript 프로젝트를 시작합니다." },
  { id: "local-run", title: "게임 실행", description: "개발 서버를 열고 브라우저에 게임 화면이 표시되는지 확인합니다." },
  { id: "game-control", title: "조작 구현", description: "키보드나 터치로 캐릭터 또는 게임 요소를 움직입니다." },
  { id: "game-loop", title: "핵심 규칙 구현", description: "시작부터 성공 또는 실패 결과까지 한 판을 끝낼 수 있게 만듭니다." },
  { id: "game-feedback", title: "점수와 피드백", description: "플레이 결과, 점수, 다시 하기 버튼을 화면에 표시합니다." },
  { id: "mobile-check", title: "화면과 조작 확인", description: "PC와 스마트폰에서 화면이 잘리고 조작이 막히지 않는지 확인합니다." },
  { id: "deploy-vercel", title: "게임 공개", description: "Vercel에 배포하고 다른 사람이 링크로 한 판을 완료하는지 확인합니다." },
];

export const terms: TermInfo[] = [
  {
    term: "터미널",
    category: "기초",
    plainDescription: "마우스 대신 글자로 컴퓨터에 작업을 요청하는 창입니다.",
    examples: {
      student: "선생님에게 말로 과제를 제출하는 대신 정해진 문장으로 제출 명령을 보내는 느낌입니다.",
      teacher: "수업 자료 폴더에서 정해진 명령으로 파일을 만들고 실행하는 공간입니다.",
      adult: "반복 업무를 버튼 대신 명령어로 빠르게 처리하는 작업 창입니다.",
    },
    related: ["명령어", "Node.js", "npm"],
  },
  {
    term: "GitHub",
    category: "협업",
    plainDescription: "코드와 변경 기록을 온라인에 저장하는 서비스입니다.",
    examples: {
      student: "수행평가 파일을 클라우드에 올리고 버전별로 남겨두는 것과 비슷합니다.",
      teacher: "학생 프로젝트 제출물과 변경 기록을 확인할 수 있는 저장 공간입니다.",
      adult: "프로젝트 코드를 보관하고 Vercel 배포와 연결하는 저장소입니다.",
    },
    related: ["Git", "Repository", "Commit"],
  },
  {
    term: "Vercel",
    category: "배포",
    plainDescription: "Next.js 웹앱을 인터넷 주소로 공개해주는 배포 서비스입니다.",
    examples: {
      student: "내 프로젝트를 친구가 링크로 볼 수 있게 올리는 곳입니다.",
      teacher: "학생 결과물을 URL로 확인하고 발표할 수 있게 해줍니다.",
      adult: "작은 웹 서비스를 빠르게 공개하고 수정 사항을 자동 반영할 수 있습니다.",
    },
    related: ["배포", "환경변수", "GitHub"],
  },
  {
    term: "Neon DB",
    category: "데이터",
    plainDescription: "웹앱의 사용자 입력과 진행 상태를 저장할 수 있는 Postgres 데이터베이스 서비스입니다.",
    examples: {
      student: "체크리스트 완료 상태를 새로고침 후에도 남겨두는 저장 공간입니다.",
      teacher: "학생들의 진행 기록을 모아볼 때 필요한 데이터 저장소입니다.",
      adult: "문의, 주문, 기록 같은 업무 데이터를 저장하는 곳입니다.",
    },
    related: ["Database", "SQL", "환경변수"],
  },
  {
    term: "환경변수",
    category: "보안",
    plainDescription: "API 키나 DB 주소처럼 코드에 직접 쓰면 안 되는 값을 숨겨서 넣는 설정입니다.",
    examples: {
      student: "비밀번호를 공개 게시판에 쓰지 않고 잠긴 서랍에 넣어두는 것과 비슷합니다.",
      teacher: "수업용 계정 비밀키를 학생 코드에 직접 노출하지 않게 하는 설정입니다.",
      adult: "서비스 운영 키와 DB 접속 주소를 배포 환경에 안전하게 넣는 방법입니다.",
    },
    related: ["API", "Vercel", "Neon DB"],
  },
  {
    term: "API",
    category: "연동",
    plainDescription: "서비스끼리 정해진 형식으로 요청과 응답을 주고받는 통로입니다.",
    examples: {
      student: "급식 정보를 가져오라고 요청하면 정해진 형식으로 답을 받는 통로입니다.",
      teacher: "외부 학습 데이터나 AI 답변을 수업 도구에 연결하는 방식입니다.",
      adult: "결제, 알림, AI 같은 외부 기능을 내 서비스에 붙이는 연결 규칙입니다.",
    },
    related: ["서버", "클라이언트", "환경변수"],
  },
  {
    term: "Repository",
    category: "협업",
    plainDescription: "프로젝트 코드와 변경 기록을 한곳에 모아두는 저장 공간이며, 보통 저장소라고 부릅니다.",
    examples: {
      student: "과제 파일과 수정본을 날짜별로 모아둔 온라인 과제함과 비슷합니다.",
      teacher: "수업 자료와 학생 프로젝트의 수정 과정을 함께 보관하는 폴더입니다.",
      adult: "소스 코드, 설정, 문서를 팀이 함께 관리하는 프로젝트 단위 공간입니다.",
    },
    related: ["GitHub", "Git", "Commit"],
  },
  {
    term: "Commit",
    category: "협업",
    plainDescription: "현재까지 바꾼 내용을 설명과 함께 하나의 안전한 시점으로 저장하는 일입니다.",
    examples: {
      student: "과제의 중간 완성본에 ‘첫 화면 완성’이라는 이름을 붙여 저장하는 것과 같습니다.",
      teacher: "수업 자료를 수정한 이유와 시점을 남겨 이전 버전도 찾을 수 있게 합니다.",
      adult: "기능 단위 변경을 기록해 검토와 문제 추적이 가능하게 만듭니다.",
    },
    related: ["Git", "Repository", "브랜치"],
  },
  {
    term: "컴포넌트",
    category: "화면",
    plainDescription: "버튼, 카드, 입력창처럼 화면에서 반복해 사용할 수 있게 나눈 작은 UI 단위입니다.",
    examples: {
      student: "레고 블록을 조립해 하나의 화면을 만드는 것과 비슷합니다.",
      teacher: "같은 퀴즈 카드나 제출 버튼을 여러 수업 화면에서 재사용할 수 있습니다.",
      adult: "공통 UI를 한 번 만들어 여러 업무 화면에서 일관되게 사용합니다.",
    },
    related: ["React", "UI", "페이지"],
  },
  {
    term: "라우팅",
    category: "화면",
    plainDescription: "주소에 따라 홈, 상세, 설정처럼 서로 다른 화면을 보여주는 연결 규칙입니다.",
    examples: {
      student: "학교 건물의 교실 번호를 보고 원하는 교실로 찾아가는 방식과 비슷합니다.",
      teacher: "수업 목록에서 특정 수업 상세 화면으로 이동하는 길을 정합니다.",
      adult: "URL과 각 업무 화면을 연결해 사용자가 필요한 위치로 이동하게 합니다.",
    },
    related: ["페이지", "URL", "Next.js"],
  },
  {
    term: "빌드",
    category: "배포",
    plainDescription: "작성한 코드를 실제 서비스에서 실행할 수 있는 형태로 검사하고 묶는 과정입니다.",
    examples: {
      student: "제출 전에 빠진 파일이나 틀린 형식이 없는지 검사해 최종본을 만드는 단계입니다.",
      teacher: "수업 자료를 배포하기 전에 링크와 파일 구성을 최종 점검하는 과정입니다.",
      adult: "타입 오류와 설정 누락을 확인하고 운영용 결과물을 생성합니다.",
    },
    related: ["배포", "Vercel", "TypeScript"],
  },
  {
    term: "로컬 환경",
    category: "기초",
    plainDescription: "인터넷에 공개하기 전, 내 컴퓨터에서 프로젝트를 실행하고 확인하는 작업 환경입니다.",
    examples: {
      student: "친구에게 공유하기 전에 내 컴퓨터에서 과제를 먼저 열어보는 단계입니다.",
      teacher: "학생에게 배포하기 전 교사용 컴퓨터에서 수업 도구를 시험하는 환경입니다.",
      adult: "운영 서비스에 영향을 주지 않고 기능을 개발하고 검증하는 개인 환경입니다.",
    },
    related: ["개발 서버", "localhost", "배포"],
  },
  {
    term: "TypeScript",
    category: "코드",
    plainDescription: "값의 종류를 미리 표시해 잘못된 데이터 사용을 실행 전에 찾아주는 JavaScript 확장 언어입니다.",
    examples: {
      student: "숫자를 써야 하는 칸에 문장을 넣었을 때 제출 전에 알려주는 검사표와 비슷합니다.",
      teacher: "학생 정보의 이름, 학년, 제출 상태 형식을 미리 정해 실수를 줄입니다.",
      adult: "데이터 계약을 코드에 남겨 기능 변경 시 생길 오류를 일찍 발견합니다.",
    },
    related: ["JavaScript", "타입", "빌드"],
  },
  {
    term: "React",
    category: "화면",
    plainDescription: "화면을 컴포넌트로 나누고 데이터가 바뀔 때 필요한 부분을 다시 보여주는 UI 도구입니다.",
    examples: {
      student: "체크 버튼을 누르면 완료 숫자와 목록 상태가 함께 바뀌게 만들 수 있습니다.",
      teacher: "출석 상태가 바뀌면 학생 카드와 전체 출석률을 바로 갱신합니다.",
      adult: "입력, 목록, 상세 화면을 재사용 가능한 단위로 구성합니다.",
    },
    related: ["컴포넌트", "상태", "Next.js"],
  },
  {
    term: "Next.js",
    category: "코드",
    plainDescription: "React로 화면과 서버 기능을 함께 만들고 배포하기 편하게 구성한 웹 프레임워크입니다.",
    examples: {
      student: "화면 만들기와 인터넷 공개에 필요한 기본 준비물이 한 상자에 들어 있는 것과 같습니다.",
      teacher: "수업용 웹 화면과 제출 데이터를 처리하는 서버 기능을 한 프로젝트에서 만듭니다.",
      adult: "페이지, API, 이미지 최적화, 배포 구조를 한 프로젝트 안에서 관리합니다.",
    },
    related: ["React", "라우팅", "Vercel"],
  },
  {
    term: "npm",
    category: "기초",
    plainDescription: "프로젝트에 필요한 도구를 설치하고 개발 서버나 빌드 명령을 실행하는 패키지 관리자입니다.",
    examples: {
      student: "필요한 준비물을 내려받고 정해진 순서로 실행해주는 도구 상자입니다.",
      teacher: "같은 실습 도구와 버전을 모든 학생 프로젝트에 설치하게 도와줍니다.",
      adult: "외부 라이브러리 버전과 프로젝트 실행 명령을 관리합니다.",
    },
    related: ["Node.js", "package.json", "터미널"],
  },
  {
    term: "서버",
    category: "연동",
    plainDescription: "사용자의 요청을 받아 권한을 확인하고 데이터를 처리한 뒤 결과를 돌려주는 프로그램입니다.",
    examples: {
      student: "급식표를 요청하면 날짜를 확인해 해당 메뉴를 찾아주는 담당자와 비슷합니다.",
      teacher: "학생 제출물을 받아 저장하고 교사에게 목록으로 돌려줍니다.",
      adult: "브라우저 요청을 검증하고 DB나 외부 API를 연결해 결과를 만듭니다.",
    },
    related: ["클라이언트", "API", "Database"],
  },
  {
    term: "클라이언트",
    category: "연동",
    plainDescription: "사용자가 직접 보는 화면에서 입력을 받고 서버에 필요한 데이터를 요청하는 프로그램입니다.",
    examples: {
      student: "브라우저에 보이는 버튼과 입력창처럼 내가 직접 만지는 부분입니다.",
      teacher: "학생이 과제를 입력하고 제출 결과를 확인하는 화면입니다.",
      adult: "웹이나 모바일 화면에서 사용자 행동을 받아 서버 요청으로 바꿉니다.",
    },
    related: ["서버", "브라우저", "API"],
  },
  {
    term: "Database",
    category: "데이터",
    plainDescription: "사용자, 게시글, 진행 상태처럼 나중에도 다시 불러올 정보를 구조에 맞춰 보관하는 저장소입니다.",
    examples: {
      student: "새로고침해도 학습 기록이 사라지지 않도록 보관하는 온라인 기록장입니다.",
      teacher: "학생별 제출 상태와 피드백을 검색할 수 있게 모아둡니다.",
      adult: "서비스의 핵심 업무 데이터를 일관된 규칙으로 저장하고 조회합니다.",
    },
    related: ["Neon DB", "SQL", "서버"],
  },
  {
    term: "브랜치",
    category: "협업",
    plainDescription: "안정적인 코드를 그대로 두고 새 기능이나 수정을 별도 흐름에서 작업하는 Git 기능입니다.",
    examples: {
      student: "원본 과제를 보존한 채 복사본에서 새로운 디자인을 시험하는 것과 비슷합니다.",
      teacher: "공개 중인 수업 자료와 다음 학기 수정본을 나누어 관리합니다.",
      adult: "운영 코드에 영향을 주지 않고 기능을 개발하고 검토합니다.",
    },
    related: ["Git", "Commit", "Repository"],
  },
];

export const promptTemplates: PromptTemplate[] = [
  {
    id: "plan-to-mvp",
    category: "기획서 구현",
    tool: "all",
    title: "기획서를 MVP 구현 계획으로 바꾸기",
    description: "PlanCraft 기획서를 기능 우선순위와 구현 순서로 정리합니다.",
    template:
      "아래 기획서를 바탕으로 Next.js, TypeScript, Tailwind CSS를 사용하는 웹앱 MVP 구현 계획을 작성해주세요. 초보자가 따라 할 수 있게 기능 우선순위, 화면 목록, 데이터 저장 여부, 구현 순서로 나눠주세요.\n\n[기획서]\n{{projectSummary}}",
  },
  {
    id: "mobile-ui",
    category: "모바일 UI",
    tool: "all",
    title: "모바일 최적화 요청",
    description: "데스크톱 화면을 모바일에 맞는 단계형 화면으로 바꿉니다.",
    template:
      "현재 웹앱 화면을 모바일 사용자가 편하게 쓰도록 개선해주세요. 하단 네비게이션, 충분한 터치 영역, 한 화면 한 행동 원칙을 적용하고 텍스트와 버튼이 겹치지 않게 수정해주세요.",
  },
  {
    id: "error-help",
    category: "에러 해결",
    tool: "codex",
    title: "에러 메시지 분석 요청",
    description: "에러 원인과 해결 순서를 요청합니다.",
    template:
      "아래 에러를 초보자도 따라 할 수 있게 설명해주세요. 가장 가능성 높은 원인, 확인할 파일, 실행할 명령어, 다시 실패하면 확인할 정보를 순서대로 알려주세요.\n\n[에러]\n{{errorMessage}}",
  },
  {
    id: "deploy-check",
    category: "배포",
    tool: "all",
    title: "Vercel 배포 점검 요청",
    description: "배포 전 보안과 환경변수 상태를 확인합니다.",
    template:
      "Vercel 배포 전에 확인해야 할 항목을 점검해주세요. API 키 노출, 환경변수, 모바일 화면, 버튼 동작, DB 연결을 우선순위대로 확인하고 빠진 부분을 알려주세요.",
  },
  {
    id: "feature-slice",
    category: "기능 구현",
    tool: "all",
    title: "큰 기능을 작은 작업으로 나누기",
    description: "막막한 기능을 한 번에 확인 가능한 구현 단위로 쪼갭니다.",
    template:
      "아래 기능을 초보자가 순서대로 구현할 수 있는 작은 작업으로 나눠주세요. 각 작업마다 수정할 파일, 완료 기준, 직접 확인할 방법을 적고 한 번에 한 작업만 진행해주세요.\n\n[기능]\n{{feature}}",
  },
  {
    id: "ui-review",
    category: "화면 검토",
    tool: "all",
    title: "화면 사용성 점검하기",
    description: "현재 화면에서 사용자가 망설이거나 놓칠 부분을 찾습니다.",
    template:
      "현재 화면을 처음 보는 사용자 관점에서 검토해주세요. 첫 행동이 분명한지, 문장이 쉬운지, 버튼 우선순위가 맞는지, 모바일에서 불편한 부분이 없는지 확인하고 영향이 큰 순서대로 개선안을 제안해주세요.",
  },
  {
    id: "safe-refactor",
    category: "코드 개선",
    tool: "all",
    title: "동작을 유지하며 코드 정리하기",
    description: "기존 기능을 깨뜨리지 않도록 범위를 제한해 코드를 정리합니다.",
    template:
      "아래 코드의 현재 동작은 유지하면서 중복과 읽기 어려운 부분만 정리해주세요. 먼저 바뀌면 안 되는 동작을 요약하고, 수정 범위를 작게 유지한 뒤 타입 검사와 확인 방법까지 알려주세요.\n\n[대상 코드 또는 파일]\n{{code}}",
  },
  {
    id: "data-design",
    category: "데이터",
    tool: "all",
    title: "저장할 데이터 구조 정하기",
    description: "기능에 필요한 데이터와 저장 여부를 먼저 정리합니다.",
    template:
      "아래 서비스 기능에 필요한 데이터를 정리해주세요. 사용자가 입력하는 값, 자동으로 생기는 값, 꼭 저장할 값, 저장하지 않아도 되는 값으로 나누고 초보자에게 적합한 가장 단순한 데이터 구조를 제안해주세요.\n\n[서비스 기능]\n{{feature}}",
  },
  {
    id: "handoff-summary",
    category: "작업 정리",
    tool: "all",
    title: "다음 작업을 위한 인수인계 만들기",
    description: "현재 상태와 남은 일을 짧고 정확하게 정리합니다.",
    template:
      "지금까지의 작업 내용을 다음 작업자가 바로 이어갈 수 있게 정리해주세요. 완료한 것, 아직 안 된 것, 주요 파일, 실행 방법, 주의할 점, 가장 먼저 할 다음 행동 순서로 작성해주세요. 추측한 내용은 따로 표시해주세요.",
  },
  {
    id: "api-contract",
    category: "데이터",
    tool: "all",
    title: "API 요청과 응답 설계하기",
    description: "화면과 서버가 주고받을 데이터 형식을 먼저 맞춥니다.",
    template:
      "아래 기능에 필요한 API를 가장 단순하게 설계해주세요. 요청 주소와 방식, 보내는 값, 성공 응답, 실패 응답, 권한 확인, 화면에서 처리할 상태를 표로 정리해주세요.\n\n[기능]\n{{feature}}",
  },
  {
    id: "reproduce-bug",
    category: "에러 해결",
    tool: "all",
    title: "재현되지 않는 문제 좁히기",
    description: "간헐적인 문제를 확인 가능한 조건으로 바꿉니다.",
    template:
      "아래 문제를 재현하기 위해 필요한 조건을 정리해주세요. 정상 동작과 다른 점, 확인할 로그, 최소 재현 순서, 원인 후보를 구분하고 아직 확인되지 않은 내용은 추측이라고 표시해주세요.\n\n[문제 상황]\n{{errorMessage}}",
  },
  {
    id: "test-cases",
    category: "품질 점검",
    tool: "all",
    title: "기능 테스트 항목 만들기",
    description: "정상·오류·빈 상태를 빠짐없이 확인합니다.",
    template:
      "아래 기능의 테스트 항목을 만들어주세요. 정상 사용, 빈 입력, 잘못된 입력, 중복 행동, 느린 네트워크, 모바일 화면으로 나누고 각 항목의 기대 결과를 한 문장으로 적어주세요.\n\n[기능]\n{{feature}}",
  },
  {
    id: "accessibility-review",
    category: "화면 검토",
    tool: "all",
    title: "접근성 기본 점검하기",
    description: "키보드와 보조 기술 사용자에게 막히는 부분을 찾습니다.",
    template:
      "현재 화면의 접근성을 점검해주세요. 키보드 이동, 포커스 표시, 버튼 이름, 입력 라벨, 색상만으로 전달되는 정보, 읽기 순서를 확인하고 수정할 파일과 직접 검증할 방법을 알려주세요.",
  },
  {
    id: "code-review",
    category: "코드 개선",
    tool: "all",
    title: "변경 코드 위험 점검하기",
    description: "오류 가능성과 빠진 검증을 영향도 순으로 찾습니다.",
    template:
      "아래 변경 코드를 리뷰해주세요. 실제 버그 가능성, 기존 기능에 미칠 영향, 보안 문제, 빠진 테스트만 중요도 순으로 알려주세요. 취향 차이인 스타일 의견은 제외하고 각 지적에 근거 파일과 확인 방법을 적어주세요.\n\n[변경 내용]\n{{code}}",
  },
];

export const deploymentChecks: ChecklistItem[] = [
  { id: "mobile-layout", title: "모바일 화면", description: "텍스트, 카드, 버튼이 작은 화면에서 겹치지 않습니다." },
  { id: "button-flow", title: "핵심 사용자 흐름", description: "처음 접속한 사용자가 핵심 행동을 처음부터 끝까지 완료할 수 있습니다." },
  { id: "secret-safe", title: "비밀키 보호", description: "API 키와 DB URL이 클라이언트 코드에 노출되지 않습니다." },
  { id: "env-ready", title: "환경변수", description: "공개 환경에 필요한 설정값이 빠짐없이 등록되어 있습니다." },
  { id: "db-ready", title: "데이터 연결", description: "저장 기능이 공개 환경에서도 정상적으로 동작합니다." },
  { id: "first-user", title: "첫 사용자 테스트", description: "프로젝트를 모르는 사람이 설명 없이 첫 행동을 찾을 수 있습니다." },
];

export const stepLabels = [
  "역할",
  "시작",
  "추천",
  "개념",
  "도구",
  "유형",
  "실습",
  "용어",
  "프롬프트",
  "에러",
  "점검",
];
