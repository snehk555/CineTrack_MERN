import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const twoFASchema = z.object({
  code: z
    .string()
    .length(6, 'Code must be exactly 6 digits')
    .regex(/^\d+$/, 'Only digits allowed'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type TwoFAFormData = z.infer<typeof twoFASchema>;
