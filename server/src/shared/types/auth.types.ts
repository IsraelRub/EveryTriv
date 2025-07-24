export interface LoginDto {
  username: string;
  password: string;
}

export interface RegisterDto {
  username: string;
  password: string;
  avatar?: string;
}

export interface JwtPayload {
  sub: string;
  username: string;
  role: string;
}
