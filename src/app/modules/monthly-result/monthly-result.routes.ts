import express from 'express';
import { createMonthlyResult, getAllMonthlyResults, updateMonthlyResult, deleteMonthlyResult, getSingleMonthlyResult } from './monthly-result.controller';
import { validateMonthlyResult } from './monthly-result.validation';
import validation from '../../middlewares/validation';

const router = express.Router();

router.post('/', createMonthlyResult);
router.get('/', getAllMonthlyResults);
router.get('/:id', getSingleMonthlyResult);
router.patch('/:id', updateMonthlyResult);
router.delete('/:id', deleteMonthlyResult);

export const MonthlyResultRoutes = router;
