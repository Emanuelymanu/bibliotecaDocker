import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PermissaoEventosController } from './eventos/permissao-eventos.controller';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RevogacaoTokensService } from './revogacao-tokens.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [PermissaoEventosController],
  providers: [RevogacaoTokensService, { provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AuthModule {}