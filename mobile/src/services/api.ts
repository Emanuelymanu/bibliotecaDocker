import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = 'http://10.10.5.190:3000/api';
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

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            await AsyncStorage.removeItem('@estante:token');
            await AsyncStorage.removeItem('@estante:usuario');
        }
        return Promise.reject(error);
    }
);