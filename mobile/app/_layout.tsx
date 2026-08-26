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
            <Stack.Protected guard={!!usuario}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="admin" />
                <Stack.Screen name="cadastro-livro" options={{ presentation: 'modal' }} />
            </Stack.Protected>

            <Stack.Protected guard={!usuario}>
                <Stack.Screen name="login" />
            </Stack.Protected>
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