import { gerarTextoCriterio, validarCriterio } from './conquistas.regras';
import { TipoConquista } from './conquistas.tipos';

export interface DadosCriterio {
  tipo?: TipoConquista;
  valor_alvo?: number;
  id_genero?: number | null;
  nome_genero?: string | null;
  criterio?: string | null;
}

export interface CriterioMontado {
  tipo: TipoConquista;
  valor_alvo: number;
  id_genero: number | null;
  nome_genero: string | null;
  criterio: string;
}


function resolverNomeGenero(idGenero: number, dados: DadosCriterio, atual?: DadosCriterio): string {
  const enviado = typeof dados.nome_genero === 'string' ? dados.nome_genero.trim() : '';
  if (enviado) return enviado;
  const mesmoGenero = atual?.id_genero === idGenero;
  const salvo = mesmoGenero && dados.nome_genero === undefined ? atual?.nome_genero?.trim() : '';
  if (salvo) return salvo;
  throw new Error('Informe o nome do gênero (nome_genero) para conquistas do tipo livros de um gênero');
}


export function montarCriterio(dados: DadosCriterio, atual?: DadosCriterio): CriterioMontado {
  const regra = validarCriterio({
    tipo: dados.tipo ?? atual?.tipo ?? 'MANUAL',
    valor_alvo: dados.valor_alvo ?? atual?.valor_alvo ?? 1,
    id_genero: dados.id_genero !== undefined ? dados.id_genero : atual?.id_genero,
  });

  const nomeGenero =
    regra.tipo === 'LIVROS_GENERO' ? resolverNomeGenero(regra.id_genero as number, dados, atual) : null;

  const texto =
    regra.tipo === 'MANUAL'
      ? (dados.criterio ?? atual?.criterio ?? null) || gerarTextoCriterio('MANUAL', 1)
      : 
        gerarTextoCriterio(regra.tipo, regra.valor_alvo, nomeGenero);

  return {
    tipo: regra.tipo,
    valor_alvo: regra.valor_alvo,
    id_genero: regra.id_genero ?? null,
    nome_genero: nomeGenero,
    criterio: texto,
  };
}