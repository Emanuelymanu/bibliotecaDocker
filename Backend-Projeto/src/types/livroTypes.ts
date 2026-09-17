export interface Livro {
    id_livro: number;
    id_google: string;
    titulo: string;
    subtitulo?: string | null;
    tipo_obra: 'unico' | 'trilogia' | 'serie' | 'colecao';
    ano_publicacao?: number | null;
    num_paginas: number;
    id_editora?: number | null;
    capa?: string | null;
    avaliacao_media?: number | null;
    total_avaliacoes?: number | null;
    created_at?: Date;
    updated_at?: Date;
}


export interface CriarLivroDTO {
    id_google: string;
    titulo: string;
    subtitulo?: string;
    autores: string[];
    tipo_obra: 'unico' | 'trilogia' | 'serie' | 'colecao';
    ano_publicacao?: number;
    num_paginas: number;
    editora?: string;
    generos?: string[];
    capa?: string;
}

export interface AtualizarLivroDTO {
    id_google?: string;
    titulo?: string;
    subtitulo?: string | null;
    autores?: string[];
    tipo_obra?: 'unico' | 'trilogia' | 'serie' | 'colecao';
    ano_publicacao?: number | null;
    num_paginas?: number;
    editora?: string | null;
    generos?: string[];
    capa?: string;
}

/** Formato de resposta ao frontend: autores/generos já vêm "achatados"
 *  em nome (o frontend não precisa saber dos ids internos pra exibir). */
export interface LivroResponse {
    id_livro: number;
    id_google: string;
    titulo: string;
    subtitulo?: string | null;
    autores: string[];
    tipo_obra: string;
    ano_publicacao?: number | null;
    num_paginas: number;
    editora?: string | null;
    generos: string[];
    capa?: string | null;
}

export interface ListarLivrosQuery {
    page?: number;
    limit?: number;
    busca?: string;
    genero?: string;
    editora?: string;
    tipo_obra?: string;
    autor?: string;
    avaliacao_min?: number;
    avaliacao_max?: number;
    ordenar_por?: 'titulo' | 'ano_publicacao' | 'num_paginas' | 'created_at';
    ordem?: 'ASC' | 'DESC';
}
