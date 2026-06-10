import api from "./api";
import { type Livro, type LivroResponse, type LivroInput } from "../types/livro";
import { AxiosError } from "axios";

interface ApiError {
    message: string;
}

class LivroService {
    async buscarGoogleBooks(query: string): Promise<Livro[]> {
        try {
            const response = await api.get(`/livros/buscar?query=${encodeURIComponent(query)}`);
            // Supondo que o backend retorna { livros: Livro[] }
            return response.data.livros || [];
        } catch (error) {
            const axiosError = error as AxiosError<ApiError>;
            console.error('Erro ao buscar livros no Google Books:', axiosError.message);
            return [];
        }
    }
    async listar(): Promise<Livro[]> {
        try {
            const response = await api.get('/livros');
            return Array.isArray(response.data.livros) ? response.data.livros : [];
        } catch (error) {
            const axiosError = error as AxiosError;
            console.error('Erro ao listar livros:', axiosError.message);
            return [];
        }
    }

    async criar(livro: LivroInput): Promise<Livro> {
        try {
            const response = await api.post('/livros/cadastrar', livro);
            // Aceita resposta: { mensagem, livro }
            if (response.data && response.data.livro) {
                return response.data.livro;
            }
            throw new Error('Erro ao criar livro');
        } catch (error) {
            const axiosError = error as AxiosError<ApiError>;
            throw axiosError.response?.data || { message: 'Erro ao criar livro' };
        }
    }
    async editarComCapa(id: number, livro: Partial<LivroInput>): Promise<Livro> {
        try {
            const response = await api.put<LivroResponse>(`/livros/editar/${id}`, livro);

            if (response.data.sucesso && !Array.isArray(response.data.data)) {
                return response.data.data;
            }
            throw new Error('Erro ao editar livro');
        } catch (error) {
            const axiosError = error as AxiosError<ApiError>;
            throw axiosError.response?.data || { message: 'Erro ao editar livro' };
        }
    }

    async editarSemCapa(id: number, dados: Partial<LivroInput>): Promise<Livro> {
        try {
            const response = await api.put(`/livros/editar/${id}`, dados);
            return response.data.livro;
        } catch (error: any) {
            console.error('Erro ao editar livro:', error);
            throw error.response?.data || { message: 'Erro ao editar livro' };
        }
    }
    async deletar(id: number): Promise<void> {
        try {
            await api.delete(`/livros/deletar/${id}`);
        } catch (error) {
            const axiosError = error as AxiosError<ApiError>;
            throw axiosError.response?.data || { message: 'Erro ao deletar livro' };
        }
    }

    async listarTopAvaliados(limit: number = 5): Promise<Livro[]> {
        try {
            const response = await api.get(`/livros/top-avaliados?limit=${limit}`);
            return response.data.livros || response.data || [];
        } catch (error: any) {
            console.error('Erro ao buscar top avaliados:', error);
            return []; // Retorna array vazio em caso de erro
        }
    }
}


export default new LivroService();