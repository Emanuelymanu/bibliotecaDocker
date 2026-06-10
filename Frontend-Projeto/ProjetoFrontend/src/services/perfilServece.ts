import api from "./api";
import type { UsuarioPerfil, AtualizarPerfilDTO, PerfilResponse } from '../types/perfil';


class PerfilService{
    async buscarPerfil(): Promise<UsuarioPerfil> {
        try{
            const response = await api.get<UsuarioPerfil>('/perfil')
            return response.data;

        }catch(error: any){
            console.error('Erro ao buscar perfil:', error);
            throw new Error('Erro ao buscar perfil');   
        }
    }

    async atualizarPerfil(dados: AtualizarPerfilDTO): Promise<PerfilResponse>{
        try{
            const response = await api.put<PerfilResponse>('/perfil', dados);
            return response.data;
        }catch(error: any){
            console.error('Erro ao atualizar perfil:', error);
            throw new Error('Erro ao atualizar perfil');
        }
    }
}

export const perfilService = new PerfilService();