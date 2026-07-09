import { NextResponse } from "next/server";
import { z } from "zod";
import { chatAnswer } from "@/lib/recommendation";

const schema = z.object({
  role: z.enum(["student", "teacher", "adult"]),
  message: z.string().min(1).max(10000),
  currentPage: z.string().optional(),
  selectedTool: z.enum(["codex", "claude", "antigravity"]).optional(),
  selectedServiceType: z.enum(["web", "mobile-web", "software"]).optional(),
  projectSummary: z.string().optional(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "질문을 입력해주세요.",
      },
      { status: 400 },
    );
  }

  return NextResponse.json(chatAnswer(parsed.data));
}
