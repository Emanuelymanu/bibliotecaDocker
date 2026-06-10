import api from './api';
import type {
  CriarAnotacaoDTO,
  AtualizarAnotacaoDTO,
  AnotacaoResponse,
  AnotacoesPorPaginaResponse,
  Anotacao
} from '../types/anotacao';

class AnotacaoService {
  async buscarTodasPorLeitura(id_leitura: number): Promise<Anotacao[]> {
    try {
      const response = await api.get<{ anotacoes: Anotacao[] }>(`/anotacoes/leitura/${id_leitura}`);
      return response.data.anotacoes;
    } catch (error: any) {
      console.error('Erro ao buscar anotações:', error);
      return [];
    }
  }
  async criarAnotacao(dados: CriarAnotacaoDTO): Promise<AnotacaoResponse> {
    try {
      const response = await api.post<AnotacaoResponse>('/anotacoes', dados);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao criar anotação:', error);
      throw error.response?.data || { erro: 'Erro ao criar anotação' };
    }
  }

  async buscarPorPagina(id_leitura: number, pagina: number): Promise<AnotacoesPorPaginaResponse> {
    try {
      const response = await api.get<AnotacoesPorPaginaResponse>(
        `/anotacoes/leitura/${id_leitura}/pagina/${pagina}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Erro ao buscar anotações:', error);
      throw error.response?.data || { erro: 'Erro ao buscar anotações' };
    }
  }

   async buscarTodasPorIdLeitura(id_leitura: number): Promise<Anotacao[]> {
    try {
      
      
      const todasAnotacoes: Anotacao[] = [];
      let pagina = 1;
      let temMais = true;
      
      while (temMais) {
        try {
          const response = await this.buscarPorPagina(id_leitura, pagina);
          if (response.anotacoes && response.anotacoes.length > 0) {
            todasAnotacoes.push(...response.anotacoes);
            pagina++;
          } else {
            temMais = false;
          }
        } catch {
          temMais = false;
        }
      }
      
      return todasAnotacoes;
    } catch (error: any) {
      console.error('Erro ao buscar todas anotações:', error);
      throw error.response?.data || { erro: 'Erro ao buscar anotações' };
    }
  }

  async atualizarAnotacao(id: number, dados: AtualizarAnotacaoDTO): Promise<AnotacaoResponse> {
    try {
      const response = await api.put<AnotacaoResponse>(`/anotacoes/${id}`, dados);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao atualizar anotação:', error);
      throw error.response?.data || { erro: 'Erro ao atualizar anotação' };
    }
  }

  async deletarAnotacao(id: number): Promise<{ mensagem: string }> {
    try {
      const response = await api.delete(`/anotacoes/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao deletar anotação:', error);
      throw error.response?.data || { erro: 'Erro ao deletar anotação' };
    }
  }
}

export const anotacaoService = new AnotacaoService();