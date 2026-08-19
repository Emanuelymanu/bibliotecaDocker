/**
 * Paleta e tokens visuais da área administrativa.
 */
export const adminTheme = {
    cor: {
        fundo: '#F7F8FA',
        superficie: '#FFFFFF',
        primaria: '#6D28D9',
        primariaClara: '#EDE7FB',
        primariaEscura: '#4C1D95',
        destaque: '#D97706',
        heroFundo: '#1E2536',      // navy escuro do card "Área de Administração"
        perigo: '#DC2626',
        perigoClaro: '#FEE2E2',
        sucesso: '#16A34A',
        texto: '#1A1D29',
        textoSecundario: '#767B8A',
        textoTerciario: '#A6ABB8',
        borda: '#ECEDF1',
    },
    // cor de cada categoria: ícone + fundo do círculo + badge de contagem
    categoria: {
        conquistas: { icone: '#D97706', fundo: '#FEF3C7' },
        autores: { icone: '#2563EB', fundo: '#DBEAFE' },
        editoras: { icone: '#7C3AED', fundo: '#EDE4FB' },
        generos: { icone: '#059669', fundo: '#D1FAE5' },
    },
    // paleta de avatares (autores) — escolhida por hash do nome, cicla nessas cores
    avatares: [
        { fundo: '#FCE7F3', texto: '#DB2777' }, // rosa
        { fundo: '#FFEDD5', texto: '#C2410C' }, // laranja
        { fundo: '#CCFBF1', texto: '#0F766E' }, // teal
        { fundo: '#FEE2E2', texto: '#DC2626' }, // vermelho
        { fundo: '#E0E7FF', texto: '#4338CA' }, // índigo
    ],
    espaco: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
    raio: { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 },
    sombra: {
        shadowColor: '#0F172A',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
};

/** Escolhe uma cor de avatar de forma consistente pro mesmo nome sempre cair na mesma cor. */
export function corDoAvatar(nome: string) {
    const soma = nome.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return adminTheme.avatares[soma % adminTheme.avatares.length];
}

/** Pega as iniciais (até 2 letras) do nome, pro avatar. */
export function iniciais(nome: string): string {
    const partes = nome.trim().split(/\s+/);
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}
