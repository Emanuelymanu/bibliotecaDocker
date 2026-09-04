// src/services/livrosService.ts
//
// Fala com as rotas /api/livros/* do backend.

import { api } from './api';

export interface LivroTopAvaliado {
  id_livro: number;
  titulo: string;
  subtitulo?: string | null;
  capa?: string | null;
  autores: string[];
  generos: string[];
  editora?: string | null;
  avaliacao_media?: string | number | null;
}

// Formato completo de um livro, usado na tela de Editar (tem mais campos
// que o "resumo" que a Biblioteca usa pra listar).
export interface LivroCompleto {
  id_livro: number;
  titulo: string;
  subtitulo?: string | null;
  tipo_obra: 'unico' | 'trilogia' | 'serie' | 'colecao';
  ano_publicacao: number | null;
  num_paginas: number | null;
  capa: string | null;
  autores: string[];
  generos: string[];
  editora: string | null;
}

export interface OpcoesFiltro {
  autores: string[];
  editoras: string[];
  generos: string[];
}

export interface AtualizarLivroPayload {
  titulo: string;
  subtitulo?: string;
  autores: string[];
  tipo_obra: string;
  ano_publicacao: number;
  num_paginas: number;
  generos: string[];
  editora?: string;
  status?: string;
  avaliacao?: number;
}

export const livrosService = {
  /** GET /api/livros/top-avaliados — rota pública, não exige login */
  async buscarTopAvaliados(): Promise<LivroTopAvaliado[]> {
    const { data } = await api.get('/livros/top-avaliados');
    return data.livros ?? [];
  },

  /**
   * O backend ainda não tem uma rota "GET /livros/:id" pra buscar um único
   * livro. Por enquanto, buscamos a lista inteira (até 100 livros) e achamos
   * o certo aqui no app. Funciona bem pra bibliotecas pequenas/médias; se um
   * dia isso ficar lento, o ideal é pedir pro backend criar essa rota.
   */
  async buscarPorId(idLivro: number): Promise<LivroCompleto | null> {
    const { data } = await api.get('/livros/listar', { params: { limit: 100 } });
    const encontrado = (data.livros ?? []).find((l: any) => l.id_livro === idLivro);
    return encontrado ?? null;
  },

  /**
   * PUT /api/livros/editar/:id — precisa ser enviado como "multipart/form-data"
   * porque essa rota também aceita upload de uma nova capa (arquivo), mesmo
   * quando a gente não está enviando nenhuma imagem agora.
   * Essa mesma chamada já atualiza o status e a avaliação da leitura, então
   * não precisamos de uma chamada separada pra isso.
   */
  async atualizar(idLivro: number, dados: AtualizarLivroPayload): Promise<void> {
    const formData = new FormData();
    formData.append('titulo', dados.titulo);
    if (dados.subtitulo) formData.append('subtitulo', dados.subtitulo);
    dados.autores.forEach((nome) => formData.append('autores', nome));
    formData.append('tipo_obra', dados.tipo_obra);
    formData.append('ano_publicacao', String(dados.ano_publicacao));
    formData.append('num_paginas', String(dados.num_paginas));
    dados.generos.forEach((nome) => formData.append('generos', nome));
    if (dados.editora) formData.append('editora', dados.editora);
    if (dados.status) formData.append('status', dados.status);
    if (dados.avaliacao !== undefined) formData.append('avaliacao', String(dados.avaliacao));

    await api.put(`/livros/editar/${idLivro}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /** DELETE /api/livros/deletar/:id */
  async deletar(idLivro: number): Promise<void> {
    await api.delete(`/livros/deletar/${idLivro}`);
  },

  /** GET /api/livros/filtros/opcoes — rota pública, alimenta os autocompletes do cadastro de livro */
  async buscarOpcoesFiltro(): Promise<OpcoesFiltro> {
    const { data } = await api.get('/livros/filtros/opcoes');
    return {
      autores: data.autores ?? [],
      editoras: data.editoras ?? [],
      generos: data.generos ?? [],
    };
  },
};