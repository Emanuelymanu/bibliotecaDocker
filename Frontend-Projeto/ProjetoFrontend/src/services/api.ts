import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import Swal from 'sweetalert2';

const API_URL = import.meta.env.VITE_API_URL || "/api";

const api: AxiosInstance = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;

    },
    (error: AxiosError) => {
        return Promise.reject(error)
    }
);


api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
)

api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);


api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const status = error.response?.status;
        const data = error.response?.data as any;

        if (error.code === 'ERR_NETWORK') {
            await Swal.fire({
                icon: 'error',
                title: 'Erro de Conexão',
                text: 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
                confirmButtonColor: '#3b82f6',
            });
            return Promise.reject(error);
        }

        switch (status) {
            case 400:
                await Swal.fire({
                    icon: 'warning',
                    title: 'Dados Inválidos',
                    text: data?.message || data?.erro || 'Verifique os campos e tente novamente.',
                    confirmButtonColor: '#3b82f6'
                });
                break;

            case 401:
                await Swal.fire({
                    icon: 'error',
                    title: 'Sessão Expirada',
                    text: 'Sua sessão expirou. Faça login novamente.',
                    confirmButtonColor: '#3b82f6',
                    confirmButtonText: 'Ir para o login'
                }).then((result) => {
                    if (result.isConfirmed) {
                        localStorage.removeItem('token');
                        localStorage.removeItem('usuario');
                        window.location.href = '/login';
                    }
                });
                break;

            case 404:
                await Swal.fire({
                    icon: 'info',
                    title: ' Não encontrado',
                    text: data?.message || data?.erro || 'O recurso solicitado não foi encontrado.',
                    confirmButtonColor: '#3b82f6'
                });
                break;

            case 500:
                await Swal.fire({
                    icon: 'error',
                    title: 'Erro Interno',
                    text: 'Ocorreu um erro no servidor. Tente novamente mais tarde.',
                    confirmButtonColor: '#3b82f6'
                });
                break;

            default:
                await Swal.fire({
                    icon: 'error',
                    title: 'Erro Desconhecido',
                    text: data?.message || data?.erro || 'Ocorreu um erro desconhecido. Tente novamente.',
                    confirmButtonColor: '#3b82f6'
                });
                break;
        }
        return Promise.reject(error);
    }
);

export default api;