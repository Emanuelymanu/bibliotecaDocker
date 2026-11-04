import { createClient } from "redis";

export interface ClienteRedis{
    isReady: boolean;
    connect(): Promise<unknown>
    publish(canal: string, mensagem: string): Promise<number>;
    quit(): Promise<unknown>
    on(evento: string, ouvinte: (...args: any[])=> void): unknown
}

type FabricaCliente = (url: string) => ClienteRedis;
const fabricaPadrao: FabricaCliente = (url) => createClient({
        url,
        disableOfflineQueue: true,
        socket:{
            connectTimeout: 2000,
            reconnectStrategy: (tentativas) => Math.min(tentativas*500,5000),
        },

    })as unknown as ClienteRedis;

    let fabrica: FabricaCliente = fabricaPadrao;
    let cliente: ClienteRedis | null = null;
    let conectando: Promise<unknown> | null = null
    let redisDisponivel = true;
    let avisouSemUrl = false;

    const ESPERA_CONEXAO_MS = 2000;

    function esperar(ms: number): Promise<void>{
        return new Promise((resolve) => setTimeout(resolve,ms).unref())
    }

    function log(mensagem: string): void{
        console.log(`[eventos] ${mensagem}`)
    }

    function logErro(mensagem: string): void{
        console.error(`[eventos] ${mensagem}`)
    }

    function marcarDisponibilidade(disponivel: boolean, motivo?: string): void{
        if(disponivel === redisDisponivel) return;
        redisDisponivel = disponivel;
        if(disponivel){
            log('Redis disponível de novo, publicação de eventos retomada')
        }else {
            logErro(`Redis indisponível, eventos não serão publicados até ele voltar (${motivo ?? 'sem detalhe'})`)
        }
    }

    function obterCliente(): ClienteRedis | null{
        const url = process.env.REDIS_URL
        if(!url){
            if(!avisouSemUrl){
                avisouSemUrl = true
                logErro('REDIS_URL não definida, eventos não serão publicados')
            }
            return null
        }

        if(!cliente){
            cliente = fabrica(url)
            cliente.on('error', (erro: Error) => marcarDisponibilidade(false, erro?.message))
            cliente.on('ready', ()=> marcarDisponibilidade(true))
            conectando = cliente.connect().catch((erro: Error)=> {
                marcarDisponibilidade(false, erro?.message)
            })
        }
        return cliente
    }

 export async function publicarEvento(pattern: string, data: unknown, descricao = ''): Promise<number | null>{
    const redis = obterCliente()
    if(!redis) return null

    try{
        if(!redis.isReady && conectando){
            await Promise.race([conectando, esperar(ESPERA_CONEXAO_MS)])
        }
        if(!redis.isReady){
            throw new Error('Redis não conectado')
        }

        const mensagem = JSON.stringify({pattern, data})
        const assinantes = await redis.publish(pattern, mensagem)
        marcarDisponibilidade(true)
        log(`publicado ${pattern}${descricao ? ` ${descricao}` : ''} (${assinantes} assinante(s))`);
        return assinantes
    }catch(erro){
        const motivo = erro instanceof Error ? erro.message: String(erro)
        logErro(`falha ao publicar ${pattern}${descricao ? ` ${descricao}` : ''}: ${motivo}`);
        return null;
    }
 }

 export async function encerrarPublicador(): Promise<void>{
    const atual = cliente
    cliente = null
    conectando = null
    if(atual?.isReady){
        await atual.quit().catch(()=> undefined)
    }
 }

 export function definirFabricaParaTestes(nova: FabricaCliente | null): void {
    fabrica = nova ?? fabricaPadrao;
    cliente = null;
    conectando = null;
    redisDisponivel = true;
    avisouSemUrl = false;
}