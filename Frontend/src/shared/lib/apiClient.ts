import axios  from "axios";
import { toast } from "sonner";

export const apiClient = axios.create({
     baseURL: `${import.meta.env.VITE_API_URL}/api`,
     withCredentials: true,
    headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const errorMessage = error.response?.data?.message || error.message || "Network Error: Something went wrong!";
         toast.error(errorMessage);
          return Promise.reject(error);
    }
)