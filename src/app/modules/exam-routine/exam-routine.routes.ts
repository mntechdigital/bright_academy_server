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

// Appends new weeks to an existing routine without touching the stored weeks.
// Use this when a routine already exists for the class + exam name + year and
// only some weeks (e.g. Week 1..3) are still missing.
router.post(
  '/:id/weeks',
  auth([featureNames.result]),
  validation(ExamRoutineValidation.addExamRoutineWeeksSchema),
  examRoutineController.addExamRoutineWeeks,
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
