"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CheckSquare,
  Calendar,
  Clock,
  CheckCircle2,
  Inbox,
  LogOut,
  Plus,
  Tag,
  Settings,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  selectedProjectId: string | null;
  onProjectChange: (id: string | null) => void;
  selectedCategoryId: string | null;
  onCategoryChange: (id: string | null) => void;
  projects: Array<{ id: string; name: string; color: string | null; _count?: { tasks: number } }>;
  categories: Array<{ id: string; name: string; color: string | null; _count?: { tasks: number } }>;
  taskCounts: {
    all: number;
    today: number;
    upcoming: number;
    completed: number;
  };
  onOpenQuickAdd: () => void;
  onOpenNewProject: () => void;
  onOpenNewCategory: () => void;
  user: { name: string | null; email: string };
  onLogout: () => void;
}

export function Sidebar({
  currentView,
  onViewChange,
  selectedProjectId,
  onProjectChange,
  selectedCategoryId,
  onCategoryChange,
  projects,
  categories,
  taskCounts,
  onOpenQuickAdd,
  onOpenNewProject,
  onOpenNewCategory,
  user,
  onLogout,
}: SidebarProps) {
  const pathname = usePathname();
  const { resolvedTheme, toggleTheme } = useTheme();

  const isDashboardActive = pathname === "/dashboard" || currentView === "dashboard";
  const isSettingsActive = pathname === "/settings" || pathname === "/profile";

  const taskFilterItems = [
    { id: "all", label: "All Tasks", icon: Inbox, count: taskCounts.all },
    { id: "today", label: "Today", icon: Calendar, count: taskCounts.today },
    { id: "upcoming", label: "Upcoming", icon: Clock, count: taskCounts.upcoming },
    { id: "completed", label: "Completed", icon: CheckCircle2, count: taskCounts.completed },
  ];

  const initials = (user.name || user.email || "U")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-screen select-none shrink-0 transition-colors">
      {/* Brand Header with Theme Toggle */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm font-semibold transition-transform group-hover:scale-105">
            <CheckSquare className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">
            PulseTask
          </span>
        </Link>

        {/* Quick Dark / Light Mode Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${resolvedTheme === "dark" ? "Light" : "Dark"} Mode`}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-xs"
          title={`Switch to ${resolvedTheme === "dark" ? "Light" : "Dark"} Mode`}
        >
          {resolvedTheme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>
      </div>

      {/* Quick Add Action Button */}
      <div className="p-3">
        <button
          onClick={onOpenQuickAdd}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
          <kbd className="ml-auto text-[10px] bg-blue-500/50 text-blue-100 px-1.5 py-0.5 rounded font-mono">
            Q
          </kbd>
        </button>
      </div>

      {/* Main Unified Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
        {/* ONE UNIFIED TASKS SECTION */}
        <div>
          <div className="px-3 mb-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
            TASKS
          </div>
          <div className="space-y-0.5">
            {taskFilterItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                !selectedProjectId && !selectedCategoryId && currentView === item.id && pathname.startsWith("/tasks");
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onProjectChange(null);
                    onCategoryChange(null);
                    onViewChange(item.id);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left cursor-pointer",
                    isActive
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs border border-slate-200 dark:border-slate-700/60"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.count > 0 && (
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-mono",
                        isActive
                          ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                          : "text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80"
                      )}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* PROJECTS SECTION */}
        <div>
          <div className="flex items-center justify-between px-3 mb-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
            <span>PROJECTS</span>
            <button
              onClick={onOpenNewProject}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
              title="Add Project"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-0.5">
            {projects.map((project) => {
              const isActive = selectedProjectId === project.id;
              return (
                <button
                  key={project.id}
                  onClick={() => {
                    onCategoryChange(null);
                    onProjectChange(project.id);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm text-left transition-colors cursor-pointer",
                    isActive
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
                  )}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: project.color || "#3b82f6" }}
                    />
                    <span className="truncate">{project.name}</span>
                  </div>
                  {project._count && project._count.tasks > 0 && (
                    <span className="text-xs text-slate-400 font-mono">
                      {project._count.tasks}
                    </span>
                  )}
                </button>
              );
            })}
            {projects.length === 0 && (
              <p className="px-3 py-1 text-xs text-slate-400 italic">No projects yet</p>
            )}
          </div>
        </div>

        {/* CATEGORIES SECTION */}
        <div>
          <div className="flex items-center justify-between px-3 mb-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
            <span>CATEGORIES</span>
            <button
              onClick={onOpenNewCategory}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
              title="Add Category"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-0.5">
            {categories.map((cat) => {
              const isActive = selectedCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    onProjectChange(null);
                    onCategoryChange(cat.id);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm text-left transition-colors cursor-pointer",
                    isActive
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
                  )}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Tag className="w-3.5 h-3.5 shrink-0" style={{ color: cat.color || "#64748b" }} />
                    <span className="truncate">{cat.name}</span>
                  </div>
                  {cat._count && cat._count.tasks > 0 && (
                    <span className="text-xs text-slate-400 font-mono">
                      {cat._count.tasks}
                    </span>
                  )}
                </button>
              );
            })}
            {categories.length === 0 && (
              <p className="px-3 py-1 text-xs text-slate-400 italic">No categories yet</p>
            )}
          </div>
        </div>
      </nav>

      {/* ACCOUNT & NAVIGATION SECTION */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/60">
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-3 px-2.5 py-2 mb-2 rounded-xl transition-all cursor-pointer group",
            isDashboardActive
              ? "bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 shadow-xs"
              : "bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 text-slate-800 dark:text-slate-200 hover:shadow-xs"
          )}
          title="Open Dashboard"
        >
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-semibold text-xs flex items-center justify-center shrink-0 shadow-xs">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {user.name || "Productivity User"}
              </p>
              {isDashboardActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              )}
            </div>
            <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
          </div>
        </Link>

        {/* Actions Row */}
        <div className="space-y-0.5">
          <Link
            href="/settings"
            className={cn(
              "w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors",
              isSettingsActive
                ? "bg-slate-200/80 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
            )}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings & Profile</span>
          </Link>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
