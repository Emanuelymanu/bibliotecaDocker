
export interface Anotacao {
  id_anotacao: number;
  id_leitura: number;
  pagina: number;
  titulo?: string;
  conteudo: string;
  created_at?: string;
  updated_at?: string;
}

export interface CriarAnotacaoDTO {
  id_leitura: number;
  pagina: number;
  titulo?: string;
  conteudo: string;
}

export interface AtualizarAnotacaoDTO {
  pagina?: number;
  titulo?: string;
  conteudo?: string;
}

export interface AnotacaoResponse {
  mensagem: string;
  anotacao: Anotacao;
}

export interface AnotacoesPorPaginaResponse {
  pagina: number;
  total: number;
  anotacoes: Anotacao[];
}