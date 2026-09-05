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

export interface CadastrarLivroPayload {
  titulo: string;
  subtitulo?: string;
  autores: string[];
  tipo_obra: string;
  ano_publicacao: number;
  num_paginas: number;
  generos: string[];
  editora?: string;
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
  async buscarTopAvaliados(): Promise<LivroTopAvaliado[]> {
    const { data } = await api.get('/livros/top-avaliados');
    return data.livros ?? [];
  },

  async buscarPorId(idLivro: number): Promise<LivroCompleto | null> {
    const { data } = await api.get('/livros/listar', { params: { limit: 100 } });
    const encontrado = (data.livros ?? []).find((l: any) => l.id_livro === idLivro);
    return encontrado ?? null;
  },


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

 
  async cadastrarComGoogle(dados: {
    titulo: string;
    subtitulo?: string;
    autores: string[];
    tipo_obra?: string;
    ano_publicacao?: number;
    num_paginas?: number;
    generos?: string[];
    editora?: string;
    capa?: string;
    id_google?: string;
  }): Promise<{ id_livro: number }> {
    const formData = new FormData();
    formData.append('titulo', dados.titulo);
    if (dados.subtitulo) formData.append('subtitulo', dados.subtitulo);
    dados.autores.forEach((nome) => formData.append('autores', nome));
    formData.append('tipo_obra', dados.tipo_obra ?? 'unico');
    if (dados.ano_publicacao) formData.append('ano_publicacao', String(dados.ano_publicacao));
    if (dados.num_paginas) formData.append('num_paginas', String(dados.num_paginas));
    (dados.generos ?? []).forEach((nome) => formData.append('generos', nome));
    if (dados.editora) formData.append('editora', dados.editora);
    if (dados.capa) formData.append('capa', dados.capa);
    if (dados.id_google) formData.append('id_google', dados.id_google);

    const { data } = await api.post('/livros/cadastrar-com-google', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return { id_livro: data.livro.id_livro };
  },

  async buscarPorAutor(nomeAutor: string): Promise<LivroTopAvaliado[]> {
    const { data } = await api.get(`/livros/autor/${encodeURIComponent(nomeAutor)}`, { params: { limit: 50 } });
    return data.livros ?? [];
  },

  async buscarPorGenero(nomeGenero: string): Promise<LivroTopAvaliado[]> {
    const { data } = await api.get(`/livros/genero/${encodeURIComponent(nomeGenero)}`, { params: { limit: 50 } });
    return data.livros ?? [];
  },

  async buscarPorEditora(nomeEditora: string): Promise<LivroTopAvaliado[]> {
    const { data } = await api.get('/livros/listar', { params: { editora: nomeEditora, limit: 50 } });
    return data.livros ?? [];
  },

  async cadastrar(dados: CadastrarLivroPayload): Promise<{ id_livro: number }> {
    const formData = new FormData();
    formData.append('titulo', dados.titulo);
    if (dados.subtitulo) formData.append('subtitulo', dados.subtitulo);
    dados.autores.forEach((nome) => formData.append('autores', nome));
    formData.append('tipo_obra', dados.tipo_obra);
    formData.append('ano_publicacao', String(dados.ano_publicacao));
    formData.append('num_paginas', String(dados.num_paginas));
    dados.generos.forEach((nome) => formData.append('generos', nome));
    if (dados.editora) formData.append('editora', dados.editora);

    const { data } = await api.post('/livros/cadastrar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return { id_livro: data.livro.id_livro };
  },

  async deletar(idLivro: number): Promise<void> {
    await api.delete(`/livros/deletar/${idLivro}`);
  },
};