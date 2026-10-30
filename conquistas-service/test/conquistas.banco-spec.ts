import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { dataHojeBrasil } from '../src/common/utils/datas';
import { configurarApp } from '../src/configurar-app';
import { CacheCatalogoService } from '../src/conquistas/cache-catalogo.service';


const LEITOR = { id: 990001, email: 'leitor@teste.com', nome: 'Leitor Teste', tipo_usuario: 'usuario' as const };
const OUTRO_LEITOR = { id: 990002, email: 'outro@teste.com', nome: 'Outro', tipo_usuario: 'usuario' as const };
const ADMIN = { id: 990009, email: 'admin@teste.com', nome: 'Admin Teste', tipo_usuario: 'admin' as const };

const token = (u: typeof LEITOR | typeof ADMIN) =>
  `Bearer ${jwt.sign(u, process.env.JWT_SECRET as string, { expiresIn: '5h' })}`;

describe('Conquistas (integração HTTP + MySQL)', () => {
  let app: INestApplication;
  let banco: DataSource;
  const criadas: number[] = [];

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = modulo.createNestApplication({ logger: false });
    configurarApp(app);
    await app.init();
    banco = app.get(DataSource);
    await limpar();
  });

  afterAll(async () => {
    await limpar();
    await app?.close();
  });

  async function limpar() {
    const usuarios = [LEITOR.id, OUTRO_LEITOR.id];
    await banco.query('DELETE FROM usuario_conquistas WHERE id_usuario IN (?)', [usuarios]);
    await banco.query('DELETE FROM estatisticas_leitor WHERE id_usuario IN (?)', [usuarios]);
    await banco.query("DELETE FROM conquistas WHERE nome LIKE '[teste]%'");
    const cache = app.get(CacheCatalogoService);
    await Promise.all(usuarios.map((id) => cache.invalidarUsuario(id, 'limpeza do teste')));
  }

  const http = () => request(app.getHttpServer());

  async function criar(corpo: object) {
    const resposta = await http().post('/api/conquistas/admin').set('Authorization', token(ADMIN)).send(corpo);
    if (resposta.status === 201) criadas.push(resposta.body.conquista.id_conquista);
    return resposta;
  }

  describe('admin', () => {
    it('cria conquista automática e gera o texto do critério', async () => {
      const resposta = await criar({ nome: '[teste] Leitor dedicado', tipo: 'LIVROS_LIDOS', valor_alvo: 3 });

      expect(resposta.status).toBe(201);
      expect(resposta.body).toMatchObject({
        mensagem: 'Conquista criada com sucesso',
        conquista: { nome: '[teste] Leitor dedicado', tipo: 'LIVROS_LIDOS', valor_alvo: 3, criterio: 'Conclua 3 livros' },
      });
    });

    it('aceita o corpo do app atual (sem tipo): vira MANUAL com o texto enviado', async () => {
      const resposta = await criar({ nome: '[teste] Clube do livro', descricao: 'Participou', criterio: 'Ir ao encontro' });

      expect(resposta.status).toBe(201);
      expect(resposta.body.conquista).toMatchObject({ tipo: 'MANUAL', criterio: 'Ir ao encontro' });
    });

    it('valida o corpo: 400 no formato { erro }', async () => {
      const semNome = await criar({ tipo: 'LIVROS_LIDOS' });
      const generoFaltando = await criar({ nome: '[teste] x', tipo: 'LIVROS_GENERO', valor_alvo: 2 });

      expect(semNome.status).toBe(400);
      expect(semNome.body.erro).toContain('Nome é obrigatório');
      expect(generoFaltando.status).toBe(400);
      expect(generoFaltando.body.erro).toBe('Selecione o gênero para conquistas do tipo LIVROS_GENERO');
    });

    it('guarda o ícone enviado na criação', async () => {
      const resposta = await criar({ nome: '[teste] Com ícone', icone: 'trofeu', criterio: 'Especial' });

      expect(resposta.status).toBe(201);
      expect(resposta.body.conquista.icone).toBe('trofeu');
    });

    it('lista todas e os tipos disponíveis', async () => {
      const todas = await http().get('/api/conquistas/admin/todas').set('Authorization', token(ADMIN)).expect(200);
      const tipos = await http().get('/api/conquistas/admin/tipos').set('Authorization', token(ADMIN)).expect(200);

      expect(todas.body.conquistas.map((c: { nome: string }) => c.nome)).toContain('[teste] Leitor dedicado');
      expect(tipos.body.tipos).toContainEqual({ tipo: 'LIVROS_LIDOS', exemplo: 'Conclua 10 livros' });
    });

    it('edita só o que foi enviado e regera o texto', async () => {
      const id = criadas[0];
      const resposta = await http()
        .put(`/api/conquistas/admin/${id}`)
        .set('Authorization', token(ADMIN))
        .send({ valor_alvo: 4 })
        .expect(200);

      expect(resposta.body).toMatchObject({
        mensagem: 'Conquista atualizada com sucesso',
        conquista: { nome: '[teste] Leitor dedicado', valor_alvo: 4, criterio: 'Conclua 4 livros' },
      });
    });

    it('404 para conquista inexistente e 400 para id inválido', async () => {
      const inexistente = await http().put('/api/conquistas/admin/99999999').set('Authorization', token(ADMIN)).send({ nome: 'x' });
      const idTexto = await http().delete('/api/conquistas/admin/abc').set('Authorization', token(ADMIN));

      expect(inexistente.status).toBe(404);
      expect(inexistente.body.erro).toBe('Conquista não encontrada');
      expect(idTexto.status).toBe(400);
      expect(idTexto.body.erro).toBe('id inválido');
    });

    it('leitor não acessa as rotas de admin (403)', async () => {
      const resposta = await http().get('/api/conquistas/admin/todas').set('Authorization', token(LEITOR));

      expect(resposta.status).toBe(403);
      expect(resposta.body.erro).toBe('Acesso restrito a administradores');
    });
  });

  describe('leitor', () => {
    it('sem estatísticas recebidas: catálogo com progresso null e nada desbloqueado', async () => {
      const resposta = await http().get('/api/conquistas/catalogo').set('Authorization', token(OUTRO_LEITOR)).expect(200);
      const item = resposta.body.conquistas.find((c: { id_conquista: number }) => c.id_conquista === criadas[0]);

      expect(resposta.body).toMatchObject({ total: resposta.body.conquistas.length, total_desbloqueadas: 0 });
      expect(item).toMatchObject({ desbloqueada: false, progresso: null, data_conquista: null, valor_alvo: 4 });
    });

    it('com estatísticas: mostra o progresso e concede o que já foi atingido', async () => {
      // Simula o que o evento do GDL-71 vai gravar: o leitor já leu 5 livros.
      await banco.query(
        'INSERT INTO estatisticas_leitor (id_usuario, livros_lidos, livros_lidos_por_genero) VALUES (?, 5, ?)',
        [LEITOR.id, JSON.stringify({})],
      );

      const catalogo = await http().get('/api/conquistas/catalogo').set('Authorization', token(LEITOR)).expect(200);
      const item = catalogo.body.conquistas.find((c: { id_conquista: number }) => c.id_conquista === criadas[0]);

      expect(item).toMatchObject({ desbloqueada: true, progresso: 4, data_conquista: dataHojeBrasil() }); // 5 limitado a 4
      expect(catalogo.body.total_desbloqueadas).toBeGreaterThanOrEqual(1);

      const minhas = await http().get('/api/conquistas').set('Authorization', token(LEITOR)).expect(200);
      expect(minhas.body.conquistas).toContainEqual({
        id_conquista: criadas[0],
        data_conquista: dataHojeBrasil(),
        conquista: expect.objectContaining({ nome: '[teste] Leitor dedicado' }),
      });
    });

    it('vários pedidos ao mesmo tempo não dão erro 500 (bug do GDL-52)', async () => {
      await banco.query('DELETE FROM usuario_conquistas WHERE id_usuario = ?', [LEITOR.id]);
      // Apagamos direto no banco, então o cache do leitor precisa ser limpo para os pedidos irem ao banco.
      await app.get(CacheCatalogoService).invalidarUsuario(LEITOR.id, 'teste de concorrência');

      const respostas = await Promise.all(
        Array.from({ length: 5 }, () => http().get('/api/conquistas/catalogo').set('Authorization', token(LEITOR))),
      );

      expect(respostas.map((r) => r.status)).toEqual([200, 200, 200, 200, 200]);
      const [{ total }] = await banco.query(
        'SELECT COUNT(*) AS total FROM usuario_conquistas WHERE id_usuario = ? AND id_conquista = ?',
        [LEITOR.id, criadas[0]],
      );
      expect(Number(total)).toBe(1);
    });

    it('sem token: 401', async () => {
      await http().get('/api/conquistas').expect(401);
    });
  });

  describe('cache do catálogo (GDL-10 e GDL-11)', () => {
    const catalogo = (u: typeof LEITOR) => http().get('/api/conquistas/catalogo').set('Authorization', token(u));
    const item = (corpo: { conquistas: { id_conquista: number }[] }, id: number) =>
      corpo.conquistas.find((c) => c.id_conquista === id) as Record<string, unknown> | undefined;

    beforeEach(async () => {
      await app.get(CacheCatalogoService).invalidarUsuario(OUTRO_LEITOR.id, 'início do teste');
    });

    it('primeira consulta vem do banco (MISS) e as seguintes do cache (HIT)', async () => {
      const primeira = await catalogo(OUTRO_LEITOR).expect(200);
      const segunda = await catalogo(OUTRO_LEITOR).expect(200);

      expect(primeira.headers['x-cache']).toBe('MISS');
      expect(segunda.headers['x-cache']).toBe('HIT');
      expect(segunda.body).toEqual(primeira.body);
    });

    it('admin editou uma conquista: o catálogo de todos é invalidado', async () => {
      await catalogo(OUTRO_LEITOR);
      await catalogo(LEITOR);

      await http()
        .put(`/api/conquistas/admin/${criadas[0]}`)
        .set('Authorization', token(ADMIN))
        .send({ nome: '[teste] Leitor dedicado (editada)' })
        .expect(200);

      const outro = await catalogo(OUTRO_LEITOR).expect(200);
      const leitor = await catalogo(LEITOR).expect(200);
      expect(outro.headers['x-cache']).toBe('MISS');
      expect(leitor.headers['x-cache']).toBe('MISS');
      expect(item(outro.body, criadas[0])?.nome).toBe('[teste] Leitor dedicado (editada)');
    });

    it('admin criou uma conquista: ela aparece na hora no catálogo', async () => {
      await catalogo(OUTRO_LEITOR);
      const nova = await criar({ nome: '[teste] Recém-criada', criterio: 'Nova' });

      const resposta = await catalogo(OUTRO_LEITOR).expect(200);

      expect(resposta.headers['x-cache']).toBe('MISS');
      expect(item(resposta.body, nova.body.conquista.id_conquista)).toBeDefined();
    });

    it('admin concedeu uma conquista a um leitor: só o cache dele é invalidado', async () => {
      const manual = await criar({ nome: '[teste] Cache manual', criterio: 'Dada pelo admin' });
      const idManual = manual.body.conquista.id_conquista;
      await catalogo(OUTRO_LEITOR);
      await catalogo(LEITOR);

      await http()
        .post(`/api/conquistas/admin/${idManual}/conceder`)
        .set('Authorization', token(ADMIN))
        .send({ id_usuario: OUTRO_LEITOR.id })
        .expect(201);

      const outro = await catalogo(OUTRO_LEITOR).expect(200);
      const leitor = await catalogo(LEITOR).expect(200);
      expect(outro.headers['x-cache']).toBe('MISS');
      expect(item(outro.body, idManual)).toMatchObject({ desbloqueada: true });
      expect(leitor.headers['x-cache']).toBe('HIT'); // o outro leitor não foi afetado
    });
  });

  describe('concessão manual', () => {
    it('concede, recusa repetida (409) e conquista inexistente (404)', async () => {
      const manual = criadas[1];
      const url = `/api/conquistas/admin/${manual}/conceder`;

      const primeira = await http().post(url).set('Authorization', token(ADMIN)).send({ id_usuario: OUTRO_LEITOR.id });
      const repetida = await http().post(url).set('Authorization', token(ADMIN)).send({ id_usuario: OUTRO_LEITOR.id });
      const inexistente = await http()
        .post('/api/conquistas/admin/99999999/conceder')
        .set('Authorization', token(ADMIN))
        .send({ id_usuario: OUTRO_LEITOR.id });
      const semUsuario = await http().post(url).set('Authorization', token(ADMIN)).send({});

      expect(primeira.status).toBe(201);
      expect(primeira.body).toEqual({ mensagem: 'Conquista concedida com sucesso' });
      expect(repetida.status).toBe(409);
      expect(repetida.body.erro).toBe('Usuário já possui esta conquista');
      expect(inexistente.status).toBe(404);
      expect(semUsuario.status).toBe(400);
      expect(semUsuario.body.erro).toBe('id_usuario é obrigatório');
    });
  });

  describe('apagar', () => {
    it('apaga a conquista e os desbloqueios dela', async () => {
      const manual = criadas[1];

      await http()
        .delete(`/api/conquistas/admin/${manual}`)
        .set('Authorization', token(ADMIN))
        .expect(200, { mensagem: 'Conquista removida com sucesso' });

      const [{ total }] = await banco.query('SELECT COUNT(*) AS total FROM usuario_conquistas WHERE id_conquista = ?', [manual]);
      expect(Number(total)).toBe(0);
      await http().delete(`/api/conquistas/admin/${manual}`).set('Authorization', token(ADMIN)).expect(404);
    });
  });
});