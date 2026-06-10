// frontend/src/services/dashboardService.ts
import api from './api';
import type { DashboardResponse } from '../types/dashboard';

class DashboardService {
  async obterDashboard(): Promise<DashboardResponse> {
    try {
      const response = await api.get<DashboardResponse>('/dashboard');
      return response.data;
    } catch (error: any) {
      console.error('Erro ao carregar dashboard:', error);
      throw error.response?.data || { erro: 'Erro ao carregar dashboard' };
    }
  }
}

export const dashboardService = new DashboardService();