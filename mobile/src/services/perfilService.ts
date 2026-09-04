// src/services/perfilService.ts
//
// Fala com a rota /api/perfil do backend. O e-mail não pode ser editado
// (o backend não aceita esse campo no PUT), então nome, cpf e senha são
// os únicos campos que essa tela consegue salvar.

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
  /** GET /api/perfil */
  async buscar(): Promise<PerfilUsuario> {
    const { data } = await api.get('/perfil');
    return data;
  },

  /** PUT /api/perfil — devolve o usuário já atualizado */
  async atualizar(dados: AtualizarPerfilPayload): Promise<PerfilUsuario> {
    const { data } = await api.put('/perfil', dados);
    return data.usuario;
  },
};