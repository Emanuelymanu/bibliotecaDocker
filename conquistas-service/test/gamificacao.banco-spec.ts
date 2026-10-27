import 'reflect-metadata';
import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { DataSource, QueryRunner } from 'typeorm';
import { configBancoDoAmbiente, opcoesBanco } from '../src/banco/opcoes-banco';
import { ConquistaDoUsuario } from '../src/conquistas/entities/conquista-do-usuario.entity';
import { Conquista } from '../src/conquistas/entities/conquista.entity';


function lerAmbiente(): NodeJS.ProcessEnv {
    try {
        return { ...parseEnv(readFileSync('.env', 'utf8')), ...process.env };
    } catch {
        return process.env;
    }
}

describe('banco gamificacao (integração)', () => {
    let banco: DataSource;
    let transacao: QueryRunner;

    beforeAll(async () => {
       
        const opcoes = { ...opcoesBanco(configBancoDoAmbiente(lerAmbiente())), logging: false };
        banco = await new DataSource(opcoes).initialize();
    });

    afterAll(async () => {
        await banco?.destroy();
    });

    beforeEach(async () => {
        transacao = banco.createQueryRunner();
        await transacao.startTransaction();
    });

    afterEach(async () => {
        await transacao.rollbackTransaction();
        await transacao.release();
    });

    it('não tem migração pendente', async () => {
        expect(await banco.showMigrations()).toBe(false);
    });

    it('o usuário só enxerga o banco gamificacao, nunca o projeto5p', async () => {
        const bancos: { Database: string }[] = await banco.query('SHOW DATABASES');
        const nomes = bancos.map((b) => b.Database);

        expect(nomes).toContain('gamificacao');
        expect(nomes).not.toContain('projeto5p');
        await expect(banco.query('SELECT 1 FROM projeto5p.conquistas LIMIT 1')).rejects.toThrow();
    });

    it('grava e lê conquista e desbloqueio pelas entities', async () => {
        const conquistas = transacao.manager.getRepository(Conquista);
        const desbloqueios = transacao.manager.getRepository(ConquistaDoUsuario);

        const conquista = await conquistas.save(
            conquistas.create({ nome: 'Teste integração', tipo: 'LIVROS_LIDOS', valor_alvo: 5 }),
        );
        await desbloqueios.save({ id_usuario: 999999, id_conquista: conquista.id_conquista, data_conquista: '2026-10-27' });

        const lida = await conquistas.findOneOrFail({
            where: { id_conquista: conquista.id_conquista },
            relations: { desbloqueios: true },
        });

        expect(lida).toMatchObject({ tipo: 'LIVROS_LIDOS', valor_alvo: 5, id_genero: null });
        expect(lida.desbloqueios).toEqual([
            expect.objectContaining({ id_usuario: 999999, data_conquista: '2026-10-27' }),
        ]);
    });

    it('o mesmo usuário não ganha a mesma conquista duas vezes', async () => {
        const conquista = await transacao.manager.save(Conquista, { nome: 'Teste duplicada' });
        const desbloqueio = { id_usuario: 999999, id_conquista: conquista.id_conquista };

        await transacao.manager.insert(ConquistaDoUsuario, desbloqueio);

        await expect(transacao.manager.insert(ConquistaDoUsuario, desbloqueio)).rejects.toThrow(/Duplicate entry/);
    });

    it('apagar a conquista apaga os desbloqueios dela (ON DELETE CASCADE)', async () => {
        const conquista = await transacao.manager.save(Conquista, { nome: 'Teste cascade' });
        await transacao.manager.insert(ConquistaDoUsuario, { id_usuario: 999999, id_conquista: conquista.id_conquista });

        await transacao.manager.delete(Conquista, conquista.id_conquista);

        expect(await transacao.manager.countBy(ConquistaDoUsuario, { id_conquista: conquista.id_conquista })).toBe(0);
    });
});
