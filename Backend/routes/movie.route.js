import express from 'express'
import { addMovie, getMovies, updateWatchedStatus, deleteMovie, searchMovies } from '../controllers/movie.controller.js';

import { protectRoute } from '../middleware/protectRoute.js';

const router = express.Router()

router.post("/add",protectRoute,addMovie)
router.get('/all', protectRoute, getMovies)
router.put('/update/:id',protectRoute, updateWatchedStatus)
router.delete('/delete/:id',protectRoute,  deleteMovie);
router.get("/search",protectRoute, searchMovies);

export default router;



