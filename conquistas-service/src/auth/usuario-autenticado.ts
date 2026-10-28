import { Request } from "express";

export interface UsuarioAutenticado{
    id: number;
    email: string;
    nome: string;
    tipo_usuario: 'usuario' | 'admin'
}

export interface RequisicaoAutenticada extends Request{
    usuario: UsuarioAutenticado
}

export function ehUsuarioAutenticado(dados: unknown): dados is UsuarioAutenticado{
    if(typeof dados !== 'object' || dados === null) return false
    const dado = dados as Record<string, unknown>
    return (
        Number.isInteger(dado.id) && (dado.id as number)> 0 && (dado.tipo_usuario === 'usuario' || dado.tipo_usuario === 'admin')
    )
}