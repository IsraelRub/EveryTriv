/**
 * Authentication-related types for the server
 */

export interface LoginDto {
  username: string;
  password: string;
}

export interface RegisterDto {
  username: string;
  email: string;
  password: string;
  avatar?: string;
}

export interface JwtPayload {
  sub: string;
  username: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  user: {
    id: string;
    username: string;
    email: string;
    avatar?: string;
    score: number;
    credits: number;
    role: string;
  };
}
