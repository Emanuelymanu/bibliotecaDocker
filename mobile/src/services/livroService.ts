import { api } from './api';
import { CapaSelecionada, CriarLivroDTO } from '../types/livro';

export const livroService = {
    async cadastrarComCapa(dados: CriarLivroDTO, capa: CapaSelecionada) {
        const formData = new FormData();

        Object.entries(dados).forEach(([chave, valor]) => {
            if (valor !== undefined && valor !== null && valor !== '') {
                formData.append(chave, String(valor));
            }
        });

        formData.append('capa', {
            uri: capa.uri,
            name: capa.nome,
            type: capa.tipoMime,
        } as any);

        const { data } = await api.post('/livros/cadastrar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    },
};
