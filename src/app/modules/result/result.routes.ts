import express from 'express';
import auth from '../../middlewares/authorization';
import { featureNames } from '../../constant/seedRoleData';
import { getWeeklyResults } from './result.controller';

const router = express.Router();
router.get('/weekly', auth([featureNames.result]), getWeeklyResults);

export const ResultRoutes = router;
