import { api } from './api';

export interface Anotacao {
  id_anotacao: number;
  id_leitura: number;
  pagina: number | null;
  titulo: string | null;
  conteudo: string;
}

export const anotacoesService = {
  async listarPorLeitura(idLeitura: number): Promise<Anotacao[]> {
    const { data } = await api.get(`/anotacoes/leitura/${idLeitura}`);
    return data.anotacoes ?? [];
  },

  async criar(idLeitura: number, pagina: number, titulo: string | undefined, conteudo: string): Promise<Anotacao> {
    const { data } = await api.post('/anotacoes', {
      id_leitura: idLeitura,
      pagina,
      titulo,
      conteudo,
    });
    return data.anotacao;
  },

  async atualizar(id: number, dados: { pagina?: number; titulo?: string; conteudo?: string }): Promise<void> {
    await api.put(`/anotacoes/${id}`, dados);
  },

  async deletar(id: number): Promise<void> {
    await api.delete(`/anotacoes/${id}`);
  },
};