import { CriterioConquista, EstatisticasLeitor, TIPOS_CONQUISTAS, TipoConquista } from "./conquistas.tipos";

type Avaliador = (e: EstatisticasLeitor, c: CriterioConquista) => number;

const avaliadores: Record<Exclude<TipoConquista,'MANUAL'>, Avaliador> ={
    LIVROS_LIDOS: (e) => e.livrosLidos,
    LIVROS_CADASTRADOS: (e) => e.livrosCadastrados,
    PAGINAS_LIDAS: (e) => e.paginasLidas,
    SESSOES: (e) => e.totalSessoes,
    ANOTACOES: (e) => e.totalAnotacoes,
    AVALIACOES: (e) => e.totalAvaliacoes,
    GENEROS_DISTINTOS: (e) => Object.values(e.livrosLidosPorGenero).filter((qtd) => qtd > 0).length,
    LIVROS_GENERO: (e, c) => (c.id_genero ? e.livrosLidosPorGenero[c.id_genero] ?? 0 : 0),
    POSSUI_META: (e) => (e.possuiMeta ? 1 : 0),
}

export function calcularProgresso(criterio: CriterioConquista, estatistica: EstatisticasLeitor): number | null{
    if (criterio.tipo === 'MANUAL') return null;
    const avaliar = avaliadores[criterio.tipo];
    return avaliar ? avaliar(estatistica, criterio): null;

}

export function atingiuCriterio(criterio:CriterioConquista, estatistica: EstatisticasLeitor): boolean{
    const progresso = calcularProgresso(criterio, estatistica);
    return progresso !== null && progresso >= criterio.valor_alvo;
}

export function gerarTextoCriterio(tipo: TipoConquista, valorAlvo: number, nomeGenero?: string | null): string {
    const n = valorAlvo;
    const p = (singular: string, plural: string) => (n === 1 ? singular : plural);
    switch (tipo) {
        case 'LIVROS_LIDOS': return `Conclua ${n} ${p('livro', 'livros')}`;
        case 'LIVROS_CADASTRADOS': return `Adicione ${n} ${p('livro', 'livros')} à sua biblioteca`;
        case 'PAGINAS_LIDAS': return `Leia ${n} ${p('página', 'páginas')}`;
        case 'SESSOES': return `Registre ${n} ${p('sessão', 'sessões')} de leitura`;
        case 'ANOTACOES': return `Escreva ${n} ${p('anotação', 'anotações')}`;
        case 'AVALIACOES': return `Avalie ${n} ${p('livro', 'livros')}`;
        case 'GENEROS_DISTINTOS': return `Conclua livros de ${n} ${p('gênero', 'gêneros')} diferentes`;
        case 'LIVROS_GENERO': return `Conclua ${n} ${p('livro', 'livros')} de ${nomeGenero ?? 'um gênero'}`;
        case 'POSSUI_META': return 'Crie uma meta de leitura';
        case 'MANUAL': return 'Concedida pela administração';
    }
}

export function validarCriterio (dados: {tipo?: unknown; valor_alvo?: unknown; id_genero?: unknown}): CriterioConquista{
    const tipo = String(dados.tipo ?? '').trim().toUpperCase() as TipoConquista;
    if(!TIPOS_CONQUISTAS.includes(tipo)){
        throw new Error(`Tipo inválido. Use um destes: ${TIPOS_CONQUISTAS.join(', ')}`);
    }

    const semQuantidade = tipo === 'MANUAL' || tipo === 'POSSUI_META';
    const valorAlvo = semQuantidade ? 1 : Number(dados.valor_alvo);
    if(!Number.isInteger(valorAlvo) || valorAlvo < 1){
        throw new Error('valor_alvo deve ser um número inteiro maior que zero');
    }

    let idGenero: number | null = null;
    if(tipo === 'LIVROS_GENERO'){
        idGenero = Number(dados.id_genero);
        if(!Number.isInteger(idGenero) || idGenero<1){
            throw new Error('Selecione o gênero para conquistas do tipo livros genero')
        }
    }
    return { tipo, valor_alvo: valorAlvo, id_genero: idGenero}
}