import React from 'react';
import CatalogoLista from '@/components/admin/CatalogoLista';
import { adminTheme as t } from '@/src/constants/adminTheme';

export default function AdminGenerosScreen() {
    return (
        <CatalogoLista
            tipo="generos"
            pk="id_genero"
            titulo="Gêneros"
            icone="pricetag"
            corCategoria={t.categoria.generos}
            placeholderBusca="Buscar gênero..."
        />
    );
}
