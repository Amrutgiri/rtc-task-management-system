import { z } from "zod";

// Task Schemas
export const createTaskSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().optional(),
    projectId: z.string().min(1, "Project is required"),
    priority: z.enum(["low", "medium", "high"], {
        errorMap: () => ({ message: "Priority must be low, medium, or high" }),
    }),
    status: z.enum(["open", "in-progress", "review", "completed"], {
        errorMap: () => ({ message: "Invalid status" }),
    }),
    taskDate: z.string().optional(),
    dueDate: z.string().optional(),
});

export const updateTaskSchema = createTaskSchema.partial();

// Project Schemas
export const createProjectSchema = z.object({
    name: z.string().min(3, "Project name must be at least 3 characters"),
    description: z.string().optional(),
    status: z.enum(["active", "on-hold", "completed"], {
        errorMap: () => ({ message: "Invalid status" }),
    }).optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

// Work Log Schema
export const createWorkLogSchema = z.object({
    taskId: z.string().min(1, "Task is required"),
    hours: z.number().min(0.5, "Hours must be at least 0.5").max(24, "Hours cannot exceed 24"),
    description: z.string().min(3, "Description must be at least 3 characters"),
    date: z.string().optional(),
});

// Comment Schema
export const createCommentSchema = z.object({
    content: z.string().min(1, "Comment cannot be empty").max(1000, "Comment is too long"),
});
