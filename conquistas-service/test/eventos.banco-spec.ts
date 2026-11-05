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


const LEITOR = { id: 990101, email: 'eventos@teste.com', nome: 'Leitor Eventos', tipo_usuario: 'usuario' as const };
const ADMIN = { id: 990109, email: 'admin-eventos@teste.com', nome: 'Admin', tipo_usuario: 'admin' as const };
const GENERO = 3;

const token = (u: typeof LEITOR | typeof ADMIN) =>
  `Bearer ${jwt.sign(u, process.env.JWT_SECRET as string, { expiresIn: '1h' })}`;


function evento(geradoEm: string, numeros: Partial<Record<string, unknown>> = {}) {
  return lerEventoEstatisticas({
    usuarioId: LEITOR.id,
    geradoEm,
    estatisticas: {
      livrosLidos: 0,
      livrosCadastrados: 0,
      paginasLidas: 0,
      totalSessoes: 0,
      totalAnotacoes: 0,
      totalAvaliacoes: 0,
      possuiMeta: false,
      livrosLidosPorGenero: {},
      ...numeros,
    },
  });
}

describe('Evento estatisticas.atualizadas (integração com MySQL)', () => {
  let app: INestApplication;
  let banco: DataSource;
  let servico: ConquistasService;
  const ids: Record<'primeiroLivro' | 'paginas' | 'genero', number> = { primeiroLivro: 0, paginas: 0, genero: 0 };

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = modulo.createNestApplication({ logger: false });
    configurarApp(app);
    await app.init();
    banco = app.get(DataSource);
    servico = app.get(ConquistasService);
    await limpar();

    const criar = async (corpo: object) => {
      const r = await request(app.getHttpServer())
        .post('/api/conquistas/admin')
        .set('Authorization', token(ADMIN))
        .send(corpo)
        .expect(201);
      return r.body.conquista.id_conquista as number;
    };
    ids.primeiroLivro = await criar({ nome: '[teste-evento] Primeiro livro', tipo: 'LIVROS_LIDOS', valor_alvo: 1 });
    ids.paginas = await criar({ nome: '[teste-evento] 500 páginas', tipo: 'PAGINAS_LIDAS', valor_alvo: 500 });
    ids.genero = await criar({
      nome: '[teste-evento] Fã do gênero',
      tipo: 'LIVROS_GENERO',
      valor_alvo: 2,
      id_genero: GENERO,
    });
  });

  afterAll(async () => {
    await limpar();
    await app?.close();
  });

  async function limpar() {
    await banco.query('DELETE FROM usuario_conquistas WHERE id_usuario = ?', [LEITOR.id]);
    await banco.query('DELETE FROM estatisticas_leitor WHERE id_usuario = ?', [LEITOR.id]);
    await banco.query("DELETE FROM conquistas WHERE nome LIKE '[teste-evento]%'");
    await app.get(CacheCatalogoService).invalidarUsuario(LEITOR.id, 'limpeza do teste');
  }

  const desbloqueadas = async (): Promise<number[]> => {
    const linhas: { id_conquista: number }[] = await banco.query(
      'SELECT id_conquista FROM usuario_conquistas WHERE id_usuario = ? AND id_conquista IN (?) ORDER BY id_conquista',
      [LEITOR.id, Object.values(ids)],
    );
    return linhas.map((l) => l.id_conquista);
  };

  const gravado = async () => {
    const [linha] = await banco.query('SELECT * FROM estatisticas_leitor WHERE id_usuario = ?', [LEITOR.id]);
    return linha;
  };

  const catalogo = () =>
    request(app.getHttpServer()).get('/api/conquistas/catalogo').set('Authorization', token(LEITOR)).expect(200);
  const item = (corpo: { conquistas: { id_conquista: number }[] }, id: number) =>
    corpo.conquistas.find((c) => c.id_conquista === id) as Record<string, unknown>;

  it('primeiro evento do leitor: grava as estatísticas e concede o que foi atingido', async () => {
    const resultado = await servico.registrarEstatisticas(
      evento('2026-11-04T12:00:00.000Z', { livrosLidos: 1, livrosCadastrados: 2, paginasLidas: 310, livrosLidosPorGenero: { [GENERO]: 1 } }),
    );

    expect(resultado.aplicado).toBe(true);
    expect(resultado.novas.map((c) => c.id_conquista)).toContain(ids.primeiroLivro);
    expect(await desbloqueadas()).toEqual([ids.primeiroLivro]);
    expect(await gravado()).toMatchObject({
      livros_lidos: 1,
      livros_cadastrados: 2,
      paginas_lidas: 310,
      livros_lidos_por_genero: { [GENERO]: 1 },
    });
    expect((await gravado()).gerado_em).toEqual(new Date('2026-11-04T12:00:00.000Z'));
  });

  it('o catálogo mostra o progresso vindo do evento', async () => {
    const { body } = await catalogo();

    expect(item(body, ids.paginas)).toMatchObject({ progresso: 310, desbloqueada: false });
    expect(item(body, ids.genero)).toMatchObject({ progresso: 1, desbloqueada: false });
    expect(item(body, ids.primeiroLivro)).toMatchObject({ progresso: 1, desbloqueada: true });
  });

  it('evento novo sem conquista nova: invalida o cache e o catálogo mostra o progresso novo', async () => {
    expect((await catalogo()).headers['x-cache']).toBe('HIT');

    const resultado = await servico.registrarEstatisticas(
      evento('2026-11-04T12:05:00.000Z', { livrosLidos: 1, livrosCadastrados: 2, paginasLidas: 410, livrosLidosPorGenero: { [GENERO]: 1 } }),
    );

    expect(resultado).toEqual({ aplicado: true, novas: [] });
    const depois = await catalogo();
    expect(depois.headers['x-cache']).toBe('MISS');
    expect(item(depois.body, ids.paginas)).toMatchObject({ progresso: 410 });
  });

  it('atingiu mais critérios: concede todos de uma vez e só uma vez', async () => {
    const atingiu = evento('2026-11-04T12:10:00.000Z', {
      livrosLidos: 2,
      livrosCadastrados: 2,
      paginasLidas: 620,
      livrosLidosPorGenero: { [GENERO]: 2 },
    });

    const primeira = await servico.registrarEstatisticas(atingiu);
    const repetida = await servico.registrarEstatisticas(atingiu); 


    const minhas = primeira.novas.map((c) => c.id_conquista).filter((id) => Object.values(ids).includes(id));
    expect(minhas.sort()).toEqual([ids.paginas, ids.genero].sort());
    expect(repetida).toEqual({ aplicado: true, novas: [] });
    expect(await desbloqueadas()).toEqual(Object.values(ids).sort((a, b) => a - b));
  });

  it('evento atrasado (mais antigo que o gravado) é descartado e não apaga os números novos', async () => {
    const atrasado = await servico.registrarEstatisticas(
      evento('2026-11-04T11:00:00.000Z', { livrosLidos: 0, paginasLidas: 0 }),
    );

    expect(atrasado).toEqual({ aplicado: false, novas: [] });
    expect(await gravado()).toMatchObject({ livros_lidos: 2, paginas_lidas: 620 });
  });

  it('dois eventos ao mesmo tempo: fica o mais novo, sem erro', async () => {
    const antigo = evento('2026-11-04T12:20:00.000Z', { livrosLidos: 3, paginasLidas: 700, livrosLidosPorGenero: { [GENERO]: 2 } });
    const novo = evento('2026-11-04T12:20:00.500Z', { livrosLidos: 4, paginasLidas: 900, livrosLidosPorGenero: { [GENERO]: 2 } });

    const resultados = await Promise.all([servico.registrarEstatisticas(novo), servico.registrarEstatisticas(antigo)]);

    expect(resultados[0].aplicado).toBe(true);
    expect(await gravado()).toMatchObject({ livros_lidos: 4, paginas_lidas: 900 });
    expect((await gravado()).gerado_em).toEqual(new Date('2026-11-04T12:20:00.500Z'));
  });
});