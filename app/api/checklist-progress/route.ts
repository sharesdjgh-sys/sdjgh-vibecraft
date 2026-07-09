import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  sessionId: z.string().min(1),
  checklistId: z.string().min(1),
  status: z.enum(["pending", "active", "done", "blocked"]),
  note: z.string().optional(),
});

export async function PATCH(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "체크리스트 상태를 저장할 수 없습니다.",
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    success: true,
    updatedProgress: {
      ...parsed.data,
      updatedAt: new Date().toISOString(),
    },
  });
}
