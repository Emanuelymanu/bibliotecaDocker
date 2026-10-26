import {Logger} from '@nestjs/common';
import{ConfigService} from '@nestjs/config'
import {NestFactory} from '@nestjs/core'
import {AppModule} from './app.module'
import {configurarApp} from './configurar-app'

async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(AppModule);
    configurarApp(app);

    const porta = app.get(ConfigService).get<number>('PORT', 3001)
    await app.listen(porta, '0.0.0.0')

    new Logger('Boostrap').log(`conquistas-service rodando na porta ${porta}`)
}
void bootstrap()