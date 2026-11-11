import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import Redis from 'ioredis';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';
import { CacheCatalogoService } from '../src/conquistas/cache-catalogo.service';
import {
  CHAVE_ESTATISTICAS_PENDENTES,
  EstatisticasPendentesService,
} from '../src/conquistas/eventos/estatisticas-pendentes.service';
import { conectarEventos } from '../src/eventos/conectar-eventos';
import { opcoesRedisDaUrl } from '../src/eventos/servidor-redis-eventos';


const CANAL = 'estatisticas.atualizadas';
const LEITOR = { id: 990377, email: 'fluxo@teste.com', nome: 'Leitor Fluxo', tipo_usuario: 'usuario' as const };
const ADMIN = { id: 990379, email: 'admin-fluxo@teste.com', nome: 'Admin', tipo_usuario: 'admin' as const };
const LIMITE_MS = 5000;


jest.setTimeout(20000);

const token = (u: typeof LEITOR | typeof ADMIN) =>
  `Bearer ${jwt.sign(u, process.env.JWT_SECRET as string, { expiresIn: '1h' })}`;

const esperar = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms));


function estatisticas(numeros: Partial<Record<string, unknown>> = {}) {
  return {
    livrosLidos: 0,
    livrosCadastrados: 0,
    paginasLidas: 0,
    totalSessoes: 0,
    totalAnotacoes: 0,
    totalAvaliacoes: 0,
    possuiMeta: false,
    livrosLidosPorGenero: {},
    ...numeros,
  };
}

describe('Fluxo de eventos: Redis -> conquistas-service -> /novas (e2e)', () => {
  let app: INestApplication;
  let publicador: Redis;
  let banco: DataSource;
  const ids = { tresSessoes: 0, primeiroLivro: 0, duasAvaliacoes: 0 };

  const http = () => request(app.getHttpServer());

  
  const publicar = (data: unknown) => publicador.publish(CANAL, JSON.stringify({ pattern: CANAL, data }));

  
  async function esperarNovas(idEsperado: number): Promise<{ id_conquista: number; nome: string }[]> {
    const inicio = Date.now();
    while (Date.now() - inicio < LIMITE_MS) {
      const resposta = await http().get('/api/conquistas/novas').set('Authorization', token(LEITOR)).expect(200);
      const novas = resposta.body.conquistas as { id_conquista: number; nome: string }[];
      if (novas.some((c) => c.id_conquista === idEsperado)) return novas;
      await esperar(150);
    }
    throw new Error(`a conquista #${idEsperado} não apareceu em /novas em ${LIMITE_MS}ms`);
  }

  beforeAll(async () => {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error('GDL-77 precisa de REDIS_URL (Redis rodando) para o teste do fluxo de eventos');

    const modulo = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = modulo.createNestApplication({ logger: false });
    configurarApp(app);
    await conectarEventos(app);
    await app.init();
    banco = app.get(DataSource);

    publicador = new Redis(opcoesRedisDaUrl(url));
    await limpar();


    const inicio = Date.now();
    for (;;) {
      const [, assinantes] = (await publicador.pubsub('NUMSUB', CANAL)) as [string, number];
      if (Number(assinantes) > 0) break;
      if (Date.now() - inicio > LIMITE_MS) throw new Error('o serviço não assinou o canal a tempo');
      await esperar(100);
    }

    const criar = async (corpo: object) =>
      (await http().post('/api/conquistas/admin').set('Authorization', token(ADMIN)).send(corpo).expect(201)).body
        .conquista.id_conquista as number;
    ids.primeiroLivro = await criar({ nome: '[teste-fluxo] Primeiro livro', tipo: 'LIVROS_LIDOS', valor_alvo: 1 });
    ids.tresSessoes = await criar({ nome: '[teste-fluxo] Três sessões', tipo: 'SESSOES', valor_alvo: 3 });
    ids.duasAvaliacoes = await criar({ nome: '[teste-fluxo] Duas avaliações', tipo: 'AVALIACOES', valor_alvo: 2 });
  });

  afterAll(async () => {
    if (banco) await limpar();
    await publicador?.quit();
    await app?.close();
  });

  async function limpar() {
    await banco.query('DELETE FROM usuario_conquistas WHERE id_usuario = ?', [LEITOR.id]);
    await publicador?.hdel(CHAVE_ESTATISTICAS_PENDENTES, String(LEITOR.id));
    await banco.query('DELETE FROM estatisticas_leitor WHERE id_usuario = ?', [LEITOR.id]);
    await banco.query("DELETE FROM conquistas WHERE nome LIKE '[teste-fluxo]%'");
    await app.get(CacheCatalogoService).invalidarUsuario(LEITOR.id, 'limpeza do teste');
  }

  it('evento publicado no Redis concede a conquista e /novas devolve ela uma vez', async () => {
    await publicar({
      usuarioId: LEITOR.id,
      estatisticas: estatisticas({ livrosLidos: 1, livrosCadastrados: 1, paginasLidas: 250 }),
      geradoEm: new Date().toISOString(),
    });

    const novas = await esperarNovas(ids.primeiroLivro);

    expect(novas.find((c) => c.id_conquista === ids.primeiroLivro)?.nome).toBe('[teste-fluxo] Primeiro livro');
    expect(novas.some((c) => c.id_conquista === ids.tresSessoes)).toBe(false);

    const deNovo = await http().get('/api/conquistas/novas').set('Authorization', token(LEITOR)).expect(200);
    expect(deNovo.body.conquistas.some((c: { id_conquista: number }) => c.id_conquista === ids.primeiroLivro)).toBe(
      false,
    );
  });

  it('o catálogo mostra o progresso que veio no evento', async () => {
    const { body } = await http().get('/api/conquistas/catalogo').set('Authorization', token(LEITOR)).expect(200);
    const tresSessoes = body.conquistas.find((c: { id_conquista: number }) => c.id_conquista === ids.tresSessoes);

    expect(tresSessoes).toMatchObject({ desbloqueada: false, progresso: 0, valor_alvo: 3 });
  });

  it('mensagem quebrada é ignorada e o próximo evento continua funcionando', async () => {
    await publicador.publish(CANAL, 'isso-nao-e-json');
    await publicar({ usuarioId: 'abc' });

    await publicar({
      usuarioId: LEITOR.id,
      estatisticas: estatisticas({ livrosLidos: 1, livrosCadastrados: 1, paginasLidas: 250, totalSessoes: 3 }),
      geradoEm: new Date().toISOString(),
    });

    const novas = await esperarNovas(ids.tresSessoes);
    expect(novas.map((c) => c.id_conquista)).toContain(ids.tresSessoes);
  });

  it('GDL-76: evento guardado enquanto o serviço estava fora é processado quando ele volta', async () => {
    await publicador.hset(
      CHAVE_ESTATISTICAS_PENDENTES,
      String(LEITOR.id),
      JSON.stringify({
        usuarioId: LEITOR.id,
        estatisticas: estatisticas({ livrosLidos: 1, livrosCadastrados: 1, totalSessoes: 3, totalAvaliacoes: 2 }),
        geradoEm: new Date().toISOString(),
      }),
    );

    
    await app.get(EstatisticasPendentesService).processar();

    const novas = await esperarNovas(ids.duasAvaliacoes);
    expect(novas.map((c) => c.id_conquista)).toContain(ids.duasAvaliacoes);
    expect(await publicador.hexists(CHAVE_ESTATISTICAS_PENDENTES, String(LEITOR.id))).toBe(0);
  });
});