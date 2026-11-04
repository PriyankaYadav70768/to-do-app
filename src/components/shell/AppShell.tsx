"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/shell/Sidebar";
import { TaskItem } from "@/components/tasks/TaskItem";
import { TaskDetailsDrawer } from "@/components/tasks/TaskDetailsDrawer";
import { QuickAddTaskModal } from "@/components/tasks/QuickAddTaskModal";
import { NewProjectModal } from "@/components/projects/NewProjectModal";
import { NewCategoryModal } from "@/components/categories/NewCategoryModal";
import { Search, CheckCircle, Tag, Folder, X, RefreshCw } from "lucide-react";

interface AppShellProps {
  initialView?: string;
}

function AppShellSkeleton() {
  return (
    <div className="flex h-screen bg-white dark:bg-slate-950 overflow-hidden font-sans">
      <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col h-screen select-none shrink-0 p-4 space-y-4">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        </div>
        <div className="h-9 w-full bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
        <div className="space-y-2 pt-2">
          <div className="h-2 w-12 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-7 w-full bg-slate-200/60 dark:bg-slate-800/60 rounded-md animate-pulse" />
          <div className="h-7 w-full bg-slate-200/60 dark:bg-slate-800/60 rounded-md animate-pulse" />
          <div className="h-7 w-full bg-slate-200/60 dark:bg-slate-800/60 rounded-md animate-pulse" />
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-950 overflow-hidden">
        <header className="px-8 py-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
          <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <div className="h-8 w-64 bg-slate-100 dark:bg-slate-900 rounded-lg animate-pulse" />
        </header>
        <div className="flex-1 p-8">
          <div className="max-w-3xl mx-auto space-y-3">
            <div className="h-14 w-full bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-slate-200/60 dark:border-slate-800/60 animate-pulse" />
            <div className="h-14 w-full bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-slate-200/60 dark:border-slate-800/60 animate-pulse" />
          </div>
        </div>
      </main>
    </div>
  );
}

