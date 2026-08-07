export function normalizarTexto(valor: unknown): string | null {
    if (typeof valor !== 'string') {
        return valor == null ? null : String(valor);
    }
    const texto = valor.trim();
    return texto.length > 0 ? texto : null;
}


export function normalizarInteiro(valor: unknown): number | null {
    if (valor === null || valor === undefined || valor === '') {
        return null;
    }
    const numero = typeof valor === 'number' ? valor : Number(valor);
    return Number.isFinite(numero) ? numero : null;
}


export function normalizarTextoOpcional(valor: unknown): string | null | undefined {
    if (valor === undefined) return undefined;
    if (valor === null) return null;
    const texto = String(valor).trim();
    return texto.length > 0 ? texto : null;
}

export function normalizarInteiroOpcional(valor: unknown): number | null | undefined {
    if (valor === undefined) return undefined;
    if (valor === null || valor === '') return null;
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : null;
}


export function normalizarLista(valor: unknown): string[] {
    if (valor === undefined || valor === null) return [];
    const bruta = Array.isArray(valor) ? valor : [valor];
    return bruta
        .map((item) => String(item).trim())
        .filter((item) => item.length > 0);
}
