import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';
import { definirCallbackSessaoExpirada } from '../services/api';
import { Usuario } from '../types/auth';

interface AuthContextData {
    usuario: Usuario | null;
    carregando: boolean;
    login: (email: string, senha: string) => Promise<void>;
    logout: () => Promise<void>;
    atualizarUsuario: (dados: Partial<Usuario>) => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        carregarUsuarioSalvo();

        definirCallbackSessaoExpirada(() => setUsuario(null));
        return () => definirCallbackSessaoExpirada(null);
    }, []);

    async function carregarUsuarioSalvo() {
        try {
            const usuarioSalvo = await authService.getUsuarioSalvo();
            const token = await authService.getToken();
            if (usuarioSalvo && token) {
                setUsuario(usuarioSalvo);
            }
        } catch (error) {
            console.error('Erro ao carregar sessão salva:', error);
        } finally {
            setCarregando(false);
        }
    }

    async function login(email: string, senha: string) {
        const resposta = await authService.login({ email, senha });
        setUsuario(resposta.usuario);
    }

    async function logout() {
        await authService.logout();
        setUsuario(null);
    }


    function atualizarUsuario(dados: Partial<Usuario>) {
        setUsuario((atual) => (atual ? { ...atual, ...dados } : atual));
    }

    return (
        <AuthContext.Provider value={{ usuario, carregando, login, logout, atualizarUsuario }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}