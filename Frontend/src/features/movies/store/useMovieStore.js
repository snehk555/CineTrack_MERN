
import {create} from 'zustand'



// The 'create' function from Zustand is used to initialize our global store.
// The 'set' function is provided by Zustand to allow us to update the state.
const useMovieStore = create((set) => ({

        // 1. STATE: This array will hold our global list of movies.
        // This replaces the local `useState([])` we previously had in App.jsx.
        movies: [],
       

        // 2. ACTION: This function is called when we fetch the initial movie list from the backend.
        // It completely replaces the existing movies array with the newly fetched data.
        setMovies: (fetchMovies) => {
             set({
                movies: fetchMovies || []
             })
        },

        // 3. ACTION: This function is called from Header.jsx when a new movie is added.
        // It takes the existing state (...state.movies) and appends the new movie to the end of the array.
        addMovieToStore: (newMovie) => {
             set((state) => ({
                movies: [...state.movies, newMovie]
             }));
        }
}));

export default useMovieStore;
