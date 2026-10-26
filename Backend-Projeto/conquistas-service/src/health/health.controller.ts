import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
    @Get()
    verificar(): { status: string; servico: string; timestamp: string } {
        return { status: 'ok', servico: 'conquistas-service', timestamp: new Date().toISOString() };
    }
}
