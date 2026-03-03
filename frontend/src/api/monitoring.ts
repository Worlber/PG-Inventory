import apiClient from './client';
import { HAGroup, PaginatedResponse } from '../types';

export const monitoringApi = {
  getPatroniClusters: () =>
    apiClient.get<PaginatedResponse<HAGroup>>('/monitoring/patroni-clusters/'),

  getPatroniCluster: (id: number) =>
    apiClient.get<HAGroup>(`/monitoring/patroni-clusters/${id}/`),

  refreshInstance: (instanceId: number) =>
    apiClient.post(`/monitoring/refresh/${instanceId}/`),

  refreshAll: () =>
    apiClient.post('/monitoring/refresh-all/'),
};
