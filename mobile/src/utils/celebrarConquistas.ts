import { Alert } from 'react-native';

export interface ConquistaDesbloqueada {
  id_conquista: number;
  nome: string;
  descricao?: string;
}

export function celebrarConquistas(novasConquistas?: ConquistaDesbloqueada[] | null) {
  if (!novasConquistas || novasConquistas.length === 0) return;

  if (novasConquistas.length === 1) {
    const c = novasConquistas[0];
    Alert.alert('🏆 Conquista desbloqueada!', c.descricao ? `${c.nome}\n${c.descricao}` : c.nome);
    return;
  }

  const nomes = novasConquistas.map((c) => `• ${c.nome}`).join('\n');
  Alert.alert('🏆 Novas conquistas desbloqueadas!', nomes);
}