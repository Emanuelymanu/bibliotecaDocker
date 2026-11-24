import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';
import { CacheCatalogoService } from '../src/conquistas/cache-catalogo.service';
import { ConquistasService } from '../src/conquistas/conquistas.service';
import { lerEventoEstatisticas } from '../src/conquistas/eventos/estatisticas-atualizadas';


const LEITOR = { id: 990272, email: 'novas@teste.com', nome: 'Leitor Novas', tipo_usuario: 'usuario' as const };
const ADMIN = { id: 990279, email: 'admin-novas@teste.com', nome: 'Admin', tipo_usuario: 'admin' as const };

const token = (u: typeof LEITOR | typeof ADMIN) =>
  `Bearer ${jwt.sign(u, process.env.JWT_SECRET as string, { expiresIn: '1h' })}`;

describe('GET /api/conquistas/novas (integração com MySQL)', () => {
  let app: INestApplication;
  let banco: DataSource;
  const ids: Record<'primeiroLivro' | 'meta' | 'manual', number> = { primeiroLivro: 0, meta: 0, manual: 0 };

  const http = () => request(app.getHttpServer());
  const novas = async () => {
    const r = await http().get('/api/conquistas/novas').set('Authorization', token(LEITOR)).expect(200);
    return (r.body.conquistas as { id_conquista: number }[])
      .map((c) => c.id_conquista)
      .filter((id) => Object.values(ids).includes(id));
  };

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = modulo.createNestApplication({ logger: false });
    configurarApp(app);
    await app.init();
    banco = app.get(DataSource);
    await limpar();

    const criar = async (corpo: object) =>
      (await http().post('/api/conquistas/admin').set('Authorization', token(ADMIN)).send(corpo).expect(201)).body
        .conquista.id_conquista as number;
    ids.primeiroLivro = await criar({ nome: '[teste-novas] Primeiro livro', tipo: 'LIVROS_LIDOS', valor_alvo: 1 });
    ids.meta = await criar({ nome: '[teste-novas] Planejador', tipo: 'POSSUI_META' });
    ids.manual = await criar({ nome: '[teste-novas] Clube do livro', criterio: 'Foi ao encontro do clube' });
  });

  afterAll(async () => {
    await limpar();
    await app?.close();
  });

  async function limpar() {
    await banco.query('DELETE FROM usuario_conquistas WHERE id_usuario = ?', [LEITOR.id]);
    await banco.query('DELETE FROM estatisticas_leitor WHERE id_usuario = ?', [LEITOR.id]);
    await banco.query("DELETE FROM conquistas WHERE nome LIKE '[teste-novas]%'");
    await app.get(CacheCatalogoService).invalidarUsuario(LEITOR.id, 'limpeza do teste');
  }

  it('sem conquista nova: lista vazia', async () => {
    expect(await novas()).toEqual([]);
  });

  it('conquistas concedidas pelo evento aparecem uma vez e depois não aparecem mais', async () => {
    await app.get(ConquistasService).registrarEstatisticas(
      lerEventoEstatisticas({
        usuarioId: LEITOR.id,
        geradoEm: new Date().toISOString(),
        estatisticas: {
          livrosLidos: 1,
          livrosCadastrados: 1,
          paginasLidas: 200,
          totalSessoes: 0,
          totalAnotacoes: 0,
          totalAvaliacoes: 0,
          possuiMeta: true,
          livrosLidosPorGenero: {},
        },
      }),
    );

    const primeira = await http().get('/api/conquistas/novas').set('Authorization', token(LEITOR)).expect(200);
    const minhas = (primeira.body.conquistas as { id_conquista: number }[]).filter((c) =>
      Object.values(ids).includes(c.id_conquista),
    );
    expect(minhas.map((c) => c.id_conquista).sort()).toEqual([ids.primeiroLivro, ids.meta].sort());
    expect(minhas[0]).toEqual(
      expect.objectContaining({ nome: expect.stringMatching(/^\[teste-novas\]/), data_conquista: expect.any(String) }),
    );

    expect(await novas()).toEqual([]);
  });

  it('conquista manual dada pelo admin também avisa o leitor', async () => {
    await http()
      .post(`/api/conquistas/admin/${ids.manual}/conceder`)
      .set('Authorization', token(ADMIN))
      .send({ id_usuario: LEITOR.id })
      .expect(201);

    expect(await novas()).toEqual([ids.manual]);
  });

  it('duas chamadas ao mesmo tempo não avisam a mesma conquista duas vezes', async () => {
    await banco.query('UPDATE usuario_conquistas SET visualizada = 0 WHERE id_usuario = ?', [LEITOR.id]);

    const [a, b] = await Promise.all([novas(), novas()]);

    expect([...a, ...b].sort()).toEqual(Object.values(ids).sort());
  });

  it('as rotas antigas continuam iguais: /api/conquistas lista tudo, visto ou não', async () => {
    const r = await http().get('/api/conquistas').set('Authorization', token(LEITOR)).expect(200);
    const doTeste = (r.body.conquistas as { id_conquista: number }[]).filter((c) =>
      Object.values(ids).includes(c.id_conquista),
    );
    expect(doTeste).toHaveLength(3);
  });

  it('sem token: 401', async () => {
    await http().get('/api/conquistas/novas').expect(401);
  });
});