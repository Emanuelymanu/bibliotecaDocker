import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { isAxiosError } from 'axios';
import { adminService } from '@/src/services/adminService';
import { adminTheme as t } from '@/src/constants/adminTheme';
import { useAuth } from '@/src/context/AuthContext';

type ChaveStat = 'conquistas' | 'autores' | 'editoras' | 'generos';

const ITENS = [
    { chave: 'conquistas' as ChaveStat, rota: '/admin/conquistas' as const, icone: 'trophy' as const, titulo: 'Conquistas', descricao: 'Gerencie as conquistas disponíveis para os leitores' },
    { chave: 'autores' as ChaveStat, rota: '/admin/autores' as const, icone: 'people' as const, titulo: 'Autores', descricao: 'Cadastre e edite informações de autores' },
    { chave: 'editoras' as ChaveStat, rota: '/admin/editoras' as const, icone: 'book' as const, titulo: 'Editoras', descricao: 'Administre o catálogo de editoras' },
    { chave: 'generos' as ChaveStat, rota: '/admin/generos' as const, icone: 'pricetag' as const, titulo: 'Gêneros', descricao: 'Organize os gêneros literários disponíveis' },
];

const ITEM_USUARIOS = {
    rota: '/admin/usuarios' as const,
    icone: 'shield-checkmark' as const,
    titulo: 'Usuários',
    descricao: 'Adicione ou remova administradores do sistema',
};

export default function AdminHomeScreen() {
    const router = useRouter();
    const { logout } = useAuth();
    const [stats, setStats] = useState<Record<ChaveStat, number> | null>(null);

    useFocusEffect(
        useCallback(() => {
            adminService.buscarEstatisticas()
                .then(setStats)
                .catch((err) => {
                    if (isAxiosError(err) && err.response?.status === 401) {
                        return;
                    }
                    console.error('Erro ao buscar estatísticas:', err);
                });
        }, [])
    );

    function confirmarSaida() {
        Alert.alert('Sair', 'Tem certeza que quer sair da conta?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Sair', style: 'destructive', onPress: () => logout() },
        ]);
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.push('/(tabs)')} style={styles.voltarBotao}>
                    <Ionicons name="chevron-back" size={24} color={t.cor.texto} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitulo}>Painel Admin</Text>
                    <Text style={styles.headerSubtitulo}>Gerenciamento do sistema</Text>
                </View>
                <TouchableOpacity onPress={confirmarSaida} style={styles.sairBotao}>
                    <Ionicons name="log-out-outline" size={22} color={t.cor.perigo} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
               

                {!stats ? (
                    <ActivityIndicator style={{ marginVertical: t.espaco.lg }} color={t.cor.primaria} />
                ) : (
                    <View style={styles.statsLinha}>
                        {ITENS.map((item) => {
                            const cor = (t.categoria as any)[item.chave];
                            return (
                                <View key={item.chave} style={styles.statCard}>
                                    <View style={[styles.statIconeCirculo, { backgroundColor: cor.fundo }]}>
                                        <Ionicons name={item.icone} size={18} color={cor.icone} />
                                    </View>
                                    <Text style={styles.statNumero}>{stats[item.chave]}</Text>
                                    <Text style={styles.statLabel}>{item.titulo}</Text>
                                </View>
                            );
                        })}
                    </View>
                )}

                <View style={styles.lista}>
                    {ITENS.map((item) => {
                        const cor = (t.categoria as any)[item.chave];
                        return (
                            <TouchableOpacity
                                key={item.chave}
                                style={styles.itemMenu}
                                onPress={() => router.push(item.rota)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.itemIconeCirculo, { backgroundColor: cor.fundo }]}>
                                    <Ionicons name={item.icone} size={22} color={cor.icone} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <View style={styles.itemTituloLinha}>
                                        <Text style={styles.itemTitulo}>{item.titulo}</Text>
                                        {stats && (
                                            <View style={[styles.badge, { backgroundColor: cor.fundo }]}>
                                                <Text style={[styles.badgeTexto, { color: cor.icone }]}>{stats[item.chave]}</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.itemDescricao} numberOfLines={1}>{item.descricao}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={t.cor.textoTerciario} />
                            </TouchableOpacity>
                        );
                    })}

                    <TouchableOpacity
                        style={styles.itemMenu}
                        onPress={() => router.push(ITEM_USUARIOS.rota)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.itemIconeCirculo, { backgroundColor: t.categoria.usuarios.fundo }]}>
                            <Ionicons name={ITEM_USUARIOS.icone} size={22} color={t.categoria.usuarios.icone} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.itemTitulo}>{ITEM_USUARIOS.titulo}</Text>
                            <Text style={styles.itemDescricao} numberOfLines={1}>{ITEM_USUARIOS.descricao}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={t.cor.textoTerciario} />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: t.cor.fundo },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: t.cor.superficie,
        paddingHorizontal: t.espaco.md,
        paddingBottom: t.espaco.md,
        borderBottomWidth: 1,
        borderBottomColor: t.cor.borda,
    },
    voltarBotao: { padding: t.espaco.xs, marginRight: t.espaco.xs },
    sairBotao: { padding: t.espaco.xs, marginLeft: t.espaco.xs },
    headerTitulo: { fontSize: 17, fontWeight: '700', color: t.cor.texto },
    headerSubtitulo: { fontSize: 12.5, color: t.cor.textoSecundario },
    scroll: { padding: t.espaco.lg },
    hero: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: t.cor.heroFundo,
        borderRadius: t.raio.lg,
        padding: t.espaco.lg,
        marginBottom: t.espaco.lg,
    },
    heroIconeCaixa: {
        width: 44, height: 44, borderRadius: t.raio.md,
        backgroundColor: 'rgba(255,255,255,0.12)',
        justifyContent: 'center', alignItems: 'center', marginRight: t.espaco.md,
    },
    heroTitulo: { color: t.cor.superficie, fontSize: 15.5, fontWeight: '700' },
    heroSubtitulo: { color: '#AEB4C4', fontSize: 12, marginTop: 2 },
    statsLinha: { flexDirection: 'row', gap: t.espaco.sm, marginBottom: t.espaco.lg },
    statCard: {
        flex: 1,
        backgroundColor: t.cor.superficie,
        borderRadius: t.raio.md,
        paddingVertical: t.espaco.md,
        alignItems: 'center',
        ...t.sombra,
    },
    statIconeCirculo: {
        width: 32, height: 32, borderRadius: t.raio.sm,
        justifyContent: 'center', alignItems: 'center', marginBottom: t.espaco.xs,
    },
    statNumero: { fontSize: 18, fontWeight: '800', color: t.cor.texto },
    statLabel: { fontSize: 10.5, color: t.cor.textoSecundario, marginTop: 1 },
    lista: { gap: t.espaco.sm },
    itemMenu: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: t.cor.superficie,
        borderRadius: t.raio.lg,
        padding: t.espaco.md,
        ...t.sombra,
    },
    itemIconeCirculo: {
        width: 46, height: 46, borderRadius: t.raio.md,
        justifyContent: 'center', alignItems: 'center', marginRight: t.espaco.md,
    },
    itemTituloLinha: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    itemTitulo: { fontSize: 15, fontWeight: '700', color: t.cor.texto },
    badge: { borderRadius: t.raio.pill, paddingHorizontal: 7, paddingVertical: 1 },
    badgeTexto: { fontSize: 11, fontWeight: '700' },
    itemDescricao: { fontSize: 12, color: t.cor.textoSecundario, marginTop: 2 },
});
