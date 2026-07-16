import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-z]/, "Must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Must contain at least one uppercase letter")
  .regex(/[0-9]/, "Must contain at least one number")
  .regex(/[\W_]/, "Must contain at least one special character (!@#$%^&*)");

export const loginSchema = z.object({
  email: z.email("Invalid email format").min(1, "Email is required"),
  password: z.string().min(1, "Password is required"), 
});

export const signupSchema = z
  .object({
    username: z.string().min(3, "Username must be at least 3 characters").max(20, "Username is too long"),
    email: z.email("Invalid email format").min(1, "Email is required"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
