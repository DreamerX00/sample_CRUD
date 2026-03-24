import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Name is too short."),
  email: z.email("Enter a valid email.").transform((value) => value.toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const loginSchema = signupSchema.pick({
  email: true,
  password: true,
});

export const taskSchema = z.object({
  title: z.string().trim().min(2, "Title is too short."),
  description: z.string().trim().default(""),
  status: z.enum(["planned", "in_progress", "done"]).default("planned"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueDate: z.string().nullable().optional(),
});

export const shareSchema = z.object({
  email: z.email("Enter a valid teammate email.").transform((value) => value.toLowerCase()),
  permission: z.enum(["view", "edit"]).default("view"),
});
