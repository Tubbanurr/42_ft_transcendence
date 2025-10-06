import { z } from 'zod';

export const UpdateUserSchema = z.object({
  display_name: z.string().min(2).max(50).optional(),
  email: z.string().email().max(255).optional(),
  password: z.string()
    .min(6)
    .max(100)
    .refine((p: string) => /[a-zA-Z]/.test(p) && /[0-9]/.test(p), "Password must contain at least one letter and one number")
    .optional(),
  avatar_url: z.string().max(500).optional().nullable()
});

export type UpdateUserData = z.infer<typeof UpdateUserSchema>;
