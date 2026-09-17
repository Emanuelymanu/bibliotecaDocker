import { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ConquistaCatalogo } from '../services/conquistasService';

type NomeIcone = ComponentProps<typeof Ionicons>['name'];

export function iconeConquista(c: Pick<ConquistaCatalogo, 'nome' | 'criterio' | 'descricao'>): NomeIcone {
  const texto = `${c.nome} ${c.criterio ?? ''} ${c.descricao ?? ''}`.toLowerCase();

  if (texto.includes('sessão') || texto.includes('sessao')) return 'timer-outline';
  if (texto.includes('anota')) return 'create-outline';
  if (texto.includes('avali') || texto.includes('crític') || texto.includes('critic')) return 'sparkles-outline';
  if (texto.includes('gênero') || texto.includes('genero') || texto.includes('explorador')) return 'compass-outline';
  if (texto.includes('página') || texto.includes('pagina')) return 'flame-outline';
  if (texto.includes('meta')) return 'flag-outline';
  if (texto.includes('cadastr')) return 'book-outline';
  if (texto.includes('primeira leitura') || texto.includes('primeiro livro lido') || texto.includes('iniciante')) return 'star-outline';
  if (texto.includes('maraton') || texto.includes('20 livro') || texto.includes('vinte livro')) return 'trophy-outline';
  if (texto.includes('bibliófilo') || texto.includes('bibliofilo') || texto.includes('10 livro') || texto.includes('dez livro'))
    return 'library-outline';
  if (texto.includes('série') || texto.includes('serie') || texto.includes('5 livro') || texto.includes('cinco livro'))
    return 'layers-outline';

  return 'ribbon-outline';
}