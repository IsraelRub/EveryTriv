import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  password: string;
  email: string;
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    username: string;
    email: string;
    fullName?: string;
    avatar?: string;
    credits: number;
    role: string;
  };
}

class AuthService {
  private static instance: AuthService;
  private token: string | null = null;

  constructor() {
    this.token = Cookies.get('auth_token') || null;
    if (this.token) {
      this.setAuthHeader(this.token);
    }
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private setAuthHeader(token: string) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  private removeAuthHeader() {
    delete axios.defaults.headers.common['Authorization'];
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
    const authData: AuthResponse = response.data;
    
    this.token = authData.access_token;
    Cookies.set('auth_token', this.token, { expires: 7 }); // 7 days
    this.setAuthHeader(this.token);
    
    return authData;
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, credentials);
    const authData: AuthResponse = response.data;
    
    this.token = authData.access_token;
    Cookies.set('auth_token', this.token, { expires: 7 });
    this.setAuthHeader(this.token);
    
    return authData;
  }

  async getCurrentUser() {
    if (!this.token) throw new Error('No token available');
    
    const response = await axios.get(`${API_BASE_URL}/auth/me`);
    return response.data;
  }

  logout() {
    this.token = null;
    Cookies.remove('auth_token');
    this.removeAuthHeader();
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getToken(): string | null {
    return this.token;
  }

  // Google OAuth
  initiateGoogleLogin() {
    window.location.href = `${API_BASE_URL}/auth/google`;
  }

  // Handle OAuth callback
  handleOAuthCallback(token: string) {
    this.token = token;
    Cookies.set('auth_token', token, { expires: 7 });
    this.setAuthHeader(token);
  }

  // Complete user profile
  async completeProfile(data: {
    fullName?: string;
    avatar?: string;
    preferences?: Record<string, any>;
  }) {
    const response = await axios.patch(`${API_BASE_URL}/user/profile`, data);
    return response.data;
  }
}

export const authService = AuthService.getInstance();
