export type StatusLeitura = 'nao_lido' | 'quero_ler' | 'lendo' | 'lido' | 'abandonado' | 'relendo';

export interface LivroInfo {
  id_livro: number;
  titulo: string;
  autor: string;
  genero?: string;
  num_paginas: number;
  capa?: string;
}

import type { Tag } from "./tags";

export interface Leitura {
  id_leitura: number;
  id_usuario: number;
  id_livro: number;
  status: StatusLeitura;
  data_inicio: string;
  data_conclusao?: string;
  avaliacao?: number;
  resenha?: string;
  pagina_atual: number;
  vezes_lido: number;
  livro?: LivroInfo;
  tags?: Tag[];
}
export interface CriarLeituraDTO {
  id_livro: number;
  status?: StatusLeitura;
  pagina_atual?: number;
}

export interface AtualizarProgressoDTO {
  pagina_atual: number;
  status?: StatusLeitura;
}

export interface AvaliarLeituraDTO {
  avaliacao: number;
  resenha?: string;
}

export interface ListarLeiturasResponse {
  total: number;
  pagina: number;
  totalPaginas: number;
  leituras: Leitura[];
}

export interface LeituraResponse {
  mensagem: string;
  leitura: Leitura;
}