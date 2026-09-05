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

export async function buscarLivrosNaAPI(termoBusca: string): Promise<Livro[]> {
  if (!termoBusca.trim()) {
    return [];
  }

  // Busca via backend (GET /api/livros/buscar) em vez de chamar o Google
  // Books direto do celular. O backend já usa a GOOGLE_BOOKS_API_KEY do
  // .env, que tem uma cota bem maior que o acesso anônimo (que estava
  // batendo em 429 rápido, principalmente em rede de operadora).
  const { data } = await api.get<{ livros: GoogleBooksItem[] }>('/livros/buscar', {
    params: { query: termoBusca },
  });

  const items = data.livros;

  if (!items) {
    return [];
  }

  return items.map((item) => ({
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
}

function extrairAno(dataPublicacao?: string): number | undefined {
  if (!dataPublicacao) return undefined;
  const ano = parseInt(dataPublicacao.substring(0, 4));
  return isNaN(ano) ? undefined : ano;
}