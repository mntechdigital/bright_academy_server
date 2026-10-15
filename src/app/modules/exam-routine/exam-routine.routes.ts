import { Router } from 'express';
import auth from '../../middlewares/authorization';
import { featureNames } from '../../constant/seedRoleData';
import validation from '../../middlewares/validation';
import { examRoutineController } from './exam-routine.controller';
import { ExamRoutineValidation } from './exam-routine.validation';

const router = Router();

router.get('/', examRoutineController.getAllExamRoutines);

// Admin-only write endpoints. There is no dedicated routine feature in the
// role seed data, so these reuse the existing Result feature.
router.post(
  '/',
  auth([featureNames.result]),
  validation(ExamRoutineValidation.createExamRoutineSchema),
  examRoutineController.createExamRoutine,
);

router.post(
  '/:id/duplicate',
  auth([featureNames.result]),
  validation(ExamRoutineValidation.duplicateExamRoutineSchema),
  examRoutineController.duplicateExamRoutine,
);

router.get('/:id', examRoutineController.getExamRoutineById);

router.put(
  '/:id',
  auth([featureNames.result]),
  validation(ExamRoutineValidation.updateExamRoutineSchema),
  examRoutineController.updateExamRoutine,
);

router.delete(
  '/:id',
  auth([featureNames.result]),
  examRoutineController.deleteExamRoutine,
);

export const ExamRoutineRoutes = router;
