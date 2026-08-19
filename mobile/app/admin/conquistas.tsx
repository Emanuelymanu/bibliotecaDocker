import React, { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Modal,
    TextInput,
    Alert,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import EmojiPicker, { pt as traducaoEmojiPt } from 'rn-emoji-keyboard'; // 1. Importação da biblioteca

import { adminService } from '@/src/services/adminService';
import { Conquista } from '@/src/types/adminTypes';
import { adminTheme as t } from '@/src/constants/adminTheme';

const FORM_VAZIO = { nome: '', descricao: '', icone: '📖', criterio: '' };

export default function AdminConquistasScreen() {
    const router = useRouter();
    const [conquistas, setConquistas] = useState<Conquista[]>([]);
    const [carregando, setCarregando] = useState(true);

    const [modalFormAberto, setModalFormAberto] = useState(false);
    const [seletorEmojiAberto, setSeletorEmojiAberto] = useState(false); // 2. Estado do seletor
    const [editandoId, setEditandoId] = useState<number | null>(null);
    const [form, setForm] = useState(FORM_VAZIO);

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

    useEffect(() => { carregar(); }, [carregar]);

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

            {carregando ? (
                <ActivityIndicator size="large" color={t.cor.primaria} style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={conquistas}
                    keyExtractor={(item) => String(item.id_conquista)}
                    contentContainerStyle={styles.lista}
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

            {/* Modal de criar/editar */}
            <Modal visible={modalFormAberto} transparent animationType="fade" onRequestClose={() => setModalFormAberto(false)}>
                <View style={styles.modalFundo}>
                    <View style={styles.modalCaixa}>
                        <View style={styles.modalTopo}>
                            <Text style={styles.modalTitulo}>{editandoId ? 'Editar Conquista' : 'Nova Conquista'}</Text>
                            <TouchableOpacity onPress={() => setModalFormAberto(false)}>
                                <Ionicons name="close" size={22} color={t.cor.textoTerciario} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.campoLabel}>ÍCONE</Text>

                            {/* 3. Botão Seletor de Emoji com Preview */}
                            <TouchableOpacity
                                style={styles.seletorEmojiBotao}
                                onPress={() => setSeletorEmojiAberto(true)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.seletorEmojiIconeContainer}>
                                    <Text style={styles.seletorEmojiTexto}>{form.icone}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.seletorEmojiTitulo}>Escolher Ícone</Text>
                                    <Text style={styles.seletorEmojiSubtitulo}>Toque para abrir a galeria de emojis</Text>
                                </View>
                                <Ionicons name="happy-outline" size={20} color={t.cor.textoSecundario} />
                            </TouchableOpacity>

                            <Text style={styles.campoLabel}>NOME DA CONQUISTA *</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="ex: Bibliófilo"
                                placeholderTextColor={t.cor.textoTerciario}
                                value={form.nome}
                                onChangeText={(v) => setForm({ ...form, nome: v })}
                            />

                            <Text style={styles.campoLabel}>DESCRIÇÃO *</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="ex: Dez livros concluídos!"
                                placeholderTextColor={t.cor.textoTerciario}
                                value={form.descricao}
                                onChangeText={(v) => setForm({ ...form, descricao: v })}
                            />

                            <Text style={styles.campoLabel}>CRITÉRIO DE DESBLOQUEIO *</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="ex: Conclua 10 livros"
                                placeholderTextColor={t.cor.textoTerciario}
                                value={form.criterio}
                                onChangeText={(v) => setForm({ ...form, criterio: v })}
                            />
                        </ScrollView>

                        <View style={styles.modalBotoes}>
                            <TouchableOpacity onPress={() => setModalFormAberto(false)} style={styles.modalBotaoCancelar}>
                                <Text style={styles.modalBotaoCancelarTexto}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={salvarForm} style={styles.modalBotaoCriar}>
                                <Text style={styles.modalBotaoCriarTexto}>{editandoId ? 'Salvar' : 'Criar'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* 4. Componente do Teclado de Emojis */}
            <EmojiPicker
                open={seletorEmojiAberto}
                onClose={() => setSeletorEmojiAberto(false)}
                onEmojiSelected={(emojiObject) => {
                    setForm((prev) => ({ ...prev, icone: emojiObject.emoji }));
                    setSeletorEmojiAberto(false);
                }}
                translation={traducaoEmojiPt}
                enableCategoryChangeAnimation
            />

            {/* Modal de conceder manualmente */}
            <Modal visible={!!conquistaConcedendo} transparent animationType="fade" onRequestClose={() => setConquistaConcedendo(null)}>
                <View style={styles.modalFundo}>
                    <View style={styles.modalCaixa}>
                        <Text style={styles.modalTitulo}>Conceder "{conquistaConcedendo?.nome}"</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="ID do usuário"
                            placeholderTextColor={t.cor.textoTerciario}
                            keyboardType="numeric"
                            value={idUsuarioConceder}
                            onChangeText={setIdUsuarioConceder}
                        />
                        <View style={styles.modalBotoes}>
                            <TouchableOpacity onPress={() => setConquistaConcedendo(null)} style={styles.modalBotaoCancelar}>
                                <Text style={styles.modalBotaoCancelarTexto}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={confirmarConcessao} style={[styles.modalBotaoCriar, { backgroundColor: t.cor.sucesso }]}>
                                <Text style={styles.modalBotaoCriarTexto}>Conceder</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    modalFundo: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'center', padding: t.espaco.lg },
    modalCaixa: { backgroundColor: t.cor.superficie, borderRadius: t.raio.xl, padding: t.espaco.lg, maxHeight: '85%' },
    modalTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: t.espaco.md },
    modalTitulo: { fontSize: 16, fontWeight: '700', color: t.cor.texto },
    campoLabel: { fontSize: 10.5, fontWeight: '700', color: t.cor.textoSecundario, letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },

    // Novos estilos para o botão de seleção de emoji
    seletorEmojiBotao: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: t.cor.fundo,
        borderWidth: 1.5,
        borderColor: t.cor.borda,
        borderRadius: t.raio.md,
        padding: 10,
        marginBottom: t.espaco.md,
        gap: 12,
    },
    seletorEmojiIconeContainer: {
        width: 40,
        height: 40,
        borderRadius: t.raio.sm,
        backgroundColor: t.categoria.conquistas.fundo,
        justifyContent: 'center',
        alignItems: 'center',
    },
    seletorEmojiTexto: { fontSize: 22 },
    seletorEmojiTitulo: { fontSize: 13.5, fontWeight: '600', color: t.cor.texto },
    seletorEmojiSubtitulo: { fontSize: 11, color: t.cor.textoTerciario },

    modalInput: {
        borderWidth: 1.5, borderColor: t.cor.borda, borderRadius: t.raio.sm,
        padding: 12, fontSize: 14.5, marginBottom: t.espaco.md, color: t.cor.texto,
    },
    modalBotoes: { flexDirection: 'row', gap: t.espaco.sm, marginTop: t.espaco.sm },
    modalBotaoCancelar: { flex: 1, paddingVertical: 12, borderRadius: t.raio.sm, borderWidth: 1.5, borderColor: t.cor.borda, alignItems: 'center' },
    modalBotaoCancelarTexto: { color: t.cor.textoSecundario, fontWeight: '600' },
    modalBotaoCriar: { flex: 1, backgroundColor: t.categoria.conquistas.icone, paddingVertical: 12, borderRadius: t.raio.sm, alignItems: 'center' },
    modalBotaoCriarTexto: { color: t.cor.superficie, fontWeight: '700' },
});