import { z } from 'zod';

export const LoginSchema = z.object({
  username: z.string()
    .min(1, "Username or email cannot be empty")
    .max(100, "Username or email too long"),
  password: z.string()
    .min(1, "Password cannot be empty")
    .max(100, "Password too long")
});

export type LoginData = z.infer<typeof LoginSchema>;
