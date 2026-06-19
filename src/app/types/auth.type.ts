export type TLogin = {
  email: string;
  password: string;
};

export type TJwtPayload = {
  role: string;
  id?: string;
  email?: string;
  fullName?: string;
  status?: string;
  regNo?: string;
  name?: string;
};