import { createKeyv } from '@keyv/redis';
import { CacheModule, CacheModuleOptions } from '@nestjs/cache-manager';
import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
 
const logger = new Logger('CacheRedis');

@Module({
    imports: [
        CacheModule.registerAsync({
            isGlobal: true,
            inject:[ConfigService],
            useFactory: (config: ConfigService): CacheModuleOptions=> {
                const ttl = config.getOrThrow<number>('CACHE_TTL_SEGUNDOS') *1000
                const url = config.get<string>('REDIS_URL')

                if(!url){
                    logger.warn('REDIS_URL não definida: usando cache em memória')
                    return {ttl}
                }
               const redis = createKeyv({
                url,
                disableOfflineQueue: true,
                socket: {
                    connectTimeout:1000,
                    reconnectStrategy: (tentativas: number) => Math.min(tentativas*200,2000)
                },
               }, {throwOnConnectError: false, throwOnErrors: true, connectionTimeout: 200},)
               redis.on('error', ()=> undefined)
                logger.log(`Cache no Redis (${url.replace(/\/\/.*@/, '//***@')}), TTL padrão ${ttl / 1000}s`);
                return { ttl, stores: [redis] };
            }
        })
    ]
})

export class CacheRedisModule {}