import axios from 'axios';
import api from './api';
import type { ApiResponse, LoginCredentials, LoginResponse } from '../types';

/** Unwrap Axios errors into a human-readable message. */
function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    // Server responded with an error body
    const serverMsg = (err.response?.data as { message?: string })?.message;
    if (serverMsg) return serverMsg;
    // No response at all (server down, CORS, etc.)
    if (!err.response) return 'Cannot reach the server. Please check your connection.';
  }
  if (err instanceof Error) return err.message;
  return 'An unexpected error occurred.';
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const { data } = await api.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
      if (!data.data) throw new Error('Invalid response from server');
      return data.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err));
    }
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout errors — always clear local state
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  },
};
