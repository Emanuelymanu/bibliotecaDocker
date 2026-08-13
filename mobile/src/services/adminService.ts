import {api} from './api';
import {Autor, Editora, Genero, tipoCatalogo, Conquista} from '../types/adminTypes';

export const adminService ={
    async listarCatalogo(tipo: tipoCatalogo): Promise<(Autor | Editora | Genero)[]>{
        const {data} = await api.get(`/admin/catalogo/${tipo}`);
        return data[tipo];
    },

     async editarItemCatalogo(tipo: tipoCatalogo, id: number, dados: Record<string, any>): Promise<void> {
        const chaveId = tipo === 'autores' ? 'id_autor' : tipo === 'editoras' ? 'id_editora' : 'id_genero';
        await api.put(`/admin/catalogo/${tipo}/${id}`, dados);
        void chaveId; 
    },
 
    async apagarItemCatalogo(tipo: tipoCatalogo, id: number): Promise<void> {
        await api.delete(`/admin/catalogo/${tipo}/${id}`);
    },
 
    async mesclarItensCatalogo(tipo: tipoCatalogo, idOrigem: number, idDestino: number): Promise<void> {
        await api.post(`/admin/catalogo/${tipo}/mesclar`, { id_origem: idOrigem, id_destino: idDestino });
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
}