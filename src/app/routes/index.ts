import { Router } from 'express';
import { TModuleRoute } from '../types/moduleRoute.type';
import { StudentClassRoutes } from '../modules/student-class/student-class.routes';


const router = Router();

const moduleRoutes: TModuleRoute[] = [
  {
    path: '/studentClasses',
    route: StudentClassRoutes,
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
