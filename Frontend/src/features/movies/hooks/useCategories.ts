import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../shared/lib/apiClient";

export interface Category {
    _id: string;
    name: string;
}

export const useCategories = () => {
     return useQuery<Category[]>({
           queryKey: ['categories'],
           queryFn: async () => {
             const response = await apiClient.get('/movies/category/get');
             return response.data   
           }
     })
}