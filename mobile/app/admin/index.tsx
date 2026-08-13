import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function AdminHomeScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.voltar}>‹ Voltar</Text>
                </TouchableOpacity>
                <Text style={styles.titulo}>Área do Administrador</Text>
            </View>

            <View style={styles.lista}>
                <TouchableOpacity
                    style={styles.cardMenu}
                    onPress={() => router.push('/admin/catalogo')}
                    activeOpacity={0.7}
                >
                    <Text style={styles.cardIcone}>📚</Text>
                    <View style={styles.cardTextos}>
                        <Text style={styles.cardTitulo}>Catálogo</Text>
                        <Text style={styles.cardSubtitulo}>Autores, editoras e gêneros — editar, mesclar duplicatas, apagar</Text>
                    </View>
                    <Text style={styles.seta}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.cardMenu}
                    onPress={() => router.push('/admin/conquistas')}
                    activeOpacity={0.7}
                >
                    <Text style={styles.cardIcone}>🏆</Text>
                    <View style={styles.cardTextos}>
                        <Text style={styles.cardTitulo}>Conquistas</Text>
                        <Text style={styles.cardSubtitulo}>Criar, editar, remover ou conceder conquistas manualmente</Text>
                    </View>
                    <Text style={styles.seta}>›</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f7f7fa' },
    header: { paddingHorizontal: 16, paddingTop: 12, marginBottom: 8 },
    voltar: { color: '#4a3aff', fontSize: 15, marginBottom: 8 },
    titulo: { fontSize: 22, fontWeight: 'bold', color: '#222' },
    lista: { paddingHorizontal: 16, marginTop: 12, gap: 12 },
    cardMenu: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    cardIcone: { fontSize: 28, marginRight: 14 },
    cardTextos: { flex: 1 },
    cardTitulo: { fontSize: 16, fontWeight: '600', color: '#222' },
    cardSubtitulo: { fontSize: 12, color: '#888', marginTop: 2 },
    seta: { fontSize: 22, color: '#ccc' },
});
