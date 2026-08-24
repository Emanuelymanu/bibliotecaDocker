import { api } from './api';
import { Autor, Editora, Genero, tipoCatalogo, Conquista } from '../types/adminTypes';

export const adminService = {
   
    async buscarEstatisticas() {
        const [autoresLista, editorasLista, generosLista, conquistasLista] = await Promise.all([
            api.get('/admin/autores'),
            api.get('/admin/editoras'),
            api.get('/admin/generos'),
            api.get('/conquistas/admin/todas'),
        ]);
        return {
            autores: autoresLista.data.autores.length,
            editoras: editorasLista.data.editoras.length,
            generos: generosLista.data.generos.length,
            conquistas: conquistasLista.data.conquistas.length,
        };
    },



    async listarCatalogo(tipo: tipoCatalogo): Promise<(Autor | Editora | Genero)[]> {
        const { data } = await api.get(`/admin/${tipo}`);
        return data[tipo];
    },

    async criarItemCatalogo(tipo: tipoCatalogo, dados: Record<string, any>): Promise<Autor | Editora | Genero> {
        const { data } = await api.post(`/admin/${tipo}`, dados);
        const chaveResposta = tipo === 'autores' ? 'autor' : tipo === 'editoras' ? 'editora' : 'genero';
        return data[chaveResposta];
    },

    async editarItemCatalogo(tipo: tipoCatalogo, id: number, dados: Record<string, any>): Promise<void> {
        await api.put(`/admin/${tipo}/${id}`, dados);
    },

    async apagarItemCatalogo(tipo: tipoCatalogo, id: number): Promise<void> {
        await api.delete(`/admin/${tipo}/${id}`);
    },

    async mesclarItensCatalogo(tipo: tipoCatalogo, idOrigem: number, idDestino: number): Promise<void> {
        await api.post(`/admin/${tipo}/mesclar`, { id_origem: idOrigem, id_destino: idDestino });
    },


    async listarTodasConquistas(): Promise<Conquista[]> {
        const { data } = await api.get('/conquistas/admin/todas');
        return data.conquistas;
    },

    async criarConquista(dados: { nome: string; descricao?: string; icone?: string; criterio: string }): Promise<Conquista> {
        const { data } = await api.post('/conquistas/admin', dados);
        return data.conquista;
    },

    async editarConquista(id: number, dados: Partial<Conquista>): Promise<Conquista> {
        const { data } = await api.put(`/conquistas/admin/${id}`, dados);
        return data.conquista;
    },

    async apagarConquista(id: number): Promise<void> {
        await api.delete(`/conquistas/admin/${id}`);
    },

    async concederConquista(idConquista: number, idUsuario: number): Promise<void> {
        await api.post(`/conquistas/admin/${idConquista}/conceder`, { id_usuario: idUsuario });
    },
};