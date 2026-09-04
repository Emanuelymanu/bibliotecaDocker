// src/services/anotacoesService.ts
//
// Fala com as rotas /api/anotacoes/* do backend (uma anotação pertence a
// uma leitura, e pode estar amarrada a uma página específica do livro).

import { api } from './api';

export interface Anotacao {
  id_anotacao: number;
  id_leitura: number;
  pagina: number | null;
  titulo: string | null;
  conteudo: string;
}

export const anotacoesService = {
  /** GET /api/anotacoes/leitura/:id_leitura — todas as anotações dessa leitura */
  async listarPorLeitura(idLeitura: number): Promise<Anotacao[]> {
    const { data } = await api.get(`/anotacoes/leitura/${idLeitura}`);
    return data.anotacoes ?? [];
  },

  /** POST /api/anotacoes */
  async criar(idLeitura: number, pagina: number, titulo: string | undefined, conteudo: string): Promise<Anotacao> {
    const { data } = await api.post('/anotacoes', {
      id_leitura: idLeitura,
      pagina,
      titulo,
      conteudo,
    });
    return data.anotacao;
  },

  /** PUT /api/anotacoes/:id */
  async atualizar(id: number, dados: { pagina?: number; titulo?: string; conteudo?: string }): Promise<void> {
    await api.put(`/anotacoes/${id}`, dados);
  },

  /** DELETE /api/anotacoes/:id */
  async deletar(id: number): Promise<void> {
    await api.delete(`/anotacoes/${id}`);
  },
};