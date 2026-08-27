import api from './api';
import type { ApiResponse, LoginCredentials, LoginResponse } from '../types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const { data } = await api.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
    if (!data.data) throw new Error('Invalid response from server');
    return data.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  },
};
