import { api } from './api';
import { celebrarConquistas, ConquistaDesbloqueada } from '../utils/celebrarConquistas';



const ROTAS_QUE_GERAM_EVENTO = /^\/?(livros|leituras|anotacoes|sessoes|metas)(\/|$|\?)/;
const ESPERAS_MS = [800, 2500];

const esperar = (ms: number) => new Promise<void>((resolver) => setTimeout(resolver, ms));

let verificando = false;
let verificarDeNovo = false;

export async function buscarConquistasNovas(): Promise<ConquistaDesbloqueada[]> {
  const { data } = await api.get('/conquistas/novas');
  return data.conquistas ?? [];
}


export async function avisarConquistasNovas(esperas: number[] = ESPERAS_MS): Promise<void> {
  if (verificando) {
    
    verificarDeNovo = true;
    return;
  }
  verificando = true;
  try {
    for (const espera of esperas) {
      await esperar(espera);
      const novas = await buscarConquistasNovas();
      if (novas.length > 0) {
        celebrarConquistas(novas);
        break;
      }
    }
  } catch (erro) {
    console.warn('Não foi possível verificar conquistas novas', erro);
  } finally {
    verificando = false;
    if (verificarDeNovo) {
      verificarDeNovo = false;
      void avisarConquistasNovas(esperas);
    }
  }
}

let ativado = false;


export function ativarAvisoDeConquistas(): void {
  if (ativado) return;
  ativado = true;
  api.interceptors.response.use((resposta) => {
    const metodo = (resposta.config.method ?? 'get').toLowerCase();
    const url = resposta.config.url ?? '';
    if (metodo !== 'get' && ROTAS_QUE_GERAM_EVENTO.test(url)) {
      void avisarConquistasNovas();
    }
    return resposta;
  });
}