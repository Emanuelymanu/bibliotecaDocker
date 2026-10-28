import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequisicaoAutenticada, UsuarioAutenticado } from '../usuario-autenticado';

export const UsuarioAtual = createParamDecorator(
  (campo: keyof UsuarioAutenticado | undefined, contexto: ExecutionContext) => {
    const usuario = contexto.switchToHttp().getRequest<RequisicaoAutenticada>().usuario;
    return campo ? usuario?.[campo] : usuario;
  },
);