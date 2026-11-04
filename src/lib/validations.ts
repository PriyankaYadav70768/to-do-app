import { z } from "zod";

export const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password must match").optional(),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const ProfileUpdateSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(50),
  avatarUrl: z.string().optional().nullable(),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export const TaskCreateSchema = z.object({
  title: z.string().trim().min(1, "Task title is required").max(255),
  description: z.string().max(5000).optional().nullable(),
  priority: z.enum(["NONE", "LOW", "MEDIUM", "HIGH", "URGENT"]).default("NONE"),
  status: z.enum(["TODO", "IN_PROGRESS", "COMPLETED", "ARCHIVED"]).default("TODO"),
  dueDate: z.string().optional().nullable(),
  dueTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)").optional().nullable(),
  projectId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
});

export const TaskUpdateSchema = TaskCreateSchema.partial().extend({
  completedAt: z.string().optional().nullable(),
  order: z.number().int().optional(),
});

export const SubtaskCreateSchema = z.object({
  title: z.string().trim().min(1, "Subtask title is required").max(255),
  position: z.number().int().default(0),
});

export const ProjectCreateSchema = z.object({
  name: z.string().trim().min(1, "Project name is required").max(100),
  description: z.string().max(1000).optional().nullable(),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color").default("#3b82f6"),
});

export const CategoryCreateSchema = z.object({
  name: z.string().trim().min(1, "Category name is required").max(50),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color").default("#64748b"),
});
