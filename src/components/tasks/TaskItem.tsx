"use client";

import React, { useState } from "react";
import { Check, Calendar, AlertCircle, ChevronRight } from "lucide-react";
import { cn, formatDueDate } from "@/lib/utils";

export interface TaskItemProps {
  task: {
    id: string;
    title: string;
    description?: string | null;
    status: string;
    priority: string;
    dueDate?: string | null;
    dueTime?: string | null;
    project?: { name: string; color: string | null } | null;
    category?: { name: string; color: string | null } | null;
    subtasks?: Array<{ id: string; isCompleted: boolean }>;
  };
  onToggleComplete: (id: string) => void;
  onSelect: (id: string) => void;
  isSelected?: boolean;
}

const PRIORITY_BADGES: Record<string, { label: string; class: string }> = {
  URGENT: { label: "Urgent", class: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400" },
  HIGH: { label: "High", class: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400" },
  MEDIUM: { label: "Medium", class: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400" },
  LOW: { label: "Low", class: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400" },
};

export function TaskItem({ task, onToggleComplete, onSelect, isSelected }: TaskItemProps) {
  const isCompleted = task.status === "COMPLETED";
  const [optimisticCompleted, setOptimisticCompleted] = useState(isCompleted);

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOptimisticCompleted(!optimisticCompleted);
    onToggleComplete(task.id);
  };

  const completedSubtasks = task.subtasks?.filter((s) => s.isCompleted).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const dueDateFormatted = formatDueDate(task.dueDate);

  return (
    <div
      onClick={() => onSelect(task.id)}
      className={cn(
        "group relative flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none",
        isSelected
          ? "border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 shadow-sm"
          : "border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs",
        optimisticCompleted && "opacity-60 bg-slate-50 dark:bg-slate-950/20"
      )}
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {/* Custom Accessible Checkbox */}
        <button
          type="button"
          aria-label={optimisticCompleted ? "Mark task incomplete" : "Mark task complete"}
          onClick={handleCheckboxClick}
          className={cn(
            "w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors",
            optimisticCompleted
              ? "bg-emerald-600 border-emerald-600 text-white"
              : "border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500"
          )}
        >
          {optimisticCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>

        {/* Task Title & Metadata */}
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-sm font-medium text-slate-800 dark:text-slate-100 truncate",
              optimisticCompleted && "line-through text-slate-400 dark:text-slate-500"
            )}
          >
            {task.title}
          </p>

          <div className="flex items-center gap-2.5 mt-1 text-xs text-slate-500">
            {/* Project Indicator */}
            {task.project && (
              <span className="flex items-center gap-1.5 font-medium">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: task.project.color || "#3b82f6" }}
                />
                <span className="text-slate-600 dark:text-slate-300 truncate max-w-[120px]">
                  {task.project.name}
                </span>
              </span>
            )}

            {/* Category */}
            {task.category && (
              <span className="text-slate-400 truncate max-w-[100px]">
                {task.category.name}
              </span>
            )}

            {/* Due Date */}
            {dueDateFormatted && (
              <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                <Calendar className="w-3 h-3" />
                <span>{dueDateFormatted}</span>
                {task.dueTime && <span>at {task.dueTime}</span>}
              </span>
            )}

            {/* Subtask Progress indicator */}
            {totalSubtasks > 0 && (
              <span className="text-slate-400 font-mono text-[11px]">
                {completedSubtasks}/{totalSubtasks}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Badges & Actions */}
      <div className="flex items-center gap-2 shrink-0 ml-3">
        {task.priority !== "NONE" && PRIORITY_BADGES[task.priority] && (
          <span
            className={cn(
              "text-[10px] font-semibold px-2 py-0.5 rounded-full",
              PRIORITY_BADGES[task.priority].class
            )}
          >
            {PRIORITY_BADGES[task.priority].label}
          </span>
        )}

        <ChevronRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}

