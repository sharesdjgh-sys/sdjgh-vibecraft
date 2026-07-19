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
  Gamepad2,
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
  gameChecklist,
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
import { toolGuides, type ToolGuideTabId } from "@/lib/tool-guides";
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

type ErrorPlatform = "unknown" | "windows" | "macos";
type ErrorTextSize = "normal" | "large" | "xlarge";

type BeginnerSetupStep = {
  id: string;
  title: string;
  description: string;
  check: string;
};

const beginnerGitSetupSteps: BeginnerSetupStep[] = [
  {
    id: "git-download",
    title: "Git 내려받기",
    description: "Git 설치 파일을 내려받아요.",
    check: "다운로드 폴더에 Git 설치 파일이 보이면 돼요.",
  },
  {
    id: "git-install",
    title: "Git 설치하기",
    description: "내려받은 파일을 열고 설치를 끝까지 진행해요.",
    check: "설치 완료 화면을 확인한 뒤 터미널을 새로 열어요.",
  },
  {
    id: "git-version",
    title: "설치 확인하기",
    description: "터미널에서 git --version을 실행해요.",
    check: "git version으로 시작하는 버전 번호가 나오면 설치된 상태예요.",
  },
  {
    id: "github-account",
    title: "GitHub 계정 만들기",
    description: "사용할 아이디와 이메일로 GitHub에 가입해요.",
    check: "로그인되고 이메일 인증까지 끝났는지 확인해요.",
  },
  {
    id: "git-identity",
    title: "이름과 이메일 연결하기",
    description: "Git에 작업 기록용 이름과 이메일을 등록해요.",
    check: "git config --global --list에 user.name과 user.email이 보여야 해요.",
  },
  {
    id: "git-ready",
    title: "프로젝트 연결 준비하기",
    description: "프로젝트 폴더에서 Git을 사용할 준비를 해요.",
    check: "현재 폴더와 GitHub 계정이 준비됐으면 다음 제작 단계로 갈 수 있어요.",
  },
];

const taskHelpTemplates: Record<
  string,
  Array<Omit<BeginnerSetupStep, "id">>
> = {
  "git-install": [
    { title: "Git 내려받기", description: "운영체제에 맞는 Git 설치 파일을 받아요.", check: "다운로드 폴더에 설치 파일이 보이면 돼요." },
    { title: "Git 설치하기", description: "설치 파일을 열고 기본 설정으로 설치해요.", check: "설치 완료 후 터미널을 새로 열어요." },
    { title: "설치 확인하기", description: "터미널에서 git --version을 실행해요.", check: "git version으로 시작하는 번호가 나오면 정상이에요." },
  ],
  "github-account": [
    { title: "GitHub 가입하기", description: "사용할 아이디와 이메일로 계정을 만들어요.", check: "GitHub에 로그인할 수 있어야 해요." },
    { title: "이메일 인증하기", description: "GitHub에서 보낸 인증 메일을 확인해요.", check: "계정 설정에서 이메일이 인증됨으로 보여야 해요." },
    { title: "Git 사용자 정보 연결하기", description: "Git에 기록할 이름과 이메일을 등록해요.", check: "git config --global --list에 user.name과 user.email이 보여야 해요." },
  ],
  "project-create": [
    { title: "작업 폴더 정하기", description: "프로젝트를 저장할 빈 폴더를 정해요.", check: "폴더 위치를 다시 찾을 수 있으면 돼요." },
    { title: "터미널 열기", description: "정한 폴더에서 터미널을 열어요.", check: "터미널의 현재 경로가 작업 폴더와 같아야 해요." },
    { title: "프로젝트 만들기", description: "안내된 생성 명령어를 한 번 실행해요.", check: "package.json과 app 폴더가 생기면 정상이에요." },
    { title: "프로젝트 폴더 들어가기", description: "생성된 프로젝트 폴더로 이동해요.", check: "터미널 경로 끝에 프로젝트 이름이 보여야 해요." },
  ],
  "local-run": [
    { title: "필요 파일 설치하기", description: "프로젝트 폴더에서 npm install을 실행해요.", check: "명령이 오류 없이 끝나면 돼요." },
    { title: "개발 서버 실행하기", description: "npm run dev를 실행해요.", check: "Local 주소가 터미널에 표시되어야 해요." },
    { title: "브라우저에서 열기", description: "터미널에 나온 Local 주소를 브라우저에 입력해요.", check: "프로젝트 첫 화면이 열리면 정상이에요." },
    { title: "첫 오류 확인하기", description: "화면이 안 열리면 터미널의 첫 오류부터 확인해요.", check: "실행 명령과 첫 오류 문장을 함께 준비해요." },
  ],
  "first-screen": [
    { title: "첫 행동 정하기", description: "사용자가 화면에서 가장 먼저 할 행동 하나를 정해요.", check: "버튼이나 입력 행동을 한 문장으로 말할 수 있어야 해요." },
    { title: "화면 파일 찾기", description: "첫 화면을 담당하는 app/page 파일을 열어요.", check: "브라우저에 보이는 문구와 같은 코드를 찾으면 돼요." },
    { title: "한 부분만 만들기", description: "제목과 핵심 버튼부터 작은 단위로 수정해요.", check: "저장 후 브라우저 화면이 바뀌어야 해요." },
    { title: "핵심 행동 확인하기", description: "버튼이나 입력이 예상대로 작동하는지 눌러봐요.", check: "오류 없이 다음 화면이나 결과가 나타나야 해요." },
  ],
  "deploy-vercel": [
    { title: "GitHub에 코드 올리기", description: "프로젝트 저장소에 최신 코드를 올려요.", check: "GitHub에서 최근 파일과 변경 기록이 보여야 해요." },
    { title: "Vercel에 저장소 연결하기", description: "Vercel에서 GitHub 저장소를 선택해 가져와요.", check: "프로젝트 이름과 저장소 이름이 연결되어 보여야 해요." },
    { title: "환경변수 확인하기", description: "필요한 키가 있다면 Vercel 설정에 등록해요.", check: "변수 이름이 빠짐없이 등록되어야 해요." },
    { title: "배포 주소 열기", description: "배포를 실행하고 생성된 주소를 열어요.", check: "공개 주소에서 첫 화면과 핵심 행동이 작동해야 해요." },
  ],
  "neon-db": [
    { title: "Neon 프로젝트 만들기", description: "Neon에서 새 데이터베이스 프로젝트를 만들어요.", check: "프로젝트와 데이터베이스 이름이 보여야 해요." },
    { title: "연결 주소 보관하기", description: "연결 문자열을 코드가 아닌 환경변수 파일에 넣어요.", check: "DATABASE_URL 값이 .env.local에 있고 화면에는 노출되지 않아야 해요." },
    { title: "테이블 준비하기", description: "프로젝트에 필요한 테이블 또는 스키마를 만들어요.", check: "Neon 화면에서 테이블을 확인할 수 있어야 해요." },
    { title: "저장과 조회 확인하기", description: "테스트 자료 하나를 저장하고 다시 불러와요.", check: "새로고침 후에도 같은 자료가 보여야 해요." },
  ],
  "mobile-check": [
    { title: "작은 화면 열기", description: "브라우저 개발자 도구에서 모바일 화면을 선택해요.", check: "화면 폭이 휴대폰 크기로 바뀌어야 해요." },
    { title: "위에서 아래로 확인하기", description: "텍스트, 카드, 버튼이 잘리거나 겹치는지 봐요.", check: "가로 스크롤 없이 내용을 읽을 수 있어야 해요." },
    { title: "핵심 행동 눌러보기", description: "입력창과 버튼을 실제로 사용해요.", check: "키보드가 열려도 버튼과 입력 내용이 보여야 해요." },
  ],
  "error-review": [
    { title: "같은 오류 다시 만들기", description: "오류가 난 행동이나 명령을 한 번만 다시 실행해요.", check: "어떤 행동 직후 오류가 나는지 알아야 해요." },
    { title: "첫 오류 찾기", description: "긴 로그에서 가장 먼저 나온 오류 문장을 찾아요.", check: "파일명, 줄 번호, 오류 문장을 준비해요." },
    { title: "수정 후 다시 확인하기", description: "한 가지 해결책만 적용하고 같은 행동을 반복해요.", check: "기존 오류가 사라졌거나 다른 오류로 바뀌었는지 확인해요." },
  ],
  "final-check": [
    { title: "빌드 확인하기", description: "공개 전에 npm run build를 실행해요.", check: "빌드가 오류 없이 완료되어야 해요." },
    { title: "핵심 흐름 확인하기", description: "처음 접속부터 핵심 결과까지 직접 진행해요.", check: "중간에 멈추거나 빈 화면이 없어야 해요." },
    { title: "비밀정보 확인하기", description: "키와 비밀번호가 코드나 화면에 보이지 않는지 확인해요.", check: "비밀값은 환경변수에만 있어야 해요." },
    { title: "공개 주소 확인하기", description: "로그아웃 상태나 다른 기기에서 주소를 열어요.", check: "다른 사람도 같은 첫 화면을 볼 수 있어야 해요." },
  ],
  "automation-sample": [
    { title: "실제 입력 하나 고르기", description: "자동화할 실제 자료 하나를 복사본으로 준비해요.", check: "개인정보를 지운 테스트 자료가 있어야 해요." },
    { title: "기대 결과 적기", description: "처리 후 어떤 결과가 나와야 하는지 적어요.", check: "입력과 기대 결과를 나란히 비교할 수 있어야 해요." },
    { title: "예외 사례 하나 준비하기", description: "비어 있거나 잘못된 입력도 하나 준비해요.", check: "성공과 실패 사례가 각각 하나씩 있어야 해요." },
  ],
  "game-rule": [
    { title: "플레이 목표 정하기", description: "플레이어가 무엇을 하면 이기는지 정해요.", check: "성공 조건을 한 문장으로 설명할 수 있어야 해요." },
    { title: "조작 방법 정하기", description: "키보드, 마우스 또는 터치 중 하나를 골라요.", check: "플레이어가 눌러야 할 키나 화면 영역이 명확해야 해요." },
    { title: "실패와 종료 정하기", description: "언제 한 판이 끝나는지 정해요.", check: "성공과 실패 조건이 각각 하나씩 있어야 해요." },
  ],
  "game-control": [
    { title: "입력 하나 연결하기", description: "키 하나 또는 터치 한 번에 움직임을 연결해요.", check: "입력할 때 화면의 게임 요소가 바로 반응해야 해요." },
    { title: "화면 밖 이동 막기", description: "캐릭터나 요소가 게임 영역을 벗어나지 않게 해요.", check: "계속 조작해도 화면 안에 남아야 해요." },
    { title: "다른 기기 확인하기", description: "키보드와 터치 환경에서 각각 조작해요.", check: "선택한 기기에서 입력이 끊기지 않아야 해요." },
  ],
  "game-loop": [
    { title: "게임 시작 연결하기", description: "시작 버튼을 누르면 플레이 상태로 바뀌게 해요.", check: "새 게임이 항상 같은 초기 상태에서 시작해야 해요." },
    { title: "성공과 실패 판정하기", description: "정한 규칙에 따라 결과를 계산해요.", check: "조건을 만족하면 즉시 결과가 표시되어야 해요." },
    { title: "한 판 끝내기", description: "결과 화면에서 조작을 멈추고 다시 하기를 제공해요.", check: "시작부터 결과까지 한 판을 완료할 수 있어야 해요." },
  ],
  "game-feedback": [
    { title: "현재 상태 보여주기", description: "점수, 남은 시간 또는 기회를 표시해요.", check: "플레이 중 값이 바로 갱신되어야 해요." },
    { title: "결과 알려주기", description: "성공 또는 실패 이유를 짧게 보여줘요.", check: "플레이어가 왜 끝났는지 알 수 있어야 해요." },
    { title: "다시 하기 연결하기", description: "버튼 한 번으로 초기 상태로 돌아가요.", check: "새로고침 없이 새 게임을 시작할 수 있어야 해요." },
  ],
  "core-process": [
    { title: "입력 정하기", description: "자동화가 받을 자료의 형태를 하나로 정해요.", check: "입력 예시를 실제 값으로 보여줄 수 있어야 해요." },
    { title: "처리 한 단계 만들기", description: "가장 중요한 변환이나 계산부터 구현해요.", check: "테스트 입력으로 결과 하나가 나와야 해요." },
    { title: "결과 저장하기", description: "화면, 파일 또는 데이터로 결과를 남겨요.", check: "실행이 끝난 뒤 결과를 다시 확인할 수 있어야 해요." },
  ],
  "failure-message": [
    { title: "실패 상황 정하기", description: "빈 입력과 잘못된 입력 등 실패 사례를 정해요.", check: "재현 가능한 실패 사례가 있어야 해요." },
    { title: "쉬운 안내문 쓰기", description: "문제와 다음 행동을 함께 알려주는 문장을 만들어요.", check: "사용자가 무엇을 고쳐야 하는지 알 수 있어야 해요." },
    { title: "다시 시도 확인하기", description: "안내에 따라 수정한 뒤 다시 실행해요.", check: "페이지를 새로 열지 않아도 다시 시도할 수 있어야 해요." },
  ],
  "share-runbook": [
    { title: "필요 조건 적기", description: "설치해야 할 프로그램과 계정을 적어요.", check: "처음 보는 사람도 준비물을 알 수 있어야 해요." },
    { title: "실행 순서 적기", description: "폴더 열기부터 실행까지 명령을 순서대로 적어요.", check: "명령어를 그대로 복사해 실행할 수 있어야 해요." },
    { title: "다른 사람에게 확인받기", description: "설명만 보고 한 번 실행해 달라고 요청해요.", check: "추가 설명 없이 결과까지 도달해야 해요." },
  ],
  "mobile-layout": [
    { title: "대표 화면 크기 선택하기", description: "휴대폰 크기로 공개 주소를 열어요.", check: "화면이 기기 너비 안에 들어와야 해요." },
    { title: "겹침과 잘림 확인하기", description: "긴 문장, 카드, 버튼을 위에서 아래로 봐요.", check: "가로 스크롤과 잘린 버튼이 없어야 해요." },
    { title: "터치로 진행하기", description: "손가락으로 핵심 흐름을 끝까지 진행해요.", check: "모든 버튼을 쉽게 누를 수 있어야 해요." },
  ],
  "button-flow": [
    { title: "시작 지점 정하기", description: "처음 방문한 사용자가 누를 첫 버튼을 정해요.", check: "설명 없이도 첫 행동이 보여야 해요." },
    { title: "끝까지 진행하기", description: "입력부터 결과까지 중간 단계를 모두 실행해요.", check: "막히는 화면이나 반응 없는 버튼이 없어야 해요." },
    { title: "새로고침 후 반복하기", description: "처음 상태에서 같은 흐름을 다시 실행해요.", check: "두 번째 실행도 같은 결과가 나와야 해요." },
  ],
  "secret-safe": [
    { title: "비밀값 목록 만들기", description: "API 키, 토큰, DB 주소를 확인해요.", check: "공개하면 안 되는 값의 이름을 알아야 해요." },
    { title: "코드에서 제거하기", description: "비밀값을 .env.local 또는 배포 환경변수로 옮겨요.", check: "코드 검색에서 실제 비밀값이 나오지 않아야 해요." },
    { title: "공개 화면 확인하기", description: "브라우저 소스와 오류 메시지에 값이 보이는지 봐요.", check: "비밀값의 일부도 화면에 노출되지 않아야 해요." },
  ],
  "env-ready": [
    { title: "필요한 변수 이름 모으기", description: ".env.local에 쓰는 변수 이름을 확인해요.", check: "필요한 이름 목록이 준비되어야 해요." },
    { title: "배포 환경에 등록하기", description: "Vercel 환경변수에 같은 이름과 값을 등록해요.", check: "이름의 대소문자까지 로컬과 같아야 해요." },
    { title: "다시 배포하기", description: "환경변수 저장 후 새 배포를 실행해요.", check: "공개 주소에서 관련 기능이 작동해야 해요." },
  ],
  "db-ready": [
    { title: "공개 DB 주소 확인하기", description: "배포 환경의 DATABASE_URL을 확인해요.", check: "로컬이 아닌 공개 환경에도 등록되어야 해요." },
    { title: "저장 테스트하기", description: "공개 주소에서 테스트 자료 하나를 저장해요.", check: "성공 메시지나 저장된 결과가 보여야 해요." },
    { title: "다시 불러오기", description: "새로고침하거나 다시 접속해 자료를 확인해요.", check: "저장한 자료가 그대로 남아 있어야 해요." },
  ],
  "first-user": [
    { title: "처음 보는 사람 정하기", description: "프로젝트 설명을 듣지 않은 사람에게 주소를 전달해요.", check: "테스트할 사람 한 명이 있어야 해요." },
    { title: "말하지 않고 관찰하기", description: "첫 행동부터 결과까지 스스로 진행하게 해요.", check: "어디서 멈추거나 질문하는지 기록해요." },
    { title: "한 가지씩 고치기", description: "가장 먼저 막힌 문구나 버튼부터 수정해요.", check: "같은 지점에서 다시 막히지 않아야 해요." },
  ],
};

