export interface DashboardEstatisticas {
    total_usuarios: number;
    total_livros: number;
    total_leituras: number;
    total_paginas_lidas: number;
    livros_lidos: number;
    livros_lendo: number;
    livros_quero_ler: number;
}

export interface DashboardResponse {
    estatisticas: DashboardEstatisticas;
    ultimos_livros: any[];
    generos_mais_lidos: any[];
    avaliacao_media: number;
}