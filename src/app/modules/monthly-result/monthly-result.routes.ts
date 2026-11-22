import express from 'express';
import auth from '../../middlewares/authorization';
import { featureNames } from '../../constant/seedRoleData';
import {
  createMonthlyResult,
  getAllMonthlyResults,
  updateMonthlyResult,
  deleteMonthlyResult,
  getSingleMonthlyResult,
  calculatePositions,
} from './monthly-result.controller';
import { calculateMonthlyPositionsValidation } from "./monthly-result.validation";
import validation from '../../middlewares/validation';

const router = express.Router();

router.post('/', auth([featureNames.result]), createMonthlyResult);
router.get('/', auth([featureNames.result]), getAllMonthlyResults);
router.post('/calculate-positions', auth([featureNames.result]), validation(calculateMonthlyPositionsValidation), calculatePositions);
router.get('/:id', auth([featureNames.result]), getSingleMonthlyResult);
router.patch('/:id', auth([featureNames.result]), updateMonthlyResult);
router.delete('/:id', auth([featureNames.result]), deleteMonthlyResult);

export const MonthlyResultRoutes = router;