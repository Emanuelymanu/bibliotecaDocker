import api from './api';

import { AxiosError } from 'axios';
import type {LoginCredencial , ApiError, Cadastro, CadastroResponse, LoginResponse, Usuario } from '../types/auth';

export class AuthService {
    async login(credentials: LoginCredencial): Promise<LoginResponse> {
        try {
            const response = await api.post<LoginResponse>('/auth/login', credentials);

            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('usuario', JSON.stringify(response.data.usuario));
            }
            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError<ApiError>;
            throw axiosError.response?.data || { mensagem: 'Erro ao fazer login' };
        }
    }

    async cadastro(userData: Cadastro): Promise<CadastroResponse> {
        try {
            const response = await api.post<CadastroResponse>('/auth/cadastro', userData);
            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError<ApiError>;
            throw axiosError.response?.data || { mensagem: "Erro ao cadastrar" };
        }
    }

    logout(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        window.location.href = '/login';
    }

    isAuthenticated(): boolean {
        const token = localStorage.getItem('token');
        return !!token;
    }
    getUser(): Usuario | null {
        const usuario = localStorage.getItem('usuario');
        return usuario ? JSON.parse(usuario) : null;
    }

    getToken(): string | null {
        return localStorage.getItem('token');
    }
}


export const authService = new AuthService();

