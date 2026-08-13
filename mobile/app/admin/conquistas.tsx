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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { adminService } from '@/src/services/adminService';
import { Conquista } from '../../src/types/adminTypes';

const FORM_VAZIO = { nome: '', descricao: '', icone: '', criterio: '' };

export default function AdminConquistasScreen() {
    const router = useRouter();
    const [conquistas, setConquistas] = useState<Conquista[]>([]);
    const [carregando, setCarregando] = useState(true);

    const [modalFormAberto, setModalFormAberto] = useState(false);
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

    useEffect(() => {
        carregar();
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
            icone: conquista.icone || '',
            criterio: conquista.criterio,
        });
        setModalFormAberto(true);
    }

    async function salvarForm() {
        if (!form.nome.trim() || !form.criterio.trim()) {
            Alert.alert('Atenção', 'Nome e critério são obrigatórios');
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
        Alert.alert(
            'Apagar conquista',
            `Apagar "${conquista.nome}"? Quem já ganhou também perde o registro.`,
            [
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
            ]
        );
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
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.voltar}>‹ Voltar</Text>
                </TouchableOpacity>
                <View style={styles.headerLinha}>
                    <Text style={styles.titulo}>Conquistas</Text>
                    <TouchableOpacity onPress={abrirCriacao} style={styles.botaoNovo}>
                        <Text style={styles.botaoNovoTexto}>+ Nova</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {carregando ? (
                <ActivityIndicator size="large" style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={conquistas}
                    keyExtractor={(item) => String(item.id_conquista)}
                    contentContainerStyle={styles.lista}
                    ListEmptyComponent={<Text style={styles.vazio}>Nenhuma conquista cadastrada</Text>}
                    renderItem={({ item }) => (
                        <View style={styles.item}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.itemNome}>{item.icone ? `${item.icone} ` : ''}{item.nome}</Text>
                                <Text style={styles.itemCriterio}>{item.criterio}</Text>
                            </View>
                            <View style={styles.acoes}>
                                <TouchableOpacity onPress={() => setConquistaConcedendo(item)}>
                                    <Text style={styles.acaoTexto}>Conceder</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => abrirEdicao(item)}>
                                    <Text style={styles.acaoTexto}>Editar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => confirmarExclusao(item)}>
                                    <Text style={[styles.acaoTexto, styles.acaoApagar]}>Apagar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                />
            )}

            {/* Modal de criar/editar */}
            <Modal visible={modalFormAberto} transparent animationType="fade" onRequestClose={() => setModalFormAberto(false)}>
                <View style={styles.modalFundo}>
                    <View style={styles.modalCaixa}>
                        <Text style={styles.modalTitulo}>{editandoId ? 'Editar conquista' : 'Nova conquista'}</Text>

                        <TextInput
                            style={styles.modalInput}
                            placeholder="Nome (ex: Maratonista)"
                            value={form.nome}
                            onChangeText={(v) => setForm({ ...form, nome: v })}
                        />
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Descrição"
                            value={form.descricao}
                            onChangeText={(v) => setForm({ ...form, descricao: v })}
                        />
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Ícone (emoji, ex: 🔥)"
                            value={form.icone}
                            onChangeText={(v) => setForm({ ...form, icone: v })}
                        />
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Critério (ex: Ler 1000 paginas)"
                            value={form.criterio}
                            onChangeText={(v) => setForm({ ...form, criterio: v })}
                        />
                        <Text style={styles.modalAviso}>
                            Dica: pra virar automática, inclua no critério uma palavra-chave + número:
                            "sess" (sessões), "pagina", "livro"/"leitura" ou "meta".
                        </Text>

                        <View style={styles.modalBotoes}>
                            <TouchableOpacity onPress={() => setModalFormAberto(false)} style={styles.modalBotaoCancelar}>
                                <Text>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={salvarForm} style={styles.modalBotaoSalvar}>
                                <Text style={{ color: '#fff', fontWeight: '600' }}>Salvar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Modal de conceder manualmente */}
            <Modal visible={!!conquistaConcedendo} transparent animationType="fade" onRequestClose={() => setConquistaConcedendo(null)}>
                <View style={styles.modalFundo}>
                    <View style={styles.modalCaixa}>
                        <Text style={styles.modalTitulo}>Conceder "{conquistaConcedendo?.nome}"</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="ID do usuário"
                            keyboardType="numeric"
                            value={idUsuarioConceder}
                            onChangeText={setIdUsuarioConceder}
                        />
                        <View style={styles.modalBotoes}>
                            <TouchableOpacity onPress={() => setConquistaConcedendo(null)} style={styles.modalBotaoCancelar}>
                                <Text>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={confirmarConcessao} style={styles.modalBotaoSalvar}>
                                <Text style={{ color: '#fff', fontWeight: '600' }}>Conceder</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f7f7fa' },
    header: { paddingHorizontal: 16, paddingTop: 12 },
    voltar: { color: '#4a3aff', fontSize: 15, marginBottom: 8 },
    headerLinha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    titulo: { fontSize: 22, fontWeight: 'bold', color: '#222' },
    botaoNovo: { backgroundColor: '#4a3aff', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20 },
    botaoNovoTexto: { color: '#fff', fontWeight: '600', fontSize: 13 },
    lista: { padding: 16 },
    vazio: { textAlign: 'center', color: '#999', marginTop: 32 },
    item: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemNome: { fontSize: 15, fontWeight: '600', color: '#222' },
    itemCriterio: { fontSize: 12, color: '#999', marginTop: 2 },
    acoes: { flexDirection: 'row', gap: 12 },
    acaoTexto: { color: '#4a3aff', fontSize: 12, fontWeight: '600' },
    acaoApagar: { color: '#e33' },
    modalFundo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
    modalCaixa: { backgroundColor: '#fff', borderRadius: 12, padding: 20 },
    modalTitulo: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
    modalAviso: { fontSize: 11, color: '#999', marginTop: 4 },
    modalInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, fontSize: 15, marginBottom: 10 },
    modalBotoes: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12 },
    modalBotaoCancelar: { paddingVertical: 10, paddingHorizontal: 16 },
    modalBotaoSalvar: { backgroundColor: '#4a3aff', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
});
