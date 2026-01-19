export type TLogin = {
  email: string;
  password: string;
};

export type TJwtPayload = {
  email: string;
  fullName: string;
  role: string;
  status: string;
  id?: string;
};
