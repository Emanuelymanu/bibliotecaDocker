export interface LoginCredencial {
    email: string;
    senha: string
}

export interface Cadastro {
    nome: string;
    email: string;
    senha: string;
    cpf: string,
    confirmSenha?: string;
}

export interface Usuario {
    id: number;
    nome: string;
    email: string;

}

export interface LoginResponse{
    sucesso: boolean;
    mensagem: string;
    token: string;
    usuario: Usuario;
}

export interface CadastroResponse{
    sucesso: boolean;
    mensagem: string;
    usuario?: Usuario;
}

export interface ApiError{
    mensagem: string;
    status: number;
    error: string[]
}