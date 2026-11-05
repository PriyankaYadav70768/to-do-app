import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const subtask = await db.subtask.findUnique({
      where: { id },
      include: { task: true },
    });

    if (!subtask || subtask.task.userId !== user.id) {
      return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
    }

    const body = await req.json();
    const updated = await db.subtask.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.isCompleted !== undefined && { isCompleted: Boolean(body.isCompleted) }),
      },
    });

    return NextResponse.json({ subtask: updated });
  } catch (error) {
    console.error("Subtask patch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const subtask = await db.subtask.findUnique({
      where: { id },
      include: { task: true },
    });

    if (!subtask || subtask.task.userId !== user.id) {
      return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
    }

    await db.subtask.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Subtask delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

