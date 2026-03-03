import apiClient from './client';
import { User } from '../types';

export const authApi = {
  login: (username: string, password: string) =>
    apiClient.post('/auth/login/', { username, password }),

  verifyOtp: (otp_code: string) =>
    apiClient.post('/auth/verify-otp/', { otp_code }),

  logout: () =>
    apiClient.post('/auth/logout/'),

  getCurrentUser: () =>
    apiClient.get<User>('/auth/user/'),

  setupOtp: () =>
    apiClient.post<{ secret: string; qr_code: string }>('/auth/otp/setup/'),

  enableOtp: (otp_code: string) =>
    apiClient.post('/auth/otp/enable/', { otp_code }),

  disableOtp: (otp_code: string) =>
    apiClient.post('/auth/otp/disable/', { otp_code }),
};
