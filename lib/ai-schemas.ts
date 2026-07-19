import { z } from "zod";

const strictRecommendationResponseSchema = z.object({
  summary: z.string().min(10).max(500),
  targetUsers: z.array(z.string().min(2)).min(1).max(5),
  mainFeatures: z.array(z.string().min(2)).min(1).max(8),
  recommendedTool: z.enum(["codex", "claude", "antigravity"]),
  recommendedServiceType: z.enum(["web", "mobile-web", "game", "software"]),
  recommendedStack: z.array(z.string().min(1)).min(2).max(8),
  difficulty: z.enum(["입문", "보통", "도전"]),
  reasons: z.array(z.string().min(5)).min(1).max(3),
  roadmap: z.array(z.string().min(3)).min(1).max(10),
  checklist: z
    .array(
      z.object({
        id: z.string().regex(/^[a-z0-9-]+$/),
        title: z.string().min(2),
        description: z.string().min(5),
      }),
    )
    .min(1)
    .max(12),
  promptTemplates: z.array(z.string().min(2)).min(1).max(5),
});

function limitedArray(value: unknown, maximum: number) {
  return Array.isArray(value) ? value.slice(0, maximum) : value;
}

function checklistId(value: unknown, index: number) {
  if (typeof value !== "string") return `task-${index + 1}`;
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return normalized || `task-${index + 1}`;
}

export const recommendationResponseSchema = z.preprocess((value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const source = value as Record<string, unknown>;
  const checklist = Array.isArray(source.checklist)
    ? source.checklist.slice(0, 12).map((item, index) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) return item;
        const task = item as Record<string, unknown>;
        return { ...task, id: checklistId(task.id, index) };
      })
    : source.checklist;

  return {
    ...source,
    targetUsers: limitedArray(source.targetUsers, 5),
    mainFeatures: limitedArray(source.mainFeatures, 8),
    recommendedStack: limitedArray(source.recommendedStack, 8),
    reasons: limitedArray(source.reasons, 3),
    roadmap: limitedArray(source.roadmap, 10),
    checklist,
    promptTemplates: limitedArray(source.promptTemplates, 5),
  };
}, strictRecommendationResponseSchema);

export const interviewQuestionsResponseSchema = z.object({
  nextQuestions: z.array(z.string().min(5)).min(1).max(5),
});

const projectBriefResponseSchema = z.preprocess((value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const source = value as Record<string, unknown>;
  return {
    ...source,
    screens: limitedArray(source.screens, 8),
    features: limitedArray(source.features, 8),
  };
}, z.object({
    title: z.string().min(2).max(100),
    summary: z.string().min(10).max(500),
    screens: z.array(z.string().min(2)).min(1).max(8),
    features: z.array(z.string().min(2)).min(1).max(8),
  }));

export const interviewResultResponseSchema = z.object({
  projectBrief: projectBriefResponseSchema,
  recommendation: recommendationResponseSchema,
});

export const recommendationJsonShape = `{
  "summary": "프로젝트를 구체적으로 설명하는 1~3문장",
  "targetUsers": ["구체적인 핵심 사용자"],
  "mainFeatures": ["MVP에 꼭 필요한 기능 3~8개"],
  "recommendedTool": "codex | claude | antigravity 중 하나",
  "recommendedServiceType": "web | mobile-web | game | software 중 하나",
  "recommendedStack": ["실제 필요한 기술"],
  "difficulty": "입문 | 보통 | 도전 중 하나",
  "reasons": ["서비스 형태 추천 이유", "도구 추천 이유", "난이도 판단 이유"],
  "roadmap": ["사용자가 실행할 구체적인 작업 순서"],
  "checklist": [{"id":"영문-kebab-case", "title":"작업명", "description":"완료 기준"}],
  "promptTemplates": ["이 프로젝트에 유용한 프롬프트 제목"]
}`;

export const projectCoachSystemPrompt = `당신은 VibeCraft의 한국어 프로젝트 코치입니다.
개발 경험이 적은 사용자의 아이디어를 실제로 제작 가능한 MVP로 바꿉니다.
사용자가 말하지 않은 기능을 함부로 추가하지 말고, 첫 버전의 범위를 작게 유지하세요.
추상적인 표현 대신 누가, 어떤 화면에서, 무엇을 하는지 구체적으로 작성하세요.
전문 용어가 필요하면 쉬운 한국어로 풀어 쓰세요.
응답은 설명이나 마크다운 없이 요청받은 JSON 객체 하나만 반환하세요.`;

const stringArraySchema = {
  type: "array",
  items: { type: "string" },
} as const;

const checklistSchema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      id: { type: "string" },
      title: { type: "string" },
      description: { type: "string" },
    },
    required: ["id", "title", "description"],
    additionalProperties: false,
  },
} as const;

export const recommendationOutputJsonSchema = {
  type: "object",
  properties: {
    summary: { type: "string" },
    targetUsers: stringArraySchema,
    mainFeatures: stringArraySchema,
    recommendedTool: { type: "string", enum: ["codex", "claude", "antigravity"] },
    recommendedServiceType: { type: "string", enum: ["web", "mobile-web", "game", "software"] },
    recommendedStack: stringArraySchema,
    difficulty: { type: "string", enum: ["입문", "보통", "도전"] },
    reasons: stringArraySchema,
    roadmap: stringArraySchema,
    checklist: checklistSchema,
    promptTemplates: stringArraySchema,
  },
  required: [
    "summary",
    "targetUsers",
    "mainFeatures",
    "recommendedTool",
    "recommendedServiceType",
    "recommendedStack",
    "difficulty",
    "reasons",
    "roadmap",
    "checklist",
    "promptTemplates",
  ],
  additionalProperties: false,
} as const;

export const interviewQuestionsOutputJsonSchema = {
  type: "object",
  properties: { nextQuestions: stringArraySchema },
  required: ["nextQuestions"],
  additionalProperties: false,
} as const;

export const interviewResultOutputJsonSchema = {
  type: "object",
  properties: {
    projectBrief: {
      type: "object",
      properties: {
        title: { type: "string" },
        summary: { type: "string" },
        screens: stringArraySchema,
        features: stringArraySchema,
      },
      required: ["title", "summary", "screens", "features"],
      additionalProperties: false,
    },
    recommendation: recommendationOutputJsonSchema,
  },
  required: ["projectBrief", "recommendation"],
  additionalProperties: false,
} as const;

export const chatOutputJsonSchema = {
  type: "object",
  properties: {
    answer: { type: "string" },
    relatedLinks: stringArraySchema,
  },
  required: ["answer", "relatedLinks"],
  additionalProperties: false,
} as const;

export const errorSolutionOutputJsonSchema = {
  type: "object",
  properties: {
    summary: { type: "string" },
    possibleCauses: stringArraySchema,
    solutionSteps: stringArraySchema,
    suggestedPrompt: { type: "string" },
    relatedTerms: stringArraySchema,
  },
  required: ["summary", "possibleCauses", "solutionSteps", "suggestedPrompt", "relatedTerms"],
  additionalProperties: false,
} as const;
