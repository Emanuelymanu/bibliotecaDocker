import { api } from './api';
import { CapaSelecionada, CriarLivroDTO } from '../types/livro';

export const livroService = {
    async cadastrarComCapa(dados: CriarLivroDTO, capa: CapaSelecionada) {
        const formData = new FormData();

        formData.append('titulo', dados.titulo);
        if (dados.subtitulo) formData.append('subtitulo', dados.subtitulo);
        dados.autores.forEach((nome) => formData.append('autores', nome));
        formData.append('tipo_obra', dados.tipo_obra);
        if (dados.ano_publicacao) formData.append('ano_publicacao', dados.ano_publicacao);
        formData.append('num_paginas', dados.num_paginas);
        (dados.generos ?? []).forEach((nome) => formData.append('generos', nome));
        if (dados.editora) formData.append('editora', dados.editora);

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
