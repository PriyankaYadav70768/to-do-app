import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { SubtaskCreateSchema } from "@/lib/validations";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: taskId } = await params;
    const task = await db.task.findFirst({
      where: { id: taskId, userId: user.id },
    });

    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const body = await req.json();
    const validated = SubtaskCreateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const subtask = await db.subtask.create({
      data: {
        taskId,
        title: validated.data.title,
        position: validated.data.position,
      },
    });

    return NextResponse.json({ subtask }, { status: 201 });
  } catch (error) {
    console.error("Subtask create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

