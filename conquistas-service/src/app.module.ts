import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LogRequisicoesMiddleware } from './common/middleware/log-requisicoes.middleware';
import { validarAmbiente } from './config/variaveis-ambiente';
import { HealthModule } from './health/health.module';

@Module({
    imports:[
        ConfigModule.forRoot({ isGlobal: true, validate: validarAmbiente}),
        HealthModule,
    ],

})
export class AppModule implements NestModule{
    configure(consumer: MiddlewareConsumer): void{
        consumer.apply(LogRequisicoesMiddleware).forRoutes('{*caminho}')
    }
}