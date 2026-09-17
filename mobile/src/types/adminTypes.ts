export interface Autor{
    id_autor: number;
    nome: string;
    bio?: string | null;
    data_nascimento?: string | null;
    total_livros: number; 
}

export interface Editora{
    id_editora: number;
    nome: string;
    pais?: string | null
    total_livros: number;
}

export interface Genero{
    id_genero: number;
    nome: string;
    total_livros:number;
}

export type tipoCatalogo = 'autores' | 'editoras' | 'generos';

export interface Conquista{
    id_conquista: number;
    nome: string;
    descricao?: string | null;
    icone?: string | null;
    criterio: string;
}

export interface UsuarioAdmin{
    id_usuario: number;
    nome: string;
    email: string;
    tipo_usuario: 'usuario' | 'admin';
}