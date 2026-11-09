import { INestApplication, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CustomStrategy } from '@nestjs/microservices';
import { ServidorRedisEventos } from './servidor-redis-eventos';


export async function conectarEventos(app: INestApplication): Promise <boolean>{
    const logger = new Logger('Eventos')
    const url = app.get(ConfigService).get<string>('REDIS_URL')
    if(!url){
        logger.warn('REDIS_URL não definida: o serviço não vai receber os eventos de estatísticas')
        return false
    }

    app.connectMicroservice<CustomStrategy>({ strategy: new ServidorRedisEventos(url)})
    await app.startAllMicroservices()
    return true
}

