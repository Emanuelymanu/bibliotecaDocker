import { INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

export function configurarApp(app: INestApplication): void{
    app.setGlobalPrefix('api', {exclude:['health']}

    )

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        })
    )

    app.useGlobalFilters(new HttpExceptionFilter())
    app.enableShutdownHooks();
}