import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { APENAS_ADMIN } from './decorators/apenas-admin.decorator';
import { ROTA_PUBLICA } from './decorators/publica.decorator';
import { ehUsuarioAutenticado, RequisicaoAutenticada } from './usuario-autenticado';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard implements CanActivate{
    private readonly logger = new Logger(JwtAuthGuard.name)

    constructor(
        private readonly jwt: JwtService,
        private readonly reflector: Reflector,
    ){}

    async canActivate(contexto: ExecutionContext): Promise <boolean> {
        const alvos = [contexto.getHandler(), contexto.getClass()]
        if(this.reflector.getAllAndOverride<boolean>(ROTA_PUBLICA,alvos)){
            return true
        }
        const requisicao = contexto.switchToHttp().getRequest<RequisicaoAutenticada>();
        const token = this.extrairToken(requisicao.headers.authorization)

        let conteudo: unknown;
        try{
            conteudo = await this.jwt.verifyAsync(token,{algorithms: ['HS256']})
        }catch(erro){
            this.logger.warn(`Token recusado em ${requisicao.method} ${requisicao.originalUrl}: ${(erro as Error).message}`)
            throw new UnauthorizedException('Token inválido ou expirado')
        }

        if (!ehUsuarioAutenticado(conteudo)){
            this.logger.warn(`Token com conteúdo inesperado em ${requisicao.method} ${requisicao.originalUrl}`)
            throw new UnauthorizedException('Token inválido ou expirado')
        }
        requisicao.usuario = conteudo

        const apenasAdmin = this.reflector.getAllAndOverride<boolean>(APENAS_ADMIN, alvos)
        if (apenasAdmin && conteudo.tipo_usuario !== 'admin'){
            this.logger.warn(`Usuário ${conteudo.id} sem permissão de admin em ${requisicao.method} ${requisicao.originalUrl}`)
            throw new ForbiddenException('Acesso restrito a administradores')
        }
        return true;
    }

    private extrairToken(cabecalho: string | undefined): string{
        if(!cabecalho){
            throw new UnauthorizedException('Token de autenticação ausente')

        }

        const partes = cabecalho.split(' ')
        if (partes.length !== 2 ||  !/^Bearer$/i.test(partes[0]) || !partes[1] ){
            throw new UnauthorizedException('Token mal formatado');
        }
        return partes[1]
    }
}