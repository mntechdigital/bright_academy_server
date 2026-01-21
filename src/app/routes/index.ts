import { Router } from 'express';
import { TModuleRoute } from '../types/moduleRoute.type';
import { StudentClassRoutes } from '../modules/student-class/student-class.routes';
import { StudentSectionRoutes } from '../modules/student-section/student-section.routes';
import { SubjectRoutes } from '../modules/subject/subject.routes';


const router = Router();

const moduleRoutes: TModuleRoute[] = [
  {
    path: '/studentClasses',
    route: StudentClassRoutes,
  },
  {
    path: '/studentSections',
    route: StudentSectionRoutes,
  },
  {
    path: '/subjects',
    route: SubjectRoutes,
  },
//   {
//     path: '/blogs',
//     route: BlogRoutes,
//   },

];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
