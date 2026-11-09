import { TipoConquista } from '../conquistas.tipos';
import { Conquista } from '../entities/conquista.entity';


export interface ItemCatalogo {
  id_conquista: number;
  nome: string;
  descricao: string | null;
  criterio: string | null;
  icone: string | null;
  tipo: TipoConquista;
  valor_alvo: number;

  progresso: number | null;
  desbloqueada: boolean;
  data_conquista: string | null;
}

export interface CatalogoResposta {
  conquistas: ItemCatalogo[];
  total: number;
  total_desbloqueadas: number;
}

export interface MinhasConquistasResposta {
  conquistas: { id_conquista: number; data_conquista: string | null; conquista: Conquista }[];
}

export interface TipoComExemplo {
  tipo: TipoConquista;
  exemplo: string;
}