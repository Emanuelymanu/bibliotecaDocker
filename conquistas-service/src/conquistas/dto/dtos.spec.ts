import { ArgumentMetadata, BadRequestException, ValidationPipe } from '@nestjs/common';
import { AtualizarConquistaDto } from './atualizar-conquista.dto';
import { ConcederConquistaDto } from './conceder-conquista.dto';
import { CriarConquistaDto } from './criar-conquista.dto';


const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });

async function validar<T>(classe: new () => T, corpo: unknown): Promise<T> {
  const meta: ArgumentMetadata = { type: 'body', metatype: classe };
  return pipe.transform(corpo, meta) as Promise<T>;
}

async function mensagemDeErro(classe: new () => unknown, corpo: unknown): Promise<string> {
  try {
    await validar(classe, corpo);
  } catch (erro) {
    const corpoErro = (erro as BadRequestException).getResponse() as { message: string[] };
    return corpoErro.message.join('; ');
  }
  throw new Error('era para ter falhado');
}

describe('CriarConquistaDto', () => {
  it('aceita o corpo que o app atual envia', async () => {
    const dto = await validar(CriarConquistaDto, { nome: 'Leitor', descricao: 'x', icone: 'book', criterio: 'texto' });

    expect(dto).toMatchObject({ nome: 'Leitor', criterio: 'texto' });
  });

  it('apara espaços e normaliza o tipo para maiúsculas', async () => {
    const dto = await validar(CriarConquistaDto, { nome: '  Leitor  ', tipo: ' livros_lidos ', valor_alvo: 3 });

    expect(dto).toMatchObject({ nome: 'Leitor', tipo: 'LIVROS_LIDOS', valor_alvo: 3 });
  });

  it.each([
    [{}, 'Nome é obrigatório'],
    [{ nome: '   ' }, 'Nome é obrigatório'],
    [{ nome: 'x', tipo: 'QUALQUER' }, 'Tipo inválido'],
    [{ nome: 'x', valor_alvo: 0 }, 'valor_alvo deve ser um número inteiro maior que zero'],
    [{ nome: 'x', valor_alvo: 2.5 }, 'valor_alvo deve ser um número inteiro maior que zero'],
    [{ nome: 'x', campo_estranho: 1 }, 'campo_estranho should not exist'],
  ])('recusa %j', async (corpo, mensagem) => {
    expect(await mensagemDeErro(CriarConquistaDto, corpo)).toContain(mensagem);
  });
});

describe('AtualizarConquistaDto', () => {
  it('todos os campos são opcionais', async () => {
    await expect(validar(AtualizarConquistaDto, {})).resolves.toBeDefined();
    await expect(validar(AtualizarConquistaDto, { valor_alvo: 5 })).resolves.toMatchObject({ valor_alvo: 5 });
  });

  it('mantém as validações da criação', async () => {
    expect(await mensagemDeErro(AtualizarConquistaDto, { nome: '' })).toContain('Nome é obrigatório');
  });
});

describe('ConcederConquistaDto', () => {
  it('exige id_usuario inteiro positivo', async () => {
    expect(await mensagemDeErro(ConcederConquistaDto, {})).toContain('id_usuario é obrigatório');
    expect(await mensagemDeErro(ConcederConquistaDto, { id_usuario: 0 })).toContain('id_usuario é obrigatório');
    await expect(validar(ConcederConquistaDto, { id_usuario: 7 })).resolves.toMatchObject({ id_usuario: 7 });
  });
});