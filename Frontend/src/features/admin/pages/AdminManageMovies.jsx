import AdminSidebar from "../component/AdminSidebar";
import AdminMovieTable from "../component/AdminMovieTable";
import useMovieStore from "../../movies/store/useMovieStore";

const AdminManageMovies = () => {
  const { movies, setMovies } = useMovieStore();

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:8000/api/movies/delete/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        setMovies(movies.filter((movie) => movie._id !== id));
      }
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

        <AdminMovieTable movies={movies} onDelete={handleDelete} />
      </main>
    </div>
  );
};

export default AdminManageMovies;