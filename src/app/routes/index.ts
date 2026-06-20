import { Router } from "express";
import { TModuleRoute } from "../types/moduleRoute.type";
import { StudentClassRoutes } from "../modules/student-class/student-class.routes";
import { StudentSectionRoutes } from "../modules/student-section/student-section.routes";
import { SubjectRoutes } from "../modules/subject/subject.routes";
import { StudentRoutes } from "../modules/student/student.routes";
import { AuthRoutes } from "../modules/auth/auth.routes";
import { RoleRoutes } from "../modules/role/role.routes";
import WeeklyMarksSheetRoutes from "../modules/weekly-marks-sheet/weekly-marks-sheet.routes";
import { MonthlyResultRoutes } from "../modules/monthly-result/monthly-result.routes";
import { TeacherRoutes } from '../modules/teacher/teacher.routes';
import { BatchRoutes } from "../batch/batch.route";

const router = Router();

const moduleRoutes: TModuleRoute[] = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/weekly-marks-sheets",
    route: WeeklyMarksSheetRoutes,
  },
  {
    path: "/roles_permissions",
    route: RoleRoutes,
  },
  {
    path: "/studentClasses",
    route: StudentClassRoutes,
  },
  {
    path: "/studentSections",
    route: StudentSectionRoutes,
  },
  {
    path: "/subjects",
    route: SubjectRoutes,
  },
  {
    path: "/students",
    route: StudentRoutes,
  },
  {
    path: '/teachers',
    route: TeacherRoutes,
  },
  {
    path: "/monthly-exam-results",
    route: MonthlyResultRoutes,
  },
  {
    path: "/monthly-results",
    route: MonthlyResultRoutes,
  },
  {
    path: "/batches",
    route: BatchRoutes,
  }
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
