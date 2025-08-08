import axios from 'axios';
import { User } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class UserService {
  private static instance: UserService;

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  async getUserCredits(): Promise<number> {
    const response = await axios.get(`${API_BASE_URL}/user/credits`);
    return response.data.credits;
  }

  async updateProfile(data: {
    fullName?: string;
    username?: string;
    avatar?: string;
  }): Promise<User> {
    const response = await axios.patch(`${API_BASE_URL}/user/profile`, data);
    return response.data;
  }

  async getUserProfile(): Promise<User> {
    const response = await axios.get(`${API_BASE_URL}/user/profile`);
    return response.data;
  }

  async deductCredits(amount: number): Promise<User> {
    const response = await axios.post(`${API_BASE_URL}/user/credits/deduct`, { amount });
    return response.data;
  }
}

export const userService = UserService.getInstance();