function AppShellContent({ initialView = "all" }: AppShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<{ id: string; name: string | null; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Unified canonical state
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [taskCounts, setTaskCounts] = useState({
    all: 0,
    today: 0,
    upcoming: 0,
    completed: 0,
  });

  // Active view filters
  const [currentView, setCurrentView] = useState(initialView);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Modals & Drawer
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activeTaskDetails, setActiveTaskDetails] = useState<any | null>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isNewCategoryOpen, setIsNewCategoryOpen] = useState(false);

  // Debounce search input (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Read URL query parameters safely
  useEffect(() => {
    const filterParam = searchParams.get("filter");
    const projectParam = searchParams.get("projectId");
    const categoryParam = searchParams.get("categoryId");
    const priorityParam = searchParams.get("priority");
    const searchParam = searchParams.get("search");

    if (filterParam && ["all", "today", "upcoming", "completed"].includes(filterParam)) {
      setCurrentView(filterParam);
    }
    if (projectParam !== null) setSelectedProjectId(projectParam || null);
    if (categoryParam !== null) setSelectedCategoryId(categoryParam || null);
    if (priorityParam !== null) setPriorityFilter(priorityParam || "");
    if (searchParam !== null) setSearchQuery(searchParam || "");
  }, [searchParams]);

  // Sync state to URL without full reloads
  const updateURL = useCallback(
    (view: string, projectId: string | null, categoryId: string | null, priority: string, search: string) => {
      const params = new URLSearchParams();
      if (view && view !== "all") params.set("filter", view);
      if (projectId) params.set("projectId", projectId);
      if (categoryId) params.set("categoryId", categoryId);
      if (priority) params.set("priority", priority);
      if (search.trim()) params.set("search", search.trim());

      const qs = params.toString();
      const newPath = qs ? `/tasks?${qs}` : "/tasks";
      router.replace(newPath);
    },
    [router]
  );

  // Authenticate Session
  useEffect(() => {
    fetch("/api/auth/login")
      .then((res) => res.json())
      .then((data) => {
        if (!data.user) {
          router.push("/login");
        } else {
          setUser(data.user);
        }
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  // Fetch unified task collection based on active view + project + category + priority + search
  const loadData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set("filter", currentView);
      if (selectedProjectId) params.set("projectId", selectedProjectId);
      if (selectedCategoryId) params.set("categoryId", selectedCategoryId);
      if (priorityFilter) params.set("priority", priorityFilter);
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());

      const [tRes, pRes, cRes] = await Promise.all([
        fetch(`/api/tasks?${params.toString()}`),
        fetch("/api/projects"),
        fetch("/api/categories"),
      ]);

      const [tData, pData, cData] = await Promise.all([tRes.json(), pRes.json(), cRes.json()]);

      if (tData.tasks) setTasks(tData.tasks);
      if (tData.counts) setTaskCounts(tData.counts);
      if (pData.projects) setProjects(pData.projects);
      if (cData.categories) setCategories(cData.categories);
    } catch (err) {
      console.error(err);
    }
  }, [currentView, selectedProjectId, selectedCategoryId, priorityFilter, debouncedSearch]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  // Load detailed single task for drawer
  useEffect(() => {
    if (activeTaskId) {
      fetch(`/api/tasks/${activeTaskId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.task) setActiveTaskDetails(data.task);
        });
    } else {
      setActiveTaskDetails(null);
    }
  }, [activeTaskId]);

  // Keyboard shortcut: Press "q" to open Quick Add
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "q" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setIsQuickAddOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleToggleComplete = async (taskId: string) => {
    try {
      await fetch(`/api/tasks/${taskId}/toggle`, { method: "POST" });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTask = async (taskId: string, updates: any) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const { task } = await res.json();
        setActiveTaskDetails(task);
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      setActiveTaskId(null);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSubtask = async (taskId: string, title: string) => {
    try {
      await fetch(`/api/tasks/${taskId}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const res = await fetch(`/api/tasks/${taskId}`);
      const data = await res.json();
      if (data.task) setActiveTaskDetails(data.task);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSubtask = async (subtaskId: string, isCompleted: boolean) => {
    try {
      await fetch(`/api/subtasks/${subtaskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted }),
      });
      if (activeTaskId) {
        const res = await fetch(`/api/tasks/${activeTaskId}`);
        const data = await res.json();
        if (data.task) setActiveTaskDetails(data.task);
      }
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      await fetch(`/api/subtasks/${subtaskId}`, { method: "DELETE" });
      if (activeTaskId) {
        const res = await fetch(`/api/tasks/${activeTaskId}`);
        const data = await res.json();
        if (data.task) setActiveTaskDetails(data.task);
      }
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/login", { method: "DELETE" });
      setUser(null);
      router.replace("/login");
    } catch (err) {
      console.error(err);
      router.replace("/login");
    }
  };

  const handleClearAllFilters = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setSelectedProjectId(null);
    setSelectedCategoryId(null);
    setPriorityFilter("");
    updateURL(currentView, null, null, "", "");
  };

  if (loading || !user) {
    return <AppShellSkeleton />;
  }

  // Active filter indicators
  const activeProject = projects.find((p) => p.id === selectedProjectId);
  const activeCategory = categories.find((c) => c.id === selectedCategoryId);
  const hasActiveFilters = Boolean(
    selectedProjectId || selectedCategoryId || priorityFilter || debouncedSearch
  );

  let viewTitle = "All Tasks";
  if (selectedProjectId) {
    viewTitle = activeProject ? activeProject.name : "Project Tasks";
  } else if (selectedCategoryId) {
    viewTitle = activeCategory ? activeCategory.name : "Category Tasks";
  } else {
    if (currentView === "today") viewTitle = "Today";
    else if (currentView === "upcoming") viewTitle = "Upcoming";
    else if (currentView === "completed") viewTitle = "Completed";
  }

  return (
    <div className="flex h-screen bg-white dark:bg-slate-950 overflow-hidden font-sans">
      {/* Unified Sidebar */}
      <Sidebar
        currentView={currentView}
        onViewChange={(v) => {
          setCurrentView(v);
          updateURL(v, selectedProjectId, selectedCategoryId, priorityFilter, debouncedSearch);
        }}
        selectedProjectId={selectedProjectId}
        onProjectChange={(pid) => {
          setSelectedProjectId(pid);
          updateURL(currentView, pid, selectedCategoryId, priorityFilter, debouncedSearch);
        }}
        selectedCategoryId={selectedCategoryId}
        onCategoryChange={(cid) => {
          setSelectedCategoryId(cid);
          updateURL(currentView, selectedProjectId, cid, priorityFilter, debouncedSearch);
        }}
        projects={projects}
        categories={categories}
        taskCounts={taskCounts}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
        onOpenNewProject={() => setIsNewProjectOpen(true)}
        onOpenNewCategory={() => setIsNewCategoryOpen(true)}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Task View Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-950 overflow-hidden">
        {/* Top Filter and Search Bar */}
        <header className="px-8 py-3.5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              {selectedProjectId && <Folder className="w-4 h-4 text-blue-500" />}
              {selectedCategoryId && <Tag className="w-4 h-4 text-amber-500" />}
              <span>{viewTitle}</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input with Debounce & Clear Button */}
            <div className="relative w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  updateURL(currentView, selectedProjectId, selectedCategoryId, priorityFilter, e.target.value);
                }}
                placeholder="Search tasks, notes, or tags..."
                className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-7 py-2 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setDebouncedSearch("");
                    updateURL(currentView, selectedProjectId, selectedCategoryId, priorityFilter, "");
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                updateURL(currentView, selectedProjectId, selectedCategoryId, e.target.value, debouncedSearch);
              }}
              className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </header>

        {/* Active Filter Pills Bar */}
        {hasActiveFilters && (
          <div className="px-8 py-2.5 bg-slate-50/60 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-2 flex-wrap text-xs">
            <span className="text-slate-400 font-medium mr-1">Active filters:</span>

            {debouncedSearch && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <span>&quot;{debouncedSearch}&quot;</span>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setDebouncedSearch("");
                    updateURL(currentView, selectedProjectId, selectedCategoryId, priorityFilter, "");
                  }}
                >
                  <X className="w-3 h-3 hover:text-blue-900" />
                </button>
              </span>
            )}

            {activeCategory && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                <Tag className="w-3 h-3" />
                <span>{activeCategory.name}</span>
                <button
                  onClick={() => {
                    setSelectedCategoryId(null);
                    updateURL(currentView, selectedProjectId, null, priorityFilter, debouncedSearch);
                  }}
                >
                  <X className="w-3 h-3 hover:text-amber-900" />
                </button>
              </span>
            )}

            {activeProject && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                <Folder className="w-3 h-3" />
                <span>{activeProject.name}</span>
                <button
                  onClick={() => {
                    setSelectedProjectId(null);
                    updateURL(currentView, null, selectedCategoryId, priorityFilter, debouncedSearch);
                  }}
                >
                  <X className="w-3 h-3 hover:text-purple-900" />
                </button>
              </span>
            )}

            {priorityFilter && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                <span>Priority: {priorityFilter}</span>
                <button
                  onClick={() => {
                    setPriorityFilter("");
                    updateURL(currentView, selectedProjectId, selectedCategoryId, "", debouncedSearch);
                  }}
                >
                  <X className="w-3 h-3 hover:text-rose-900" />
                </button>
              </span>
            )}

            <button
              onClick={handleClearAllFilters}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline ml-2 cursor-pointer"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Unified Task Feed */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-3xl mx-auto space-y-2.5">
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                isSelected={activeTaskId === task.id}
                onSelect={(id) => setActiveTaskId(id)}
                onToggleComplete={handleToggleComplete}
              />
            ))}

            {tasks.length === 0 && (
              <div className="text-center py-20">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {hasActiveFilters ? "No matching tasks" : "No tasks found"}
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {hasActiveFilters
                    ? "Try adjusting your search query or clearing active filters."
                    : currentView === "completed"
                    ? "Completed tasks will show up here."
                    : "No active tasks in this view. Press Q to add one."}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={handleClearAllFilters}
                    className="mt-3 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Task Details Drawer */}
      <TaskDetailsDrawer
        task={activeTaskDetails}
        projects={projects}
        categories={categories}
        isOpen={Boolean(activeTaskId)}
        onClose={() => setActiveTaskId(null)}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
        onAddSubtask={handleAddSubtask}
        onToggleSubtask={handleToggleSubtask}
        onDeleteSubtask={handleDeleteSubtask}
      />

      {/* Quick Add Modal */}
      <QuickAddTaskModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        projects={projects}
        categories={categories}
        onTaskCreated={loadData}
      />

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
        onProjectCreated={loadData}
      />

      {/* New Category Modal */}
      <NewCategoryModal
        isOpen={isNewCategoryOpen}
        onClose={() => setIsNewCategoryOpen(false)}
        onCategoryCreated={loadData}
      />
    </div>
  );
}

export default function AppShell(props: AppShellProps) {
  return (
    <Suspense fallback={<AppShellSkeleton />}>
      <AppShellContent {...props} />
    </Suspense>
  );
}
