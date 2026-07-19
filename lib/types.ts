export type Role = "student" | "teacher" | "adult";

export type ToolSlug = "codex" | "claude" | "antigravity";

export type ServiceType = "web" | "mobile-web" | "game" | "software";

export type ChecklistStatus = "pending" | "active" | "done" | "blocked";

export interface RoleOption {
  id: Role;
  title: string;
  description: string;
  example: string;
}

export interface ToolInfo {
  slug: ToolSlug;
  name: string;
  tagline: string;
  bestFor: string;
  strengths: string[];
  cautions: string[];
  guide: Array<{
    title: string;
    items: string[];
  }>;
}

export interface ServiceTypeInfo {
  id: ServiceType;
  title: string;
  description: string;
  stack: string[];
  screens: string[];
}

export interface TermInfo {
  term: string;
  category: string;
  plainDescription: string;
  examples: Record<Role, string>;
  related: string[];
}

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
}

export interface PromptTemplate {
  id: string;
  category: string;
  tool: "all" | ToolSlug;
  title: string;
  description: string;
  template: string;
}

export interface Recommendation {
  summary: string;
  targetUsers: string[];
  mainFeatures: string[];
  recommendedTool: ToolSlug;
  recommendedServiceType: ServiceType;
  recommendedStack: string[];
  difficulty: "입문" | "보통" | "도전";
  reasons: string[];
  roadmap: string[];
  checklist: ChecklistItem[];
  promptTemplates: string[];
}

export interface ErrorSolution {
  summary: string;
  possibleCauses: string[];
  solutionSteps: string[];
  suggestedPrompt: string;
  relatedTerms: string[];
}
