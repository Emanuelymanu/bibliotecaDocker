import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { opcoesBanco } from './opcoes-banco';


@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const host = config.getOrThrow<string>('DB_HOST');
        const nome = config.getOrThrow<string>('DB_NAME');
        new Logger('BancoModule').log(`Conectando ao banco "${nome}" em ${host}`);

        return {
          ...opcoesBanco({
            host,
            porta: config.getOrThrow<number>('DB_PORT'),
            usuario: config.getOrThrow<string>('DB_USER'),
            senha: config.getOrThrow<string>('DB_PASSWORD'),
            nome,
          }),
          migrationsRun: true,
          retryAttempts: 10,
          retryDelay: 3000,
        };
      },
    }),
  ],
})
export class BancoModule {}