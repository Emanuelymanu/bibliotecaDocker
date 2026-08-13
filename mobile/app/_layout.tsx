import React from 'react';
import { Stack } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from '@/src/context/AuthContext';


function RotasProtegidas() {
    const { usuario, carregando } = useAuth();

    if (carregando) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <Stack screenOptions={{ headerShown: false }}>
            {usuario ? (
                <>
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="admin" />
                </>
            ) : (
                <Stack.Screen name="login" />
            )}
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