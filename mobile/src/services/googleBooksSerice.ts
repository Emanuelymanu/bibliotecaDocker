import { api } from './api';

export interface Livro {
  id_google: string;
  titulo: string;
  subtitulo?: string;
  autores: string[];
  capa: string;
  num_paginas: number;
  ano_publicacao?: number;
  avaliacao_media?: number;
  total_avaliacoes?: number;
  editora?: string;
  generos?: string[];
}

interface GoogleBooksItem {
  id: string;
  volumeInfo: {
    title: string;
    subtitle?: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    pageCount?: number;
    imageLinks?: {
      thumbnail?: string;
      medium?: string;
    };
    averageRating?: number;
    ratingsCount?: number;
    categories?: string[];
  };
}

function mapearItemGoogle(item: GoogleBooksItem): Livro {
  return {
    id_google: item.id,
    titulo: item.volumeInfo.title || 'Título desconhecido',
    subtitulo: item.volumeInfo.subtitle,
    autores: item.volumeInfo.authors || ['Autor desconhecido'],
    capa: item.volumeInfo.imageLinks?.thumbnail || item.volumeInfo.imageLinks?.medium || '',
    num_paginas: item.volumeInfo.pageCount || 0,
    ano_publicacao: extrairAno(item.volumeInfo.publishedDate),
    avaliacao_media: item.volumeInfo.averageRating || 0,
    total_avaliacoes: item.volumeInfo.ratingsCount || 0,
    editora: item.volumeInfo.publisher,
    generos: item.volumeInfo.categories,
  };
}


export async function buscarLivrosNaAPI(termoBusca: string): Promise<Livro[]> {
  if (!termoBusca.trim()) {
    return [];
  }

  try {
    const { data } = await api.get('/livros/buscar', { params: { query: termoBusca } });
    const items: GoogleBooksItem[] = data.livros ?? [];
    return items.map(mapearItemGoogle);
  } catch (error: any) {
    const mensagem = error.response?.data?.erro || 'Não foi possível buscar os livros. Tente novamente.';
    console.error('Erro ao buscar livros:', error);
    throw new Error(mensagem);
  }
}

function extrairAno(dataPublicacao?: string): number | undefined {
  if (!dataPublicacao) return undefined;
  const ano = parseInt(dataPublicacao.substring(0, 4));
  return isNaN(ano) ? undefined : ano;
}
