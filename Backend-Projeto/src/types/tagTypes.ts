export interface Tag{
    id_tag: number;
    id_usuario;
    nome: string;
    cor: string
}

export interface CriarTagDTO{
    nome: string;
    cor?: string;
}

export interface AtualizarTagDTO{
    nome?: string;
    cor?: string;
}

export interface TagResponse {
    id_tag: number;
    nome: string;
    cor: string;
    usuario?:{
        id: number;
        nome:string;
    };
    total_leituras?: number;
}

export interface ListarTagQuery{
    page?: number;
    limit?: number;
    buscar?: string;
}