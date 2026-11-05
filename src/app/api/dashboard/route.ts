import { NextResponse } from "next/server";
import { getCurrentUser, isPrerenderBailoutError } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Seven days ago for productivity rate
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const [
      activeTasksCount,
      todayTasksCount,
      upcomingTasksCount,
      completedTasksCount,
      overdueTasksCount,
      completedPastWeekCount,
      todayTasks,
      upcomingTasks,
      projectsSummary,
    ] = await Promise.all([
      // Total active
      db.task.count({
        where: {
          userId: user.id,
          status: { notIn: ["COMPLETED", "ARCHIVED"] },
        },
      }),
      // Today
      db.task.count({
        where: {
          userId: user.id,
          status: { not: "COMPLETED" },
          dueDate: { gte: startOfToday, lte: endOfToday },
        },
      }),
      // Upcoming
      db.task.count({
        where: {
          userId: user.id,
          status: { not: "COMPLETED" },
          dueDate: { gt: endOfToday },
        },
      }),
      // Completed all time
      db.task.count({
        where: {
          userId: user.id,
          status: "COMPLETED",
        },
      }),
      // Overdue
      db.task.count({
        where: {
          userId: user.id,
          status: { not: "COMPLETED" },
          dueDate: { lt: startOfToday },
        },
      }),
      // Completed past 7 days
      db.task.count({
        where: {
          userId: user.id,
          status: "COMPLETED",
          completedAt: { gte: sevenDaysAgo },
        },
      }),
      // Preview: Today's tasks (up to 5)
      db.task.findMany({
        where: {
          userId: user.id,
          status: { not: "COMPLETED" },
          dueDate: { gte: startOfToday, lte: endOfToday },
        },
        include: {
          project: { select: { id: true, name: true, color: true } },
          category: { select: { id: true, name: true, color: true } },
          subtasks: true,
        },
        orderBy: { priority: "desc" },
        take: 5,
      }),
      // Preview: Upcoming tasks (up to 5)
      db.task.findMany({
        where: {
          userId: user.id,
          status: { not: "COMPLETED" },
          dueDate: { gt: endOfToday },
        },
        include: {
          project: { select: { id: true, name: true, color: true } },
          category: { select: { id: true, name: true, color: true } },
        },
        orderBy: { dueDate: "asc" },
        take: 5,
      }),
      // Active Projects with task progress
      db.project.findMany({
        where: { userId: user.id, isArchived: false },
        include: {
          tasks: {
            select: { status: true },
          },
        },
        take: 4,
      }),
    ]);

    const totalTasksTracked = activeTasksCount + completedTasksCount;
    const completionRate =
      totalTasksTracked > 0
        ? Math.round((completedTasksCount / totalTasksTracked) * 100)
        : 0;

    return NextResponse.json({
      metrics: {
        active: activeTasksCount,
        today: todayTasksCount,
        upcoming: upcomingTasksCount,
        completed: completedTasksCount,
        overdue: overdueTasksCount,
        completedThisWeek: completedPastWeekCount,
        completionRate,
      },
      todayTasks,
      upcomingTasks,
      projects: projectsSummary.map((p) => {
        const total = p.tasks.length;
        const done = p.tasks.filter((t) => t.status === "COMPLETED").length;
        return {
          id: p.id,
          name: p.name,
          color: p.color,
          total,
          completed: done,
          percentage: total > 0 ? Math.round((done / total) * 100) : 0,
        };
      }),
    });
  } catch (error) {
    if (isPrerenderBailoutError(error)) {
      throw error;
    }
    console.error("Dashboard metrics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

