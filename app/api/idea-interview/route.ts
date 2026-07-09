import { NextResponse } from "next/server";
import { z } from "zod";
import { createInterview } from "@/lib/recommendation";

const schema = z.object({
  role: z.enum(["student", "teacher", "adult"]),
  idea: z.string().min(4).max(3000),
  answers: z.record(z.string()).optional(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "만들고 싶은 서비스를 한 문장 이상으로 입력해주세요.",
      },
      { status: 400 },
    );
  }

  return NextResponse.json(createInterview(parsed.data));
}
