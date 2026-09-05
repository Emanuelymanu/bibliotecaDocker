import { api } from './api';
import { ConquistaDesbloqueada } from '../utils/celebrarConquistas';

export interface Sessao {
  id_sessao: number;
  id_leitura: number;
  data: string;
  pagina_inicial: number | null;
  pagina_final: number | null;
  duracao_minutos: number | null;
  leitura?: {
    id_leitura: number;
    id_livro: number;
    status: string;
    pagina_atual: number | null;
  };
}

export interface NovaSessaoPayload {
  id_leitura: number;
  data: string; 
  pagina_inicial?: number;
  pagina_final?: number;
  duracao_minutos?: number;
}

export const sessoesService = {
  async listarTodas(): Promise<{ sessoes: Sessao[]; total_sessoes: number; total_minutos: number }> {
    const { data } = await api.get('/sessoes');
    return {
      sessoes: data.sessoes ?? [],
      total_sessoes: data.total_sessoes ?? 0,
      total_minutos: data.total_minutos ?? 0,
    };
  },

  async listarPorLeitura(idLeitura: number): Promise<{ sessoes: Sessao[]; total_sessoes: number; total_minutos: number }> {
    const { data } = await api.get(`/sessoes/leitura/${idLeitura}`);
    return {
      sessoes: data.sessoes ?? [],
      total_sessoes: data.total_sessoes ?? 0,
      total_minutos: data.total_minutos ?? 0,
    };
  },

  async registrar(payload: NovaSessaoPayload): Promise<{ sessao: Sessao; novasConquistas: ConquistaDesbloqueada[] }> {
    const { data } = await api.post('/sessoes', payload);
    return { sessao: data.sessao, novasConquistas: data.novasConquistas ?? [] };
  },

  async deletar(idSessao: number): Promise<void> {
    await api.delete(`/sessoes/${idSessao}`);
  },
};