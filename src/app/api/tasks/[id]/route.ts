import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { TaskUpdateSchema } from "@/lib/validations";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const task = await db.task.findFirst({
      where: { id, userId: user.id },
      include: {
        project: true,
        category: true,
        subtasks: { orderBy: { position: "asc" } },
        activities: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });

    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Get task error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const existing = await db.task.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const body = await req.json();
    const validated = TaskUpdateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const data: any = { ...validated.data };
    if (data.dueDate !== undefined) {
      data.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }
    if (data.status === "COMPLETED" && existing.status !== "COMPLETED") {
      data.completedAt = new Date();
    } else if (data.status && data.status !== "COMPLETED") {
      data.completedAt = null;
    }

    const updatedTask = await db.task.update({
      where: { id },
      data,
      include: {
        project: { select: { id: true, name: true, color: true } },
        category: { select: { id: true, name: true, color: true } },
        subtasks: { orderBy: { position: "asc" } },
      },
    });

    // Log Activity
    await db.taskActivity.create({
      data: {
        taskId: updatedTask.id,
        userId: user.id,
        action: "UPDATED",
        details: JSON.stringify(body),
      },
    });

    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    console.error("Update task error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const existing = await db.task.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    await db.task.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete task error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

