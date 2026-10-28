import { SetMetadata } from '@nestjs/common';

export const APENAS_ADMIN = 'apenasAdmin';


export const ApenasAdmin = () => SetMetadata(APENAS_ADMIN, true);