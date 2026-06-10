import api from "./api";
import { AxiosError } from "axios";
import type { CriarLivroDTO, LivroResponse } from '../types/livro';

class LivroServiceUpload {
    async cadastrarComCapa(dados: CriarLivroDTO, capaFile: File): Promise<LivroResponse> {
        try {
            const formData = new FormData();

            Object.entries(dados).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    formData.append(key, String(value));
                }
            });

            formData.append('capa', capaFile);

            const response = await api.post<LivroResponse>('/livros/cadastrar', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            return response.data;
        } catch (error: any) {
            console.error('Erro ao cadastrar livro:', error);
            throw error.response?.data || { message: 'Erro ao cadastrar livro' };
        }

    }
    async editarComCapa(id: number, dados: any, file: File) {
        const formData = new FormData();
        Object.entries(dados).forEach(([key, value]) => {
            formData.append(key, value as string);
        });
        formData.append("capa", file);
        try {
            const response = await api.put(`/livros/editar/${id}`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError;
            throw axiosError.response?.data || { message: "Erro ao editar livro" };
        }
    }

    async deletarLivro(id: number): Promise<{ message: string }> {
        try {
            const response = await api.delete(`/livros/${id}`);
            return response.data;
        } catch (error: any) {
            console.error('Erro ao deletar livro:', error);
            throw error.response?.data || { message: 'Erro ao deletar livro' };
        }
    }

    
}

export default new LivroServiceUpload();