function helpStepsForItem(item: ChecklistItem): BeginnerSetupStep[] {
  const templates = taskHelpTemplates[item.id] ?? [
    { title: "목표 확인하기", description: item.description, check: `${item.title}의 완료 모습을 한 문장으로 말할 수 있어야 해요.` },
    { title: "현재 상태 확인하기", description: "지금까지 한 행동과 마지막으로 정상 작동한 지점을 적어요.", check: "막히기 직전까지의 순서를 다시 설명할 수 있어야 해요." },
    { title: "문제 다시 만들기", description: "같은 행동을 한 번만 반복하고 화면의 메시지를 확인해요.", check: "재현 순서와 실제 메시지를 함께 준비해야 해요." },
  ];

  return templates.map((step, index) => ({
    ...step,
    id: `${item.id}-help-${index + 1}`,
  }));
}

function errorDetailsFromDraft(draft: string): string {
  const markers = [
    "실제로 보이는 화면 또는 에러:\n",
    "실행한 명령어 또는 에러 메시지:\n",
  ];
  const marker = markers.find((candidate) => draft.includes(candidate));
  return marker ? draft.slice(draft.indexOf(marker) + marker.length).trimStart() : draft.trim();
}

function beginnerStepErrorDraft(step: BeginnerSetupStep, details = ""): string {
  return [
    `현재 준비 단계: ${step.title}`,
    `하려던 일: ${step.description}`,
    `정상 확인 기준: ${step.check}`,
    "",
    "실제로 보이는 화면 또는 에러:",
    details,
  ].join("\n");
}

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
  game: [
    "플레이어의 목표와 조작 방법을 한 문장으로 정합니다.",
    "시작 → 플레이 → 결과로 이어지는 한 판을 먼저 만듭니다.",
    "점수, 성공과 실패 조건, 다시 하기를 연결합니다.",
    "키보드와 터치 조작을 각각 확인합니다.",
    "공개 URL을 친구에게 보내 한 판을 직접 해보게 합니다.",
  ],
};

const toolLogos: Record<ToolSlug, string> = {
  codex: "/tool-logos/codex.svg",
  claude: "/tool-logos/claude.ico",
  antigravity: "/tool-logos/antigravity.ico",
};

const serviceIcons: Record<ServiceType, LucideIcon> = {
  web: Code2,
  "mobile-web": Smartphone,
  game: Gamepad2,
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
  game: "tile-cyan",
  software: "tile-amber",
};

const serviceLayouts: Record<ServiceType, string> = {
  web: "lg:col-span-5",
  "mobile-web": "lg:col-span-4",
  game: "lg:col-span-3",
  software: "lg:col-span-3",
};

const serviceLearningInfo: Record<
  ServiceType,
  {
    shortFit: string;
    fits: string[];
    result: string;
    strength: string;
    caution: string;
    firstStep: string;
  }
