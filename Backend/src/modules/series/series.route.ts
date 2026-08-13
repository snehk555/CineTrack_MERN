import express from 'express';
import {
  listSeriesPublic,
  getSeriesDetailPublic,
  getPublicSeasons,
  getPublicEpisodes,
} from './series.controller.js';
import { cacheMiddleware } from '../../middlewares/cache.middleware.js';

const router = express.Router();

router.get('/', cacheMiddleware(300), listSeriesPublic);
router.get('/:id', cacheMiddleware(300), getSeriesDetailPublic);
router.get('/:id/seasons', cacheMiddleware(300), getPublicSeasons);
router.get('/:id/seasons/:seasonId/episodes', cacheMiddleware(300), getPublicEpisodes);

export default router;
