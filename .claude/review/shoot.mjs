import { chromium } from "playwright-core";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "http://127.0.0.1:3000";
const OUT = "D:/Programming_study/sdjgh_vibecraft/.claude/review";

const recommendation = {
  summary: "동아리 모집 신청을 받고 담당 교사가 승인하는 모바일 웹 서비스",
  targetUsers: ["동아리에 가입하려는 학생", "동아리 담당 교사"],
  mainFeatures: [
    "동아리 목록과 소개 보기",
    "가입 신청서 제출",
    "교사 승인과 결과 확인",
  ],
  recommendedTool: "codex",
  recommendedServiceType: "mobile-web",
  recommendedStack: ["Next.js", "Vercel", "Neon DB"],
  difficulty: "보통",
  reasons: [
    "스마트폰으로 접속하는 학생이 주 사용자라 모바일 웹이 적합합니다.",
    "화면 안에서 코드 작업을 끝낼 수 있어 처음 시작하기 좋습니다.",
  ],
  roadmap: [
    "신청 흐름의 첫 화면을 정합니다.",
    "동아리 목록과 신청 폼을 구현합니다.",
    "저장과 교사 승인 흐름을 연결합니다.",
    "실제 스마트폰에서 흐름을 점검합니다.",
    "공개 URL에서 첫 신청을 완료해봅니다.",
  ],
  checklist: [],
  promptTemplates: [],
};

const seeds = {
  "vc-session-id": JSON.stringify("review-session"),
  "vc-role": JSON.stringify("student"),
  "vc-recommendation": JSON.stringify(recommendation),
  "vc-tool": JSON.stringify("codex"),
  "vc-service-type": JSON.stringify("mobile-web"),
  "vc-checklist": JSON.stringify({
    "github-account": "done",
    "project-create": "done",
    "local-run": "active",
  }),
  "vc-deploy-checks": JSON.stringify({ "mobile-layout": "done" }),
  "vc-deployment-url": JSON.stringify("https://club-join.vercel.app"),
};

async function seed(page) {
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.evaluate((s) => {
    for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v);
  }, seeds);
}

async function setPhase(page, phase) {
  await page.evaluate(
    (p) => localStorage.setItem("vc-phase", JSON.stringify(p)),
    phase,
  );
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1700);
}

async function shot(page, name) {
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  console.log("shot:", name);
}

const browser = await chromium.launch({ executablePath: CHROME });

const desktop = await browser.newContext({
  viewport: { width: 1600, height: 1000 },
});
const page = await desktop.newPage();
await seed(page);

for (const phase of ["start", "shape", "build", "ship"]) {
  await setPhase(page, phase);
  await shot(page, `desktop-${phase}`);
  if (phase === "shape") {
    await page.getByRole("button", { name: "제작 도구" }).click();
    await page.waitForTimeout(1200);
    await shot(page, "desktop-shape-tool");
    await page.getByRole("button", { name: "서비스 형태" }).click();
    await page.waitForTimeout(1200);
    await shot(page, "desktop-shape-service");
    await page.getByRole("button", { name: "프로젝트 브리프" }).click();
    await page.waitForTimeout(400);
  }
}

await page.getByRole("button", { name: "프로젝트 코치 열기" }).click();
await page.waitForTimeout(900);
await shot(page, "desktop-drawer-coach");
await page.keyboard.press("Escape");

const mobile = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const mpage = await mobile.newPage();
await seed(mpage);
for (const phase of ["start", "shape", "build", "ship"]) {
  await setPhase(mpage, phase);
  await shot(mpage, `mobile-${phase}`);
}

await browser.close();
console.log("done");
