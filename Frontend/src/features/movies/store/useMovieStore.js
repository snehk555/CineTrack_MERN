
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

 export const watchListStore = create((set) => ({
   
       userWatchlist : [],
       cardError: { movieId: null, message: null }, // for showing error 
       addtoWatchlist :  async (movieId) => {
         
        set({ cardError: { movieId: null, message: null } });
         
       try { const response =  await  fetch('http://localhost:8000/api/user/addtowatchlist', {
                   method: "POST",
                   body: JSON.stringify({movieId}),
                   headers: { "Content-Type": "application/json"},
                   credentials: "include"

                }); 

                const data = await response.json();

                if(response.ok){
                   set((state) => ({
                       userWatchlist: [...state.userWatchlist, data.WatchingListing],
                       cardError: { movieId: null, message: null }
                   }))
                }
                else{
                  // if moive already exist or backend error then , a timeout also 
                  set({ cardError: { movieId: movieId, message: data.message }})
                  setTimeout(() => set({ cardError: { movieId: null, message: null } }), 3000)
                }
} 
catch(error) {
    set({ cardError: { movieId: movieId, message: "Network error!" } })
    setTimeout(() => set({ cardError: { movieId: null, message: null } }), 3000)
}

       },


   fetchUserWatchlist : async () => {
               
      set({error: null});
      try{
            const response = await fetch('http://localhost:8000/api/user/getuserwatchlist', {
                  credentials: "include"
            })

            const data = await response.json();
            
            if(response.ok){
                 set({userWatchlist: data.watchlist})
            }
            else{
                set({error: data.message || "Failed to load watchlist"})
            }
            
            }

            catch(error){
                 set({error: "Network error while loading watchlist."})
            }
       }
}))
