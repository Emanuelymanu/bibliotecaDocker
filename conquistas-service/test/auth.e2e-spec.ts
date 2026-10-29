import { Controller, Get, INestApplication, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ApenasAdmin } from '../src/auth/decorators/apenas-admin.decorator';
import { UsuarioAtual } from '../src/auth/decorators/usuario-atual.decorator';
import { UsuarioAutenticado } from '../src/auth/usuario-autenticado';
import { BancoModule } from '../src/banco/banco.module';
import { ConquistasModule } from '../src/conquistas/conquistas.module';
import { configurarApp } from '../src/configurar-app';


@Controller('teste-auth')
class RotasProtegidasController {
  @Get('eu')
  eu(@UsuarioAtual() usuario: UsuarioAutenticado, @UsuarioAtual('id') id: number) {
    return { usuario, id };
  }

  @ApenasAdmin()
  @Get('admin')
  admin() {
    return { ok: true };
  }
}

@Module({ controllers: [RotasProtegidasController] })
class RotasDeTesteModule {}

@Module({})
class SemBancoModule {}


function tokenDoBackendPrincipal(usuario: UsuarioAutenticado, segredo = process.env.JWT_SECRET as string) {
  return jwt.sign(
    { id: usuario.id, email: usuario.email, nome: usuario.nome, tipo_usuario: usuario.tipo_usuario },
    segredo,
    { expiresIn: '5h' },
  );
}

const leitor: UsuarioAutenticado = { id: 7, email: 'leitor@teste.com', nome: 'Leitor', tipo_usuario: 'usuario' };
const administrador: UsuarioAutenticado = { id: 1, email: 'admin@teste.com', nome: 'Admin', tipo_usuario: 'admin' };

describe('Autenticação JWT (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({ imports: [AppModule, RotasDeTesteModule] })
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

  it('rota sem @Publica() exige token: 401 no formato { erro }', async () => {
    const resposta = await request(app.getHttpServer()).get('/api/teste-auth/eu').expect(401);

    expect(resposta.body.erro).toBe('Token de autenticação ausente');
  });

  it('token de outro segredo é recusado', async () => {
    const resposta = await request(app.getHttpServer())
      .get('/api/teste-auth/eu')
      .set('Authorization', `Bearer ${tokenDoBackendPrincipal(leitor, 'segredo-errado')}`)
      .expect(401);

    expect(resposta.body.erro).toBe('Token inválido ou expirado');
  });

  it('aceita o token do login do backend principal e entrega o usuário com @UsuarioAtual()', async () => {
    const resposta = await request(app.getHttpServer())
      .get('/api/teste-auth/eu')
      .set('Authorization', `Bearer ${tokenDoBackendPrincipal(leitor)}`)
      .expect(200);

    expect(resposta.body.usuario).toMatchObject(leitor);
    expect(resposta.body.id).toBe(7);
  });

  it('rota de admin: 403 para usuário comum', async () => {
    const resposta = await request(app.getHttpServer())
      .get('/api/teste-auth/admin')
      .set('Authorization', `Bearer ${tokenDoBackendPrincipal(leitor)}`)
      .expect(403);

    expect(resposta.body.erro).toBe('Acesso restrito a administradores');
  });

  it('rota de admin: 200 para admin', async () => {
    await request(app.getHttpServer())
      .get('/api/teste-auth/admin')
      .set('Authorization', `Bearer ${tokenDoBackendPrincipal(administrador)}`)
      .expect(200, { ok: true });
  });

  it('/health continua público', async () => {
    await request(app.getHttpServer()).get('/health').expect(200);
  });
});