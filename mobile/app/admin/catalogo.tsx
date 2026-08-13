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
import { TipoCatalogo } from '@/src/types/admin';

type ItemCatalogo = { nome: string; total_livros: number; [key: string]: any };

const ABAS: { chave: TipoCatalogo; label: string; pk: string }[] = [
    { chave: 'autores', label: 'Autores', pk: 'id_autor' },
    { chave: 'editoras', label: 'Editoras', pk: 'id_editora' },
    { chave: 'generos', label: 'Gêneros', pk: 'id_genero' },
];

export default function AdminCatalogoScreen() {
    const router = useRouter();
    const [abaAtiva, setAbaAtiva] = useState<TipoCatalogo>('autores');
    const [itens, setItens] = useState<ItemCatalogo[]>([]);
    const [carregando, setCarregando] = useState(true);

    const [itemEditando, setItemEditando] = useState<ItemCatalogo | null>(null);
    const [nomeEditado, setNomeEditado] = useState('');

    const [itemMesclando, setItemMesclando] = useState<ItemCatalogo | null>(null);

    const pkAtual = ABAS.find((a) => a.chave === abaAtiva)!.pk;

    const carregar = useCallback(async () => {
        setCarregando(true);
        try {
            const dados = await adminService.listarCatalogo(abaAtiva);
            setItens(dados as ItemCatalogo[]);
        } catch (error) {
            console.error('Erro ao carregar catálogo:', error);
            Alert.alert('Erro', 'Não foi possível carregar o catálogo');
        } finally {
            setCarregando(false);
        }
    }, [abaAtiva]);

    useEffect(() => {
        carregar();
    }, [carregar]);

    function abrirEdicao(item: ItemCatalogo) {
        setItemEditando(item);
        setNomeEditado(item.nome);
    }

    async function salvarEdicao() {
        if (!itemEditando || !nomeEditado.trim()) return;
        try {
            await adminService.editarItemCatalogo(abaAtiva, itemEditando[pkAtual], { nome: nomeEditado.trim() });
            setItemEditando(null);
            carregar();
        } catch (error: any) {
            Alert.alert('Erro', error.response?.data?.erro || 'Não foi possível editar');
        }
    }

    function confirmarExclusao(item: ItemCatalogo) {
        Alert.alert(
            'Apagar item',
            `Tem certeza que quer apagar "${item.nome}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Apagar', style: 'destructive', onPress: async () => {
                        try {
                            await adminService.apagarItemCatalogo(abaAtiva, item[pkAtual]);
                            carregar();
                        } catch (error: any) {
                            Alert.alert('Não foi possível apagar', error.response?.data?.erro || 'Erro desconhecido');
                        }
                    }
                },
            ]
        );
    }

    async function confirmarMesclagem(destino: ItemCatalogo) {
        if (!itemMesclando) return;
        try {
            await adminService.mesclarItensCatalogo(abaAtiva, itemMesclando[pkAtual], destino[pkAtual]);
            setItemMesclando(null);
            carregar();
        } catch (error: any) {
            Alert.alert('Erro ao mesclar', error.response?.data?.erro || 'Erro desconhecido');
        }
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.voltar}>‹ Voltar</Text>
                </TouchableOpacity>
                <Text style={styles.titulo}>Catálogo</Text>
            </View>

            <View style={styles.abas}>
                {ABAS.map((aba) => (
                    <TouchableOpacity
                        key={aba.chave}
                        style={[styles.aba, abaAtiva === aba.chave && styles.abaAtiva]}
                        onPress={() => setAbaAtiva(aba.chave)}
                    >
                        <Text style={[styles.abaTexto, abaAtiva === aba.chave && styles.abaTextoAtivo]}>
                            {aba.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {carregando ? (
                <ActivityIndicator size="large" style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={itens}
                    keyExtractor={(item) => String(item[pkAtual])}
                    contentContainerStyle={styles.lista}
                    ListEmptyComponent={<Text style={styles.vazio}>Nada cadastrado ainda</Text>}
                    renderItem={({ item }) => (
                        <View style={styles.item}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.itemNome}>{item.nome}</Text>
                                <Text style={styles.itemContagem}>
                                    {item.total_livros} livro{item.total_livros === 1 ? '' : 's'}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => abrirEdicao(item)} style={styles.botaoAcao}>
                                <Text style={styles.botaoAcaoTexto}>Editar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setItemMesclando(item)} style={styles.botaoAcao}>
                                <Text style={styles.botaoAcaoTexto}>Mesclar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => confirmarExclusao(item)} style={styles.botaoAcao}>
                                <Text style={[styles.botaoAcaoTexto, styles.botaoApagarTexto]}>Apagar</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                />
            )}

            {/* Modal de edição */}
            <Modal visible={!!itemEditando} transparent animationType="fade" onRequestClose={() => setItemEditando(null)}>
                <View style={styles.modalFundo}>
                    <View style={styles.modalCaixa}>
                        <Text style={styles.modalTitulo}>Editar nome</Text>
                        <TextInput style={styles.modalInput} value={nomeEditado} onChangeText={setNomeEditado} autoFocus />
                        <View style={styles.modalBotoes}>
                            <TouchableOpacity onPress={() => setItemEditando(null)} style={styles.modalBotaoCancelar}>
                                <Text>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={salvarEdicao} style={styles.modalBotaoSalvar}>
                                <Text style={{ color: '#fff', fontWeight: '600' }}>Salvar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Modal de mesclagem: escolher o item destino */}
            <Modal visible={!!itemMesclando} transparent animationType="fade" onRequestClose={() => setItemMesclando(null)}>
                <View style={styles.modalFundo}>
                    <View style={styles.modalCaixa}>
                        <Text style={styles.modalTitulo}>
                            Mesclar "{itemMesclando?.nome}" em qual item?
                        </Text>
                        <Text style={styles.modalAviso}>
                            Todos os livros vinculados a "{itemMesclando?.nome}" passam a apontar pro item escolhido, e "{itemMesclando?.nome}" é apagado.
                        </Text>
                        <FlatList
                            style={{ maxHeight: 240, marginTop: 8 }}
                            data={itens.filter((i) => i[pkAtual] !== itemMesclando?.[pkAtual])}
                            keyExtractor={(item) => String(item[pkAtual])}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.opcaoMesclagem} onPress={() => confirmarMesclagem(item)}>
                                    <Text>{item.nome}</Text>
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity onPress={() => setItemMesclando(null)} style={[styles.modalBotaoCancelar, { marginTop: 12 }]}>
                            <Text>Cancelar</Text>
                        </TouchableOpacity>
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
    titulo: { fontSize: 22, fontWeight: 'bold', color: '#222' },
    abas: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 16, gap: 8 },
    aba: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#eee' },
    abaAtiva: { backgroundColor: '#4a3aff' },
    abaTexto: { color: '#555', fontWeight: '500' },
    abaTextoAtivo: { color: '#fff' },
    lista: { padding: 16 },
    vazio: { textAlign: 'center', color: '#999', marginTop: 32 },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
    },
    itemNome: { fontSize: 15, fontWeight: '600', color: '#222' },
    itemContagem: { fontSize: 12, color: '#999', marginTop: 2 },
    botaoAcao: { marginLeft: 8 },
    botaoAcaoTexto: { color: '#4a3aff', fontSize: 12, fontWeight: '600' },
    botaoApagarTexto: { color: '#e33' },
    modalFundo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
    modalCaixa: { backgroundColor: '#fff', borderRadius: 12, padding: 20 },
    modalTitulo: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
    modalAviso: { fontSize: 12, color: '#888', marginBottom: 4 },
    modalInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, fontSize: 15 },
    modalBotoes: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
    modalBotaoCancelar: { paddingVertical: 10, paddingHorizontal: 16 },
    modalBotaoSalvar: { backgroundColor: '#4a3aff', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
    opcaoMesclagem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
});
