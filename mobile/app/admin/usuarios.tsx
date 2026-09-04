import React, { useCallback, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { adminService } from '@/src/services/adminService';
import { UsuarioAdmin } from '@/src/types/adminTypes';
import { adminTheme as t, corDoAvatar, iniciais } from '@/src/constants/adminTheme';
import { useAuth } from '@/src/context/AuthContext';

export default function AdminUsuariosScreen() {
    const router = useRouter();
    const { usuario: usuarioLogado } = useAuth();
    const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [busca, setBusca] = useState('');
    const [processandoId, setProcessandoId] = useState<number | null>(null);

    function ordenarPorAdmin(lista: UsuarioAdmin[]): UsuarioAdmin[] {
        return [...lista].sort((a, b) => (a.tipo_usuario === b.tipo_usuario ? 0 : a.tipo_usuario === 'admin' ? -1 : 1));
    }

    const carregar = useCallback(async (termo?: string) => {
        setCarregando(true);
        try {
            const dados = await adminService.listarUsuarios(termo);
            setUsuarios(ordenarPorAdmin(dados));
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            Alert.alert('Erro', 'Não foi possível carregar os usuários');
        } finally {
            setCarregando(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { carregar(busca || undefined); }, [carregar]));

    function confirmarPromocao(usuario: UsuarioAdmin) {
        Alert.alert('Tornar administrador', `Dar acesso de administrador para "${usuario.nome}"?`, [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Confirmar', onPress: async () => {
                    setProcessandoId(usuario.id_usuario);
                    try {
                        await adminService.promoverUsuario(usuario.id_usuario);
                        setUsuarios((atual) => ordenarPorAdmin(atual.map((u) => u.id_usuario === usuario.id_usuario ? { ...u, tipo_usuario: 'admin' } : u)));
                    } catch (error: any) {
                        Alert.alert('Erro', error.response?.data?.erro || 'Não foi possível promover o usuário');
                    } finally {
                        setProcessandoId(null);
                    }
                }
            },
        ]);
    }

    function confirmarRemocao(usuario: UsuarioAdmin) {
        Alert.alert('Remover administrador', `Remover o acesso de administrador de "${usuario.nome}"?`, [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Remover', style: 'destructive', onPress: async () => {
                    setProcessandoId(usuario.id_usuario);
                    try {
                        await adminService.rebaixarUsuario(usuario.id_usuario);
                        setUsuarios((atual) => ordenarPorAdmin(atual.map((u) => u.id_usuario === usuario.id_usuario ? { ...u, tipo_usuario: 'usuario' } : u)));
                    } catch (error: any) {
                        Alert.alert('Erro', error.response?.data?.erro || 'Não foi possível remover o acesso');
                    } finally {
                        setProcessandoId(null);
                    }
                }
            },
        ]);
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.voltarBotao}>
                    <Ionicons name="chevron-back" size={24} color={t.cor.texto} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitulo}>Usuários</Text>
                    <Text style={styles.headerSubtitulo}>{usuarios.length} encontrado{usuarios.length === 1 ? '' : 's'}</Text>
                </View>
            </View>

            <View style={styles.buscaContainer}>
                <Ionicons name="search" size={16} color={t.cor.textoTerciario} style={{ marginRight: t.espaco.xs }} />
                <TextInput
                    style={styles.buscaInput}
                    placeholder="Buscar por nome ou e-mail"
                    placeholderTextColor={t.cor.textoTerciario}
                    value={busca}
                    onChangeText={setBusca}
                    onSubmitEditing={() => carregar(busca || undefined)}
                    returnKeyType="search"
                />
            </View>

            {carregando ? (
                <ActivityIndicator size="large" color={t.cor.primaria} style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={usuarios}
                    keyExtractor={(item) => String(item.id_usuario)}
                    contentContainerStyle={styles.lista}
                    ListEmptyComponent={
                        <View style={styles.vazioContainer}>
                            <Ionicons name="people-outline" size={36} color={t.cor.textoTerciario} />
                            <Text style={styles.vazio}>Nenhum usuário encontrado</Text>
                        </View>
                    }
                    renderItem={({ item }) => {
                        const avatar = corDoAvatar(item.nome);
                        const ehAdmin = item.tipo_usuario === 'admin';
                        const ehEuMesmo = item.id_usuario === usuarioLogado?.id_usuario;
                        const processando = processandoId === item.id_usuario;

                        return (
                            <View style={styles.item}>
                                <View style={[styles.avatarCirculo, { backgroundColor: avatar.fundo }]}>
                                    <Text style={[styles.avatarTexto, { color: avatar.texto }]}>{iniciais(item.nome)}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.itemNome} numberOfLines={1}>{item.nome}</Text>
                                    <Text style={styles.itemEmail} numberOfLines={1}>{item.email}</Text>
                                </View>
                                {ehAdmin && (
                                    <View style={styles.badgeAdmin}>
                                        <Text style={styles.badgeAdminTexto}>Admin</Text>
                                    </View>
                                )}
                                {processando ? (
                                    <ActivityIndicator size="small" color={t.cor.primaria} style={{ marginLeft: t.espaco.sm }} />
                                ) : ehAdmin ? (
                                    <TouchableOpacity
                                        disabled={ehEuMesmo}
                                        onPress={() => confirmarRemocao(item)}
                                        style={[styles.botaoAcao, { backgroundColor: t.cor.perigoClaro, opacity: ehEuMesmo ? 0.4 : 1 }]}
                                    >
                                        <Ionicons name="person-remove-outline" size={16} color={t.cor.perigo} />
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity
                                        onPress={() => confirmarPromocao(item)}
                                        style={[styles.botaoAcao, { backgroundColor: t.cor.primariaClara }]}
                                    >
                                        <Ionicons name="shield-checkmark-outline" size={16} color={t.cor.primaria} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        );
                    }}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: t.cor.fundo },
    header: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: t.cor.superficie, paddingHorizontal: t.espaco.md, paddingBottom: t.espaco.md,
        borderBottomWidth: 1, borderBottomColor: t.cor.borda,
    },
    voltarBotao: { padding: t.espaco.xs, marginRight: t.espaco.xs },
    headerTitulo: { fontSize: 17, fontWeight: '700', color: t.cor.texto },
    headerSubtitulo: { fontSize: 12.5, color: t.cor.textoSecundario },
    buscaContainer: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: t.cor.superficie, marginHorizontal: t.espaco.lg, marginTop: t.espaco.lg,
        paddingHorizontal: t.espaco.md, paddingVertical: 10, borderRadius: t.raio.md,
        borderWidth: 1, borderColor: t.cor.borda,
    },
    buscaInput: { flex: 1, fontSize: 13.5, color: t.cor.texto, padding: 0 },
    lista: { padding: t.espaco.lg },
    vazioContainer: { alignItems: 'center', marginTop: 48, gap: t.espaco.sm },
    vazio: { textAlign: 'center', color: t.cor.textoTerciario },
    item: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: t.cor.superficie, borderRadius: t.raio.lg, padding: t.espaco.md, marginBottom: t.espaco.sm,
        ...t.sombra,
    },
    avatarCirculo: {
        width: 42, height: 42, borderRadius: t.raio.pill,
        justifyContent: 'center', alignItems: 'center', marginRight: t.espaco.md,
    },
    avatarTexto: { fontSize: 14, fontWeight: '700' },
    itemNome: { fontSize: 14.5, fontWeight: '700', color: t.cor.texto },
    itemEmail: { fontSize: 12, color: t.cor.textoSecundario, marginTop: 1 },
    badgeAdmin: {
        backgroundColor: t.cor.primariaClara, borderRadius: t.raio.pill,
        paddingHorizontal: 8, paddingVertical: 3, marginLeft: t.espaco.xs,
    },
    badgeAdminTexto: { fontSize: 10.5, fontWeight: '700', color: t.cor.primaria },
    botaoAcao: { width: 30, height: 30, borderRadius: t.raio.sm, justifyContent: 'center', alignItems: 'center', marginLeft: t.espaco.sm },
});
