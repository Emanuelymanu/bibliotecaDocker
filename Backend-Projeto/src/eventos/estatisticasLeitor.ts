import { Op } from 'sequelize';
import { anotacoes } from '../models-auto/anotacoes';
import { generos } from '../models-auto/generos';
import { leituras } from '../models-auto/leituras';
import { livros } from '../models-auto/livros';
import { metas_leituras } from '../models-auto/metas_leituras';
import { sessoes_leitura } from '../models-auto/sessoes_leitura';


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


export async function calcularEstatisticasLeitor(usuarioId: number): Promise<EstatisticasLeitor> {
    const leiturasDoUsuario = await leituras.findAll({
        where: { id_usuario: usuarioId },
        attributes: ['id_leitura', 'status', 'avaliacao'],
        include: [{
            model: livros,
            as: 'id_livro_livro',
            attributes: ['num_paginas'],
            include: [{
                model: generos,
                as: 'generos',
                attributes: ['id_genero'],
                through: { attributes: [] },
            }],
        }],
    });

    const idsLeituras = leiturasDoUsuario.map((leitura) => leitura.id_leitura);
    const lidas = leiturasDoUsuario.filter((leitura) => leitura.status === 'lido');

    const paginasLidas = lidas.reduce(
        (total, leitura) => total + Number(leitura.id_livro_livro?.num_paginas || 0),
        0,
    );

    const livrosLidosPorGenero: Record<number, number> = {};
    for (const leitura of lidas) {
        for (const genero of leitura.id_livro_livro?.generos ?? []) {
            if (genero.id_genero) {
                livrosLidosPorGenero[genero.id_genero] = (livrosLidosPorGenero[genero.id_genero] ?? 0) + 1;
            }
        }
    }

    const totalAvaliacoes = leiturasDoUsuario.filter(
        (leitura) => leitura.avaliacao !== null && leitura.avaliacao !== undefined,
    ).length;

    const doUsuario = { id_leitura: { [Op.in]: idsLeituras } };
    const [totalSessoes, totalAnotacoes, totalMetas] = await Promise.all([
        idsLeituras.length ? sessoes_leitura.count({ where: doUsuario }) : 0,
        idsLeituras.length ? anotacoes.count({ where: doUsuario }) : 0,
        metas_leituras.count({ where: { id_usuario: usuarioId } }),
    ]);

    return {
        livrosLidos: lidas.length,
        livrosCadastrados: leiturasDoUsuario.length,
        paginasLidas,
        totalSessoes,
        totalAnotacoes,
        totalAvaliacoes,
        possuiMeta: totalMetas > 0,
        livrosLidosPorGenero,
    };
}