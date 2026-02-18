import { TAdminRole } from "../types/adminRole.types";


export const seedRoleAdminData: TAdminRole = {
  name: 'Super Admin',
  roleFeature: [
    { name: 'Auth', path: '/auth', index: 1 },
    { name: 'Roles & Permissions', path: '/roles-permissions', index: 2 },
    { name: 'Classes', path: '/classes', index: 3 },
    { name: 'Sections', path: '/sections', index: 4 },
    { name: 'Subjects', path: '/subjects', index: 5 },
    { name: 'Students', path: '/students', index: 6 },
    { name: 'Teachers', path: '/teachers', index: 7 },
    { name: 'Result', path: '/result', index: 8 },
    { name: 'Weekly Marks Sheets', path: '/weekly-marks-sheets', index: 9 },
  ],
};

export const featureNames = {
  auth: '/auth',
  rolesAndPermissions: '/roles-permissions',
  classes: '/classes',
  sections: '/sections',
  subjects: '/subjects',
  students: '/students',
  teachers: '/teachers',
  result: '/result',
  weeklyMarksSheets: '/weekly-marks-sheets',
};