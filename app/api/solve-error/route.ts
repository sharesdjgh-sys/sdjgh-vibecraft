import { NextResponse } from "next/server";
import { z } from "zod";
import { solveError } from "@/lib/recommendation";

const schema = z.object({
  role: z.enum(["student", "teacher", "adult"]),
  selectedTool: z.enum(["codex", "claude", "antigravity"]).optional(),
  currentStep: z.string().optional(),
  errorMessage: z.string().min(1).max(20000),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "에러 메시지를 입력해주세요.",
      },
      { status: 400 },
    );
  }

  return NextResponse.json(solveError(parsed.data));
}
