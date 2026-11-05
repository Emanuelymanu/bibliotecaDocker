import { EstatisticasLeitor } from '../conquistas.tipos';


export const EVENTO_ESTATISTICAS_ATUALIZADAS = 'estatisticas.atualizadas';

export interface EventoEstatisticasAtualizadas {
  usuarioId: number;
  estatisticas: EstatisticasLeitor;
  
  geradoEm: Date;
}

export class EventoInvalidoError extends Error {}

const CAMPOS_NUMERICOS = [
  'livrosLidos',
  'livrosCadastrados',
  'paginasLidas',
  'totalSessoes',
  'totalAnotacoes',
  'totalAvaliacoes',
] as const;

const ehObjeto = (valor: unknown): valor is Record<string, unknown> =>
  typeof valor === 'object' && valor !== null && !Array.isArray(valor);

const ehContagem = (valor: unknown): valor is number => Number.isInteger(valor) && (valor as number) >= 0;


export function lerEventoEstatisticas(dados: unknown): EventoEstatisticasAtualizadas {
  if (!ehObjeto(dados)) throw new EventoInvalidoError('o corpo do evento não é um objeto');

  const { usuarioId, estatisticas, geradoEm } = dados;
  if (!Number.isInteger(usuarioId) || (usuarioId as number) < 1) {
    throw new EventoInvalidoError('usuarioId deve ser um inteiro positivo');
  }

  const data = typeof geradoEm === 'string' ? new Date(geradoEm) : null;
  if (!data || Number.isNaN(data.getTime())) {
    throw new EventoInvalidoError('geradoEm deve ser uma data ISO');
  }

  if (!ehObjeto(estatisticas)) throw new EventoInvalidoError('estatisticas ausente');
  for (const campo of CAMPOS_NUMERICOS) {
    if (!ehContagem(estatisticas[campo])) {
      throw new EventoInvalidoError(`estatisticas.${campo} deve ser um inteiro maior ou igual a zero`);
    }
  }
  if (typeof estatisticas.possuiMeta !== 'boolean') {
    throw new EventoInvalidoError('estatisticas.possuiMeta deve ser true ou false');
  }

  const porGeneroRecebido = estatisticas.livrosLidosPorGenero;
  if (!ehObjeto(porGeneroRecebido)) {
    throw new EventoInvalidoError('estatisticas.livrosLidosPorGenero deve ser um objeto { idGenero: quantidade }');
  }
  const livrosLidosPorGenero: Record<number, number> = {};
  for (const [idGenero, quantidade] of Object.entries(porGeneroRecebido)) {
    const id = Number(idGenero);
    if (!Number.isInteger(id) || id < 1 || !ehContagem(quantidade)) {
      throw new EventoInvalidoError(`livrosLidosPorGenero["${idGenero}"] inválido`);
    }
    livrosLidosPorGenero[id] = quantidade;
  }

  return {
    usuarioId: usuarioId as number,
    geradoEm: data,
    estatisticas: {
      livrosLidos: estatisticas.livrosLidos as number,
      livrosCadastrados: estatisticas.livrosCadastrados as number,
      paginasLidas: estatisticas.paginasLidas as number,
      totalSessoes: estatisticas.totalSessoes as number,
      totalAnotacoes: estatisticas.totalAnotacoes as number,
      totalAvaliacoes: estatisticas.totalAvaliacoes as number,
      possuiMeta: estatisticas.possuiMeta,
      livrosLidosPorGenero,
    },
  };
}


export function resumirEvento(evento: EventoEstatisticasAtualizadas): string {
  const e = evento.estatisticas;
  const generos = Object.entries(e.livrosLidosPorGenero)
    .map(([id, qtd]) => `${id}:${qtd}`)
    .join(',');
  return (
    `usuario=${evento.usuarioId} geradoEm=${evento.geradoEm.toISOString()} ` +
    `lidos=${e.livrosLidos} cadastrados=${e.livrosCadastrados} paginas=${e.paginasLidas} ` +
    `sessoes=${e.totalSessoes} anotacoes=${e.totalAnotacoes} avaliacoes=${e.totalAvaliacoes} ` +
    `meta=${e.possuiMeta ? 'sim' : 'nao'} generos={${generos}}`
  );
}