import { z } from 'zod';

export const RegisterSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers and underscore allowed"),
  email: z.string()
    .email("Please enter a valid email address")
    .max(255, "Email address too long"),
  password: z.string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password too long")
    .refine(p => /[a-zA-Z]/.test(p) && /[0-9]/.test(p), "Password must contain at least one letter and one number"),
  displayName: z.string()
    .min(2, "Display name must be at least 2 characters")
    .max(50, "Display name must be at most 50 characters")
    .optional()
});

export type RegisterData = z.infer<typeof RegisterSchema>;
