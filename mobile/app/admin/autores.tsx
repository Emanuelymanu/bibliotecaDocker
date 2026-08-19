import React from 'react';
import CatalogoLista from '@/components/admin/CatalogoLista';
import { adminTheme as t } from '@/src/constants/adminTheme';

export default function AdminAutoresScreen() {
    return (
        <CatalogoLista
            tipo="autores"
            pk="id_autor"
            titulo="Autores"
            icone="people"
            corCategoria={t.categoria.autores}
            placeholderBusca="Buscar autor..."
            campoSubtitulo="nacionalidade"
            campoDescricao="bio"
            camposEdicao={[
                { campo: 'nacionalidade', label: 'Nacionalidade', placeholder: 'Nacionalidade' },
                { campo: 'bio', label: 'Biografia', placeholder: 'Biografia' },
            ]}
        />
    );
}
