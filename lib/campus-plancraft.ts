const CAMPUS_ORIGIN = "https://platform.sdjgh-ai.kr";
const PROJECTS_API = `${CAMPUS_ORIGIN}/api/plancraft/projects`;

export type CampusPlanSummary = { id: string; title: string; updatedAt: string };

type CampusPlan = {
  id: string;
  title: string;
  proposalScript?: string;
  story?: {
    logline?: string;
    theme?: string;
    setting?: string;
    plotOutline?: string;
  };
  characters?: Array<{ name?: string; role?: string; appearance?: string; personality?: string; backstory?: string }>;
  episodes?: Array<{ title?: string; synopsis?: string; cuts?: Array<{ description?: string; dialogue?: string; soundEffect?: string }> }>;
};

export const SMART_CAMPUS_ORIGIN = CAMPUS_ORIGIN;

async function requestCampusPlan(url: string, token: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: "omit",
    cache: "no-store",
  });
  if (response.status === 401) throw new Error("스마트 캠퍼스 로그인 세션이 끝났어요. 다시 로그인해 주세요.");
  if (!response.ok) throw new Error("기획서를 서버에서 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
  return response.json();
}

export async function listCampusPlans(token: string): Promise<CampusPlanSummary[]> {
  const result = await requestCampusPlan(PROJECTS_API, token) as { projects?: unknown };
  if (!Array.isArray(result.projects)) throw new Error("기획서 목록 형식이 올바르지 않아요.");
  return result.projects.filter((item): item is CampusPlanSummary =>
    item !== null && typeof item === "object" &&
    typeof item.id === "string" && typeof item.title === "string" && typeof item.updatedAt === "string");
}

export async function readCampusPlan(token: string, id: string): Promise<CampusPlan> {
  const result = await requestCampusPlan(`${PROJECTS_API}/${encodeURIComponent(id)}`, token) as { project?: unknown };
  const project = result.project;
  if (!project || typeof project !== "object" ||
      typeof (project as CampusPlan).id !== "string" || typeof (project as CampusPlan).title !== "string" ||
      (project as CampusPlan).id !== id) throw new Error("기획서 내용 형식이 올바르지 않아요.");
  return project as CampusPlan;
}

/** 서버 프로젝트의 작성된 기획 내용만 분석 입력으로 옮긴다. 빈 항목과 AI 대화 기록은 제외한다. */
export function campusPlanToText(project: CampusPlan): string {
  const lines: string[] = [`[ ${project.title} — 기획서 ]`];
  const add = (label: string, value: unknown) => {
    if (typeof value === "string" && value.trim()) lines.push(`${label}: ${value.trim()}`);
  };
  add("한 줄 소개", project.story?.logline);
  add("해결하려는 문제", project.story?.theme);
  add("배경 및 필요성", project.story?.setting);
  add("기능 개요", project.story?.plotOutline);
  project.characters?.forEach((person) => {
    add("이해관계자", person.name);
    add("역할", person.role);
    add("현재 불편함", person.appearance);
    add("SW 사용 목적", person.personality);
    add("SW와의 관계", person.backstory);
  });
  project.episodes?.forEach((feature, index) => {
    add(`기능 ${index + 1}`, feature.title);
    add("기능 설명", feature.synopsis);
    feature.cuts?.forEach((step) => {
      add("처리 단계", step.description);
      add("입력 데이터", step.dialogue);
      add("출력/결과", step.soundEffect);
    });
  });
  add("작성한 기획서", project.proposalScript);
  if (lines.length === 1) throw new Error("이 프로젝트에는 아직 불러올 기획서 내용이 없어요.");
  return lines.join("\n\n");
}
