export interface Livro {
    id_livro: number;
    id_google: string;
    titulo: string;
    subtitulo?: string | null;
    autor: string;
    tipo_obra: 'unico' | 'trilogia' | 'serie' | 'colecao';
    nome_serie?: string | null;
    volume?: number | null;
    total_volumes?: number | null;
    ano_publicacao?: number | null;
    num_paginas: number;
    editora?: string | null;
    genero?: string | null;
    capa?: string | null;
    created_at?: Date;
    updated_at?: Date;
}

export interface CriarLivroDTO {
    id_google: string;
    titulo: string;
    subtitulo?: string;
    autor: string;
    tipo_obra: 'unico' | 'trilogia' | 'serie' | 'colecao';
    nome_serie?: string;
    volume?: number;
    total_volumes?: number;
    ano_publicacao?: number;
    num_paginas: number;
    editora?: string;
    genero?: string;
    capa?: string;
}

export interface AtualizarLivroDTO {
    id_google?: string;
    titulo?: string;
    subtitulo?: string;
    autor?: string;
    tipo_obra?: 'unico' | 'trilogia' | 'serie' | 'colecao';
    nome_serie?: string;
    volume?: number;
    total_volumes?: number;
    ano_publicacao?: number;
    num_paginas?: number;
    editora?: string;
    genero?: string;
    capa?: string;
}

export interface LivroResponse {
    id_livro: number;
    id_google: string;
    titulo: string;
    subtitulo?: string | null;
    autor: string;
    tipo_obra: string;
    nome_serie?: string | null;
    volume?: number | null;
    total_volumes?: number | null;
    ano_publicacao?: number | null;
    num_paginas: number;
    editora?: string | null;
    genero?: string | null;
    capa?: string | null;
}

export interface ListarLivrosQuery {
    page?: number;
    limit?: number;
    busca?: string;
    genero?: string;
    editora?: string;
    tipo_obra?: string;
    nome_serie?: string;
    avaliacao_min?: number;
    avaliacao_max?: number;
    ordenar_por?: 'titulo' | 'autor' | 'ano_publicacao' | 'num_paginas' | 'created_at';
    ordem?: 'ASC' | 'DESC';
}