> = {
  web: {
    shortFit: "공유 링크·로그인·데이터 저장이 필요할 때",
    fits: ["PC와 모바일에서 모두 접속", "여러 사용자가 같은 데이터 이용", "학교 밖에서도 링크로 공유"],
    result: "설치 없이 브라우저에서 여는 공개 URL",
    strength: "배포와 업데이트가 쉽고, 사용자에게 새 버전을 다시 설치하게 할 필요가 없습니다.",
    caution: "로그인, 데이터베이스, API 키가 있다면 서버 보안과 개인정보 처리를 함께 설계해야 합니다.",
    firstStep: "사용자가 접속해서 핵심 행동을 완료하는 한 개의 화면 흐름부터 만드세요.",
  },
  "mobile-web": {
    shortFit: "스마트폰·카메라·터치 중심 경험이 중요할 때",
    fits: ["스마트폰에서 자주 사용", "카메라·위치·사진 업로드 활용", "한 손 조작과 큰 버튼이 중요"],
    result: "모바일 브라우저에서 열고 홈 화면에도 추가할 수 있는 URL",
    strength: "앱스토어 심사 없이 배포하면서도 앱에 가까운 화면과 조작 경험을 만들 수 있습니다.",
    caution: "iPhone과 Android의 브라우저 기능 차이, 권한 요청, 작은 화면과 느린 네트워크를 확인해야 합니다.",
    firstStep: "가장 작은 스마트폰 화면에서 첫 행동과 완료 화면을 먼저 연결하세요.",
  },
  game: {
    shortFit: "규칙·조작·점수로 한 판을 완성하고 싶을 때",
    fits: ["친구와 링크로 바로 플레이", "키보드나 터치로 직접 조작", "점수와 성공·실패 결과가 중요"],
    result: "설치 없이 브라우저에서 바로 플레이하는 게임 URL",
    strength: "작은 규칙 하나부터 만들고 바로 플레이하며 재미와 난이도를 빠르게 확인할 수 있습니다.",
    caution: "그래픽을 먼저 늘리기보다 한 판이 처음부터 끝까지 작동하는지와 조작 반응을 먼저 확인해야 합니다.",
    firstStep: "플레이어가 한 번 조작하고 결과를 확인하는 가장 작은 게임 규칙부터 만드세요.",
  },
  software: {
    shortFit: "파일 처리·반복 업무·로컬 실행이 핵심일 때",
    fits: ["많은 파일을 한꺼번에 처리", "인터넷 없이 또는 내부 PC에서 사용", "반복 명령과 업무 자동화"],
    result: "터미널 명령, 설치형 프로그램 또는 내부에서 실행하는 도구",
    strength: "컴퓨터의 파일과 자원을 직접 활용하기 좋아 대량 처리와 자동화에 유리합니다.",
    caution: "운영체제별 설치, 업데이트, 실행 권한과 사용자에게 전달할 배포 방식을 따로 준비해야 합니다.",
    firstStep: "입력 파일 한 개를 받아 결과 파일 한 개를 만드는 가장 작은 실행 흐름부터 만드세요.",
  },
};

type ToolSurface = {
  kind: "app" | "terminal" | "extension" | "web";
  title: string;
  description: string;
};

type ToolLearningInfo = {
  overview: string;
  beginnerPath: string;
  installUrl: string;
  docsUrl: string;
  installCommand?: string;
  surfaces: ToolSurface[];
};

const toolLearningInfo: Record<ToolSlug, ToolLearningInfo> = {
  codex: {
    overview:
      "OpenAI의 코딩 에이전트입니다. 프로젝트 파일을 읽고 수정하며, 명령 실행과 테스트까지 한 흐름으로 도와줍니다.",
    beginnerPath:
      "처음에는 Codex 앱이나 IDE 확장에서 변경 내용을 눈으로 검토하며 사용하고, 익숙해지면 CLI로 반복 작업과 자동화를 시도하세요.",
    installUrl: "https://openai.com/codex/",
    docsUrl: "https://developers.openai.com/codex/",
    installCommand: "npm install -g @openai/codex",
    surfaces: [
      {
        kind: "app",
        title: "Codex 앱",
        description: "Windows·macOS에서 여러 작업을 나누어 진행하고 코드 변경 내역을 화면으로 검토하기 좋습니다.",
      },
      {
        kind: "terminal",
        title: "터미널 CLI",
        description: "프로젝트 폴더에서 codex를 실행합니다. 명령어와 Git에 익숙해질수록 빠르고 자동화하기 좋습니다.",
      },
      {
        kind: "extension",
        title: "IDE 확장",
        description: "VS Code, Cursor, Windsurf 계열 편집기 안에서 현재 열어 둔 코드와 함께 사용할 수 있습니다.",
      },
      {
        kind: "web",
        title: "웹·클라우드",
        description: "GitHub 저장소를 연결해 브라우저에서 작업을 맡기고, 완료된 결과를 나중에 검토할 수 있습니다.",
      },
    ],
  },
  claude: {
    overview:
      "Anthropic의 Claude Code는 큰 코드베이스와 긴 문서를 이해하면서 계획, 파일 수정, 테스트를 함께 수행하는 코딩 에이전트입니다.",
    beginnerPath:
      "터미널이 낯설다면 Claude Desktop의 Code 탭에서 시작하세요. 파일 변경과 미리보기에 익숙해진 뒤 CLI나 IDE 확장으로 옮기면 좋습니다.",
    installUrl: "https://claude.com/download",
    docsUrl: "https://code.claude.com/docs/en/overview",
    installCommand: "npm install -g @anthropic-ai/claude-code",
    surfaces: [
      {
        kind: "app",
        title: "Claude Desktop",
        description: "Windows·macOS의 Code 탭에서 프로젝트 폴더를 열고 변경 비교, 터미널, 미리보기를 한 화면에서 사용합니다.",
      },
      {
        kind: "terminal",
        title: "Claude Code CLI",
        description: "프로젝트 폴더에서 claude를 실행합니다. 스크립트, 자동화, 세밀한 권한 설정에 적합합니다.",
      },
      {
        kind: "extension",
        title: "IDE 확장",
        description: "VS Code와 JetBrains 환경에서 코드 옆에 Claude를 두고 선택 영역과 오류를 바로 전달할 수 있습니다.",
      },
      {
        kind: "web",
        title: "Claude Code 웹",
        description: "브라우저에서 원격 작업을 시작하고, 컴퓨터를 닫아도 계속 진행되는 작업을 맡길 수 있습니다.",
      },
    ],
  },
  antigravity: {
    overview:
      "Google의 에이전트형 개발 환경입니다. 전용 IDE와 CLI에서 여러 에이전트가 코드를 만들고 실행 결과를 확인하도록 구성되어 있습니다.",
    beginnerPath:
      "처음에는 Antigravity IDE를 설치해 시각적으로 작업하세요. 터미널 흐름이 익숙해지면 agy CLI를 추가하고, 필요한 Google 도구 플러그인만 선택하세요.",
    installUrl: "https://antigravity.google/download",
    docsUrl: "https://antigravity.google/docs",
    installCommand: "irm https://antigravity.google/cli/install.ps1 | iex",
    surfaces: [
      {
        kind: "app",
        title: "Antigravity IDE",
        description: "Windows·macOS·Linux용 전용 개발 앱입니다. 에이전트, 편집기, 실행 결과를 한곳에서 다루기 좋습니다.",
      },
      {
        kind: "terminal",
        title: "Antigravity CLI",
        description: "설치 후 agy 명령으로 실행합니다. 터미널에서 코드베이스를 직접 다루고 반복 작업을 맡길 때 사용합니다.",
      },
      {
        kind: "extension",
        title: "플러그인",
        description: "초기 설정에서 Google 개발 도구용 플러그인을 선택할 수 있습니다. 일반 편집기 확장보다 전용 IDE 사용이 중심입니다.",
      },
      {
        kind: "web",
        title: "SDK·연동",
        description: "직접 만든 개발 흐름에 Antigravity 기능을 연결해야 할 때 SDK를 살펴보는 고급 경로입니다.",
      },
    ],
  },
};

const toolSurfaceIcons: Record<ToolSurface["kind"], LucideIcon> = {
  app: Layers3,
  terminal: Terminal,
  extension: Code2,
  web: ExternalLink,
};

const designPartners = [
  {
    name: "Claude Design",
    eyebrow: "대화형 디자인 캔버스",
    description:
      "말로 요청하면서 화면 시안, 인터랙티브 프로토타입, 발표 자료를 만들 수 있습니다. 기존 디자인 파일이나 참고 자료를 첨부해 같은 분위기로 발전시키는 데도 적합합니다.",
    steps: [
      "만들 화면의 목적, 사용자, 기기, 꼭 필요한 내용을 먼저 적습니다.",
      "처음부터 완성본을 요구하지 말고 레이아웃 시안 2~3개를 비교합니다.",
      "간격, 대비, 버튼 위치처럼 수정할 부분을 구체적인 말로 피드백합니다.",
    ],
    primaryUrl: "https://claude.ai/design",
    primaryLabel: "Claude Design 열기",
    guideUrl: "https://support.claude.com/en/articles/14604416-get-started-with-claude-design",
    tone: "tile-amber",
    logo: "/tool-logos/claude.ico",
  },
  {
    name: "Google Stitch",
    eyebrow: "AI UI 생성·탐색",
    description:
      "텍스트 설명이나 참고 이미지를 바탕으로 여러 UI 방향을 빠르게 만들고, 화면 흐름과 프런트엔드 결과로 이어 가는 Google Labs의 디자인 도구입니다.",
    steps: [
      "웹인지 모바일인지 정하고, 핵심 화면 한 개부터 요청합니다.",
      "마음에 드는 결과를 고른 뒤 색상, 밀도, 분위기를 한 번에 하나씩 바꿉니다.",
      "완성 시안을 개발 도구로 넘기기 전에 반응형과 실제 문구를 점검합니다.",
    ],
    primaryUrl: "https://stitch.withgoogle.com/",
    primaryLabel: "Stitch 시작하기",
    guideUrl: "https://developers.googleblog.com/en/stitch-a-new-way-to-design-uis/",
    tone: "tile-blue",
    logo: "/tool-logos/google-stitch.svg",
  },
] as const;

