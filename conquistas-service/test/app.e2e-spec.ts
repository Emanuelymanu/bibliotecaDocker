import { INestApplication, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { BancoModule } from '../src/banco/banco.module';
import { ConquistasModule } from '../src/conquistas/conquistas.module';
import { configurarApp } from '../src/configurar-app';

@Module({})
class SemBancoModule {}

describe('conquistas-service (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({ imports: [AppModule] })
      .overrideModule(BancoModule)
      .useModule(SemBancoModule)
      .overrideModule(ConquistasModule)
      .useModule(SemBancoModule)
      .compile();
    app = modulo.createNestApplication({ logger: false });
    configurarApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health responde 200 fora do prefixo /api', async () => {
    const resposta = await request(app.getHttpServer()).get('/health').expect(200);

    expect(resposta.body).toMatchObject({ status: 'ok', servico: 'conquistas-service' });
  });

  it('rota inexistente responde 404 no formato { erro }', async () => {
    const resposta = await request(app.getHttpServer()).get('/api/nao-existe').expect(404);

    expect(resposta.body).toHaveProperty('erro');
    expect(resposta.body.statusCode).toBe(404);
  });
});