import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

function resolverApiUrl(): string {
    if (process.env.EXPO_PUBLIC_API_URL) {
        return process.env.EXPO_PUBLIC_API_URL;
    }

   
    const ipDoMetro = Constants.expoConfig?.hostUri?.split(':')[0];
    if (ipDoMetro) {
        return `http://${ipDoMetro}/api`;
    }

    return 'http://estantedigital.local/api';
}

const API_URL = resolverApiUrl();
export const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
})

api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('@estante:token');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
})

let aoSessaoExpirar: (() => void) | null = null;


export function definirCallbackSessaoExpirada(callback: (() => void) | null) {
    aoSessaoExpirar = callback;
}

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            await AsyncStorage.removeItem('@estante:token');
            await AsyncStorage.removeItem('@estante:usuario');
            aoSessaoExpirar?.();
        }
        return Promise.reject(error);
    }
);