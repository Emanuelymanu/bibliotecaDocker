// src/services/googleBooksService.ts
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

export interface GoogleBooksResponse {
  items: GoogleBooksItem[];
  totalItems: number;
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

export async function buscarLivrosNaAPI(termoBusca: string): Promise<Livro[]> {
  if (!termoBusca.trim()) {
    return [];
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(termoBusca)}&maxResults=40`
    );

    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status}`);
    }

    const data: GoogleBooksResponse = await response.json();

    if (!data.items) {
      return [];
    }

    return data.items.map((item) => ({
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
    }));
  } catch (error) {
    console.error('Erro ao buscar livros:', error);
    return [];
  }
}

function extrairAno(dataPublicacao?: string): number | undefined {
  if (!dataPublicacao) return undefined;
  const ano = parseInt(dataPublicacao.substring(0, 4));
  return isNaN(ano) ? undefined : ano;
}