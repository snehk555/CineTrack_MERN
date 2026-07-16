import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import movieRoutes from './routes/movie.route.js'
import  CategoryRoute from './routes/category.route.js'
import GenreRoute from './routes/genre.route.js'
import authRoutes from './routes/auth.route.js';
import cookieParser from 'cookie-parser';
import  watchlistRoute from './routes/watchlist.route.js'


dotenv.config(); // this loads the secret of dataenv file 

connectDB();  // db connection happens here

const app = express();
app.use(cors({
    origin: "http://localhost:5173", // Frontend URL
    credentials: true                // Cookies allowed here 
}));

app.use(cookieParser())


app.use(express.json());
app.use("/api/movies", movieRoutes)
app.use("/api/movies/category", CategoryRoute )
app.use("/api/movies/genre", GenreRoute)
app.use("/api/auth", authRoutes)
app.use("/api/user",watchlistRoute )


app.listen(process.env.PORT,() => {
    console.log(`server is running on port ${process.env.PORT}`)
})