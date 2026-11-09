export type TipoConquista =
    | 'MANUAL'
    | 'LIVROS_LIDOS'
    | 'LIVROS_CADASTRADOS'
    | 'PAGINAS_LIDAS'
    | 'SESSOES'
    | 'ANOTACOES'
    | 'AVALIACOES'
    | 'GENEROS_DISTINTOS'
    | 'LIVROS_GENERO'
    | 'POSSUI_META';

export const OPCOES_TIPO: { tipo: TipoConquista; rotulo: string }[] = [
    { tipo: 'LIVROS_LIDOS', rotulo: 'Livros lidos' },
    { tipo: 'LIVROS_CADASTRADOS', rotulo: 'Livros cadastrados' },
    { tipo: 'PAGINAS_LIDAS', rotulo: 'Páginas lidas' },
    { tipo: 'SESSOES', rotulo: 'Sessões' },
    { tipo: 'ANOTACOES', rotulo: 'Anotações' },
    { tipo: 'AVALIACOES', rotulo: 'Avaliações' },
    { tipo: 'GENEROS_DISTINTOS', rotulo: 'Gêneros diferentes' },
    { tipo: 'LIVROS_GENERO', rotulo: 'Livros de um gênero' },
    { tipo: 'POSSUI_META', rotulo: 'Ter uma meta' },
    { tipo: 'MANUAL', rotulo: 'Manual' },
];


export function semQuantidade(tipo: TipoConquista): boolean {
    return tipo === 'MANUAL' || tipo === 'POSSUI_META';
}


export function textoDoCriterio(tipo: TipoConquista, n: number, nomeGenero?: string | null): string {
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