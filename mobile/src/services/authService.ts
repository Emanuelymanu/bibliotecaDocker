import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';
import { loginDTO, loginResponse, Usuario } from '../types/auth';

const TOKEN_KEY = '@estante:token';
const USER_KEY = '@estante:usuario';

export const authService = {
    async login(credentials: loginDTO): Promise<loginResponse> {
        const { data } = await api.post<loginResponse>('/auth/login', credentials);
        await AsyncStorage.multiSet([
            [TOKEN_KEY, data.token],
            [USER_KEY, JSON.stringify(data.usuario)],
        ]);
        return data;
    },

    async getToken(): Promise<string | null> {
        return AsyncStorage.getItem(TOKEN_KEY);
    },

    async getUsuarioSalvo(): Promise<Usuario | null> {
        const usuario = await AsyncStorage.getItem(USER_KEY);
        return usuario ? JSON.parse(usuario) as Usuario : null;
    },

    async logout(): Promise<void> {
        await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    },
};
