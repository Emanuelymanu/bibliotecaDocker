import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from '@/src/context/AuthContext';


function RotasProtegidas() {
    const { usuario, carregando } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (carregando) {
            return;
        }

        if (!usuario) {
            router.replace('/login');
            return;
        }

        router.replace(usuario.tipo_usuario === 'admin' ? '/admin' : '/(tabs)');
    }, [carregando, router, usuario]);

    if (carregando) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

        return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="admin" />
            <Stack.Screen name="metas" />
            <Stack.Screen name="conquistas" />
            <Stack.Screen name="lista-desejos" />
            <Stack.Screen name="autor/[nome]" />
            <Stack.Screen name="genero/[nome]" />
            <Stack.Screen name="editora/[nome]" />
            <Stack.Screen name="login" />
            <Stack.Screen name="cadastro" />
        </Stack>
    );
}

export default function RootLayout() {
    return (
        <AuthProvider>
            <RotasProtegidas />
        </AuthProvider>
    );
}