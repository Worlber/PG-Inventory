import apiClient from './client';
import {
  Application,
  DashboardStats,
  HAGroup,
  PaginatedResponse,
  PostgreSQLInstance,
  SearchResult,
} from '../types';

export const inventoryApi = {
  // Applications
  getApplications: () =>
    apiClient.get<PaginatedResponse<Application>>('/applications/'),

  getApplication: (id: number) =>
    apiClient.get<Application>(`/applications/${id}/`),

  createApplication: (data: { name: string; description?: string }) =>
    apiClient.post<Application>('/applications/', data),

  updateApplication: (id: number, data: Partial<Application>) =>
    apiClient.patch<Application>(`/applications/${id}/`, data),

  deleteApplication: (id: number) =>
    apiClient.delete(`/applications/${id}/`),

  // Instances
  getInstances: (params?: Record<string, string>) =>
    apiClient.get<PaginatedResponse<PostgreSQLInstance>>('/instances/', { params }),

  getInstance: (id: number) =>
    apiClient.get<PostgreSQLInstance>(`/instances/${id}/`),

  createInstance: (data: Record<string, unknown>) =>
    apiClient.post<PostgreSQLInstance>('/instances/', data),

  updateInstance: (id: number, data: Record<string, unknown>) =>
    apiClient.patch<PostgreSQLInstance>(`/instances/${id}/`, data),

  deleteInstance: (id: number) =>
    apiClient.delete(`/instances/${id}/`),

  // HA Groups
  getHAGroups: () =>
    apiClient.get<PaginatedResponse<HAGroup>>('/ha-groups/'),

  createHAGroup: (data: { name: string }) =>
    apiClient.post<HAGroup>('/ha-groups/', data),

  deleteHAGroup: (id: number) =>
    apiClient.delete(`/ha-groups/${id}/`),

  // Search
  search: (q: string) =>
    apiClient.get<SearchResult[]>('/search/', { params: { q } }),

  // Dashboard
  getDashboardStats: () =>
    apiClient.get<DashboardStats>('/dashboard/stats/'),

  // Export (raw blob download)
  exportRaw: (path: string) =>
    apiClient.get(path, { responseType: 'blob' }),
};
