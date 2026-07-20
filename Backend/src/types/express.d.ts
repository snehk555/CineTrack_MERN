declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      role: 'user' | 'admin' | 'super_admin' | 'moderator' | 'premium';
      username?: string;
      _id?: any;
    }
    interface Request {
      cachedData?: unknown;
    }
  }
}

export {};
