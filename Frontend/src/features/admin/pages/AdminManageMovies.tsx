import React from "react";
import AdminSidebar from "../component/AdminSidebar";
import AdminMovieTable from "../component/AdminMovieTable";

import { apiClient } from "../../../shared/lib/apiClient";
import { useMovies } from "../../movies/hooks/useMovies";
import { useQueryClient } from "@tanstack/react-query";



const AdminManageMovies:React.FC = () => {

  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useMovies();
  const movies = data?.movies || [];

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/movies/delete/${id}`);
      queryClient.invalidateQueries({ queryKey: ['movies'] });
    } catch (error) {
      console.log("Failed to delete movie:", error);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#09090f]">
      <AdminSidebar />

      <main className="ml-[260px] flex-1 px-10 py-12 w-full">
        <h1 className="text-3xl font-bold text-white mb-1.5">Manage Movies</h1>
        <p className="text-sm text-slate-400 mb-9">
          View, manage, and remove movies from the database.
        </p>

        {isLoading ? (
          <div className="text-violet-400 mt-10">Loading movies...</div>
        ) : isError ? (
          <div className="text-red-400 mt-10">Failed to load movies.</div>
        ) : (
          <AdminMovieTable movies={movies} onDelete={handleDelete} />
        )}
      </main>
    </div>
  );
};

export default AdminManageMovies;