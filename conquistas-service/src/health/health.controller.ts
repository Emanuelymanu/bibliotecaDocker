import { Controller, Get } from '@nestjs/common';
import { Publica } from '../auth/decorators/publica.decorator';

export interface StatusServico {
  status: 'ok';
  servico: string;
  versao: string;
  timestamp: string;
}


@Publica()
@Controller('health')
export class HealthController {
  @Get()
  verificar(): StatusServico {
    return {
      status: 'ok',
      servico: 'conquistas-service',
      versao: process.env.npm_package_version ?? '0.1.0',
      timestamp: new Date().toISOString(),
    };
  }
}