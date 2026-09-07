import React, { useCallback, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    RefreshControl,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { adminService } from '@/src/services/adminService';
import { Conquista } from '@/src/types/adminTypes';
import { adminTheme as t } from '@/src/constants/adminTheme';
import ConquistaFormModal, { FormConquista } from '@/components/admin/ConquistaFormModal';
import ConcederConquistaModal from '@/components/admin/ConcederConquistaModal';

const FORM_VAZIO: FormConquista = { nome: '', descricao: '', icone: '📖', criterio: '' };

export default function AdminConquistasScreen() {
    const router = useRouter();
    const [conquistas, setConquistas] = useState<Conquista[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [atualizando, setAtualizando] = useState(false);

    const [modalFormAberto, setModalFormAberto] = useState(false);
    const [editandoId, setEditandoId] = useState<number | null>(null);
    const [form, setForm] = useState<FormConquista>(FORM_VAZIO);

    const [conquistaConcedendo, setConquistaConcedendo] = useState<Conquista | null>(null);
    const [idUsuarioConceder, setIdUsuarioConceder] = useState('');

    const carregar = useCallback(async () => {
        setCarregando(true);
        try {
            const dados = await adminService.listarTodasConquistas();
            setConquistas(dados);
        } catch (error) {
            console.error('Erro ao carregar conquistas:', error);
            Alert.alert('Erro', 'Não foi possível carregar as conquistas');
        } finally {
            setCarregando(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

    const onRefresh = useCallback(async () => {
        setAtualizando(true);
        await carregar();
        setAtualizando(false);
    }, [carregar]);

    function abrirCriacao() {
        setEditandoId(null);
        setForm(FORM_VAZIO);
        setModalFormAberto(true);
    }

    function abrirEdicao(conquista: Conquista) {
        setEditandoId(conquista.id_conquista);
        setForm({
            nome: conquista.nome,
            descricao: conquista.descricao || '',
            icone: conquista.icone || '📖',
            criterio: conquista.criterio,
        });
        setModalFormAberto(true);
    }

    async function salvarForm() {
        if (!form.nome.trim() || !form.descricao.trim() || !form.criterio.trim()) {
            Alert.alert('Atenção', 'Nome, descrição e critério são obrigatórios');
            return;
        }
        try {
            if (editandoId) {
                await adminService.editarConquista(editandoId, form);
            } else {
                await adminService.criarConquista(form);
            }
            setModalFormAberto(false);
            carregar();
        } catch (error: any) {
            Alert.alert('Erro', error.response?.data?.erro || 'Não foi possível salvar');
        }
    }

    function confirmarExclusao(conquista: Conquista) {
        Alert.alert('Apagar conquista', `Apagar "${conquista.nome}"? Quem já ganhou também perde o registro.`, [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Apagar', style: 'destructive', onPress: async () => {
                    try {
                        await adminService.apagarConquista(conquista.id_conquista);
                        carregar();
                    } catch (error: any) {
                        Alert.alert('Erro', error.response?.data?.erro || 'Não foi possível apagar');
                    }
                }
            },
        ]);
    }

    async function confirmarConcessao() {
        if (!conquistaConcedendo || !idUsuarioConceder.trim()) return;
        const idUsuario = Number(idUsuarioConceder);
        if (isNaN(idUsuario)) {
            Alert.alert('Atenção', 'Digite um ID de usuário válido (número)');
            return;
        }
        try {
            await adminService.concederConquista(conquistaConcedendo.id_conquista, idUsuario);
            Alert.alert('Sucesso', `Conquista concedida ao usuário #${idUsuario}`);
            setConquistaConcedendo(null);
            setIdUsuarioConceder('');
        } catch (error: any) {
            Alert.alert('Erro', error.response?.data?.erro || 'Não foi possível conceder');
        }
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.voltarBotao}>
                    <Ionicons name="chevron-back" size={24} color={t.cor.texto} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitulo}>Conquistas</Text>
                    <Text style={styles.headerSubtitulo}>{conquistas.length} cadastrada{conquistas.length === 1 ? '' : 's'}</Text>
                </View>
                <TouchableOpacity onPress={abrirCriacao} style={styles.botaoNovo}>
                    <Ionicons name="add" size={22} color={t.cor.superficie} />
                </TouchableOpacity>
            </View>

            {carregando && conquistas.length === 0 ? (
                <ActivityIndicator size="large" color={t.cor.primaria} style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={conquistas}
                    keyExtractor={(item) => String(item.id_conquista)}
                    contentContainerStyle={styles.lista}
                    refreshControl={<RefreshControl refreshing={atualizando} onRefresh={onRefresh} tintColor={t.cor.primaria} />}
                    ListEmptyComponent={
                        <View style={styles.vazioContainer}>
                            <Ionicons name="trophy-outline" size={36} color={t.cor.textoTerciario} />
                            <Text style={styles.vazio}>Nenhuma conquista cadastrada</Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.item} activeOpacity={0.8} onPress={() => abrirEdicao(item)}>
                            <View style={styles.itemIconeCirculo}>
                                <Text style={styles.itemEmoji}>{item.icone || '🏆'}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.itemNome}>{item.nome}</Text>
                                {item.descricao ? <Text style={styles.itemDescricao} numberOfLines={1}>{item.descricao}</Text> : null}
                                <Text style={styles.itemCriterio} numberOfLines={1}>{item.criterio}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setConquistaConcedendo(item)} style={[styles.botaoIcone, { backgroundColor: '#DCFCE7' }]}>
                                <Ionicons name="gift-outline" size={16} color={t.cor.sucesso} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => confirmarExclusao(item)} style={[styles.botaoIcone, { backgroundColor: t.cor.perigoClaro }]}>
                                <Ionicons name="trash-outline" size={16} color={t.cor.perigo} />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    )}
                />
            )}

            <ConquistaFormModal
                visivel={modalFormAberto}
                editando={!!editandoId}
                form={form}
                aoMudarForm={setForm}
                aoFechar={() => setModalFormAberto(false)}
                aoSalvar={salvarForm}
            />

            <ConcederConquistaModal
                visivel={!!conquistaConcedendo}
                nomeConquista={conquistaConcedendo?.nome}
                idUsuario={idUsuarioConceder}
                aoMudarIdUsuario={setIdUsuarioConceder}
                aoFechar={() => setConquistaConcedendo(null)}
                aoConfirmar={confirmarConcessao}
            />
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
    botaoNovo: {
        width: 34, height: 34, borderRadius: t.raio.sm, backgroundColor: t.categoria.conquistas.icone,
        justifyContent: 'center', alignItems: 'center',
    },
    lista: { padding: t.espaco.lg },
    vazioContainer: { alignItems: 'center', marginTop: 48, gap: t.espaco.sm },
    vazio: { textAlign: 'center', color: t.cor.textoTerciario },
    item: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: t.cor.superficie, borderRadius: t.raio.lg, padding: t.espaco.md, marginBottom: t.espaco.sm,
        ...t.sombra,
    },
    itemIconeCirculo: {
        width: 46, height: 46, borderRadius: t.raio.md, backgroundColor: t.categoria.conquistas.fundo,
        justifyContent: 'center', alignItems: 'center', marginRight: t.espaco.md,
    },
    itemEmoji: { fontSize: 20 },
    itemNome: { fontSize: 14.5, fontWeight: '700', color: t.cor.texto },
    itemDescricao: { fontSize: 12, color: t.cor.textoSecundario, marginTop: 1 },
    itemCriterio: { fontSize: 11, color: t.cor.textoTerciario, marginTop: 1, fontStyle: 'italic' },
    botaoIcone: { width: 30, height: 30, borderRadius: t.raio.sm, justifyContent: 'center', alignItems: 'center', marginLeft: 6 },
});