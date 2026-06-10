export interface UsuarioPerfil{
    id_usuario: number;
    nome: string;
    email: string;
    cpf: string;

}


export interface AtualizarPerfilDTO{
    nome?: string;
    cpf?: string;
    senha?: string;
}

export interface PerfilResponse{
    mensagem: string;
    usuario: UsuarioPerfil;
}

export interface ApiError{
    erro?: string;
    mensagem?: string;
}