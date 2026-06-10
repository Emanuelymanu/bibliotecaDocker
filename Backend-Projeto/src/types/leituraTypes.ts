export type StatusLeitura = 'nao_lido' | 'quero_ler' | 'lendo' | 'lido' | 'abandonado' | 'relendo';

export interface Leitura {
    id_leitura: number;
    id_usuario: number;
    id_livro: number;
    status: StatusLeitura;
    data_inicio?: string | null;
    data_conclusao?: string | null;
    avaliacao?: number | null;
    resenha?: string | null;
    pagina_atual?: number | null;
    vezes_lido?: number | null;
    created_at: Date;
    updated_at: Date;
}

export interface CriarLeituraDTO {
    id_livro: number;
    status?: StatusLeitura;
    pagina_atual?: number;
}

export interface AtualizarLeituraDTO {
    pagina_atual?: number;
    status?: StatusLeitura;
    avaliacao?: number;
    resenha?: string;
}

export interface LeituraResponse {
    id_leitura: number;
    id_usuario: number;
    id_livro: number;
    status: StatusLeitura;
    data_inicio?: string | null;
    data_conclusao?: string | null;
    avaliacao?: number | null;
    resenha?: string | null;
    pagina_atual?: number | null;
    vezes_lido?: number | null;
    livro?: {
        id_livro: number;
        titulo: string;
        autor: string;
        num_paginas: number;
        capa?: string;
    };
}

export interface ListarLeiturasQuery {
    status?: StatusLeitura;
    page?: number;
    limit?: number;
}