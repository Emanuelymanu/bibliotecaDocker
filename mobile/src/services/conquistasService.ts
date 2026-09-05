import { api } from './api';

export interface ConquistaCatalogo {
  id_conquista: number;
  nome: string;
  descricao: string | null;
  criterio: string | null;
  desbloqueada: boolean;
  data_conquista: string | null;
}

export const conquistasService = {

  async listarCatalogo(): Promise<{ conquistas: ConquistaCatalogo[]; total: number; totalDesbloqueadas: number }> {
    const { data } = await api.get('/conquistas/catalogo');
    return {
      conquistas: data.conquistas ?? [],
      total: data.total ?? 0,
      totalDesbloqueadas: data.total_desbloqueadas ?? 0,
    };
  },
};