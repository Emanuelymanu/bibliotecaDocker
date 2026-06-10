// frontend/src/types/tag.ts
export interface Tag {
  id_tag: number;
  nome: string;
  cor: string;
  total_leituras?: number;
}

export interface CriarTagDTO {
  nome: string;
  cor?: string;
}

export interface AtualizarTagDTO {
  nome?: string;
  cor?: string;
}

export interface TagResponse {
  total: number;
  pagina: number;
  totalPaginas: number;
  tags: Tag[];
}

export interface VincularTagDTO {
  id_tag: number;
  id_leitura: number;
}