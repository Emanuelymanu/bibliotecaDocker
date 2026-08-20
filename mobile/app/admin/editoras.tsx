import React from 'react';
import CatalogoLista from '@/components/admin/CatalogoLista';
import { adminTheme as t } from '@/src/constants/adminTheme';

export default function AdminEditorasScreen() {
    return (
        <CatalogoLista
            tipo="editoras"
            pk="id_editora"
            titulo="Editoras"
            icone="book"
            corCategoria={t.categoria.editoras}
            placeholderBusca="Buscar editora..."
            campoSubtitulo="pais"
            camposEdicao={[
                { campo: 'pais', label: 'País', placeholder: 'País' },
            ]}
        />
    );
}
