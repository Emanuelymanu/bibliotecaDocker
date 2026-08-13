import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';
import { Usuario } from '../types/auth';

interface AuthContextData {
    usuario: Usuario | null;
    carregando: boolean;
    login: (email: string, senha: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        carregarUsuarioSalvo();
    }, []);

    async function carregarUsuarioSalvo() {
        const usuarioSalvo = await authService.getUsuarioSalvo();
        const token = await authService.getToken();
        if (usuarioSalvo && token) {
            setUsuario(usuarioSalvo);
        }
        setCarregando(false);
    }

    async function login(email: string, senha: string) {
        const resposta = await authService.login({ email, senha });
        setUsuario(resposta.usuario);
    }

    async function logout() {
        await authService.logout();
        setUsuario(null);
    }

    return (
        <AuthContext.Provider value={{ usuario, carregando, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
