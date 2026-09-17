import { api } from './api';
import { ConquistaDesbloqueada } from '../utils/celebrarConquistas';

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

  async atualizarStatus(idLeitura: number, status: string): Promise<ConquistaDesbloqueada[]> {
    const { data } = await api.put(`/leituras/${idLeitura}/progresso`, { status });
    return data.novasConquistas ?? [];
  },


  async atualizarProgresso(idLeitura: number, dados: { status?: string; pagina_atual?: number }): Promise<ConquistaDesbloqueada[]> {
    const { data } = await api.put(`/leituras/${idLeitura}/progresso`, dados);
    return data.novasConquistas ?? [];
  },

  async avaliar(idLeitura: number, avaliacao: number): Promise<void> {
    await api.post(`/leituras/${idLeitura}/avaliar`, { avaliacao });
  },
};