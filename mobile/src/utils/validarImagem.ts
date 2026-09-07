const EXTENSOES_PERMITIDAS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
export const TAMANHO_MAXIMO_CAPA_BYTES = 5 * 1024 * 1024; 

interface ArquivoParaValidar {
    fileName?: string | null;
    mimeType?: string | null;
    fileSize?: number | null;
    uri: string;
}


export function validarImagemCapa(asset: ArquivoParaValidar): string | null {
    const nomeArquivo = asset.fileName ?? asset.uri;
    const extensao = nomeArquivo.split('.').pop()?.toLowerCase() ?? '';

    if (!EXTENSOES_PERMITIDAS.includes(extensao)) {
        return 'Formato de imagem não suportado. Use JPG, PNG, GIF ou WEBP.';
    }

    if (asset.mimeType && !asset.mimeType.startsWith('image/')) {
        return 'O arquivo selecionado não é uma imagem válida.';
    }

    if (asset.fileSize && asset.fileSize > TAMANHO_MAXIMO_CAPA_BYTES) {
        return 'A imagem deve ter no máximo 5MB.';
    }

    return null;
}
