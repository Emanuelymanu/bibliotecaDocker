import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { APENAS_ADMIN } from './decorators/apenas-admin.decorator';
import { ROTA_PUBLICA } from './decorators/publica.decorator';
import { RevogacaoIndisponivelError, RevogacaoTokensService } from './revogacao-tokens.service';
import { ehUsuarioAutenticado, RequisicaoAutenticada, UsuarioAutenticado } from './usuario-autenticado';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard implements CanActivate{
    private readonly logger = new Logger(JwtAuthGuard.name)

    constructor(
        private readonly jwt: JwtService,
        private readonly reflector: Reflector,
        private readonly revogacao: RevogacaoTokensService,
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
        const apenasAdmin = this.reflector.getAllAndOverride<boolean>(APENAS_ADMIN, alvos)
        await this.recusarSeRevogado(conteudo, (conteudo as { iat?: number }).iat, apenasAdmin, requisicao)
        requisicao.usuario = conteudo

        if (apenasAdmin && conteudo.tipo_usuario !== 'admin'){
            this.logger.warn(`Usuário ${conteudo.id} sem permissão de admin em ${requisicao.method} ${requisicao.originalUrl}`)
            throw new ForbiddenException('Acesso restrito a administradores')
        }
        return true;
    }


    private async recusarSeRevogado(
        usuario: UsuarioAutenticado,
        iat: number | undefined,
        apenasAdmin: boolean | undefined,
        requisicao: RequisicaoAutenticada,
    ): Promise<void> {
        let revogadoEm: number | null
        try{
            revogadoEm = await this.revogacao.revogadoEm(usuario.id)
        }catch(erro){
            if (!(erro instanceof RevogacaoIndisponivelError)) throw erro
            if (apenasAdmin){
                this.logger.warn(`Rota de admin recusada (503) para usuario=${usuario.id} em ${requisicao.method} ${requisicao.originalUrl}: não deu para checar a revogação`)
                throw new ServiceUnavailableException('Não foi possível confirmar sua permissão agora. Tente de novo em instantes.')
            }
            return
        }

        if (revogadoEm !== null && RevogacaoTokensService.emitidoAntes(iat, revogadoEm)){
            const emitido = iat === undefined ? 'sem data' : new Date(iat * 1000).toISOString()
            this.logger.warn(
                `Token recusado: usuario=${usuario.id} (token diz ${usuario.tipo_usuario}, emitido ${emitido}) ` +
                `teve a permissão alterada em ${new Date(revogadoEm).toISOString()} - ${requisicao.method} ${requisicao.originalUrl}`,
            )
            throw new UnauthorizedException('Sua permissão foi alterada. Faça login novamente.')
        }
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