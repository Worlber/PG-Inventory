import apiClient from './client';
import { PaginatedResponse, User } from '../types';

export const usersApi = {
  getUsers: () =>
    apiClient.get<PaginatedResponse<User>>('/auth/users/'),

  createUser: (data: {
    username: string;
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
    role: string;
  }) => apiClient.post<User>('/auth/users/', data),

  updateUser: (id: number, data: Partial<User>) =>
    apiClient.patch<User>(`/auth/users/${id}/`, data),

  deleteUser: (id: number) =>
    apiClient.delete(`/auth/users/${id}/`),

  resetPassword: (id: number, new_password: string) =>
    apiClient.post(`/auth/users/${id}/reset-password/`, { new_password }),

  disableOtp: (id: number) =>
    apiClient.post(`/auth/users/${id}/disable-otp/`),
};
