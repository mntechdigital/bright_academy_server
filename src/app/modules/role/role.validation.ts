import { z } from 'zod';

const createRoleValidation = z.object({
  body: z.object({
    name: z.string({ required_error: 'Role name is required' }),
    roleFeature: z.array(
      z.object({
        name: z.string({ required_error: 'Feature name is required' }),
        path: z.string({ required_error: 'Feature path is required' }),
        index: z.number({ required_error: 'Feature index is required' }),
      }),
    ),
  }),
});

const updateRoleValidation = z.object({
  body: z
    .object({
      name: z.string({ required_error: 'Role name is required' }).optional(),
      roleFeature: z.array(
        z.object({
          name: z.string({ required_error: 'Feature name is required' }),
          path: z.string({ required_error: 'Feature path is required' }),
          index: z.number({ required_error: 'Feature index is required' }),
        }),
      ),
    })
    .optional(),
});

export const RoleValidation = {
  createRoleValidation,
  updateRoleValidation,
};
