import {useEffect} from 'react';

import {
    Routes,
    Route,
    Navigate,
    useLocation
} from 'react-router-dom';
import HomePage from '../pages/HomePage.jsx';
import MoviesPage from '../features/movies/pages/MoviesPage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';
import MovieDetailPage from '../features/movies/pages/MovieDetailPage.jsx';

import LoginPage from '../features/auth/pages/LoginPage.jsx';
import SignupPage from '../features/auth/pages/SignupPage.jsx';
import useAuthStore from '../features/auth/store/useAuthStore.js';
import AdminDashboard from '../features/admin/pages/AdminDashboard.jsx';
import AdminLoginPage from '../features/admin/pages/AdminLoginPage.jsx';
import AdminAddMovie from '../features/admin/pages/AdminAddMovie.jsx';
import AdminManageMovies from '../features/admin/pages/AdminManageMovies.jsx';
import Header from '../shared/ui/Header.js';


const App = () => {

    const {user, checkAuth, isCheckingAuth} = useAuthStore();

    useEffect(() => {
        checkAuth();
    }, []);

     const location = useLocation();
    const isAdminRoute = location.pathname.startsWith('/admin');

    if (isCheckingAuth && !user) {
        return (
            <div className="flex justify-center items-center h-screen text-white">
                <h2>Loading CineTrack...🍿</h2>
            </div>
        )
    }


   

    if (isAdminRoute) {
        return (
            <Routes> {/* 1. Main Admin Dashboard */}
                <Route path='/admin'
                    element={
                        !user ? <Navigate to="/admin/login"/> : user.role === 'admin' ? <AdminDashboard/>: <Navigate to="/"/>}/>
                  

                    {/* 2.  Admin Login Page */}
                <Route path='/admin/login'
                    element={
                        !user ? <AdminLoginPage/>: user.role === 'admin' ? <Navigate to="/admin"/> : <Navigate to="/"/>}/>
                   


                <Route path='/admin/add-movie'
                    element={
                        !user ? <Navigate to="/admin/login"/> : user.role === 'admin' ? <AdminAddMovie/>: <Navigate to="/"/>}/>
                  

                <Route path='/admin/movies'
                    element={
                        !user ? <Navigate to="/admin/login"/> : user.role === 'admin' ? <AdminManageMovies/>: <Navigate to="/"/>}/>
                  
                  {/* 3. for wrong url 404 */}
                <Route path='*'
                    element={<NotFoundPage/>}/>
            </Routes>
        );
    }

    return (
        <div className="max-w-[1200px] mx-auto px-8 py-8">

            <Header/>

            <Routes>

                <Route path='/'
                    element={<HomePage/>}/>

                <Route path='/movies'
                    element={<MoviesPage/>}/>

                <Route path='/movies/:id'
                    element={<MovieDetailPage/>}/>
                <Route path='/login'
                    element={<LoginPage/>}/>
                <Route path='/signup'
                    element={<SignupPage/>}/>

                <Route path='*'
                    element={<NotFoundPage/>}/>

            </Routes>

        </div>
    );
}

export default App;
