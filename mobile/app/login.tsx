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
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { Brand } from '../constants/Brand';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [carregando, setCarregando] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    async function handleLogin() {
        if (!email.trim() || !senha.trim()) {
            Alert.alert('Atenção', 'Preencha email e senha');
            return;
        }

        setCarregando(true);
        try {
            await login(email.trim(), senha);
        } catch (error: any) {
            const mensagem = error.response?.data?.erro
                || error.response?.data?.message
                || (!error.response
                    ? 'Não foi possível conectar ao servidor. Verifique a rede Wi-Fi e o endereço da API.'
                    : 'Email ou senha inválidos');
            Alert.alert('Erro ao entrar', mensagem);
        } finally {
            setCarregando(false);
        }
    }

    return (
        <View style={styles.tela}>
            <LinearGradient
                colors={[Brand.gradientStart, Brand.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.hero}
            >
                <SafeAreaView edges={['top']} style={styles.heroConteudo}>
                    <View style={styles.iconWrapper}>
                        <Ionicons name="book" size={36} color="#fff" />
                    </View>
                    <Text style={styles.appNome}>Minha Biblioteca</Text>
                    <Text style={styles.appSubtitulo}>Entre para gerenciar seus livros</Text>
                </SafeAreaView>
            </LinearGradient>

            <KeyboardAvoidingView
                style={styles.formArea}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
                    <View style={styles.card}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="seu@email.com"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            editable={!carregando}
                        />

                        <Text style={styles.label}>Senha</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="••••••••"
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

                        <TouchableOpacity onPress={() => router.push('/cadastro')} disabled={carregando}>
                            <Text style={styles.rodape}>
                                Não tem uma conta? <Text style={styles.rodapeLink}>Cadastre-se</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    tela: {
        flex: 1,
        backgroundColor: Brand.gradientStart,
    },
    hero: {
        paddingBottom: 48,
    },
    heroConteudo: {
        alignItems: 'center',
        paddingTop: 24,
        paddingHorizontal: 24,
    },
    iconWrapper: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    appNome: {
        fontSize: 22,
        fontWeight: '700',
        color: '#fff',
    },
    appSubtitulo: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 4,
    },
    formArea: {
        flex: 1,
        marginTop: -28,
    },
    formScroll: {
        flexGrow: 1,
    },
    card: {
        flex: 1,
        backgroundColor: Brand.card,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: 32,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: Brand.textTertiary,
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: Brand.border,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 16,
        fontSize: 15,
        color: Brand.textPrimary,
    },
    botao: {
        backgroundColor: Brand.primary,
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 6,
    },
    textoBotao: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    rodape: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 13,
        color: Brand.textSecondary,
    },
    rodapeLink: {
        color: Brand.primary,
        fontWeight: '700',
    },
});