const designResources = [
  {
    name: "Builder Josh의 Supanova Design Skill",
    label: "한국어 랜딩페이지 디자인 규칙",
    description:
      "새 랜딩페이지 제작, 기존 페이지 개선, 프리미엄 표현, 완성본 출력에 맞춘 네 가지 SKILL.md를 제공합니다.",
    usage: [
      "새 페이지는 taste-skill과 output-skill을 함께 고릅니다.",
      "기존 페이지 개선은 redesign-skill을 프로젝트에 복사합니다.",
      "AI에게 해당 SKILL.md를 읽고 디자인을 수정하라고 요청합니다.",
    ],
    url: "https://github.com/uxjoseph/supanova-design-skill",
    command: "기존 페이지 개선 → redesign-skill/SKILL.md",
    tone: "design-resource-card--coral",
  },
  {
    name: "Awesome Design Skills",
    label: "다양한 디자인 스킬 탐색",
    description:
      "여러 디자인 스타일의 SKILL.md와 사람이 읽는 DESIGN.md를 모아 둔 컬렉션입니다. 원하는 스타일을 찾아 AI 도구에 설치할 수 있습니다.",
    usage: [
      "목록에서 minimal, editorial, stitch처럼 원하는 스타일을 고릅니다.",
      "--dry-run으로 어떤 파일이 생기는지 먼저 확인합니다.",
      "설치 후 AI에게 새 스킬을 적용해 UI를 만들거나 검토해 달라고 요청합니다.",
    ],
    url: "https://github.com/bergside/awesome-design-skills",
    command: "npx typeui.sh pull <스타일> --dry-run",
    tone: "design-resource-card--blue",
  },
  {
    name: "getdesign.md",
    label: "브랜드 DESIGN.md 참고 자료",
    description:
      "여러 실제 서비스의 색상, 글꼴, 간격, 컴포넌트 원칙을 분석한 DESIGN.md 카탈로그입니다. 브랜드를 그대로 복제하기보다 시각 언어를 공부하는 자료로 활용합니다.",
    usage: [
      "카탈로그에서 프로젝트와 비슷한 업종이나 분위기의 브랜드를 찾습니다.",
      "DESIGN.md를 내려받거나 요청해 프로젝트 최상위 폴더에 둡니다.",
      "AI에게 DESIGN.md를 참고하되 로고와 고유 자산은 복제하지 말라고 요청합니다.",
    ],
    url: "https://getdesign.md/",
    command: "DESIGN.md를 프로젝트에 추가 → AI에게 먼저 읽도록 요청",
    tone: "design-resource-card--green",
  },
] as const;

type StackGuide = {
  description: string;
  projectRole: string;
  firstStep: string;
  officialUrl?: string;
};

