import Movie from "../models/movie.model.js";
import axios from "axios";

export const addMovie = async (req, res) => {
  try {
    // Step 1: Extract incoming data from the frontend request body
    // The frontend can either send a search string (searchName) OR a full movie object (movieDetails)
    // const searchName = req.body.searchName;
    // const movieDetails = req.body.movieDetails;

    const {searchName , movieDetails, category, genre } = req.body
    
    // This will hold the finalized movie object we intend to save to the database
    let finalMovieData;

    // checking for category validation 
    if(!category){
      return res.status(400).json({
         message: "category Id is required to add a movie!"
      })
    }

    // Step 2: Determine the source of the movie data

    // CASE A: The frontend sent the full movie details directly (e.g., user clicked an item in the search dropdown)
    // Robust Check: We ensure that movieDetails exists AND contains all required fields before proceeding.
    
    if (movieDetails && movieDetails.title && movieDetails.poster_path && movieDetails.release_date ) {
      finalMovieData = {
        title: movieDetails.title,
        poster: movieDetails.poster_path,
        year: movieDetails.release_date 
      };
    }
    // CASE B: The frontend only sent a search string (e.g., user typed a name and clicked the Add button)
    // We must fetch the missing details from the TMDB API ourselves
    else if (searchName) {
      const tmdbUrl = `https://api.themoviedb.org/3/search/movie?query=${searchName}&api_key=${process.env.TMDB_API_KEY}`;

      const response = await axios.get(tmdbUrl);

      // TMDB returns an array of results. We take the first match (index 0).
      const tmdMovie = response.data.results[0];

      // If the API found no matching movies, return a 404 error
      if (!tmdMovie) {
        return res.status(404).json({ message: "Movie not found on TMDB" });
      }

      finalMovieData = {
        title: tmdMovie.title,
        poster: tmdMovie.poster_path,
        year: tmdMovie.release_date
      };
    }
    // CASE C: The frontend sent neither (Invalid request)
    else {
      return res.status(400).json({ message: "Please provide either a search name or movie details." });
    }

    // Step 3: Save the finalized data to MongoDB
    const newMovie = new Movie({
      title: finalMovieData.title,
      poster: finalMovieData.poster,
      year: finalMovieData.year,
      category: category,
      genre: genre, 
      userId: req.user._id

    });

    await newMovie.save();

    // Step 4: Send a success response back to the frontend
    return res.status(201).json({
      message: "Movie successfully saved to database!",
      movie: newMovie
    });

  } catch (error) {
    // Catch and handle any server errors
    return res.status(500).json({
      error: error.message
    });
  }
}

export const getMovies = async (req, res) => {
  try {
    const filterQuery = {
         userId: req.user._id,
    }
    // for category in req.query
    if(req.query.category){
        filterQuery.category = req.query.category;
    }
    // for genre in req.query
    if(req.query.genre){
        filterQuery.genre = req.query.genre;
    }
    const movies = await Movie.find(filterQuery)
    .populate("category") // to populate the refrence ids in mongodb 
    .populate("genre")


    res.status(200).json({
      movies
    })


  }

  catch (error) {
    return res.status(500).json({
      error: error.message
    })
  }
}

export const updateWatchedStatus = async (req, res) => {
  try {
    const id = req.params.id;
    // because  this fails security any one can upadate status 
    // const updateMovie = await Movie.findByIdAndUpdate(id, { isWatched: true }, { returnDocument: "after" })
    const updateMovie = await Movie.findOneAndUpdate({ _id: id, userId: req.user._id }, { isWatched: true }, { returnDocument: "after" })
    
    if (!updateMovie) {
    return res.status(404).json({
        error: "Movie not found"
    });
}

    res.status(200).json({
      updateMovie
    })
  }

  catch (error) {
    return res.status(500).json({
      error: error.message
    })
  }
}

export const deleteMovie = async (req, res) => {
  try {
    const id = req.params.id;
    const deletM = await Movie.findOneAndDelete({ _id: id, userId: req.user._id });
    
    if(deletM === null){
       return res.status(404).json({
        error: "Movie not found"
       })
    }
    res.status(200).json({
      deletM,
      message: "Movie deleted in  wathlist  "
    })

  }
  catch (error) {
    return res.status(500).json({
      error: error.message
    })
  }
}


export const searchMovies = async (req, res) => {

  try {
    const search = req.query.name;
    const response = await axios.get(`https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&query=${search}`);

    res.status(200).json(response.data.results)


  }
  catch (error) {
    return res.status(500).json({
      error: error.message
    })
  }
}