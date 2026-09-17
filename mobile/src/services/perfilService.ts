import { api } from './api';

export interface PerfilUsuario {
  id_usuario: number;
  nome: string;
  email: string;
  cpf: string;
  tipo_usuario: 'admin' | 'usuario';
}

export interface AtualizarPerfilPayload {
  nome?: string;
  cpf?: string;
  senha?: string;
}

export const perfilService = {
  async buscar(): Promise<PerfilUsuario> {
    const { data } = await api.get('/perfil');
    return data;
  },

  async atualizar(dados: AtualizarPerfilPayload): Promise<PerfilUsuario> {
    const { data } = await api.put('/perfil', dados);
    return data.usuario;
  },
};