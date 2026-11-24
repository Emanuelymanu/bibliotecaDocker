jest.mock('../../models-auto/leituras', () => ({ leituras: { findAll: jest.fn() } }));
jest.mock('../../models-auto/sessoes_leitura', () => ({ sessoes_leitura: { count: jest.fn() } }));
jest.mock('../../models-auto/anotacoes', () => ({ anotacoes: { count: jest.fn() } }));
jest.mock('../../models-auto/metas_leituras', () => ({ metas_leituras: { count: jest.fn() } }));
jest.mock('../../models-auto/livros', () => ({ livros: {} }));
jest.mock('../../models-auto/generos', () => ({ generos: {} }));

import { leituras } from '../../models-auto/leituras';
import { sessoes_leitura } from '../../models-auto/sessoes_leitura';
import { anotacoes } from '../../models-auto/anotacoes';
import { metas_leituras } from '../../models-auto/metas_leituras';
import { calcularEstatisticasLeitor } from '../../eventos/estatisticasLeitor';

const mock = (fn: unknown) => fn as jest.Mock;

function leitura(id: number, status: string, paginas: number | null, idsGeneros: number[], avaliacao?: number | null) {
    return {
        id_leitura: id,
        status,
        avaliacao,
        id_livro_livro: { num_paginas: paginas, generos: idsGeneros.map((id_genero) => ({ id_genero })) },
    };
}

describe('calcularEstatisticasLeitor (GDL-70)', () => {
    beforeEach(() => jest.resetAllMocks());

    it('soma os números do leitor no formato do conquistas-service', async () => {
        mock(leituras.findAll).mockResolvedValue([
            leitura(1, 'lido', 300, [2, 5], 5),
            leitura(2, 'lido', 200, [2]),
            leitura(3, 'lendo', 500, [5], 4),
            leitura(4, 'quero_ler', null, [], null),
        ]);
        mock(sessoes_leitura.count).mockResolvedValue(6);
        mock(anotacoes.count).mockResolvedValue(2);
        mock(metas_leituras.count).mockResolvedValue(1);

        await expect(calcularEstatisticasLeitor(7)).resolves.toEqual({
            livrosLidos: 2,
            livrosCadastrados: 4,
            paginasLidas: 500,
            totalSessoes: 6,
            totalAnotacoes: 2,
            totalAvaliacoes: 2,
            possuiMeta: true,
            livrosLidosPorGenero: { 2: 2, 5: 1 },
        });
        expect(leituras.findAll).toHaveBeenCalledWith(expect.objectContaining({ where: { id_usuario: 7 } }));
    });

    it('leitor sem livros: tudo zerado e sem consultar sessões nem anotações', async () => {
        mock(leituras.findAll).mockResolvedValue([]);
        mock(metas_leituras.count).mockResolvedValue(0);

        await expect(calcularEstatisticasLeitor(7)).resolves.toEqual({
            livrosLidos: 0,
            livrosCadastrados: 0,
            paginasLidas: 0,
            totalSessoes: 0,
            totalAnotacoes: 0,
            totalAvaliacoes: 0,
            possuiMeta: false,
            livrosLidosPorGenero: {},
        });
        expect(sessoes_leitura.count).not.toHaveBeenCalled();
        expect(anotacoes.count).not.toHaveBeenCalled();
    });
});