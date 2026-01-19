export interface TAdminRole {
  name: string;
  roleFeature: TRoleFeature[];
}

export interface TRoleFeature {
  name: string;
  path: string;
  index: number;
}

export type TRoleFeatureNames = {
  [key: string]: string;
};
