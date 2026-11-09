import { gerarTextoCriterio, validarCriterio } from './conquistas.regras';
import { TipoConquista } from './conquistas.tipos';

export interface DadosCriterio {
  tipo?: TipoConquista;
  valor_alvo?: number;
  id_genero?: number | null;
  criterio?: string | null;
}

export interface CriterioMontado {
  tipo: TipoConquista;
  valor_alvo: number;
  id_genero: number | null;
  criterio: string;
}


export function montarCriterio(dados: DadosCriterio, atual?: DadosCriterio): CriterioMontado {
  const regra = validarCriterio({
    tipo: dados.tipo ?? atual?.tipo ?? 'MANUAL',
    valor_alvo: dados.valor_alvo ?? atual?.valor_alvo ?? 1,
    id_genero: dados.id_genero !== undefined ? dados.id_genero : atual?.id_genero,
  });

  const texto =
    regra.tipo === 'MANUAL'
      ? (dados.criterio ?? atual?.criterio ?? null) || gerarTextoCriterio('MANUAL', 1)
      : 
        gerarTextoCriterio(regra.tipo, regra.valor_alvo, null);

  return {
    tipo: regra.tipo,
    valor_alvo: regra.valor_alvo,
    id_genero: regra.id_genero ?? null,
    criterio: texto,
  };
}