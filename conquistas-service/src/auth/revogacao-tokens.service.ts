import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Keyv } from 'keyv';


export const DURACAO_TOKEN_MS = 5 * 60 * 60 * 1000;
const LIMITE_REDIS_MS = 300;

export const chaveRevogacao = (usuarioId: number) => `auth:revogado:${usuarioId}`;

export class RevogacaoIndisponivelError extends Error {}


@Injectable()
export class RevogacaoTokensService {
  private readonly logger = new Logger('RevogacaoTokens');
  private redisDisponivel = true;

  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}


  async revogarAte(usuarioId: number, alteradoEm: Date): Promise<number> {
    const chave = chaveRevogacao(usuarioId);
    const atual = await this.lerMs(chave);
    const momento = Math.max(atual ?? 0, alteradoEm.getTime());
    try {
      await this.comLimite(this.store.set(chave, momento, DURACAO_TOKEN_MS));
    } catch (erro) {
      throw this.indisponivel(erro);
    }
    this.marcarDisponivel();
    return momento;
  }


  async revogadoEm(usuarioId: number): Promise<number | null> {
    return this.lerMs(chaveRevogacao(usuarioId));
  }

  
  static emitidoAntes(iatSegundos: number | undefined, revogadoEmMs: number): boolean {
    if (iatSegundos === undefined) return true; // sem data de emissão: na dúvida, recusa
    return iatSegundos <= Math.floor(revogadoEmMs / 1000);
  }

  private async lerMs(chave: string): Promise<number | null> {
    let valor: unknown;
    try {
      valor = await this.comLimite(this.store.get(chave));
    } catch (erro) {
      throw this.indisponivel(erro);
    }
    this.marcarDisponivel();
    const numero = Number(valor);
    return valor === undefined || valor === null || Number.isNaN(numero) ? null : numero;
  }

  private get store(): Keyv {
    return this.cache.stores[0];
  }

  private comLimite<T>(operacao: Promise<T>): Promise<T> {
    let timer: NodeJS.Timeout | undefined;
    const limite = new Promise<never>((_, rejeitar) => {
      timer = setTimeout(() => rejeitar(new Error(`Redis não respondeu em ${LIMITE_REDIS_MS}ms`)), LIMITE_REDIS_MS);
    });
    return Promise.race([operacao, limite]).finally(() => clearTimeout(timer));
  }

  private indisponivel(erro: unknown): RevogacaoIndisponivelError {
    const mensagem = (erro as Error).message;
    if (this.redisDisponivel) {
      this.redisDisponivel = false;
      this.logger.warn(
        `Redis indisponível (${mensagem}): rotas de admin respondem 503 e rotas de leitor seguem sem checar revogação`,
      );
    }
    return new RevogacaoIndisponivelError(mensagem);
  }

  private marcarDisponivel(): void {
    if (!this.redisDisponivel) {
      this.redisDisponivel = true;
      this.logger.log('Redis disponível de novo: revogação de tokens reativada');
    }
  }
}