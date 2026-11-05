import { NextResponse } from "next/server";
import { getCurrentUser, isPrerenderBailoutError } from "@/lib/auth";
import { db } from "@/lib/db";
import { TaskCreateSchema } from "@/lib/validations";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "all";
    const projectId = searchParams.get("projectId");
    const categoryId = searchParams.get("categoryId");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Build the query conditions for current active list
    const andConditions: any[] = [{ userId: user.id }];

    if (projectId) {
      andConditions.push({ projectId });
    }

    if (categoryId) {
      andConditions.push({ categoryId });
    }

    if (priority) {
      andConditions.push({ priority });
    }

    // Comprehensive text search (Title, Description, Category Name, Project Name)
    if (search && search.trim()) {
      const q = search.trim();
      andConditions.push({
        OR: [
          { title: { contains: q } },
          { description: { contains: q } },
          { category: { name: { contains: q } } },
          { project: { name: { contains: q } } },
        ],
      });
    }

    // Apply view logic
    if (filter === "completed") {
      andConditions.push({ status: "COMPLETED" });
    } else if (filter === "today") {
      andConditions.push(
        { status: { not: "COMPLETED" } },
        { dueDate: { gte: startOfToday, lte: endOfToday } }
      );
    } else if (filter === "upcoming") {
      andConditions.push(
        { status: { not: "COMPLETED" } },
        { dueDate: { gt: endOfToday } }
      );
    } else {
      // "all" / "inbox" view: all active tasks
      andConditions.push({ status: { notIn: ["COMPLETED", "ARCHIVED"] } });
    }

    const where = { AND: andConditions };

    // Fetch tasks matching the current view and filters
    const tasks = await db.task.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, color: true } },
        category: { select: { id: true, name: true, color: true } },
        subtasks: { orderBy: { position: "asc" } },
      },
      orderBy: [
        { status: "asc" },
        { dueDate: "asc" },
        { createdAt: "desc" },
      ],
    });

    // Real dynamic task counts for the unified TASKS section
    const [allCount, todayCount, upcomingCount, completedCount] = await Promise.all([
      db.task.count({
        where: {
          userId: user.id,
          status: { notIn: ["COMPLETED", "ARCHIVED"] },
        },
      }),
      db.task.count({
        where: {
          userId: user.id,
          status: { not: "COMPLETED" },
          dueDate: { gte: startOfToday, lte: endOfToday },
        },
      }),
      db.task.count({
        where: {
          userId: user.id,
          status: { not: "COMPLETED" },
          dueDate: { gt: endOfToday },
        },
      }),
      db.task.count({
        where: {
          userId: user.id,
          status: "COMPLETED",
        },
      }),
    ]);

    return NextResponse.json({
      tasks,
      counts: {
        all: allCount,
        today: todayCount,
        upcoming: upcomingCount,
        completed: completedCount,
      },
    });
  } catch (error) {
    if (isPrerenderBailoutError(error)) {
      throw error;
    }
    console.error("Task list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = TaskCreateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { title, description, priority, dueDate, dueTime, projectId, categoryId } = validated.data;

    if (projectId) {
      const proj = await db.project.findFirst({ where: { id: projectId, userId: user.id } });
      if (!proj) return NextResponse.json({ error: "Invalid project" }, { status: 400 });
    }

    if (categoryId) {
      const cat = await db.category.findFirst({ where: { id: categoryId, userId: user.id } });
      if (!cat) return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    const task = await db.task.create({
      data: {
        userId: user.id,
        title,
        description,
        priority: priority || "NONE",
        status: "TODO",
        dueDate: dueDate ? new Date(dueDate) : null,
        dueTime,
        projectId,
        categoryId,
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
        action: "CREATED",
        details: JSON.stringify({ title: task.title }),
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("Task creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
