export type TipoObra = 'unico' | 'trilogia' | 'serie' | 'colecao';

export interface CriarLivroDTO {
    titulo: string;
    subtitulo?: string;
    autor: string;
    tipo_obra: TipoObra;
    ano_publicacao?: string;
    num_paginas: string;
    genero?: string;
    editora?: string;
}

export interface CapaSelecionada {
    uri: string;
    nome: string;
    tipoMime: string;
    tamanhoBytes?: number;
}
