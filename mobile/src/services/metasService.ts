import { api } from './api';
import { ConquistaDesbloqueada } from '../utils/celebrarConquistas';

export interface Meta {
  id_meta: number;
  id_usuario: number;
  ano: number;
  qtd_livros_alvo: number | null;
  qtd_paginas_alvo: number | null;
}

export interface Progresso {
  livros_lidos: number;
  paginas_lidas: number;
}

export const metasService = {
  async listar(): Promise<{ meta: Meta; progresso: Progresso }[]> {
    const { data } = await api.get('/metas');
    return data.metas ?? [];
  },

  async buscarPorAno(ano: number): Promise<{ meta: Meta; progresso: Progresso } | null> {
    try {
      const { data } = await api.get(`/metas/${ano}`);
      return { meta: data.meta, progresso: data.progresso };
    } catch (e: any) {
      if (e?.response?.status === 404) return null;
      throw e;
    }
  },

  async salvar(ano: number, qtdLivrosAlvo?: number, qtdPaginasAlvo?: number): Promise<{ meta: Meta; novasConquistas: ConquistaDesbloqueada[] }> {
    const { data } = await api.post('/metas', {
      ano,
      qtd_livros_alvo: qtdLivrosAlvo,
      qtd_paginas_alvo: qtdPaginasAlvo,
    });
    return { meta: data.meta, novasConquistas: data.novasConquistas ?? [] };
  },
};