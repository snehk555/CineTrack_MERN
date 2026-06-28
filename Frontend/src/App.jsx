import {useEffect} from 'react';
import Header from './layouts/Header.jsx';
import {Routes, Route, useSearchParams} from 'react-router-dom';
import HomePage from './Pages/HomePage.jsx';
import MoviesPage from './features/movies/components/MoviesPage.jsx';
import NotFoundPage from './Pages/NotFoundPage.jsx';
import MovieDetailPage from './features/movies/components/MovieDetailPage.jsx';
import useMovieStore from './features/movies/store/useMovieStore.js';
import LoginPage from './features/auth/components/LoginPage.jsx';
import SignupPage from './features/auth/components/SignupPage.jsx';
import useAuthStore from './features/auth/store/useAuthStore.js';


const App = () => {

    const {setMovies} = useMovieStore();
    const {user, checkAuth, isCheckingAuth} = useAuthStore();

   const [searchParams ] = useSearchParams();
    const category = searchParams.get('category');
    const genre  = searchParams.get('genre')

    useEffect(() => {
        checkAuth();
    }, [])
    useEffect(() => {
        const fetchMovies = async () => {
            try {
                 let url = "http://localhost:8000/api/movies/all";
                
                const params = new URLSearchParams();
                if(category){
                     params.append("category", category)
                }
                if(genre){
                     params.append('genre',genre)
                }

                const queryString = params.toString();

                if(queryString){
                     url += `?${queryString}`
                }

                const response = await fetch(url, {credentials: 'include'});
                 
                if (! response.ok) {

                    throw new Error("Something went wrong!")

                }

                const data = await response.json();

                // console.log(data)
                setMovies(data.movies)
            } catch (error) {
                console.log("something went wrong!")
                setMovies([]);
            }

        };
        fetchMovies();
    }, [user])

    if (isCheckingAuth && !user) {
        return (
            <div style={
                {
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    color: 'white'
                }
            }>
                <h2>Loading CineTrack...🍿
                </h2>

            </div>
        )
    }


    return (
        <div className="app-container">

            <Header/>

            <Routes>


                <Route path='/'
                    element={<HomePage/>}/>

                <Route path='/movies'
                    element={<MoviesPage/>}/>

                <Route path='*'
                    element={<NotFoundPage/>}/>

                <Route path='/movies/:id'
                    element={<MovieDetailPage/>}/>
                <Route path='/login'
                    element={<LoginPage/>}/>
                <Route path='/signup'
                    element={<SignupPage/>}/>

            </Routes>

        </div>
    );
}

export default App;
