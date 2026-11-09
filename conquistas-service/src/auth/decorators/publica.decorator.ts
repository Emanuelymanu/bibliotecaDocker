import { SetMetadata } from '@nestjs/common';

export const ROTA_PUBLICA = 'rotaPublica';

export const Publica = () => SetMetadata(ROTA_PUBLICA, true);