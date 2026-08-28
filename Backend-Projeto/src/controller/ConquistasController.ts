import { Op, Sequelize } from 'sequelize';
import { conquistas } from '../models-auto/conquistas';
import { leituras } from '../models-auto/leituras';
import { livros } from '../models-auto/livros';
import { generos } from '../models-auto/generos';
import { metas_leituras } from '../models-auto/metas_leituras';
import { sessoes_leitura } from '../models-auto/sessoes_leitura';
import { usuario_conquistas } from '../models-auto/usuario_conquistas';

type EstatisticasConquistas = {
    livrosLidos: number;
    paginasLidas: number;
    totalSessoes: number;
    possuiMeta: boolean;
    livrosLidosPorGenero: Record<string, number>;
};

function extrairNumero(texto: string): number | null {
    const correspondencia = texto.match(/\d+/);
    return correspondencia ? Number(correspondencia[0]) : null;
}

function atendeCriterio(textoBase: string, estatisticas: EstatisticasConquistas): boolean {
    const texto = textoBase.toLowerCase();
    const alvo = extrairNumero(texto) ?? 1;

    if (texto.includes('meta')) {
        return estatisticas.possuiMeta;
    }

    if (texto.includes('sess')) {
        return estatisticas.totalSessoes >= alvo;
    }

    if (texto.includes('pagina')) {
        return estatisticas.paginasLidas >= alvo;
    }

    if (texto.includes('livro') || texto.includes('leitura')) {
        const generoMencionado = Object.keys(estatisticas.livrosLidosPorGenero)
            .find((nomeGenero) => texto.includes(nomeGenero));

        if (generoMencionado) {
            return estatisticas.livrosLidosPorGenero[generoMencionado] >= alvo;
        }

        return estatisticas.livrosLidos >= alvo;
    }

    return false;
}

async function carregarEstatisticas(usuarioId: number): Promise<EstatisticasConquistas> {
    const leiturasDoUsuario = await leituras.findAll({
        where: { id_usuario: usuarioId },
        attributes: ['id_leitura', 'status'],
        include: [{
            model: livros,
            as: 'id_livro_livro',
            attributes: ['num_paginas'],
            include: [{
                model: generos,
                as: 'generos',
                attributes: ['nome'],
                through: { attributes: [] }
            }]
        }]
    });

    const idsLeituras = leiturasDoUsuario.map((leitura) => leitura.id_leitura);
    const leiturasLidas = leiturasDoUsuario.filter((leitura) => leitura.status === 'lido');
    const livrosLidos = leiturasLidas.length;
    const paginasLidas = leiturasLidas.reduce((total, leitura) => {
        return total + Number(leitura.id_livro_livro?.num_paginas || 0);
    }, 0);

    const livrosLidosPorGenero: Record<string, number> = {};
    leiturasLidas.forEach((leitura) => {
        const generosLivro = leitura.id_livro_livro?.generos || [];
        generosLivro.forEach((genero) => {
            if (genero.nome) {
                const chave = genero.nome.toLowerCase();
                livrosLidosPorGenero[chave] = (livrosLidosPorGenero[chave] || 0) + 1;
            }
        });
    });

    const totalSessoes = idsLeituras.length
        ? await sessoes_leitura.count({ where: { id_leitura: { [Op.in]: idsLeituras } } })
        : 0;

    const possuiMeta = await metas_leituras.count({ where: { id_usuario: usuarioId } }) > 0;

    return {
        livrosLidos,
        paginasLidas,
        totalSessoes,
        possuiMeta,
        livrosLidosPorGenero
    };
}

export async function verificarConquistas(usuarioId: number): Promise<conquistas[]> {
    const [todasConquistas, conquistasExistentes, estatisticas] = await Promise.all([
        conquistas.findAll(),
        usuario_conquistas.findAll({ where: { id_usuario: usuarioId }, attributes: ['id_conquista'] }),
        carregarEstatisticas(usuarioId)
    ]);

    const idsJaConquistados = new Set(conquistasExistentes.map((item) => item.id_conquista));
    const novasConquistas = todasConquistas.filter((conquista) => {
        if (idsJaConquistados.has(conquista.id_conquista)) {
            return false;
        }

        const textoBase = [conquista.nome, conquista.criterio, conquista.descricao]
            .filter(Boolean)
            .join(' ');

        return atendeCriterio(textoBase, estatisticas);
    });

    if (!novasConquistas.length) {
        return [];
    }

    const dataConquista = new Date().toISOString().slice(0, 10);

    await usuario_conquistas.bulkCreate(
        novasConquistas.map((conquista) => ({
            id_usuario: usuarioId,
            id_conquista: conquista.id_conquista,
            data_conquista: dataConquista
        }))
    );

    return conquistas.findAll({
        where: {
            id_conquista: {
                [Op.in]: novasConquistas.map((conquista) => conquista.id_conquista)
            }
        },
        order: [['id_conquista', 'ASC']]
    });
}