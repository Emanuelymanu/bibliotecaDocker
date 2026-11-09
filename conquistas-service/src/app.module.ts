import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { BancoModule } from './banco/banco.module';
import { CacheRedisModule } from './cache/cache-redis.module';
import { ConquistasModule } from './conquistas/conquistas.module';
import { LogRequisicoesMiddleware } from './common/middleware/log-requisicoes.middleware';
import { validarAmbiente } from './config/variaveis-ambiente';
import { HealthModule } from './health/health.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validarAmbiente }),
    BancoModule,
    CacheRedisModule,
    AuthModule,
    HealthModule,
    ConquistasModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LogRequisicoesMiddleware).forRoutes('{*caminho}');
  }
}