import { Router } from 'express';
import { studentSectionController } from './student-section.controller';

const router = Router();

router.get('/', studentSectionController.getAllStudentSections);

router.get('/:id', studentSectionController.getStudentSectionById);

export const StudentSectionRoutes = router;
