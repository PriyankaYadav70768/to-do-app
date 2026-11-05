import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { syncTaskReminder } from "@/lib/reminderScheduler";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const task = await db.task.findFirst({
      where: { id, userId: user.id },
    });

    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const isCompleting = task.status !== "COMPLETED";
    const newStatus = isCompleting ? "COMPLETED" : "TODO";
    const completedAt = isCompleting ? new Date() : null;

    const updatedTask = await db.task.update({
      where: { id },
      data: {
        status: newStatus,
        completedAt,
      },
      include: {
        project: { select: { id: true, name: true, color: true } },
        category: { select: { id: true, name: true, color: true } },
        subtasks: true,
      },
    });

    await db.taskActivity.create({
      data: {
        taskId: task.id,
        userId: user.id,
        action: isCompleting ? "COMPLETED" : "REOPENED",
      },
    });

    // Synchronize reminder (cancelled if completed, rescheduled if reopened)
    await syncTaskReminder(updatedTask.id);

    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    console.error("Toggle task error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

