import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useAuth } from '@/src/context/AuthContext';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [carregando, setCarregando] = useState(false);
    const { login } = useAuth();

    async function handleLogin() {
        if (!email.trim() || !senha.trim()) {
            Alert.alert('Atenção', 'Preencha email e senha');
            return;
        }

        setCarregando(true);
        try {
            await login(email.trim(), senha);
           
        } catch (error: any) {
            const mensagem = error.response?.data?.erro || 'Email ou senha inválidos';
            Alert.alert('Erro ao entrar', mensagem);
        } finally {
            setCarregando(false);
        }
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <Text style={styles.titulo}>📚 Estante Digital</Text>

            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!carregando}
            />

            <TextInput
                style={styles.input}
                placeholder="Senha"
                value={senha}
                onChangeText={setSenha}
                secureTextEntry
                editable={!carregando}
            />

            <TouchableOpacity
                style={styles.botao}
                onPress={handleLogin}
                disabled={carregando}
            >
                {carregando ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.textoBotao}>Entrar</Text>
                )}
            </TouchableOpacity>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        backgroundColor: '#fff',
    },
    titulo: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 32,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 16,
        fontSize: 16,
    },
    botao: {
        backgroundColor: '#4a3aff',
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 8,
    },
    textoBotao: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});