function getStackGuide(name: string): StackGuide {
  const key = name.toLowerCase().replace(/[\s._-]/g, "");

  if (key.includes("nextjs")) {
    return {
      description: "React를 기반으로 화면과 서버 기능을 함께 만드는 웹 프레임워크입니다.",
      projectRole: "페이지 구성, API 연결, 화면 이동처럼 서비스의 전체 뼈대를 담당합니다.",
      firstStep: "페이지와 컴포넌트의 차이부터 익힌 뒤 간단한 API 경로를 만들어 보세요.",
      officialUrl: "https://nextjs.org/learn",
    };
  }
  if (key.includes("react")) {
    return {
      description: "사용자 입력에 따라 바뀌는 웹 화면을 컴포넌트 단위로 만드는 라이브러리입니다.",
      projectRole: "촬영 버튼, 결과 미리보기, AI 선택 화면처럼 상태가 변하는 UI를 구현합니다.",
      firstStep: "컴포넌트, props, useState를 사용해 버튼을 누르면 내용이 바뀌는 화면부터 만들어 보세요.",
      officialUrl: "https://react.dev/learn",
    };
  }
  if (key.includes("tailwind")) {
    return {
      description: "미리 정해진 클래스 조합으로 웹 화면의 디자인을 빠르게 만드는 CSS 도구입니다.",
      projectRole: "부스 화면의 색상, 간격, 반응형 배치와 인쇄 전 미리보기 디자인을 담당합니다.",
      firstStep: "여백, 글자 크기, 색상, grid와 반응형 접두사 순서로 익혀 보세요.",
      officialUrl: "https://tailwindcss.com/docs",
    };
  }
  if (key.includes("framermotion")) {
    return {
      description: "React 화면에 자연스러운 등장, 전환, 움직임을 추가하는 애니메이션 라이브러리입니다.",
      projectRole: "AI 분석 중 로딩, 결과 카드 등장, 감정 캐릭터 전환을 자연스럽게 표현합니다.",
      firstStep: "motion 요소의 initial, animate, transition 속성으로 페이드 효과부터 만들어 보세요.",
      officialUrl: "https://motion.dev/docs/react",
    };
  }
  if (key.includes("pyodide")) {
    return {
      description: "별도 서버 없이 브라우저 안에서 파이썬 코드를 실행하게 해주는 기술입니다.",
      projectRole: "이미지 처리나 파이썬 실습 코드를 학생의 브라우저에서 바로 실행할 수 있게 합니다.",
      firstStep: "Pyodide를 불러온 뒤 짧은 파이썬 문자열을 실행하고 결과를 화면에 출력해 보세요.",
      officialUrl: "https://pyodide.org/en/stable/usage/index.html",
    };
  }
  if (key.includes("gemini")) {
    return {
      description: "텍스트와 이미지를 이해하고 결과를 생성할 수 있는 Google의 생성형 AI API입니다.",
      projectRole: "촬영 이미지를 분석하거나 퍼스널 컬러·감정 결과를 만드는 AI 기능에 연결합니다.",
      firstStep: "API 키를 서버 환경 변수에 보관하고, 이미지 한 장을 보내 응답을 받는 흐름부터 연습하세요.",
      officialUrl: "https://ai.google.dev/gemini-api/docs",
    };
  }
  if (key.includes("openai") || key.includes("chatgpt")) {
    return {
      description: "텍스트와 이미지를 처리하는 OpenAI 모델을 서비스에 연결하는 API입니다.",
      projectRole: "사진 분석 결과 설명, 캐릭터 문구 생성 등 AI 응답이 필요한 기능을 담당합니다.",
      firstStep: "API 키를 화면 코드에 넣지 말고 서버 API에서 간단한 요청을 보내는 것부터 시작하세요.",
      officialUrl: "https://platform.openai.com/docs/overview",
    };
  }
  if (key.includes("supabase")) {
    return {
      description: "데이터베이스, 로그인, 파일 저장 기능을 한곳에서 제공하는 백엔드 서비스입니다.",
      projectRole: "촬영 결과, 생성 이미지, 체험 기록을 저장하고 다시 불러오는 역할을 합니다.",
      firstStep: "테이블 하나를 만들고 데이터를 추가·조회한 뒤 Storage에 이미지 업로드를 연습하세요.",
      officialUrl: "https://supabase.com/docs/guides/getting-started",
    };
  }
  if (key.includes("typescript")) {
    return {
      description: "JavaScript에 데이터 형태를 미리 정하는 타입 기능을 더한 언어입니다.",
      projectRole: "AI 응답과 화면 데이터의 실수를 개발 중에 발견해 서비스 오류를 줄여줍니다.",
      firstStep: "문자열과 배열 타입, 객체를 표현하는 type 또는 interface부터 익혀 보세요.",
      officialUrl: "https://www.typescriptlang.org/docs/handbook/",
    };
  }
  if (key.includes("nodejs")) {
    return {
      description: "브라우저 밖에서도 JavaScript를 실행해 서버와 개발 도구를 만들 수 있는 실행 환경입니다.",
      projectRole: "API 요청 처리, 데이터 저장, 파일 변환처럼 화면 뒤에서 필요한 작업을 담당합니다.",
      firstStep: "간단한 JavaScript 파일을 실행한 뒤 요청과 응답을 주고받는 서버를 만들어 보세요.",
      officialUrl: "https://nodejs.org/learn",
    };
  }
  if (key.includes("neondb") || key === "neon") {
    return {
      description: "클라우드에서 바로 사용할 수 있는 서버리스 PostgreSQL 데이터베이스입니다.",
      projectRole: "사용자 입력, 프로젝트 설정, 결과 기록처럼 오래 보관할 데이터를 저장합니다.",
      firstStep: "프로젝트와 테이블을 만든 뒤 한 행을 추가하고 다시 조회해 보세요.",
      officialUrl: "https://neon.com/docs/introduction",
    };
  }
  if (key.includes("pwa")) {
    return {
      description: "웹 서비스를 스마트폰 앱처럼 설치하고 일부 기능을 오프라인에서도 쓰게 하는 방식입니다.",
      projectRole: "부스용 태블릿이나 스마트폰 홈 화면에서 서비스를 빠르게 실행할 수 있게 합니다.",
      firstStep: "웹 앱 매니페스트와 서비스 워커가 각각 어떤 역할을 하는지 먼저 익혀 보세요.",
      officialUrl: "https://web.dev/learn/pwa",
    };
  }
  if (key.includes("vercel")) {
    return {
      description: "웹 프로젝트를 인터넷 주소로 빠르게 배포하고 운영하는 서비스입니다.",
      projectRole: "완성한 서비스를 설명회 부스의 여러 기기에서 접속할 수 있게 공개합니다.",
      firstStep: "Git 저장소를 연결해 미리보기 주소를 만들고 환경 변수 설정을 확인해 보세요.",
      officialUrl: "https://vercel.com/docs",
    };
  }

  return {
    description: `${name}은 이 프로젝트의 특정 기능을 구현하기 위해 추천된 개발 기술입니다.`,
    projectRole: "기획서의 핵심 기능 중 어떤 부분에 연결되는지 공식 문서의 예제와 함께 확인해 보세요.",
    firstStep: "설치 방법과 가장 작은 예제를 먼저 실행한 뒤 프로젝트 기능에 한 단계씩 연결하세요.",
  };
}

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
  const [errorPlatform, setErrorPlatform] = useState<ErrorPlatform>("unknown");
  const [errorTextSize, setErrorTextSize] = usePersistentState<ErrorTextSize>(
    "vc-error-text-size",
    "normal",
  );
  const [errorHelpItem, setErrorHelpItem] = useState<ChecklistItem | null>(null);
  const [selectedErrorStepId, setSelectedErrorStepId] = useState<string | null>(null);
  const [errorSolution, setErrorSolution] = useState<ErrorSolution | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialChatMessages);
  const [editingBrief, setEditingBrief] = useState(false);
  const [selectedStackItem, setSelectedStackItem] = useState<string | null>(null);
  const [activeToolGuide, setActiveToolGuide] = useState<ToolSlug | null>(null);
  const [activeToolGuideTab, setActiveToolGuideTab] = useState<ToolGuideTabId>("start");
  const [briefDraft, setBriefDraft] = useState({
    summary: "",
    targetUsers: "",
    mainFeatures: "",
  });
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const activeErrorSteps = errorHelpItem
    ? helpStepsForItem(errorHelpItem)
    : beginnerGitSetupSteps;
  const selectedErrorStep =
    activeErrorSteps.find((step) => step.id === selectedErrorStepId) ?? null;

  const safePhase = (phaseOrder as readonly string[]).includes(phase) ? phase : "start";
  const activeRole = role ?? "student";
  const activeTool = selectedTool ?? recommendation?.recommendedTool ?? "codex";
  const availableServiceTypes = serviceTypes.filter((service) =>
    activeRole === "student" ? service.id !== "software" : service.id !== "game",
  );
  const roleRecommendedServiceType =
    activeRole === "student" && recommendation?.recommendedServiceType === "software"
      ? "game"
      : activeRole !== "student" && recommendation?.recommendedServiceType === "game"
        ? "software"
        : recommendation?.recommendedServiceType;
  const activeServiceType =
    selectedServiceType ?? roleRecommendedServiceType ?? "web";
  const selectedToolInfo = tools.find((tool) => tool.slug === activeTool) ?? tools[0];
  const recommendedToolInfo =
    tools.find((tool) => tool.slug === recommendation?.recommendedTool) ?? tools[0];
  const selectedServiceInfo =
    serviceTypes.find((item) => item.id === activeServiceType) ?? serviceTypes[0];
  const recommendedServiceInfo =
    serviceTypes.find((item) => item.id === roleRecommendedServiceType) ??
    serviceTypes[0];
  const displayedStack =
    selectedServiceType && selectedServiceType !== roleRecommendedServiceType
      ? selectedServiceInfo.stack
      : recommendation?.recommendedStack ?? selectedServiceInfo.stack;
  const activeStackItem =
    selectedStackItem && displayedStack.includes(selectedStackItem) ? selectedStackItem : null;
  const activeStackGuide = activeStackItem ? getStackGuide(activeStackItem) : null;
  const checklistItems = useMemo(() => {
    if (activeServiceType === "software") return softwareChecklist;
    if (activeServiceType === "game") return gameChecklist;
    return baseChecklist;
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
    selectedServiceType && selectedServiceType !== roleRecommendedServiceType
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
    () => checklistItems.find((item) => checklistStatuses[item.id] !== "done") ?? null,
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

  useEffect(() => {
    if (recommendation) setSelectedTool(recommendation.recommendedTool);
  }, [recommendation, setSelectedTool]);

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
    if (
      (nextRole === "student" && selectedServiceType === "software") ||
      (nextRole !== "student" && selectedServiceType === "game")
    ) {
      setSelectedServiceType(null);
      setChecklistStatuses({});
      setDeploymentStatuses({});
    }
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

  function advanceShapeStep() {
    setNotice(null);
    if (shapeTab === "brief") {
      setShapeTab("tool");
      scrollToTop();
      return;
    }
    if (shapeTab === "tool") {
      if (!selectedTool) {
        setNotice("추천을 확인한 뒤 이번 프로젝트에 사용할 제작 도구를 직접 선택해주세요.");
        return;
      }
      setShapeTab("service");
      scrollToTop();
      return;
    }
    startBuild();
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
    const itemIndex = checklistItems.findIndex((candidate) => candidate.id === item.id);
    const hasIncompletePrevious = checklistItems
      .slice(0, itemIndex)
      .some((candidate) => checklistStatuses[candidate.id] !== "done");
    if (itemIndex > 0 && hasIncompletePrevious) {
      setNotice("이전 작업을 먼저 완료해야 이 작업을 시작할 수 있어요.");
      return;
    }

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
    const itemIndex = deploymentItems.findIndex((candidate) => candidate.id === item.id);
    const buildIncomplete = checklistItems.some(
      (candidate) => checklistStatuses[candidate.id] !== "done",
    );
    const hasIncompletePrevious = deploymentItems
      .slice(0, itemIndex)
      .some((candidate) => deploymentStatuses[candidate.id] !== "done");
    if (buildIncomplete || (itemIndex > 0 && hasIncompletePrevious)) {
      setNotice(
        buildIncomplete
          ? "전체 제작 작업을 먼저 완료해야 공개 전 점검을 시작할 수 있어요."
          : "이전 점검을 먼저 완료해야 다음 점검을 시작할 수 있어요.",
      );
      return;
    }

    setDeploymentStatuses((current) => ({ ...current, [item.id]: status }));
    if (status === "blocked") openBlockedItem(item);
  }

  function openBlockedItem(item: ChecklistItem) {
    const firstStep = helpStepsForItem(item)[0];
    setErrorHelpItem(item);
    setSelectedErrorStepId(firstStep.id);
    setErrorMessage(beginnerStepErrorDraft(firstStep));
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
        platform: errorPlatform,
        taskContext: errorHelpItem
          ? {
              title: errorHelpItem.title,
              description: errorHelpItem.description,
            }
          : undefined,
        troubleshootingStep: selectedErrorStep
          ? {
              title: selectedErrorStep.title,
              description: selectedErrorStep.description,
              check: selectedErrorStep.check,
            }
          : undefined,
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
          <h1 className="type-display mt-4 text-signal-ink">
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

    const shapeStepAction =
      shapeTab === "brief"
        ? {
            description: "프로젝트 브리프를 확인했다면 어떤 도구로 만들지 비교해보세요.",
            label: "제작 도구 선택하기",
            icon: ArrowRight,
          }
        : shapeTab === "tool"
          ? {
              description: "제작 도구를 선택했다면 결과물을 어떤 형태로 만들지 결정하세요.",
              label: "서비스 형태 선택하기",
              icon: ArrowRight,
            }
          : {
              description: "브리프와 제작 방식을 모두 확인했다면 첫 번째 실제 작업을 시작하세요.",
              label: "제작 시작하기",
              icon: Play,
            };

    return (
      <section>
        <Eyebrow>프로젝트 설계 · 02</Eyebrow>
        <h1 className="type-display mt-4 text-signal-ink">
          무엇을 만들지 정했다면,
          <br />
          이제 만드는 방법을 고릅니다.
        </h1>
        <p className="type-body mt-5 max-w-2xl text-muted">
          핵심 기능을 먼저 정리한 뒤, 프로젝트에 맞는 도구와 구현 순서를 확인하세요.
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
                <header className="brief-hero border-b border-line px-5 py-5 sm:px-8 sm:py-6">
                  <div className="relative z-10">
                    <div className="flex flex-nowrap items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2 whitespace-nowrap font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-muted">
                        <FileText className="h-3.5 w-3.5 shrink-0 text-signal-ink" />
                        프로젝트 브리프 // AI 분석
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-success/35 bg-success/10 px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-success">
                        <span className="h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_10px_currentColor]" />
                        분석 완료
                      </span>
                    </div>

                    <p className="mt-5 font-mono text-[10px] font-bold tracking-[0.08em] text-signal-ink">
                      핵심 목표
                    </p>
                    <h2 className="brief-summary mt-1.5 text-signal-ink">
                      {recommendation.summary}
                    </h2>

                    <dl className="mt-5 grid gap-2 sm:grid-cols-3">
                      <div className="brief-stat brief-stat--blue rounded-xl px-4 py-3 backdrop-blur-sm">
                        <dt className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-muted">
                          핵심 사용자
                        </dt>
                        <dd className="mt-1 text-sm font-bold text-ink">
                          {recommendation.targetUsers.length}개 사용자군
                        </dd>
                      </div>
                      <div className="brief-stat brief-stat--green rounded-xl px-4 py-3 backdrop-blur-sm">
                        <dt className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-muted">
                          MVP 범위
                        </dt>
                        <dd className="mt-1 text-sm font-bold text-ink">
                          {recommendation.mainFeatures.length}개 핵심 기능
                        </dd>
                      </div>
                      <div className="brief-stat brief-stat--amber rounded-xl px-4 py-3 backdrop-blur-sm">
                        <dt className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-muted">
                          제작 난이도
                        </dt>
                        <dd className="mt-1 text-sm font-bold text-ink">{recommendation.difficulty}</dd>
                      </div>
                    </dl>
                  </div>
                </header>

                <div className="p-5 sm:p-8">
                  <div className="grid gap-4">
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
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
                        tone="tile-cyan"
                        title="MVP 핵심 기능"
                      />
                    </div>

                    <aside className="brief-spec-panel relative overflow-hidden rounded-[1.25rem] border p-5 text-ink sm:p-6">
                      <div className="relative z-10">
                        <div className="flex items-center gap-2">
                          <Wrench className="h-4 w-4 text-signal" />
                          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
                            빌드 사양
                          </p>
                        </div>
                        <dl className="mt-5 grid gap-5 md:grid-cols-2">
                          <div className="border-b border-line pb-4 md:border-b-0 md:border-r md:pb-0 md:pr-5">
                            <dt className="type-label text-muted">제작 도구</dt>
                            <dd className="type-title mt-1 text-ink">
                              {selectedTool ? selectedToolInfo.name : recommendedToolInfo.name}
                            </dd>
                            {!selectedTool ? (
                              <span className="mt-1 block text-xs font-semibold text-signal">AI 추천</span>
                            ) : null}
                          </div>
                          <div className="border-b border-line pb-4 md:border-b-0 md:pb-0">
                            <dt className="type-label text-muted">서비스 형태</dt>
                            <dd className="type-title mt-1 text-ink">
                              {selectedServiceType
                                ? selectedServiceInfo.title
                                : recommendedServiceInfo.title}
                            </dd>
                            {!selectedServiceType ? (
                              <span className="mt-1 block text-xs font-semibold text-signal">AI 추천</span>
                            ) : null}
                          </div>
                          <div className="md:col-span-2 md:border-t md:border-line md:pt-5">
                            <dt className="type-label text-muted">추천 스택</dt>
                            <dd className="mt-1 text-xs leading-5 text-muted">
                              기술을 눌러 역할과 공부 순서를 확인하세요.
                            </dd>
                            <dd className="mt-3 flex flex-wrap gap-1.5">
                              {displayedStack.map((item) => (
                                <button
                                  aria-expanded={activeStackItem === item}
                                  className={
                                    "rounded-full border px-2.5 py-1 text-xs font-semibold transition-all duration-300 active:scale-[0.98] " +
                                    (activeStackItem === item
                                      ? "border-signal bg-signal text-white shadow-sm"
                                      : "border-line bg-surface text-ink hover:-translate-y-0.5 hover:border-signal/40 hover:text-signal-ink")
                                  }
                                  key={item}
                                  onClick={() =>
                                    setSelectedStackItem((current) => (current === item ? null : item))
                                  }
                                  type="button"
                                >
                                  {item}
                                </button>
                              ))}
                            </dd>
                            {activeStackGuide && activeStackItem ? (
                              <div
                                className="mt-4 rounded-xl border border-signal/20 bg-surface/80 p-4 shadow-[0_10px_24px_rgb(var(--tile-amber-ink)/0.06)]"
                                role="region"
                              >
                                <div className="flex items-center gap-2">
                                  <BookOpen className="h-4 w-4 text-signal" />
                                  <p className="text-sm font-bold text-signal-ink">{activeStackItem}</p>
                                </div>
                                <p className="mt-2 text-sm leading-6 text-ink">
                                  {activeStackGuide.description}
                                </p>
                                <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                                  <div className="rounded-lg bg-signal-soft/60 p-3">
                                    <dt className="text-[11px] font-bold text-signal-ink">
                                      이 프로젝트에서 하는 일
                                    </dt>
                                    <dd className="mt-1 text-xs leading-5 text-ink">
                                      {activeStackGuide.projectRole}
                                    </dd>
                                  </div>
                                  <div className="rounded-lg bg-canvas p-3">
                                    <dt className="text-[11px] font-bold text-muted">
                                      먼저 공부할 것
                                    </dt>
                                    <dd className="mt-1 text-xs leading-5 text-ink">
                                      {activeStackGuide.firstStep}
                                    </dd>
                                  </div>
                                </dl>
                                {activeStackGuide.officialUrl ? (
                                  <a
                                    className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-signal-ink transition-colors hover:text-signal"
                                    href={activeStackGuide.officialUrl}
                                    rel="noreferrer"
                                    target="_blank"
                                  >
                                    공식 사이트에서 배우기
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </a>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        </dl>
                        <button
                          className="mt-7 flex items-center gap-2 text-sm font-bold text-signal-ink transition-colors hover:text-signal"
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
                    <ol className="stagger mt-5 grid gap-3 md:grid-cols-2">
                      {displayedRoadmap.map((item, index) => (
                        <li
                          className={
                            "mission-route-card relative rounded-xl border border-line bg-canvas p-4"
                          }
                          key={item}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] font-bold text-signal-ink">
                              M-{String(index + 1).padStart(2, "0")}
                            </span>
                            <span className="h-1.5 w-1.5 rounded-full bg-signal/50" />
                          </div>
                          <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-ink">
                            {item}
                          </p>
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
            <div className="build-partner-grid stagger mt-4 grid gap-3">
              {tools.map((tool, index) => {
                const selected = (selectedTool ?? recommendation.recommendedTool) === tool.slug;
                const recommended = recommendation.recommendedTool === tool.slug;
                const learning = toolLearningInfo[tool.slug];
                return (
                  <div className="build-partner-item" key={tool.slug}>
                    <button
                      aria-expanded={selected}
                      aria-pressed={selected}
                      className={
                        `build-partner-card semantic-tile ${toolThemes[tool.slug]} flex min-h-[220px] w-full flex-col items-start rounded-[1.125rem] p-5 text-left text-ink transition-all hover:shadow-soft ` +
                        (selected ? "is-selected" : "")
                      }
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
                          "mt-4 grid h-12 w-12 place-items-center overflow-hidden rounded-xl border " +
                          (selected
                            ? "semantic-icon border-transparent"
                            : "border-line bg-surface/70 text-muted")
                        }
                      >
                        <img
                          alt={`${tool.name} 로고`}
                          className="h-7 w-7 object-contain"
                          src={toolLogos[tool.slug]}
                        />
                      </span>
                      <span className="mt-5">
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
                      <span className="mt-auto flex w-full items-center gap-2 pt-5 text-xs font-bold">
                        {selected ? "선택됨" : recommended ? "추천 · 선택" : "선택"}
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    </button>
                    {selected ? (
                      <div
                        className={`build-partner-detail semantic-tile ${toolThemes[tool.slug]} grid gap-8 rounded-[1.125rem] border border-line p-5 text-ink sm:p-7 md:grid-cols-2`}
                      >
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
                        <section className="border-t border-line pt-6 md:col-span-2">
                          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                            <div>
                              <div className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-signal" />
                                <h4 className="text-sm font-bold text-ink">
                                  {tool.name} 사용 방법 알아보기
                                </h4>
                              </div>
                              <p className="mt-3 text-sm leading-6 text-muted">
                                {learning.overview}
                              </p>
                            </div>
                            <div className="rounded-xl border border-signal/20 bg-signal-soft/60 p-4">
                              <p className="text-[11px] font-bold text-signal-ink">
                                초보자 추천 순서
                              </p>
                              <p className="mt-1.5 text-xs leading-5 text-ink">
                                {learning.beginnerPath}
                              </p>
                            </div>
                          </div>

                          <div className="mt-5 grid gap-3 sm:grid-cols-2">
                            {learning.surfaces.map((surface) => {
                              const SurfaceIcon = toolSurfaceIcons[surface.kind];
                              return (
                                <article
                                  className={`interactive-card tool-surface-card tool-surface-card--${surface.kind} rounded-xl border border-line bg-surface/75 p-4`}
                                  key={surface.title}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-signal-soft text-signal-ink">
                                      <SurfaceIcon className="h-3.5 w-3.5" />
                                    </span>
                                    <h5 className="text-xs font-bold text-ink">{surface.title}</h5>
                                  </div>
                                  <p className="mt-2 text-xs leading-5 text-muted">
                                    {surface.description}
                                  </p>
                                </article>
                              );
                            })}
                          </div>

                          {learning.installCommand ? (
                            <div className="mt-5 rounded-xl bg-ink p-4 text-surface">
                              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-surface/55">
                                터미널 설치 명령
                              </p>
                              <code className="mt-2 block overflow-x-auto whitespace-nowrap font-mono text-xs text-surface">
                                {learning.installCommand}
                              </code>
                            </div>
                          ) : null}

                          <div className="mt-5 flex flex-wrap gap-2">
                            <a
                              className="inline-flex items-center gap-2 rounded-lg bg-signal px-4 py-2.5 text-xs font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-signal-ink active:scale-[0.98]"
                              href={learning.installUrl}
                              rel="noreferrer"
                              target="_blank"
                            >
                              공식 설치 페이지
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                            <a
                              className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-4 py-2.5 text-xs font-bold text-ink transition-all hover:-translate-y-0.5 hover:border-signal/40 hover:text-signal-ink active:scale-[0.98]"
                              href={learning.docsUrl}
                              rel="noreferrer"
                              target="_blank"
                            >
                              공식 학습 문서
                              <BookOpen className="h-3.5 w-3.5" />
                            </a>
                            <button
                              className="inline-flex items-center gap-2 rounded-lg border border-signal/25 bg-signal-soft px-4 py-2.5 text-xs font-bold text-signal-ink transition-all hover:-translate-y-0.5 hover:border-signal/50 hover:bg-signal/15 active:scale-[0.98]"
                              onClick={() => {
                                setActiveToolGuide(tool.slug);
                                setActiveToolGuideTab("start");
                              }}
                              type="button"
                            >
                              전체 사용법 배우기
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </section>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <section className="mt-16 border-t border-line pt-12">
              <SectionHeading
                description="코드를 만들기 전에 화면 방향을 탐색하고, 디자인 규칙을 AI에게 정확히 전달하는 방법을 익힙니다."
                title="디자인 파트너와 참고 자료"
              />

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {designPartners.map((partner) => (
                  <article
                    className={`semantic-tile ${partner.tone} rounded-[1.25rem] p-5 text-ink sm:p-6`}
                    key={partner.name}
                  >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                            {partner.eyebrow}
                          </p>
                          <h3 className="type-title mt-2">{partner.name}</h3>
                        </div>
                        <span className="semantic-icon grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl">
                          <img
                            alt={`${partner.name} 로고`}
                            className="h-7 w-7 object-contain"
                            src={partner.logo}
                          />
                        </span>
                      </div>
                      <p className="mt-4 text-sm leading-6 text-muted">{partner.description}</p>

                      <ol className="mt-5 space-y-3">
                        {partner.steps.map((step, index) => (
                          <li className="grid grid-cols-[28px_minmax(0,1fr)] gap-3" key={step}>
                            <span className="grid h-7 w-7 place-items-center rounded-full bg-surface font-mono text-xs font-bold text-signal-ink shadow-sm">
                              {index + 1}
                            </span>
                            <span className="text-sm leading-6 text-ink">{step}</span>
                          </li>
                        ))}
                      </ol>

                      <div className="mt-6 flex flex-wrap gap-2">
                        <a
                          className="inline-flex items-center gap-1.5 rounded-lg bg-signal px-3.5 py-2.5 text-xs font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-signal-ink active:scale-[0.98]"
                          href={partner.primaryUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {partner.primaryLabel}
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                        <a
                          className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface/80 px-3.5 py-2.5 text-xs font-bold text-ink transition-all hover:-translate-y-0.5 hover:border-signal/40 hover:text-signal-ink active:scale-[0.98]"
                          href={partner.guideUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          공식 사용 가이드
                          <BookOpen className="h-3.5 w-3.5" />
                        </a>
                      </div>
                  </article>
                ))}
              </div>

              <div className="brief-shell mt-5 p-5 sm:p-7">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-signal-soft text-signal-ink">
                    <Search className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-signal-ink">
                      DESIGN REFERENCE LIBRARY
                    </p>
                    <h3 className="type-title mt-1 text-ink">AI에게 디자인 감각을 전달하는 자료</h3>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 border-y border-line py-3">
                  {designResources.map((resource, index) => (
                    <article
                      className={`interactive-card design-resource-card ${resource.tone} grid gap-5 rounded-xl border border-transparent px-3 py-6 lg:grid-cols-[48px_minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start`}
                      key={resource.name}
                    >
                      <span className="font-mono text-xs font-bold text-signal-ink">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <p className="text-[11px] font-bold text-muted">{resource.label}</p>
                        <h4 className="mt-1 text-base font-bold text-ink">{resource.name}</h4>
                        <p className="mt-2 text-sm leading-6 text-muted">{resource.description}</p>
                        <a
                          className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-signal-ink transition-colors hover:text-signal"
                          href={resource.url}
                          rel="noreferrer"
                          target="_blank"
                        >
                          사이트에서 확인하기
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                      <div>
                        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-muted">
                          초보자 사용 순서
                        </p>
                        <ol className="mt-3 space-y-2.5">
                          {resource.usage.map((step, stepIndex) => (
                            <li className="flex gap-2.5 text-xs leading-5 text-ink" key={step}>
                              <span className="font-mono font-bold text-signal-ink">
                                {stepIndex + 1}.
                              </span>
                              {step}
                            </li>
                          ))}
                        </ol>
                        <code className="mt-4 block overflow-x-auto rounded-lg bg-canvas px-3 py-2.5 font-mono text-[11px] text-ink">
                          {resource.command}
                        </code>
                      </div>
                    </article>
                  ))}
                </div>

                <p className="mt-5 text-xs leading-5 text-muted">
                  참고: DESIGN.md는 색상과 구성 원칙을 학습하기 위한 자료입니다. 브랜드의 로고,
                  사진, 고유 그래픽을 그대로 사용할 권리까지 제공하는 것은 아니므로 공개 전에는
                  각 브랜드의 사용 조건을 확인하세요.
                </p>
              </div>
            </section>
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
              {availableServiceTypes.map((service, index) => {
                const selected = selectedServiceType === service.id;
                const recommended = roleRecommendedServiceType === service.id;
                const Icon = serviceIcons[service.id];
                const learning = serviceLearningInfo[service.id];
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
                    <span className="mt-5 block border-t border-current/10 pt-4 text-xs font-bold leading-5 text-ink/80">
                      {learning.shortFit}
                    </span>
                  </button>
                );
              })}
            </div>

            <section className={`semantic-tile ${serviceThemes[activeServiceType]} mt-6 rounded-[1.25rem] p-5 sm:p-6`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted">
                    선택 가이드
                  </p>
                  <h3 className="type-title mt-2 text-ink">{selectedServiceInfo.title}은 이런 프로젝트에 맞습니다</h3>
                </div>
                <span className="semantic-icon semantic-icon-static inline-flex w-fit items-center rounded-full px-3 py-1.5 text-xs font-bold">
                  최종 결과 · {serviceLearningInfo[activeServiceType].result}
                </span>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <article className="tool-surface-card tool-surface-card--extension rounded-xl border border-line bg-surface/65 p-4">
                  <p className="text-xs font-bold text-signal-ink">이럴 때 선택하세요</p>
                  <ul className="mt-3 space-y-2">
                    {serviceLearningInfo[activeServiceType].fits.map((item) => (
                      <li className="flex gap-2 text-sm leading-6 text-ink" key={item}>
                        <Check className="mt-1.5 h-3.5 w-3.5 shrink-0 text-success" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
                <article className="tool-surface-card tool-surface-card--app rounded-xl border border-line bg-surface/65 p-4">
                  <p className="text-xs font-bold text-signal-ink">가장 큰 장점</p>
                  <p className="mt-3 text-sm leading-6 text-ink">{serviceLearningInfo[activeServiceType].strength}</p>
                </article>
                <article className="tool-surface-card tool-surface-card--web rounded-xl border border-line bg-surface/65 p-4">
                  <p className="text-xs font-bold text-signal-ink">미리 확인할 점</p>
                  <p className="mt-3 text-sm leading-6 text-ink">{serviceLearningInfo[activeServiceType].caution}</p>
                </article>
                <article className="tool-surface-card tool-surface-card--terminal rounded-xl border border-line bg-surface/65 p-4">
                  <p className="text-xs font-bold text-signal-ink">첫 번째로 만들 것</p>
                  <p className="mt-3 text-sm leading-6 text-ink">{serviceLearningInfo[activeServiceType].firstStep}</p>
                </article>
              </div>

              <div className="mt-6 border-t border-current/10 pt-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-signal-ink">필요한 화면</p>
                    <p className="mt-1 text-sm leading-6 text-muted">
                      첫 번째 버전에 필요한 화면부터 하나씩 만드세요.
                    </p>
                  </div>
                  <span className="font-mono text-[10px] font-bold text-muted">
                    {selectedServiceInfo.screens.length} SCREENS
                  </span>
                </div>
                <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {selectedServiceInfo.screens.map((screen, index) => (
                    <li
                      className="interactive-card flex items-center gap-3 rounded-xl border border-line bg-surface/70 px-3.5 py-3"
                      key={screen}
                    >
                      <span className="semantic-icon semantic-icon-static grid h-7 w-7 shrink-0 place-items-center rounded-lg font-mono text-[10px] font-bold">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="text-sm font-semibold leading-5 text-ink">{screen}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </section>

            <div className="mt-12">
              <div>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-signal-ink">
                      기술이 연결되는 순서
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      기술 이름을 외우기보다 무엇을 담당하고 왜 필요한지부터 확인하세요.
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-signal-soft px-3 py-1 font-mono text-[10px] font-bold text-signal-ink">
                    {displayedStack.length} STEPS
                  </span>
                </div>
                <ol className="technology-flow mt-5">
                  {displayedStack.map((item, index) => {
                    const guide = getStackGuide(item);
                    return (
                      <li className="technology-flow-node" key={item}>
                        <div className="flex items-center justify-between gap-3">
                          <span className="technology-flow-number">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="rounded-full bg-canvas px-2 py-1 font-mono text-[9px] font-bold text-muted">
                            STEP {index + 1}
                          </span>
                        </div>
                        <h4 className="mt-4 text-base font-bold leading-5 text-ink">{item}</h4>
                        <p className="mt-2 text-xs leading-5 text-muted">{guide.description}</p>
                        <div className="mt-4 border-t border-line pt-3">
                          <p className="text-[10px] font-bold text-signal-ink">이 프로젝트에서</p>
                          <p className="mt-1 text-xs leading-5 text-ink">{guide.projectRole}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-line pt-6 sm:flex-row sm:items-center">
          <p className="max-w-xl text-sm leading-6 text-muted">
            {shapeStepAction.description} 이후 선택은 언제든 이 화면에서 바꿀 수 있습니다.
          </p>
          <PrimaryButton icon={shapeStepAction.icon} onClick={advanceShapeStep}>
            {shapeStepAction.label}
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
            <h1 className="type-display mt-4 text-signal-ink">
              계획한 내용을
              <br />
              실제 결과물로 만들어 보세요.
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
            description="위에서 아래로 한 단계씩 진행하세요. 이전 작업을 완료해야 다음 작업이 열리며, 막히면 해당 작업의 순서를 해결 도우미로 전달합니다."
            title="전체 작업"
          />
          <div className="technology-flow stagger mt-5">
            {checklistItems.map((item, index) => (
              <TaskRow
                index={index}
                item={item}
                key={item.id}
                locked={checklistItems
                  .slice(0, index)
                  .some((previousItem) => checklistStatuses[previousItem.id] !== "done")}
                onChange={(status) => setChecklist(item, status)}
                showSequence
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
            <h1 className="type-display text-signal-ink">
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
            <div className="technology-flow technology-flow--two-column stagger mt-5">
              {deploymentItems.map((item, index) => (
                <TaskRow
                  index={index}
                  item={item}
                  key={item.id}
                  locked={
                    checklistItems.some(
                      (buildItem) => checklistStatuses[buildItem.id] !== "done",
                    ) ||
                    deploymentItems
                      .slice(0, index)
                      .some(
                        (previousItem) => deploymentStatuses[previousItem.id] !== "done",
                      )
                  }
                  onChange={(status) => setDeployCheck(item, status)}
                  showSequence
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
        <div className={`error-helper error-helper-text--${errorTextSize} grid gap-7 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start`}>
          <section>
            <p className="error-helper-caption font-mono font-bold uppercase tracking-[0.16em] text-signal-ink">
              {errorHelpItem ? "선택한 전체 작업의 해결 순서" : "처음 시작하는 분을 위한 순서"}
            </p>
            <h3 className="error-helper-title type-title mt-2 text-ink">
              {errorHelpItem ? `${errorHelpItem.title}, 이 순서대로 확인하세요` : "Git 준비, 여기까지 확인했나요?"}
            </h3>
            <p className="error-helper-copy mt-2 leading-6 text-muted">
              {errorHelpItem
                ? `${errorHelpItem.description} 위에서부터 확인하고, 진행되지 않는 단계를 누르세요.`
                : "위에서부터 확인하고, 진행되지 않는 단계를 누르세요. GitHub 가입과 Git 설치는 서로 다른 작업이에요."}
            </p>
            <ol className="mt-5 space-y-2" aria-label={errorHelpItem ? `${errorHelpItem.title} 해결 순서` : "Git 시작 준비 순서"}>
              {activeErrorSteps.map((step, index) => {
                const selected = selectedErrorStepId === step.id;
                return (
                  <li key={step.id}>
                    <button
                      aria-pressed={selected}
                      className={
                        "group grid w-full grid-cols-[34px_minmax(0,1fr)] gap-3 rounded-xl border px-3.5 py-3 text-left transition-all duration-300 active:scale-[0.99] " +
                        (selected
                          ? "border-warning/45 bg-warning/10 shadow-sm"
                          : "border-line bg-canvas/60 hover:border-signal/30 hover:bg-signal-soft/60")
                      }
                      onClick={() => {
                        setSelectedErrorStepId(step.id);
                        setErrorMessage((current) =>
                          beginnerStepErrorDraft(step, errorDetailsFromDraft(current)),
                        );
                        setErrorSolution(null);
                      }}
                      type="button"
                    >
                      <span
                        className={
                          "error-helper-caption grid h-[30px] w-[30px] place-items-center rounded-full font-mono font-black " +
                          (selected ? "bg-warning text-white" : "bg-surface text-signal-ink shadow-sm")
                        }
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0">
                        <span className="error-helper-copy block font-extrabold text-ink">{step.title}</span>
                        <span className="error-helper-detail mt-0.5 block leading-5 text-muted">{step.description}</span>
                        <span className="error-helper-caption mt-1 block font-semibold leading-5 text-signal-ink">
                          확인: {step.check}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </section>

          <section className="rounded-2xl border border-line bg-canvas/55 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="error-helper-caption font-mono font-bold uppercase tracking-[0.16em] text-danger">
                  AI 문제 분석
                </p>
                <h3 className="error-helper-title type-title mt-2 text-ink">
                  {selectedErrorStep ? `${selectedErrorStep.title}에서 막혔어요` : "어디에서 막혔는지 알려주세요"}
                </h3>
              </div>
              <label className="block shrink-0">
                <span className="error-helper-caption mb-1 block font-bold text-muted">사용 중인 컴퓨터</span>
                <select
                  className="error-helper-copy field min-h-10 py-2 font-bold"
                  onChange={(event) => setErrorPlatform(event.target.value as ErrorPlatform)}
                  value={errorPlatform}
                >
                  <option value="unknown">잘 모르겠어요</option>
                  <option value="windows">Windows</option>
                  <option value="macos">macOS</option>
                </select>
              </label>
            </div>

            {selectedErrorStep ? (
              <div className="error-helper-copy mt-4 rounded-xl border border-warning/25 bg-warning/10 px-4 py-3 leading-6 text-ink">
                <span className="font-bold text-warning">정상이라면</span>
                <span className="mt-1 block">{selectedErrorStep.check}</span>
              </div>
            ) : null}

            <label className="mt-5 block">
              <span className="error-helper-copy mb-2 block font-bold text-ink">실제로 보이는 화면이나 메시지</span>
              <span className="error-helper-detail mb-3 block leading-6 text-muted">
                무엇을 눌렀는지와 화면에 나온 문장을 그대로 적어주세요. API 키, 비밀번호, DB 주소는 지워주세요.
              </span>
              <textarea
                className="error-helper-copy field min-h-44 resize-y font-mono leading-6"
                onChange={(event) => setErrorMessage(event.target.value)}
                placeholder={
                  selectedErrorStep
                    ? `예: ${selectedErrorStep.title} 단계에서 무엇을 했고, 어떤 문구가 나왔는지 적어주세요.`
                    : "예: git --version을 입력했는데 'git을 찾을 수 없습니다'라고 나와요."
                }
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
              AI에게 해결 순서 받기
            </PrimaryButton>

            {errorSolution ? (
              <div className="mt-7 border-t border-line pt-6">
                <p className="error-helper-caption font-mono font-semibold uppercase tracking-[0.14em] text-danger">
                  초보자용 분석 결과
                </p>
                <h3 className="error-helper-title type-title mt-2 text-ink">{errorSolution.summary}</h3>
                <h4 className="error-helper-copy type-label mt-6 text-ink">가능성이 높은 원인</h4>
                <ul className="error-helper-copy mt-3 space-y-2 leading-7 text-muted">
                  {errorSolution.possibleCauses.map((item) => (
                    <li className="flex gap-3" key={item}>
                      <AlertTriangle className="mt-1 h-4 w-4 shrink-0 text-danger" />
                      {item}
                    </li>
                  ))}
                </ul>
                <h4 className="error-helper-copy type-label mt-6 text-ink">한 단계씩 해결해요</h4>
                <ol className="mt-3">
                  {errorSolution.solutionSteps.map((item, index) => (
                    <li
                      className="error-helper-copy grid grid-cols-[32px_minmax(0,1fr)] border-t border-line py-3 leading-7"
                      key={item}
                    >
                      <span className="error-helper-detail font-mono text-signal-ink">
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
                      errorSolution.suggestedPrompt.replaceAll("{{errorMessage}}", errorMessage),
                      "에러 해결 프롬프트를 복사했습니다.",
                    )
                  }
                >
                  AI에게 다시 물어볼 문장 복사
                </SecondaryButton>
              </div>
            ) : (
              <div className="error-helper-detail mt-6 rounded-xl border border-dashed border-line px-4 py-5 text-center leading-6 text-muted">
                막힌 단계와 화면의 메시지를 보내면, 먼저 확인할 것부터 한 단계씩 알려드려요.
              </div>
            )}
          </section>
        </div>
      );
    }

    return (
      <div className="flex min-h-full flex-col">
        <div className="rounded-2xl border border-signal/15 bg-signal-soft/70 px-4 py-3.5 shadow-[inset_0_1px_0_rgb(255_255_255/.7)]">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-success shadow-[0_0_0_4px_rgb(var(--color-success)/.1)]" />
            <p className="text-xs font-extrabold text-ink">프로젝트 문맥 연결됨</p>
          </div>
          <p className="mt-1.5 pl-4 text-xs leading-5 text-muted">
            {phaseMetadata[safePhase].label} · {selectedToolInfo.name} ·{" "}
            {selectedServiceInfo.title}
          </p>
        </div>
        <div
          aria-live="polite"
          className="mt-6 min-h-0 flex-1 space-y-4 overflow-y-auto"
        >
          {chatMessages.map((message, index) => (
            <div className={"flex items-end gap-2.5 " + (message.role === "user" ? "justify-end" : "justify-start")} key={message.role + "-" + index}>
              {message.role === "assistant" ? (
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-signal-soft text-[10px] font-extrabold text-signal-ink">VC</span>
              ) : null}
              <div
                className={
                  "max-w-[86%] rounded-2xl border px-4 py-3 text-sm leading-6 shadow-[0_5px_16px_rgba(104,66,47,.06)] " +
                  (message.role === "user"
                    ? "rounded-br-md border-ink bg-ink text-surface"
                    : "rounded-bl-md border-line bg-surface text-ink")
                }
              >
                <p>{message.content}</p>
              {message.links?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {message.links.map((link) => (
                    <button
                      className={
                        "rounded-full border px-2.5 py-1 text-[11px] font-bold transition-all hover:-translate-y-0.5 " +
                        (message.role === "user"
                          ? "border-surface/30 text-surface"
                          : "border-signal/20 bg-signal-soft/60 text-signal-ink hover:bg-signal-soft")
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
            </div>
          ))}
        </div>
        <div className="sticky bottom-0 mt-6 border-t border-line bg-surface/95 pt-4 backdrop-blur-xl safe-area-bottom">
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
              placeholder="무엇이 막혔나요?"
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
  const activeGuide = activeToolGuide ? toolGuides[activeToolGuide] : null;
  const activeGuideContent =
    activeGuide?.tabs.find((tab) => tab.id === activeToolGuideTab) ?? activeGuide?.tabs[0];

  return (
    <div className="game-shell min-h-screen text-ink">
      <MobilePhaseNav
        activePhase={safePhase}
        onSelect={navigatePhase}
        overallProgress={projectProgress.percent}
        progress={projectProgress.phases}
      />
      <div className="min-h-screen lg:pt-24">
        <PhaseRail
          activePhase={safePhase}
          onSelect={navigatePhase}
          progress={projectProgress.phases}
        />
        <main className="min-w-0 pb-28 lg:pb-16">
          <div className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
            {notice ? <InlineNotice>{notice}</InlineNotice> : null}
            <div className="phase-enter" key={safePhase}>
              {phaseContent}
            </div>
          </div>
        </main>
      </div>

      <ResourceDock onOpen={setResource} />

      {activeResourceMeta ? (
        <ResourceDrawer
          eyebrow={activeResourceMeta.eyebrow}
          onClose={closeResource}
          open={Boolean(resource)}
          title={activeResourceMeta.title}
          wide={resource === "error"}
        >
          <ResourceSwitcher
            accessory={
              resource === "error" ? (
                <div aria-label="막힘 해결 도우미 글자 크기" className="flex min-h-9 items-center" role="group">
                  <button
                    aria-label="글자 작게"
                    className="min-h-9 rounded-lg px-2 text-xs font-black text-muted transition-colors hover:bg-surface hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
                    disabled={errorTextSize === "normal"}
                    onClick={() => setErrorTextSize(errorTextSize === "xlarge" ? "large" : "normal")}
                    type="button"
                  >
                    가−
                  </button>
                  <span aria-live="polite" className="w-12 text-center font-mono text-[11px] font-bold tabular-nums text-ink">
                    {errorTextSize === "normal" ? "100%" : errorTextSize === "large" ? "115%" : "130%"}
                  </span>
                  <button
                    aria-label="글자 크게"
                    className="min-h-9 rounded-lg px-2 text-sm font-black text-muted transition-colors hover:bg-surface hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
                    disabled={errorTextSize === "xlarge"}
                    onClick={() => setErrorTextSize(errorTextSize === "normal" ? "large" : "xlarge")}
                    type="button"
                  >
                    가+
                  </button>
                </div>
              ) : undefined
            }
            activeResource={resource ?? "coach"}
            onChange={setResource}
          />
          {notice ? <InlineNotice>{notice}</InlineNotice> : null}
          {renderResource()}
        </ResourceDrawer>
      ) : null}

      {activeGuide && activeGuideContent ? (
        <ResourceDrawer
          eyebrow="BUILD PARTNER GUIDE"
          onClose={() => setActiveToolGuide(null)}
          open={Boolean(activeToolGuide)}
          title={`${activeGuide.name} 전체 사용법`}
          wide
        >
          <div className="border-b border-line px-5 py-5 sm:px-7">
            <p className="max-w-2xl text-sm leading-6 text-muted">{activeGuide.description}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <a
                className="inline-flex items-center gap-1.5 text-xs font-bold text-signal-ink hover:text-signal"
                href={activeGuide.officialUrl}
                rel="noreferrer"
                target="_blank"
              >
                공식 문서
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          <div className="border-b border-line px-5 py-4 sm:px-7">
            <div className="flex gap-2 overflow-x-auto pb-1" role="tablist">
              {activeGuide.tabs.map((tab) => (
                <button
                  aria-selected={activeGuideContent.id === tab.id}
                  className={
                    "shrink-0 rounded-full border px-3.5 py-2 text-xs font-bold transition-all " +
                    (activeGuideContent.id === tab.id
                      ? "border-signal bg-signal text-white shadow-sm"
                      : "border-line bg-surface text-muted hover:border-signal/40 hover:bg-signal-soft hover:text-signal-ink")
                  }
                  key={tab.id}
                  onClick={() => setActiveToolGuideTab(tab.id)}
                  role="tab"
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-y-auto px-5 py-6 sm:px-7 sm:py-8" role="tabpanel">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-signal-ink">
              {activeGuideContent.label}
            </p>
            <h3 className="type-title mt-2 text-ink">{activeGuideContent.summary}</h3>

            <ol className="mt-6 space-y-3">
              {activeGuideContent.steps.map((step, index) => (
                <li
                  className="interactive-card rounded-xl border border-line bg-canvas/70 p-4 sm:p-5"
                  key={step.title}
                >
                  <div className="grid grid-cols-[28px_minmax(0,1fr)] gap-3">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-signal-soft font-mono text-[10px] font-bold text-signal-ink">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-ink">{step.title}</h4>
                      <p className="mt-1 text-sm leading-6 text-muted">{step.body}</p>
                      {step.command ? (
                        <pre className="mt-3 overflow-x-auto rounded-lg bg-ink px-3.5 py-3 text-xs leading-5 text-surface">
                          <code>{step.command}</code>
                        </pre>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ol>

            {activeGuideContent.tips?.length ? (
              <aside className="mt-6 rounded-xl border border-signal/20 bg-signal-soft/60 p-4">
                <p className="text-xs font-bold text-signal-ink">초보자 팁</p>
                <ul className="mt-2 space-y-2">
                  {activeGuideContent.tips.map((tip) => (
                    <li className="flex gap-2 text-xs leading-5 text-ink" key={tip}>
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-signal" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </aside>
            ) : null}
          </div>
        </ResourceDrawer>
      ) : null}
    </div>
  );
}
