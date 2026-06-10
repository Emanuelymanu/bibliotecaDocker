
export interface DashboardEstatisticas {
  total_usuarios: number;
  total_livros: number;
  total_leituras: number;
  total_paginas_lidas: number;
  livros_lidos: number;
  livros_lendo: number;
  livros_quero_ler: number;
}

export interface GeneroMaisLido {
  genero: string;
  quantidade: number;
}

export interface DashboardResponse {
  estatisticas: DashboardEstatisticas;
  ultimos_livros: any[];
  generos_mais_lidos: GeneroMaisLido[];
  avaliacao_media: number;
}