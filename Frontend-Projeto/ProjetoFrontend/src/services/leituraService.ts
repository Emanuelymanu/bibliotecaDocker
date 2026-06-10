import api from "./api";
import type { Leitura, LeituraResponse, ListarLeiturasResponse, CriarLeituraDTO, AtualizarProgressoDTO, AvaliarLeituraDTO } from "../types/leitura";

class LeituraService {
    async iniciarLeitura(dados: CriarLeituraDTO): Promise<LeituraResponse> {
        try {
            const response = await api.post<LeituraResponse>('/leituras/iniciar', dados);
            return response.data;
        } catch (error: any) {
            console.error('Erro ao iniciar leitura:', error);
            throw error.response?.data || { message: 'Erro ao iniciar leitura' };
        }
    }

    async listarLeituras(status?: string, page: number = 1, limit: number = 10): Promise<ListarLeiturasResponse> {
        try {
            let url = `/leituras/listar?page=${page}&limit=${limit}`;
            if (status) {
                url += `&status=${status}`;
            }
            const response = await api.get<ListarLeiturasResponse>(url);
            return response.data;
        } catch (error: any) {
            console.error('Erro ao listar leituras:', error);
            throw error.response?.data || { erro: 'Erro ao listar leituras' };
        }
    }

    async listarLeiturasEmAndamento(): Promise<Leitura[]> {
        try {
            const response = await this.listarLeituras('lendo', 1, 100);
            return response.leituras;
        } catch (error: any) {
            console.error('Erro ao listar leituras em andamento:', error);
            throw error.response?.data || { erro: 'Erro ao listar leituras em andamento' };
        }
    }

    async listarLeiturasConcluidas(): Promise<Leitura[]> {
        try {
            const response = await this.listarLeituras('lido', 1, 100);
            return response.leituras;
        } catch (error: any) {
            console.error('Erro ao listar leituras concluídas:', error);
            throw error.response?.data || { erro: 'Erro ao listar leituras concluídas' };
        }
    }

    async atualizarProgresso(id: number, dados: AtualizarProgressoDTO): Promise<LeituraResponse> {
        try {
            const response = await api.put<LeituraResponse>(`/leituras/${id}/progresso`, dados);
            return response.data;
        } catch (error: any) {
            console.error('Erro ao atualizar progresso:', error);
            throw error.response?.data || { erro: 'Erro ao atualizar progresso' };
        }
    }

    async avaliarLeitura(id: number, dados: AvaliarLeituraDTO): Promise<LeituraResponse> {
        try {
            const response = await api.post<LeituraResponse>(`/leituras/${id}/avaliar`, dados);
            return response.data;
        } catch (error: any) {
            console.error('Erro ao avaliar leitura:', error);
            throw error.response?.data || { erro: 'Erro ao avaliar leitura' };
        }
    }

    async deletarLeitura(id: number): Promise<{ mensagem: string }> {
        try {
            const response = await api.delete(`/leituras/${id}`);
            return response.data;
        } catch (error: any) {
            console.error('Erro ao deletar leitura:', error);
            throw error.response?.data || { erro: 'Erro ao deletar leitura' };
        }
    }

    async marcarComoLido(id: number, avaliacao?: number, resenha?: string): Promise<LeituraResponse> {
        try {
            const livro = await this.buscarLeituraPorId(id);
            if (livro) {
                const respostaProgresso = await this.atualizarProgresso(id, {
                    pagina_atual: livro.livro?.num_paginas || 0,
                    status: 'lido'
                });
                console.log('Resposta atualizarProgresso:', respostaProgresso);
            }

            let leituraAtualizada = null;
            let tentativas = 0;
            while (tentativas < 5) {
                await new Promise(resolve => setTimeout(resolve, 400)); // espera 400ms
                leituraAtualizada = await this.buscarLeituraPorId(id);
                if (leituraAtualizada?.status === 'lido') break;
                tentativas++;
            }

            if (leituraAtualizada?.status !== 'lido') {
                console.error('Status após atualizarProgresso:', leituraAtualizada?.status);
                throw { erro: 'O status não foi atualizado para "lido". Tente novamente.' };
            }

            if (avaliacao) {
                return await this.avaliarLeitura(id, { avaliacao, resenha });
            }

            return { mensagem: 'Leitura marcada como lida', leitura: leituraAtualizada };
        } catch (error: any) {
            console.error('Erro ao marcar como lido:', error);
            throw error.response?.data || error || { erro: 'Erro ao marcar como lido' };
        }
    }

    async buscarLeituraPorId(id: number): Promise<Leitura> {
        try {
            const response = await api.get(`/leituras/${id}`);
            return response.data.leitura;
        } catch (error: any) {
            console.error('Erro ao buscar leitura:', error);
            throw error.response?.data || { erro: 'Erro ao buscar leitura' };
        }
    }
}

export const leituraService = new LeituraService();