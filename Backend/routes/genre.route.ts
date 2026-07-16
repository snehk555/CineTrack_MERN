import express from 'express'
import {addGenre, getGenre} from '../controllers/genre.controller.js'

const router = express.Router();

router.post("/add", addGenre)
router.get("/get", getGenre)

export  default router