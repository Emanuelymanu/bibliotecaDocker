import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { opcoesRedisDaUrl } from '../../eventos/servidor-redis-eventos';
import { ConquistasService } from '../conquistas.service';
import { EventoInvalidoError, lerEventoEstatisticas } from './estatisticas-atualizadas';


export const CHAVE_ESTATISTICAS_PENDENTES = 'eventos:pendentes:estatisticas.atualizadas';
export const INTERVALO_PENDENTES_MS = 30_000;

const APAGAR_SE_IGUAL = `
if redis.call('HGET', KEYS[1], ARGV[1]) == ARGV[2] then
  return redis.call('HDEL', KEYS[1], ARGV[1])
end
return 0`;


@Injectable()
export class EstatisticasPendentesService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger('EventosPendentes');
  private redis: Redis | null = null;
  private timer: NodeJS.Timeout | null = null;
  private processando = false;
  private avisouFalha = false;

  constructor(
    private readonly config: ConfigService,
    private readonly conquistas: ConquistasService,
  ) {}

  onApplicationBootstrap(): void {
    const url = this.config.get<string>('REDIS_URL');
    if (!url) return;

    this.redis = new Redis({
      ...opcoesRedisDaUrl(url),
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      retryStrategy: (tentativas) => Math.min(tentativas * 500, 5000),
    });
    this.redis.on('error', () => undefined); 
    this.redis.connect().catch(() => undefined);

    this.timer = setInterval(() => void this.processar(), INTERVALO_PENDENTES_MS);
    this.timer.unref();
    setTimeout(() => void this.processar(), 1000).unref();
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    const redis = this.redis;
    this.redis = null;
    await redis?.quit().catch(() => undefined);
  }

  
  async processar(): Promise<number> {
    if (!this.redis || this.processando) return 0;
    this.processando = true;
    try {
      const pendentes = await this.redis.hgetall(CHAVE_ESTATISTICAS_PENDENTES);
      this.avisouFalha = false;
      const campos = Object.entries(pendentes);
      if (campos.length === 0) return 0;

      this.logger.log(`processando ${campos.length} evento(s) guardado(s) enquanto o serviço estava fora do ar`);
      let aplicados = 0;
      for (const [usuario, valor] of campos) {
        if (await this.processarUm(usuario, valor)) aplicados++;
      }
      return aplicados;
    } catch (erro) {
      if (!this.avisouFalha) {
        this.avisouFalha = true;
        this.logger.warn(`não foi possível ler os eventos pendentes: ${(erro as Error).message}`);
      }
      return 0;
    } finally {
      this.processando = false;
    }
  }

  private async processarUm(usuario: string, valor: string): Promise<boolean> {
    let evento;
    try {
      evento = lerEventoEstatisticas(JSON.parse(valor));
    } catch (erro) {
      const motivo = erro instanceof EventoInvalidoError ? erro.message : 'JSON inválido';
      this.logger.warn(`evento pendente do usuario=${usuario} ignorado (${motivo})`);
      await this.apagarSeIgual(usuario, valor);
      return false;
    }

    try {
      const { aplicado, novas } = await this.conquistas.registrarEstatisticas(evento);
      await this.apagarSeIgual(usuario, valor);
      this.logger.log(
        `usuario=${usuario}: evento pendente ${aplicado ? 'aplicado' : 'já estava superado'}` +
          (novas.length ? `, ${novas.length} conquista(s) concedida(s)` : ''),
      );
      return aplicado;
    } catch (erro) {
      
      this.logger.error(`falha ao processar o evento pendente do usuario=${usuario}: ${(erro as Error).message}`);
      return false;
    }
  }

  private async apagarSeIgual(usuario: string, valor: string): Promise<void> {
    await this.redis?.eval(APAGAR_SE_IGUAL, 1, CHAVE_ESTATISTICAS_PENDENTES, usuario, valor);
  }
}