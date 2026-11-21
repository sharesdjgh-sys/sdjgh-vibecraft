import type { Recommendation } from "./types";

export const complexityOptions = [
  {
    id: "practice",
    title: "한 화면 실습",
    description: "화면 1개에서 동작 1개를 완성해요. HTML·CSS·JavaScript 파일 1~3개부터 시작해요.",
    example: "예: 버튼을 누르면 오늘의 문장이 나타나는 화면",
    instruction: "한 화면과 핵심 동작 하나만 만드세요. HTML·CSS·JavaScript 파일 1~3개를 우선하고, 설치 패키지·프레임워크·로그인·서버·데이터베이스·외부 API는 요구가 명시되지 않았다면 추가하지 마세요. 코드를 만들기 전에 생성할 파일 이름과 개수를 먼저 보여주고 확인을 받으세요. 전체 기능 목록을 한 번에 구현하지 말고 첫 동작 하나만 만든 뒤 실행 방법을 알려주세요.",
  },
  {
    id: "small",
    title: "작은 웹앱",
    description: "필요한 화면 1~2개에 기능 2~3개를 담아요. 저장은 브라우저부터 시작해요.",
    example: "예: 메모를 쓰고 목록에서 다시 보는 앱",
    instruction: "핵심 기능 2~3개와 꼭 필요한 화면만 만드세요. 단순한 브라우저 저장을 우선하고, 프레임워크·서버·DB·인증은 기능상 꼭 필요할 때만 근거를 설명한 뒤 제안하세요. 생성할 파일 이름과 개수를 먼저 보여주고 확인을 받은 뒤 한 기능씩 구현하세요.",
  },
  {
    id: "extended",
    title: "확장형",
    description: "여러 화면을 연결하고 데이터를 주고받아요. 서버·DB는 필요할 때 추가해요.",
    example: "예: 여러 사람이 쓰는 예약 앱",
    instruction: "여러 화면과 데이터 흐름을 설계하되 실제 요구에 필요한 기술만 사용하세요. 인증·서버·DB·외부 연동은 각각 필요 근거를 확인한 뒤 별도 단계로 추가하세요. 첫 버전은 핵심 사용자 흐름부터 작동하게 하세요.",
  },
  {
    id: "advanced",
    title: "고급 서비스",
    description: "로그인·권한·운영 관리까지 다뤄요. 큰 기능도 하나씩 만들어 확인해요.",
    example: "예: 사용자와 관리자가 함께 쓰는 서비스",
    instruction: "운영·협업·확장 요구를 고려해 구조를 설계하세요. 복잡한 계층과 인프라는 요구사항으로 정당화하고, 각 기능을 독립적으로 구현·검증하세요. 전체 시스템을 한 번에 생성하지 마세요.",
  },
] as const;

export type ComplexityLevel = (typeof complexityOptions)[number]["id"];

export function complexityInstruction(level: ComplexityLevel): string {
  return complexityOptions.find((option) => option.id === level)?.instruction ?? complexityOptions[0].instruction;
}
export function fitRecommendationToComplexity(
  recommendation: Recommendation,
  level: ComplexityLevel,
): Recommendation {
  if (level === "practice") {
    const firstFeature = recommendation.mainFeatures[0];
    return {
      ...recommendation,
      mainFeatures: [firstFeature],
      recommendedStack: ["HTML", "CSS", "JavaScript"],
      difficulty: "입문",
      reasons: [
        ...recommendation.reasons.slice(0, 2),
        "한 화면과 핵심 동작 하나부터 완성하는 실습 범위입니다.",
      ],
      roadmap: [
        `첫 화면에 ${firstFeature} 동작을 표시하기`,
        "HTML·CSS·JavaScript로 핵심 동작 하나 구현하기",
        "브라우저에서 직접 실행하고 결과 확인하기",
      ],
      checklist: [
        { id: "practice-screen", title: "첫 화면 만들기", description: "핵심 동작을 실행할 화면이 브라우저에 표시됩니다." },
        { id: "practice-action", title: "핵심 동작 하나 구현하기", description: `${firstFeature} 동작을 한 번 실행하고 결과를 확인합니다.` },
        { id: "practice-check", title: "직접 실행해 확인하기", description: "처음부터 끝까지 한 번 사용해 보고 오류가 없는지 확인합니다." },
      ],
    };
  }

  if (level === "small") {
    return { ...recommendation, mainFeatures: recommendation.mainFeatures.slice(0, 3) };
  }

  return recommendation;
}
