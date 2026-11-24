import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { BancoModule } from './banco/banco.module';
import { CacheRedisModule } from './cache/cache-redis.module';
import { ConquistasModule } from './conquistas/conquistas.module';
import { validarAmbiente } from './config/variaveis-ambiente';
import { HealthModule } from './health/health.module';
import { LoggerModule } from 'nestjs-pino';
import { opcoesLogger } from './logger/opcoes-logger';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validarAmbiente }),
    LoggerModule.forRoot(opcoesLogger()),
    BancoModule,
    CacheRedisModule,
    AuthModule,
    HealthModule,
    ConquistasModule,
  ],
})
export class AppModule {}