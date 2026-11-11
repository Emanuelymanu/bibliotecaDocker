import { NextFunction, Request, Response } from 'express';
import { calcularEstatisticasLeitor, EstatisticasLeitor } from './estatisticasLeitor';
import { guardarPendente, publicarEvento } from './publicadorEventos';


export const EVENTO_ESTATISTICAS_ATUALIZADAS = 'estatisticas.atualizadas';


export const CHAVE_ESTATISTICAS_PENDENTES = 'eventos:pendentes:estatisticas.atualizadas';

export interface EstatisticasAtualizadasEvento {
    usuarioId: number;
    estatisticas: EstatisticasLeitor;

    geradoEm: string;
}

type Calcular = (usuarioId: number) => Promise<EstatisticasLeitor>;
type Publicar = typeof publicarEvento;
type Guardar = typeof guardarPendente;


export async function notificarEstatisticasAtualizadas(
    usuarioId: number,
    calcular: Calcular = calcularEstatisticasLeitor,
    publicar: Publicar = publicarEvento,
    guardar: Guardar = guardarPendente,
): Promise<void> {
    try {
        const evento: EstatisticasAtualizadasEvento = {
            usuarioId,
            estatisticas: await calcular(usuarioId),
            geradoEm: new Date().toISOString(),
        };
        const assinantes = await publicar(EVENTO_ESTATISTICAS_ATUALIZADAS, evento, `usuario=${usuarioId}`);


        if (assinantes === 0 && (await guardar(CHAVE_ESTATISTICAS_PENDENTES, String(usuarioId), evento))) {
            console.warn(
                `[eventos] ninguém recebeu ${EVENTO_ESTATISTICAS_ATUALIZADAS} usuario=${usuarioId}: ` +
                    'guardado para o conquistas-service processar quando voltar',
            );
        }
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