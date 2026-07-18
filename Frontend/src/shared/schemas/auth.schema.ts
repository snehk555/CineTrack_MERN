// Compatibility shim — auth schemas moved to features/auth/schemas/authSchemas.ts
export { loginSchema, registerSchema } from '../../features/auth/schemas/authSchemas';
export type { LoginFormData, RegisterFormData } from '../../features/auth/schemas/authSchemas';

// Legacy alias
export { loginSchema as signupSchema } from '../../features/auth/schemas/authSchemas';
export type { RegisterFormData as SignupFormData } from '../../features/auth/schemas/authSchemas';
