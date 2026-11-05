import { Logger } from '@nestjs/common';
import { ServerRedis } from '@nestjs/microservices';

export const INTERVALO_RECONEXAO_MS = 2000

export function opcoesRedisDaUrl(url: string){
    const endereco = new URL(url);
    if(endereco.protocol !== 'redis:' && endereco.protocol !== 'rediss:'){
        throw new Error (`REDIS_URL deve começar com redis:// ou rediss:// (veio ${endereco.protocol})`)
    }

    const db = endereco.pathname.length > 1 ? Number(endereco.pathname.slice(1)): undefined
    return{
        host: endereco.hostname,
        port: Number(endereco.port || 6379),
        ...(endereco.username && {username: decodeURIComponent(endereco.username)}),
        ...(endereco.password && {password: decodeURIComponent(endereco.password) }),
        ...(db !== undefined && !Number.isNaN(db) && {db}),
        ...(endereco.protocol === 'rediss:' && {tls: {}}),

    }
}

export class ServidorRedisEventos extends ServerRedis{
    private readonly log = new Logger('EventosRedis')
    private redisDisponivel = true
    private jaConectou = false

    constructor(url: string){
        super({
            ...opcoesRedisDaUrl(url),
            retryAttempts: Number.MAX_SAFE_INTEGER,
            retryDelay: INTERVALO_RECONEXAO_MS,
            maxRetriesPerRequest: null,
        })
    }

    override start (callback?: () => void): void{
    this.subClient.connect().catch(() => undefined);
    this.pubClient.connect().catch(() => undefined);
    this.bindEvents(this.subClient, this.pubClient);
    this.log.log(`assinando os canais: ${[...this.messageHandlers.keys()].join(', ')}`);
    callback?.();
    }

      override registerErrorListener(client: { on: (evento: string, fn: (erro: Error) => void) => void }): void {
    client.on('error', (erro) => {
      if (this.redisDisponivel) {
        this.redisDisponivel = false;
        this.log.warn(
          `Redis indisponível (${erro.message || erro.name}): eventos não chegam até ele voltar; ` +
            `tentando reconectar a cada ${INTERVALO_RECONEXAO_MS / 1000}s`,
        );
      }
    });
  }
 
  override registerReadyListener(client: { on: (evento: string, fn: () => void) => void }): void {
    client.on('ready', () => {
      if (!this.jaConectou) {
        this.jaConectou = true;
        this.redisDisponivel = true;
        this.log.log('conectado ao Redis: recebendo eventos');
      } else if (!this.redisDisponivel) {
        this.redisDisponivel = true;
        this.log.log('Redis disponível de novo: assinatura dos eventos retomada');
      }
    });
  }
 
  override registerReconnectListener(): void {
  
  }
}