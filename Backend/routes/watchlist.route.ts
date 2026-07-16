import express from 'express'

import { addToWatchList, getUserWatchlist } from '../controllers/watchlist.controller.js'
import { protectRoute } from '../middleware/protectRoute.js';


const router = express.Router();

router.post('/addtowatchlist',protectRoute, addToWatchList)
router.get('/getuserwatchlist',protectRoute, getUserWatchlist)

export default router;
