import { TAdminRole } from "../types/adminRole.types";


export const seedRoleAdminData: TAdminRole = {
  name: 'Super Admin',
  roleFeature: [
    { name: 'Auth', path: 'auth', index: 1 },
    { name: 'Roles & Permissions', path: 'roles_permissions', index: 2 },
    { name: 'Student Classes', path: 'studentClasses', index: 3 },
  ],
};

export const featureNames = {
  auth: 'auth',
  rolesAndPermissions: 'roles_permissions',
  studentClasses: 'studentClasses',
};