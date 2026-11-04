"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  Folder,
  Layers,
  Sparkles,
} from "lucide-react";
import { Sidebar } from "@/components/shell/Sidebar";
import { QuickAddTaskModal } from "@/components/tasks/QuickAddTaskModal";
import { NewProjectModal } from "@/components/projects/NewProjectModal";
import { NewCategoryModal } from "@/components/categories/NewCategoryModal";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name: string | null; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const [metrics, setMetrics] = useState({
    active: 0,
    today: 0,
    upcoming: 0,
    completed: 0,
    overdue: 0,
    completedThisWeek: 0,
    completionRate: 0,
  });

  const [todayTasks, setTodayTasks] = useState<any[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isNewCategoryOpen, setIsNewCategoryOpen] = useState(false);

  // Authenticate & load personal dashboard
  useEffect(() => {
    fetch("/api/auth/login")
      .then((res) => res.json())
      .then((data) => {
        if (!data.user) {
          router.replace("/login");
        } else {
          setUser(data.user);
        }
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  const loadDashboardData = async () => {
    try {
      const [dashRes, projRes, catRes] = await Promise.all([
        fetch("/api/dashboard"),
        fetch("/api/projects"),
        fetch("/api/categories"),
      ]);

      const [dashData, projData, catData] = await Promise.all([
        dashRes.json(),
        projRes.json(),
        catRes.json(),
      ]);

      if (dashData.metrics) setMetrics(dashData.metrics);
      if (dashData.todayTasks) setTodayTasks(dashData.todayTasks);
      if (dashData.upcomingTasks) setUpcomingTasks(dashData.upcomingTasks);
      if (projData.projects) setProjects(projData.projects);
      if (catData.categories) setCategories(catData.categories);
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const handleToggleTask = async (taskId: string) => {
    try {
      await fetch(`/api/tasks/${taskId}/toggle`, { method: "POST" });
      loadDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/login", { method: "DELETE" });
    setUser(null);
    router.replace("/login");
  };

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  if (loading || !user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const displayName = user.name ? user.name.split(" ")[0] : "there";

  return (
    <div className="flex h-screen bg-white dark:bg-slate-950 overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar
        currentView="dashboard"
        onViewChange={(view) => router.push(`/tasks?filter=${view}`)}
        selectedProjectId={null}
        onProjectChange={(pid) => router.push(`/tasks?projectId=${pid}`)}
        selectedCategoryId={null}
        onCategoryChange={(cid) => router.push(`/tasks?categoryId=${cid}`)}
        projects={projects}
        categories={categories}
        taskCounts={{
          all: metrics.active,
          today: metrics.today,
          upcoming: metrics.upcoming,
          completed: metrics.completed,
        }}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
        onOpenNewProject={() => setIsNewProjectOpen(true)}
        onOpenNewCategory={() => setIsNewCategoryOpen(true)}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Personal Dashboard View */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50/50 dark:bg-slate-950 overflow-y-auto">
        <div className="max-w-5xl mx-auto w-full px-8 py-8 space-y-8">
          {/* Header & Personalized Greeting */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Personal Workspace</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {getGreeting()}, {displayName}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Here is your live productivity overview and agenda for today.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsQuickAddOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Task</span>
              </button>
              <Link
                href="/tasks"
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-lg transition-colors"
              >
                <span>Task Manager</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Metric KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/tasks?filter=today"
              className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs"
            >
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Due Today</span>
                <Calendar className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {metrics.today}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Scheduled for today</span>
            </Link>

            <Link
              href="/tasks?filter=upcoming"
              className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs"
            >
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Upcoming</span>
                <Clock className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {metrics.upcoming}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Future deadlines</span>
            </Link>

            <Link
              href="/tasks?filter=completed"
              className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs"
            >
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Completed</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {metrics.completed}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {metrics.completedThisWeek} completed this week
              </span>
            </Link>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Completion Rate</span>
                <TrendingUp className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {metrics.completionRate}%
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {metrics.active} active tasks total
              </span>
            </div>
          </div>

          {/* Two Columns: Today's Tasks & Upcoming Focus */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Today's Tasks Preview */}
            <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Today&apos;s Agenda
                  </h3>
                </div>
                <Link
                  href="/tasks?filter=today"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  View all
                </Link>
              </div>

              <div className="space-y-2">
                {todayTasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/40 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <button
                        onClick={() => handleToggleTask(t.id)}
                        className="w-4 h-4 rounded border border-slate-300 dark:border-slate-600 hover:border-emerald-500 shrink-0 cursor-pointer"
                      />
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {t.title}
                      </span>
                    </div>
                    {t.priority !== "NONE" && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {t.priority}
                      </span>
                    )}
                  </div>
                ))}

                {todayTasks.length === 0 && (
                  <p className="text-xs text-slate-400 italic py-4 text-center">
                    No tasks due today. Enjoy your day or plan ahead!
                  </p>
                )}
              </div>
            </div>

            {/* Upcoming Next Few Deadlines */}
            <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-500" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Upcoming Next
                  </h3>
                </div>
                <Link
                  href="/tasks?filter=upcoming"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  View all
                </Link>
              </div>

              <div className="space-y-2">
                {upcomingTasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/40 text-xs"
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                      {t.title}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(t.dueDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                ))}

                {upcomingTasks.length === 0 && (
                  <p className="text-xs text-slate-400 italic py-4 text-center">
                    No future upcoming tasks scheduled.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Quick Add Modal */}
      <QuickAddTaskModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        projects={projects}
        categories={categories}
        onTaskCreated={loadDashboardData}
      />

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
        onProjectCreated={loadDashboardData}
      />

      {/* New Category Modal */}
      <NewCategoryModal
        isOpen={isNewCategoryOpen}
        onClose={() => setIsNewCategoryOpen(false)}
        onCategoryCreated={loadDashboardData}
      />
    </div>
  );
}

