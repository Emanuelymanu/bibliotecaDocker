import { publicarEvento } from './publicadorEventos';

export const EVENTO_PERMISSAO_ALTERADA = 'usuario.permissao_alterada'

export type TipoUsuario = 'usuario' | 'admin'

export interface PermissaoAlteradaEvento{
    usuarioId: number;
    tipo_usuario: TipoUsuario;
    alteradoEm: string
}

type Publicar = typeof publicarEvento

export async function notificarPermissaoAlterada(
    usuarioId: number,
    tipo_usuario: TipoUsuario,
    alteradoEm: Date = new Date(),
    publicar: Publicar = publicarEvento,
): Promise<boolean> {
    const evento: PermissaoAlteradaEvento = { usuarioId, tipo_usuario, alteradoEm: alteradoEm.toISOString() };
    const assinantes = await publicar(EVENTO_PERMISSAO_ALTERADA, evento, `usuario=${usuarioId} tipo=${tipo_usuario}`);
    return assinantes !== null;
}