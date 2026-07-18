declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: 'user' | 'admin' | 'moderator' | 'premium';
        username: string;
      };
      cachedData?: unknown;
    }
  }
}

export {};
