// src/services/leiturasService.ts
//
// Fala com as rotas /api/leituras/* do backend (arquivo leiturasRoutes.ts).
// Segue o mesmo padrão dos outros services do projeto: usa a instância
// `api` (axios) já configurada com o token de login.

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
  /** GET /api/leituras/listar — devolve as leituras do usuário logado, com os dados do livro já junto */
  async listar(status?: string): Promise<LeituraItem[]> {
    const params: Record<string, string | number> = { limit: 100 };
    if (status) params.status = status;
    const { data } = await api.get('/leituras/listar', { params });
    return data.leituras ?? [];
  },

  /** PUT /api/leituras/:id/progresso — troca o status (ex: "lendo" -> "lido") */
  async atualizarStatus(idLeitura: number, status: string): Promise<void> {
    await api.put(`/leituras/${idLeitura}/progresso`, { status });
  },

  /**
   * PUT /api/leituras/:id/progresso — mesma rota do atualizarStatus, mas
   * aqui também dá pra mandar a página atual. Se pagina_atual chegar no
   * total de páginas do livro, o próprio backend já marca como "lido"
   * sozinho (não precisa mandar status junto nesse caso).
   */
  async atualizarProgresso(idLeitura: number, dados: { status?: string; pagina_atual?: number }): Promise<void> {
    await api.put(`/leituras/${idLeitura}/progresso`, dados);
  },

  /** POST /api/leituras/:id/avaliar — só funciona se a leitura já estiver com status "lido" (regra do backend) */
  async avaliar(idLeitura: number, avaliacao: number): Promise<void> {
    await api.post(`/leituras/${idLeitura}/avaliar`, { avaliacao });
  },
};