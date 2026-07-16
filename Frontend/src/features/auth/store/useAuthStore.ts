
import { create } from "zustand";
import { User } from "../../../shared/types/user";
import { apiClient } from "../../../shared/lib/apiClient";

interface AuthStore {
  user: User | null;
  isCheckingAuth: boolean;
  setUser: (user: User | null) => void;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

const useAuthStore = create<AuthStore>((set) => ({

    user: null,
    isCheckingAuth: true,

    setUser: (user) => set({ user }),

    checkAuth: async () => {
        try {
            const response = await apiClient.get('/auth/authCheck');
            set({ user: response.data.user, isCheckingAuth: false });
        } catch {
            set({ user: null, isCheckingAuth: false });
        }
    },

    logout: async () => {
        try {
            await apiClient.post('/auth/logout');
            set({ user: null });
        } catch (error) {
            console.log("logout failed", error);
        }
    }
}));

export default useAuthStore;