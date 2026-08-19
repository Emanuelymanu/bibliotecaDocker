export interface Usuario {
    id_usuario: number;
    nome: string;
    email: string;
    tipo_usuario: 'admin' | 'usuario';
}

export interface loginDTO{
    email: string;
    senha: string;

}

export interface loginResponse{
    token: string;
    usuario: Usuario;
}