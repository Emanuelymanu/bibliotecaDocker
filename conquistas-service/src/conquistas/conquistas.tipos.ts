export const TIPOS_CONQUISTA = [
  'MANUAL',
  'LIVROS_LIDOS',
  'LIVROS_CADASTRADOS',
  'PAGINAS_LIDAS',
  'SESSOES',
  'ANOTACOES',
  'AVALIACOES',
  'GENEROS_DISTINTOS',
  'LIVROS_GENERO',
  'POSSUI_META',
] as const;

export type TipoConquista = typeof TIPOS_CONQUISTA[number];


export interface CriterioConquista {
  tipo: TipoConquista;
  valor_alvo: number;
  id_genero?: number | null;
}


export interface EstatisticasLeitor {
  livrosLidos: number;
  livrosCadastrados: number;
  paginasLidas: number;
  totalSessoes: number;
  totalAnotacoes: number;
  totalAvaliacoes: number;
  possuiMeta: boolean;

  livrosLidosPorGenero: Record<number, number>;
}