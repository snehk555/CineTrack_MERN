import { useState } from "react";
import SearchBar from "../../movies/components/SearchBar";
import MovieFilters from "../../movies/components/MovieFilters";
import AdminSidebar from "../component/AdminSidebar";

const AdminAddMovie = () => {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [error, setError] = useState("");
  

  return (
     <div className="flex min-h-screen bg-[#09090f]">

      <AdminSidebar />

    <main className="ml-[260px] flex-1 px-10 py-12 w-full">
        <h1 className="text-3xl font-bold text-slate-100 mb-1.5">Add New Movie</h1>
        <p className="text-sm text-slate-400 mb-9">Search TMDB and add movies to your database.</p>

        {error && (
          <div className="bg-red-500/15 border border-red-500/40 text-red-300 px-5 py-3 rounded-xl text-sm font-medium mb-5"
               style={{animation: 'toastIn 0.4s ease'}}>
            ⚠️ {error}
          </div>
        )}

        <div className="flex gap-5 items-center flex-wrap">
          <MovieFilters
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedGenre={selectedGenre}
            setSelectedGenre={setSelectedGenre}
          />

          <SearchBar
            selectedCategory={selectedCategory}
            selectedGenre={selectedGenre}
            setError={setError}
            setSelectedCategory={setSelectedCategory} 
             setSelectedGenre={setSelectedGenre} 
          />
        </div>
      </main>
      </div>
  )
}

export default AdminAddMovie