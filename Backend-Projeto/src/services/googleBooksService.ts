import axios, { AxiosError, AxiosInstance } from 'axios';
import { logDe } from '../logger';
import { HttpError } from '../utils/HttpError';

/*
 * Integração com a Google Books API (GDL-32).
 *
 * A API é externa: pode ficar lenta, cair ou recusar por limite de uso. Para a busca
 * não travar o sistema:
 *   - timeout: cada chamada desiste depois de GOOGLE_BOOKS_TIMEOUT_MS (padrão 4 s);
 *   - retry: falha temporária (timeout, rede, 5xx) tenta de novo, no máximo
 *     GOOGLE_BOOKS_TENTATIVAS vezes no total (padrão 2), com espera crescente;
 *   - circuit breaker: depois de 3 chamadas seguidas falhando, o circuito abre e,
 *     por 30 s, nenhuma chamada vai ao Google; a resposta é imediata (fallback);
 *   - fallback: a busca responde 503 com mensagem amigável, e as listagens que
 *     misturam livros locais com o Google devolvem só os livros locais.
 */

export const logGoogle = logDe('googleBooks');

const BASE_URL = 'https://www.googleapis.com/books/v1/volumes';
const FALHAS_PARA_ABRIR = 3;
const CIRCUITO_ABERTO_MS = 30_000;
const ESPERA_ENTRE_TENTATIVAS_MS = 300;

export const MENSAGEM_INDISPONIVEL =
    'A busca no Google Books está indisponível no momento. Tente novamente em alguns instantes.';

/** Google fora do ar, lento demais ou circuito aberto: o chamador deve usar o fallback. */
export class GoogleBooksIndisponivelError extends HttpError {
    constructor() {
        super(503, MENSAGEM_INDISPONIVEL);
        this.name = 'GoogleBooksIndisponivelError';
    }
}

function numeroDoAmbiente(nome: string, padrao: number): number {
    const valor = Number(process.env[nome]);
    return Number.isInteger(valor) && valor > 0 ? valor : padrao;
}

let cliente: AxiosInstance | null = null;
let falhasSeguidas = 0;
let abertoAte = 0;
let esperar = (ms: number) => new Promise<void>((resolver) => setTimeout(resolver, ms));

function clienteGoogle(): AxiosInstance {
    cliente ??= axios.create({
        baseURL: BASE_URL,
        timeout: numeroDoAmbiente('GOOGLE_BOOKS_TIMEOUT_MS', 4000),
    });
    return cliente;
}

/** Timeout, erro de rede e 5xx podem passar sozinhos; 4xx (inclusive 429) não adianta repetir. */
function ehFalhaTemporaria(erro: unknown): boolean {
    if (!axios.isAxiosError(erro)) return false;
    const status = erro.response?.status;
    return status === undefined || status >= 500;
}

function registrarSucesso(): void {
    if (falhasSeguidas >= FALHAS_PARA_ABRIR) {
        logGoogle.info('Google Books respondeu de novo: circuito fechado');
    }
    falhasSeguidas = 0;
    abertoAte = 0;
}

function registrarFalha(motivo: string): void {
    falhasSeguidas += 1;
    if (falhasSeguidas >= FALHAS_PARA_ABRIR) {
        abertoAte = Date.now() + CIRCUITO_ABERTO_MS;
        logGoogle.warn(
            `circuito aberto por ${CIRCUITO_ABERTO_MS / 1000}s após ${falhasSeguidas} falhas seguidas (${motivo}): buscas usam o fallback`,
        );
    }
}

function descrever(erro: unknown): string {
    if (axios.isAxiosError(erro)) {
        const e = erro as AxiosError;
        if (e.code === 'ECONNABORTED' || e.code === 'ETIMEDOUT') return 'timeout';
        if (e.response) return `HTTP ${e.response.status}`;
        return e.code ?? e.message;
    }
    return (erro as Error)?.message ?? String(erro);
}

function normalizeGoogleImageUrl(url?: string | null) {
    if (!url) {
        return null;
    }

    if (url.startsWith('//')) {
        return `https:${url}`;
    }

    if (url.startsWith('http://')) {
        return url.replace(/^http:\/\//, 'https://');
    }

    return url;
}

function normalizeGoogleBookItem<T extends { volumeInfo?: { imageLinks?: { thumbnail?: string; smallThumbnail?: string } } }>(item: T): T {
    const imageLinks = item.volumeInfo?.imageLinks;

    if (!imageLinks) {
        return item;
    }

    return {
        ...item,
        volumeInfo: {
            ...item.volumeInfo,
            imageLinks: {
                ...imageLinks,
                thumbnail: normalizeGoogleImageUrl(imageLinks.thumbnail) ?? undefined,
                smallThumbnail: normalizeGoogleImageUrl(imageLinks.smallThumbnail) ?? undefined
            }
        }
    };
}

export const fetchFromGoogle = async (query: string) => {
    if (Date.now() < abertoAte) {
        throw new GoogleBooksIndisponivelError();
    }

    const params: Record<string, string> = { q: query };
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    if (apiKey) {
        params.key = apiKey;
    }

    const tentativas = numeroDoAmbiente('GOOGLE_BOOKS_TENTATIVAS', 2);

    for (let tentativa = 1; ; tentativa++) {
        try {
            const response = await clienteGoogle().get('', { params });
            registrarSucesso();
            return (response.data.items ?? []).map(normalizeGoogleBookItem);
        } catch (erro) {
            const motivo = descrever(erro);

            if (axios.isAxiosError(erro) && erro.response?.status === 429) {
                logGoogle.warn('limite de requisições da Google Books API atingido (429)');
                throw new HttpError(429, 'Limite de buscas no Google Books atingido. Tente novamente mais tarde.');
            }

            if (!ehFalhaTemporaria(erro)) {
                // Ex.: 400/403 (chave inválida). Repetir não resolve, mas o usuário recebe o mesmo fallback.
                logGoogle.error(`Google Books recusou a busca (${motivo})`);
                throw new GoogleBooksIndisponivelError();
            }

            if (tentativa < tentativas) {
                logGoogle.warn(`tentativa ${tentativa}/${tentativas} falhou (${motivo}); tentando de novo`);
                await esperar(ESPERA_ENTRE_TENTATIVAS_MS * tentativa);
                continue;
            }

            logGoogle.warn(`Google Books indisponível após ${tentativas} tentativa(s) (${motivo})`);
            registrarFalha(motivo);
            throw new GoogleBooksIndisponivelError();
        }
    }
};

export function estadoCircuitoGoogle(): { aberto: boolean; falhasSeguidas: number } {
    return { aberto: Date.now() < abertoAte, falhasSeguidas };
}

export function reiniciarGoogleBooksParaTestes(opcoes: { cliente?: AxiosInstance; esperar?: (ms: number) => Promise<void> } = {}): void {
    cliente = opcoes.cliente ?? null;
    esperar = opcoes.esperar ?? ((ms) => new Promise<void>((resolver) => setTimeout(resolver, ms)));
    falhasSeguidas = 0;
    abertoAte = 0;
}
