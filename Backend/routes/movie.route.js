import express from 'express'
import { addMovie, getMovies, updateWatchedStatus, deleteMovie, searchMovies } from '../controllers/movie.controller.js';

import { protectRoute , isAdmin } from '../middleware/protectRoute.js';

const router = express.Router()

router.post("/add",protectRoute,isAdmin,addMovie)
router.delete('/delete/:id',protectRoute,isAdmin,  deleteMovie);

router.get('/all', protectRoute, getMovies)
router.put('/update/:id',protectRoute, updateWatchedStatus)
router.get("/search",protectRoute, searchMovies);

export default router;



