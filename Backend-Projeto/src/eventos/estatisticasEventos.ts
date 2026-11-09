import { NextFunction, Request, Response } from 'express';
import { calcularEstatisticasLeitor } from '../conquistas/estatisticasLeitor';
import { EstatisticasLeitor } from '../conquistas/conquistas.tipos';
import { publicarEvento } from './publicadorEventos';


export const EVENTO_ESTATISTICAS_ATUALIZADAS = 'estatisticas.atualizadas';

export interface EstatisticasAtualizadasEvento {
    usuarioId: number;
    estatisticas: EstatisticasLeitor;

    geradoEm: string;
}

type Calcular = (usuarioId: number) => Promise<EstatisticasLeitor>;
type Publicar = typeof publicarEvento;


export async function notificarEstatisticasAtualizadas(
    usuarioId: number,
    calcular: Calcular = calcularEstatisticasLeitor,
    publicar: Publicar = publicarEvento,
): Promise<void> {
    try {
        const evento: EstatisticasAtualizadasEvento = {
            usuarioId,
            estatisticas: await calcular(usuarioId),
            geradoEm: new Date().toISOString(),
        };
        await publicar(EVENTO_ESTATISTICAS_ATUALIZADAS, evento, `usuario=${usuarioId}`);
    } catch (erro) {
        const motivo = erro instanceof Error ? erro.message : String(erro);
        console.error(`[eventos] falha ao montar ${EVENTO_ESTATISTICAS_ATUALIZADAS} usuario=${usuarioId}: ${motivo}`);
    }
}

const METODOS_DE_ESCRITA = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);


export function publicarEstatisticasAposEscrita(notificar: (usuarioId: number) => Promise<void> = notificarEstatisticasAtualizadas) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (METODOS_DE_ESCRITA.has(req.method)) {
            res.on('finish', () => {
                const usuarioId = req.usuario?.id;
                if (usuarioId && res.statusCode >= 200 && res.statusCode < 300) {
                    void notificar(usuarioId);
                }
            });
        }
        next();
    };
}