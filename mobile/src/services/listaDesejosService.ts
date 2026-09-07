import { api } from './api';

export interface ItemDesejo {
  data_adicao: string;
  livro: {
    id_livro: number;
    titulo: string;
    subtitulo?: string | null;
    capa: string | null;
    autores: string[];
    editora: string | null;
  } | null;
}

export const listaDesejosService = {
  async listar(): Promise<ItemDesejo[]> {
    const { data } = await api.get('/lista-desejos');
    return data.lista_desejos ?? [];
  },

  async adicionar(idLivro: number): Promise<void> {
    await api.post('/lista-desejos', { id_livro: idLivro });
  },

  async remover(idLivro: number): Promise<void> {
    await api.delete(`/lista-desejos/${idLivro}`);
  },
};