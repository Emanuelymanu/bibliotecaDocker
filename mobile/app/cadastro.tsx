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
import { authService } from '../src/services/authService';
import { Brand } from '../constants/Brand';

function validarEmail(email: string) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function validarSenha(senha: string) {
    return senha.length >= 6;
}

function validarCPF(cpfDigitado: string) {
    const cpf = cpfDigitado.replace(/[^\d]+/g, '');

    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

    let soma = 0;
    let resto;

    for (let i = 1; i <= 9; i++) {
        soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;

    soma = 0;
    for (let i = 1; i <= 10; i++) {
        soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;

    return resto === parseInt(cpf.substring(10, 11));
}

function formatarCPF(valor: string) {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length <= 11) {
        return numeros
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .slice(0, 14);
    }
    return valor;
}

export default function CadastroScreen() {
    const router = useRouter();

    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [cpf, setCpf] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [carregando, setCarregando] = useState(false);

    function handleCpfChange(valor: string) {
        setCpf(formatarCPF(valor));
    }

    async function handleCadastro() {
        if (!nome.trim() || !email.trim() || !cpf.trim() || !senha || !confirmarSenha) {
            Alert.alert('Atenção', 'Preencha todos os campos!');
            return;
        }
        if (!validarEmail(email.trim())) {
            Alert.alert('Atenção', 'Email inválido!');
            return;
        }
        const cpfNumerico = cpf.replace(/\D/g, '');
        if (!validarCPF(cpfNumerico)) {
            Alert.alert('Atenção', 'CPF inválido!');
            return;
        }
        if (!validarSenha(senha)) {
            Alert.alert('Atenção', 'A senha deve ter pelo menos 6 caracteres.');
            return;
        }
        if (senha !== confirmarSenha) {
            Alert.alert('Atenção', 'As senhas não conferem!');
            return;
        }

        setCarregando(true);
        try {
            await authService.cadastro({
                nome: nome.trim(),
                email: email.trim(),
                cpf: cpfNumerico,
                senha,
            });
            Alert.alert('Cadastro realizado!', 'Agora é só entrar com seu email e senha.', [
                { text: 'OK', onPress: () => router.replace('/login') },
            ]);
        } catch (error: any) {
            const mensagem =
                error.response?.data?.erro ||
                error.response?.data?.mensagem ||
                (!error.response
                    ? 'Não foi possível conectar ao servidor. Verifique a rede Wi-Fi e o endereço da API.'
                    : 'Erro ao cadastrar. Tente novamente.');
            Alert.alert('Erro ao cadastrar', mensagem);
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
                        <Ionicons name="book" size={30} color="#fff" />
                    </View>
                    <Text style={styles.appNome}>Criar Conta</Text>
                    <Text style={styles.appSubtitulo}>Cadastre-se para começar</Text>
                </SafeAreaView>
            </LinearGradient>

            <KeyboardAvoidingView
                style={styles.formArea}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
                    <View style={styles.card}>
                        <Text style={styles.label}>Nome Completo</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Seu nome"
                            value={nome}
                            onChangeText={setNome}
                            editable={!carregando}
                        />

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

                        <Text style={styles.label}>CPF</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="000.000.000-00"
                            value={cpf}
                            onChangeText={handleCpfChange}
                            keyboardType="numeric"
                            maxLength={14}
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

                        <Text style={styles.label}>Confirmar Senha</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="••••••••"
                            value={confirmarSenha}
                            onChangeText={setConfirmarSenha}
                            secureTextEntry
                            editable={!carregando}
                        />

                        <TouchableOpacity style={styles.botao} onPress={handleCadastro} disabled={carregando}>
                            {carregando ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.textoBotao}>Cadastrar</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => router.replace('/login')} disabled={carregando}>
                            <Text style={styles.rodape}>
                                Já tem uma conta? <Text style={styles.rodapeLink}>Entrar</Text>
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
        paddingBottom: 40,
    },
    heroConteudo: {
        alignItems: 'center',
        paddingTop: 16,
        paddingHorizontal: 24,
    },
    iconWrapper: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    appNome: {
        fontSize: 20,
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
        marginTop: -24,
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
        paddingTop: 28,
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