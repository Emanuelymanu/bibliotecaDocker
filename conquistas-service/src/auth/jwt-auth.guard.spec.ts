import { ExecutionContext, ForbiddenException, Logger, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { ApenasAdmin } from './decorators/apenas-admin.decorator';
import { Publica } from './decorators/publica.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RevogacaoIndisponivelError, RevogacaoTokensService } from './revogacao-tokens.service';
import { UsuarioAutenticado } from './usuario-autenticado';

const SEGREDO = 'segredo-de-teste';


class RotasDeTeste {
  comum() {}
  @Publica()
  publica() {}
  @ApenasAdmin()
  admin() {}
}

@ApenasAdmin()
class ControllerSoDeAdmin {
  qualquer() {}
}

const leitor: UsuarioAutenticado = { id: 7, email: 'leitor@teste.com', nome: 'Leitor', tipo_usuario: 'usuario' };
const administrador: UsuarioAutenticado = { id: 1, email: 'admin@teste.com', nome: 'Admin', tipo_usuario: 'admin' };

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwt: JwtService;

  let revogacoes: Map<number, number>;
  let redisFora: boolean;

  beforeEach(async () => {
    revogacoes = new Map();
    redisFora = false;
    const revogacaoFalsa = {
      revogadoEm: async (id: number) => {
        if (redisFora) throw new RevogacaoIndisponivelError('The client is offline');
        return revogacoes.get(id) ?? null;
      },
    };
    const modulo = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        Reflector,
        { provide: JwtService, useValue: new JwtService({ secret: SEGREDO }) },
        { provide: RevogacaoTokensService, useValue: revogacaoFalsa },
      ],
    }).compile();

    guard = modulo.get(JwtAuthGuard);
    jwt = modulo.get(JwtService);
  });

  function contexto(
    authorization: string | undefined,
    rota: keyof RotasDeTeste = 'comum',
    classe: object = RotasDeTeste,
  ) {
    const requisicao: Record<string, unknown> = {
      headers: authorization === undefined ? {} : { authorization },
      method: 'GET',
      originalUrl: '/api/teste',
    };
    const handler =
      classe === RotasDeTeste ? RotasDeTeste.prototype[rota] : ControllerSoDeAdmin.prototype.qualquer;
    const ctx = {
      getHandler: () => handler,
      getClass: () => classe,
      switchToHttp: () => ({ getRequest: () => requisicao }),
    } as unknown as ExecutionContext;
    return { ctx, requisicao };
  }

  const bearer = (token: string) => `Bearer ${token}`;

  describe('token', () => {
    it('sem cabeçalho Authorization -> 401 "Token de autenticação ausente"', async () => {
      const { ctx } = contexto(undefined);

      await expect(guard.canActivate(ctx)).rejects.toThrow(new UnauthorizedException('Token de autenticação ausente'));
    });

    it.each(['Basic abc', 'Bearer', 'Bearer a b', 'tokensemespaco'])(
      'cabeçalho "%s" -> 401 "Token mal formatado"',
      async (cabecalho) => {
        const { ctx } = contexto(cabecalho);

        await expect(guard.canActivate(ctx)).rejects.toThrow(new UnauthorizedException('Token mal formatado'));
      },
    );

    it('token assinado com outro segredo -> 401 "Token inválido ou expirado"', async () => {
      const falso = new JwtService({ secret: 'outro-segredo' }).sign(leitor);
      const { ctx } = contexto(bearer(falso));

      await expect(guard.canActivate(ctx)).rejects.toThrow(new UnauthorizedException('Token inválido ou expirado'));
    });

    it('token expirado -> 401', async () => {
      const vencido = jwt.sign({ ...leitor, exp: Math.floor(Date.now() / 1000) - 60 });
      const { ctx } = contexto(bearer(vencido));

      await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    });

    it('token sem assinatura ("alg": "none") -> 401', async () => {
      const base64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
      const semAssinatura = `${base64({ alg: 'none', typ: 'JWT' })}.${base64(administrador)}.`;
      const { ctx } = contexto(bearer(semAssinatura));

      await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    });

    it('token válido mas sem id ou tipo_usuario -> 401', async () => {
      const incompleto = jwt.sign({ email: 'x@teste.com' });
      const { ctx } = contexto(bearer(incompleto));

      await expect(guard.canActivate(ctx)).rejects.toThrow(new UnauthorizedException('Token inválido ou expirado'));
    });

    it('token válido -> libera e coloca o usuário na requisição', async () => {
      const { ctx, requisicao } = contexto(bearer(jwt.sign(leitor, { expiresIn: '5h' })));

      await expect(guard.canActivate(ctx)).resolves.toBe(true);
      expect(requisicao.usuario).toMatchObject(leitor);
    });

    it('aceita "bearer" minúsculo, como o backend principal', async () => {
      const { ctx } = contexto(`bearer ${jwt.sign(leitor)}`);

      await expect(guard.canActivate(ctx)).resolves.toBe(true);
    });
  });

  describe('@Publica()', () => {
    it('libera sem token', async () => {
      const { ctx } = contexto(undefined, 'publica');

      await expect(guard.canActivate(ctx)).resolves.toBe(true);
    });
  });

  describe('@ApenasAdmin()', () => {
    it('usuário comum -> 403 "Acesso restrito a administradores"', async () => {
      const { ctx } = contexto(bearer(jwt.sign(leitor)), 'admin');

      await expect(guard.canActivate(ctx)).rejects.toThrow(new ForbiddenException('Acesso restrito a administradores'));
    });

    it('admin -> libera', async () => {
      const { ctx } = contexto(bearer(jwt.sign(administrador)), 'admin');

      await expect(guard.canActivate(ctx)).resolves.toBe(true);
    });

    it('sem token continua sendo 401 (e não 403)', async () => {
      const { ctx } = contexto(undefined, 'admin');

      await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    });

    it('funciona também no controller inteiro', async () => {
      const { ctx } = contexto(bearer(jwt.sign(leitor)), 'comum', ControllerSoDeAdmin);

      await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('revogação por mudança de permissão (GDL-79)', () => {
    const agoraSeg = () => Math.floor(Date.now() / 1000);
    let avisos: string[];

    beforeEach(() => {
      avisos = [];
      jest.spyOn(Logger.prototype, 'warn').mockImplementation((m: string) => void avisos.push(m));
    });
    afterEach(() => jest.restoreAllMocks());

    it('admin rebaixado: token antigo (ainda diz admin) -> 401 em rota de admin, com log', async () => {
      const antigo = jwt.sign({ ...administrador, iat: agoraSeg() - 600 });
      revogacoes.set(administrador.id, Date.now() - 60_000); // rebaixado há 1 minuto

      const { ctx } = contexto(bearer(antigo), 'admin');

      await expect(guard.canActivate(ctx)).rejects.toThrow(
        new UnauthorizedException('Sua permissão foi alterada. Faça login novamente.'),
      );
      expect(avisos.join('\n')).toMatch(/Token recusado: usuario=1 \(token diz admin/);
    });

    it('token antigo também é recusado nas rotas de leitor', async () => {
      revogacoes.set(administrador.id, Date.now() - 60_000);
      const { ctx } = contexto(bearer(jwt.sign({ ...administrador, iat: agoraSeg() - 600 })));

      await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    });

    it('depois de um novo login (token emitido depois da mudança) -> libera, com a permissão nova', async () => {
      revogacoes.set(administrador.id, Date.now() - 60_000);
      const novo = jwt.sign({ ...administrador, tipo_usuario: 'usuario' }); // iat = agora

      const { ctx: rotaLeitor, requisicao } = contexto(bearer(novo));
      await expect(guard.canActivate(rotaLeitor)).resolves.toBe(true);
      expect(requisicao.usuario).toMatchObject({ id: 1, tipo_usuario: 'usuario' });

      const { ctx: rotaAdmin } = contexto(bearer(novo), 'admin');
      await expect(guard.canActivate(rotaAdmin)).rejects.toThrow(ForbiddenException);
    });

    it('token do mesmo segundo da mudança é recusado (pode ser de antes dela)', async () => {
      const agora = Date.now();
      revogacoes.set(administrador.id, agora);
      const { ctx } = contexto(bearer(jwt.sign({ ...administrador, iat: Math.floor(agora / 1000) })), 'admin');

      await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    });

    it('a revogação de um usuário não afeta os outros', async () => {
      revogacoes.set(administrador.id, Date.now());
      const { ctx } = contexto(bearer(jwt.sign({ ...leitor, iat: agoraSeg() - 600 })));

      await expect(guard.canActivate(ctx)).resolves.toBe(true);
    });

    it('Redis fora: rota de admin -> 503', async () => {
      redisFora = true;
      const { ctx } = contexto(bearer(jwt.sign(administrador)), 'admin');

      await expect(guard.canActivate(ctx)).rejects.toThrow(ServiceUnavailableException);
      expect(avisos.join('\n')).toMatch(/Rota de admin recusada \(503\) para usuario=1/);
    });

    it('Redis fora: rota de leitor continua funcionando', async () => {
      redisFora = true;
      const { ctx } = contexto(bearer(jwt.sign(leitor)));

      await expect(guard.canActivate(ctx)).resolves.toBe(true);
    });

    it('Redis fora não muda a ordem: sem token continua 401', async () => {
      redisFora = true;
      const { ctx } = contexto(undefined, 'admin');

      await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    });
  });
});