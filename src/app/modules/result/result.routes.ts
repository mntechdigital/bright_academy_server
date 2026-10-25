import express from 'express';
import { getWeeklyResults } from './result.controller';

const router = express.Router();
router.get('/weekly', getWeeklyResults);

export const ResultRoutes = router;
