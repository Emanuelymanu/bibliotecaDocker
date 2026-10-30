import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Keyv } from 'keyv';

export type OrigemCatalogo = 'HIT' | 'MISS' | 'SEM_CACHE';
const LIMITE_REDIS_MS = 300;
const CHAVE_VERSAO = 'conquistas:catalogo:versao';

@Injectable()
export class CacheCatalogoService{
    private readonly logger = new Logger(CacheCatalogoService.name);
    private readonly ttlMs: number;
    private redisDisponivel = true;
    constructor(
        @Inject(CACHE_MANAGER) private readonly cache: Cache,
        config: ConfigService
    ){
        this.ttlMs = config.getOrThrow<number>('CACHE_TTL_SEGUNDOS') * 1000

    }

    async obterOuCalcular<T>(usuarioId: number, calcular:()=> Promise<T>): Promise<{dados: T; origem: OrigemCatalogo}>{
        let chave: string;
        try{
            chave = await this.chaveDoUsuario(usuarioId)
            const guardado = (await this.comLimite(this.store.get(chave))) as T | undefined;
             this.marcarDisponivel();
      if (guardado !== undefined && guardado !== null) {
        this.logger.log(`cache hit  ${chave}`);
        return { dados: guardado, origem: 'HIT' };
      }
        }catch (erro) {
      this.marcarIndisponivel(erro);
      return { dados: await calcular(), origem: 'SEM_CACHE' };
        }

        const dados = await calcular()
        try{
            await this.comLimite(this.store.set(chave,dados, this.ttlMs))
            this.logger.log(`cache miss ${chave} (consultou o banco, guardado por ${this.ttlMs /1000})`)
        }catch(erro){
            this.marcarIndisponivel(erro)
        }

        return {dados, origem: 'MISS'}
    }

    async invalidarUsuario(usuarioId: number, motivo: string): Promise<void>{
        try{
            const chave = await this.chaveDoUsuario(usuarioId)
            await this.comLimite(this.store.delete(chave))
            this.marcarDisponivel();
            this.logger.log(`cache invalidado ${chave} (${motivo})`);
        }catch(erro){
            this.marcarIndisponivel(erro)
        }
    }

    async invalidarTodos(motivo: string): Promise<void>{
        const novaVersao = String(Date.now())
        try{
            await this.comLimite(this.store.set(CHAVE_VERSAO, novaVersao))
                  this.marcarDisponivel();
                 this.logger.log(`cache invalidado para todos os leitores: versão ${novaVersao} (${motivo})`);
        }catch(erro){
            this.marcarIndisponivel(erro)
        }
    }

     private get store(): Keyv {
    return this.cache.stores[0];
    }

    private async chaveDoUsuario(usuarioId: number): Promise<string> {
    const versao = ((await this.comLimite(this.store.get(CHAVE_VERSAO))) as string | undefined) ?? '0';
    return `conquistas:catalogo:v${versao}:${usuarioId}`;
    }

      private comLimite<T>(operacao: Promise<T>): Promise<T> {
    let timer: NodeJS.Timeout | undefined;
    const limite = new Promise<never>((_, rejeitar) => {
      timer = setTimeout(() => rejeitar(new Error(`Redis não respondeu em ${LIMITE_REDIS_MS}ms`)), LIMITE_REDIS_MS);
    });
    return Promise.race([operacao, limite]).finally(() => clearTimeout(timer));
  }
 
  private marcarIndisponivel(erro: unknown): void {
    if (this.redisDisponivel) {
      this.redisDisponivel = false;
      this.logger.warn(`Redis indisponível (${(erro as Error).message}): catálogo respondendo direto do banco`);
    }
  }
 
  private marcarDisponivel(): void {
    if (!this.redisDisponivel) {
      this.redisDisponivel = true;
      this.logger.log('Redis disponível de novo: cache do catálogo reativado');
    }
  }
}