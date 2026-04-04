export type JwtPayload = {
  sub: string;
  email: string;
  role: 'admin' | 'customer' | 'manager';
  iat?: number;
  exp?: number;
};
