import { StatusTom } from '@/components/BookCard';

export const FILTROS: { label: string; valor?: string }[] = [
  { label: 'Todos', valor: undefined },
  { label: 'Quero Ler', valor: 'quero_ler' },
  { label: 'Lendo', valor: 'lendo' },
  { label: 'Lido', valor: 'lido' },
  { label: 'Abandonado', valor: 'abandonado' },
];

export const STATUS_LABEL: Record<string, string> = {
  nao_lido: 'Não Lido',
  quero_ler: 'Quero Ler',
  lendo: 'Lendo',
  lido: 'Lido',
  abandonado: 'Abandonado',
  relendo: 'Relendo',
};

export const STATUS_TOM: Record<string, StatusTom> = {
  quero_ler: 'neutro',
  lendo: 'aviso',
  lido: 'sucesso',
  abandonado: 'perigo',
  relendo: 'aviso',
};

export const TIPOS_OBRA: { label: string; valor: string }[] = [
  { label: 'Único', valor: 'unico' },
  { label: 'Trilogia', valor: 'trilogia' },
  { label: 'Série', valor: 'serie' },
  { label: 'Coleção', valor: 'colecao' },
];

export const GENEROS_SUGERIDOS = [
  'Fantasia', 'Ficção Científica', 'Romance', 'História', 'Biografia',
  'Tecnologia', 'Autoajuda', 'Terror', 'Suspense', 'Poesia', 'Infantil',
];
