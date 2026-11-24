import { api } from './api';

export interface LeituraItem {
  id_leitura: number;
  status: 'nao_lido' | 'quero_ler' | 'lendo' | 'lido' | 'abandonado' | 'relendo';
  avaliacao: number | null;
  pagina_atual: number | null;
  data_inicio: string | null;
  data_conclusao: string | null;
  livro?: {
    id_livro: number;
    titulo: string;
    autor: string;
    num_paginas: number | null;
    capa: string | null;
  };
}

export const leiturasService = {
  async listar(status?: string): Promise<LeituraItem[]> {
    const params: Record<string, string | number> = { limit: 100 };
    if (status) params.status = status;
    const { data } = await api.get('/leituras/listar', { params });
    return data.leituras ?? [];
  },

  async atualizarStatus(idLeitura: number, status: string): Promise<void> {
    await api.put(`/leituras/${idLeitura}/progresso`, { status });
  },

  async atualizarProgresso(idLeitura: number, dados: { status?: string; pagina_atual?: number }): Promise<void> {
    await api.put(`/leituras/${idLeitura}/progresso`, dados);
  },

  async avaliar(idLeitura: number, avaliacao: number): Promise<void> {
    await api.post(`/leituras/${idLeitura}/avaliar`, { avaliacao });
  },
};