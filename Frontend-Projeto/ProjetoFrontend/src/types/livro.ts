import type { Leitura } from "./leitura";

export interface Livro {
    id_livro: number;
    titulo: string;
    subtitulo?: string;
    autor: string;
    tipo_obra: 'unico' | 'trilogia' | 'serie' | 'colecao';
    nome_serie?: string;
    ano_publicacao?: number;
    num_paginas: number;
    editora?: string;
    genero?: string;
    capa?: string;
    status_leitura?: 'Abandonado' | 'Lido' | 'Lendo' | 'Quero Ler' | 'Não lido' | 'Relendo';
    avaliacao?: number;
    leituras?: Leitura[],
    avaliacao_media?: number;
    created_at?: string;
    updated_at?: string;
    usuarioId?: number;
}

export interface CriarLivroDTO {
    titulo: string;
    subtitulo?: string;
    autor: string;
    tipo_obra: 'unico' | 'trilogia' | 'serie' | 'colecao';
    nome_serie?: string;
    ano_publicacao?: string;
    num_paginas: string;
    editora?: string;
    genero?: string;
    status?: string;
    avaliacao?: number;
    id_google?: string;
}
export interface LivroInput {
    titulo: string;
    autor: string;
    genero: string;
    editora: string;
    avaliacao: number;
    capa: string;

    status: 'Lido' | 'Lendo' | 'Quero Ler' | 'Abandonado' | 'Não lido';
}

export interface LivroResponse {
    sucesso: boolean;
    data: Livro | Livro[];
    mensagem?: string;
}

export interface FiltersType {
    statusFilter: string;
    generoFilter: string;
    editoraFilter: string;
    avaliacaoFilter: string;
    sortBy: string;
}

export interface LivrosListResponse {
    livros: Livro[];
    total: number;
}