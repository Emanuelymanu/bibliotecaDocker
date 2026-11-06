export const EVENTO_PERMISSAO_ALTERADA = 'usuario.permissao_alterada';

export interface EventoPermissaoAlterada {
  usuarioId: number;
  tipo_usuario: 'usuario' | 'admin';
  alteradoEm: Date;
}

export class EventoPermissaoInvalidoError extends Error {}


export function lerEventoPermissao(dados: unknown): EventoPermissaoAlterada {
  if (typeof dados !== 'object' || dados === null || Array.isArray(dados)) {
    throw new EventoPermissaoInvalidoError('o corpo do evento não é um objeto');
  }
  const { usuarioId, tipo_usuario, alteradoEm } = dados as Record<string, unknown>;

  if (!Number.isInteger(usuarioId) || (usuarioId as number) < 1) {
    throw new EventoPermissaoInvalidoError('usuarioId deve ser um inteiro positivo');
  }
  if (tipo_usuario !== 'usuario' && tipo_usuario !== 'admin') {
    throw new EventoPermissaoInvalidoError("tipo_usuario deve ser 'usuario' ou 'admin'");
  }
  const data = typeof alteradoEm === 'string' ? new Date(alteradoEm) : null;
  if (!data || Number.isNaN(data.getTime())) {
    throw new EventoPermissaoInvalidoError('alteradoEm deve ser uma data ISO');
  }
  return { usuarioId: usuarioId as number, tipo_usuario, alteradoEm: data };
}