"use client";

import React, { useState } from "react";
import { X, Calendar, Flag, Folder, Tag, Plus, Trash2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
}

interface TaskDetailsDrawerProps {
  task: any | null;
  projects: any[];
  categories: any[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAddSubtask: (taskId: string, title: string) => Promise<void>;
  onToggleSubtask: (subtaskId: string, isCompleted: boolean) => Promise<void>;
  onDeleteSubtask: (subtaskId: string) => Promise<void>;
}

export function TaskDetailsDrawer({
  task,
  projects,
  categories,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}: TaskDetailsDrawerProps) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !task) return null;

  const handleSubtaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    await onAddSubtask(task.id, newSubtaskTitle.trim());
    setNewSubtaskTitle("");
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[460px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 flex flex-col transition-transform duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Task Details
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={async () => {
              if (confirm("Are you sure you want to delete this task?")) {
                setIsDeleting(true);
                await onDelete(task.id);
                setIsDeleting(false);
                onClose();
              }
            }}
            disabled={isDeleting}
            className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Delete task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Title Input */}
        <div>
          <input
            type="text"
            defaultValue={task.title}
            onBlur={(e) => {
              if (e.target.value !== task.title && e.target.value.trim()) {
                onUpdate(task.id, { title: e.target.value.trim() });
              }
            }}
            className="w-full text-lg font-semibold bg-transparent border-0 focus:ring-0 p-0 text-slate-900 dark:text-slate-50 placeholder-slate-400"
            placeholder="Task title"
          />
        </div>

        {/* Status & Priority Row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 block">Priority</label>
            <select
              value={task.priority}
              onChange={(e) => onUpdate(task.id, { priority: e.target.value })}
              className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200"
            >
              <option value="NONE">No Priority</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 block">Status</label>
            <select
              value={task.status}
              onChange={(e) => onUpdate(task.id, { status: e.target.value })}
              className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200"
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>

        {/* Project & Category Row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 block">Project</label>
            <select
              value={task.projectId || ""}
              onChange={(e) => onUpdate(task.id, { projectId: e.target.value || null })}
              className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200"
            >
              <option value="">No Project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 block">Category</label>
            <select
              value={task.categoryId || ""}
              onChange={(e) => onUpdate(task.id, { categoryId: e.target.value || null })}
              className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200"
            >
              <option value="">No Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Due Date & Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 block">Due Date</label>
            <input
              type="date"
              defaultValue={task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""}
              onChange={(e) => onUpdate(task.id, { dueDate: e.target.value || null })}
              className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 block">Due Time</label>
            <input
              type="time"
              defaultValue={task.dueTime || ""}
              onBlur={(e) => onUpdate(task.id, { dueTime: e.target.value || null })}
              className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1.5 block">Notes / Description</label>
          <textarea
            rows={4}
            defaultValue={task.description || ""}
            onBlur={(e) => {
              if (e.target.value !== (task.description || "")) {
                onUpdate(task.id, { description: e.target.value });
              }
            }}
            placeholder="Add detailed markdown notes, links, or instructions..."
            className="w-full text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Subtasks Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Subtasks
            </span>
          </div>

          <div className="space-y-1.5 mb-3">
            {task.subtasks?.map((subtask: Subtask) => (
              <div
                key={subtask.id}
                className="flex items-center justify-between gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-xs"
              >
                <button
                  type="button"
                  onClick={() => onToggleSubtask(subtask.id, !subtask.isCompleted)}
                  className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                    subtask.isCompleted
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : "border-slate-300 dark:border-slate-600"
                  )}
                >
                  {subtask.isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                </button>
                <span
                  className={cn(
                    "flex-1 text-slate-700 dark:text-slate-300",
                    subtask.isCompleted && "line-through text-slate-400"
                  )}
                >
                  {subtask.title}
                </span>
                <button
                  type="button"
                  onClick={() => onDeleteSubtask(subtask.id)}
                  className="text-slate-400 hover:text-red-500 p-0.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubtaskSubmit} className="flex gap-2">
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              placeholder="Add a step..."
              className="flex-1 text-xs bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shrink-0 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

