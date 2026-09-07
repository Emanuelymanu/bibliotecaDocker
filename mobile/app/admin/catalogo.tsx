import React, { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    RefreshControl,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Modal,
    TextInput,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '@/src/services/adminService';
import { tipoCatalogo } from '../../src/types/adminTypes';
import { adminTheme as t } from '@/src/constants/adminTheme';

type ItemCatalogo = { nome: string; total_livros: number; [key: string]: any };

const ABAS: { chave: tipoCatalogo; label: string; pk: string; icone: keyof typeof Ionicons.glyphMap }[] = [
    { chave: 'autores', label: 'Autores', pk: 'id_autor', icone: 'person' },
    { chave: 'editoras', label: 'Editoras', pk: 'id_editora', icone: 'business' },
    { chave: 'generos', label: 'Gêneros', pk: 'id_genero', icone: 'pricetag' },
];

export default function AdminCatalogoScreen() {
    const router = useRouter();
    const [abaAtiva, setAbaAtiva] = useState<tipoCatalogo>('autores');
    const [itens, setItens] = useState<ItemCatalogo[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [atualizando, setAtualizando] = useState(false);

    const [itemEditando, setItemEditando] = useState<ItemCatalogo | null>(null);
    const [nomeEditado, setNomeEditado] = useState('');

    const [itemMesclando, setItemMesclando] = useState<ItemCatalogo | null>(null);

    const abaAtual = ABAS.find((a) => a.chave === abaAtiva)!;
    const pkAtual = abaAtual.pk;

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

    const onRefresh = useCallback(async () => {
        setAtualizando(true);
        await carregar();
        setAtualizando(false);
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
                <TouchableOpacity onPress={() => router.back()} style={styles.voltarBotao}>
                    <Ionicons name="chevron-back" size={22} color={t.cor.superficie} />
                    <Text style={styles.voltarTexto}>Voltar</Text>
                </TouchableOpacity>
                <Text style={styles.eyebrow}>GESTÃO DE DADOS</Text>
                <Text style={styles.titulo}>Catálogo</Text>
            </View>

            <View style={styles.abas}>
                {ABAS.map((aba) => {
                    const ativa = abaAtiva === aba.chave;
                    return (
                        <TouchableOpacity
                            key={aba.chave}
                            style={[styles.aba, ativa && styles.abaAtiva]}
                            onPress={() => setAbaAtiva(aba.chave)}
                        >
                            <Ionicons name={aba.icone} size={15} color={ativa ? t.cor.superficie : t.cor.primaria} />
                            <Text style={[styles.abaTexto, ativa && styles.abaTextoAtivo]}>{aba.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {carregando && itens.length === 0 ? (
                <ActivityIndicator size="large" color={t.cor.primaria} style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={itens}
                    keyExtractor={(item) => String(item[pkAtual])}
                    contentContainerStyle={styles.lista}
                    refreshControl={<RefreshControl refreshing={atualizando} onRefresh={onRefresh} tintColor={t.cor.primaria} />}
                    ListEmptyComponent={
                        <View style={styles.vazioContainer}>
                            <Ionicons name={abaAtual.icone} size={40} color={t.cor.textoTerciario} />
                            <Text style={styles.vazio}>Nada cadastrado ainda</Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <View style={styles.item}>
                            <View style={styles.itemFaixa} />
                            <View style={styles.itemIconeCirculo}>
                                <Ionicons name={abaAtual.icone} size={18} color={t.cor.primaria} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.itemNome}>{item.nome}</Text>
                                <View style={styles.badgeContagem}>
                                    <Text style={styles.badgeContagemTexto}>
                                        {item.total_livros} livro{item.total_livros === 1 ? '' : 's'}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.acoes}>
                                <TouchableOpacity onPress={() => abrirEdicao(item)} style={styles.botaoIcone}>
                                    <Ionicons name="create-outline" size={19} color={t.cor.primaria} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setItemMesclando(item)} style={styles.botaoIcone}>
                                    <Ionicons name="git-merge-outline" size={19} color={t.cor.destaque} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => confirmarExclusao(item)} style={styles.botaoIcone}>
                                    <Ionicons name="trash-outline" size={19} color={t.cor.perigo} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                />
            )}

          
            <Modal visible={!!itemEditando} transparent animationType="fade" onRequestClose={() => setItemEditando(null)}>
                <View style={styles.modalFundo}>
                    <View style={styles.modalCaixa}>
                        <View style={styles.modalIconeCirculo}>
                            <Ionicons name="create-outline" size={22} color={t.cor.primaria} />
                        </View>
                        <Text style={styles.modalTitulo}>Editar nome</Text>
                        <TextInput style={styles.modalInput} value={nomeEditado} onChangeText={setNomeEditado} autoFocus />
                        <View style={styles.modalBotoes}>
                            <TouchableOpacity onPress={() => setItemEditando(null)} style={styles.modalBotaoCancelar}>
                                <Text style={styles.modalBotaoCancelarTexto}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={salvarEdicao} style={styles.modalBotaoSalvar}>
                                <Text style={styles.modalBotaoSalvarTexto}>Salvar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

          
            <Modal visible={!!itemMesclando} transparent animationType="fade" onRequestClose={() => setItemMesclando(null)}>
                <View style={styles.modalFundo}>
                    <View style={styles.modalCaixa}>
                        <View style={[styles.modalIconeCirculo, { backgroundColor: '#FEF3C7' }]}>
                            <Ionicons name="git-merge-outline" size={22} color={t.cor.destaque} />
                        </View>
                        <Text style={styles.modalTitulo}>Mesclar "{itemMesclando?.nome}"</Text>
                        <Text style={styles.modalAviso}>
                            Os livros vinculados passam pro item escolhido, e "{itemMesclando?.nome}" é apagado.
                        </Text>
                        <FlatList
                            style={{ maxHeight: 240, marginTop: t.espaco.sm }}
                            data={itens.filter((i) => i[pkAtual] !== itemMesclando?.[pkAtual])}
                            keyExtractor={(item) => String(item[pkAtual])}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.opcaoMesclagem} onPress={() => confirmarMesclagem(item)}>
                                    <Text style={styles.opcaoMesclagemTexto}>{item.nome}</Text>
                                    <Ionicons name="chevron-forward" size={16} color={t.cor.textoTerciario} />
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity onPress={() => setItemMesclando(null)} style={[styles.modalBotaoCancelar, { marginTop: t.espaco.md }]}>
                            <Text style={styles.modalBotaoCancelarTexto}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: t.cor.fundo },
    header: {
        backgroundColor: t.cor.primariaEscura,
        paddingHorizontal: t.espaco.lg,
        paddingBottom: t.espaco.lg,
    },
    voltarBotao: { flexDirection: 'row', alignItems: 'center', marginTop: t.espaco.sm, marginBottom: t.espaco.md },
    voltarTexto: { color: t.cor.superficie, fontSize: 15, marginLeft: 2 },
    eyebrow: { color: '#C4B5FD', fontSize: 12, fontWeight: '700', letterSpacing: 1.2, marginBottom: 4 },
    titulo: { color: t.cor.superficie, fontSize: 24, fontWeight: '800' },
    abas: { flexDirection: 'row', paddingHorizontal: t.espaco.lg, marginTop: t.espaco.lg, gap: t.espaco.sm },
    aba: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 9,
        paddingHorizontal: 14,
        borderRadius: t.raio.pill,
        backgroundColor: t.cor.superficie,
        borderWidth: 1,
        borderColor: t.cor.borda,
    },
    abaAtiva: { backgroundColor: t.cor.primaria, borderColor: t.cor.primaria },
    abaTexto: { color: t.cor.primaria, fontWeight: '600', fontSize: 13 },
    abaTextoAtivo: { color: t.cor.superficie },
    lista: { padding: t.espaco.lg },
    vazioContainer: { alignItems: 'center', marginTop: 48, gap: t.espaco.sm },
    vazio: { textAlign: 'center', color: t.cor.textoTerciario },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: t.cor.superficie,
        borderRadius: t.raio.md,
        padding: t.espaco.md,
        marginBottom: t.espaco.sm,
        overflow: 'hidden',
        ...t.sombra,
        shadowOpacity: 0.05,
        elevation: 1,
    },
    itemFaixa: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: t.cor.primaria },
    itemIconeCirculo: {
        width: 36, height: 36, borderRadius: t.raio.sm,
        backgroundColor: t.cor.primariaClara,
        justifyContent: 'center', alignItems: 'center',
        marginRight: t.espaco.md, marginLeft: t.espaco.xs,
    },
    itemNome: { fontSize: 15, fontWeight: '700', color: t.cor.texto },
    badgeContagem: {
        alignSelf: 'flex-start',
        backgroundColor: t.cor.primariaClara,
        borderRadius: t.raio.pill,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginTop: 4,
    },
    badgeContagemTexto: { fontSize: 11, color: t.cor.primaria, fontWeight: '600' },
    acoes: { flexDirection: 'row', gap: 4 },
    botaoIcone: { padding: 6 },
    modalFundo: { flex: 1, backgroundColor: 'rgba(30,27,46,0.55)', justifyContent: 'center', padding: t.espaco.xl },
    modalCaixa: { backgroundColor: t.cor.superficie, borderRadius: t.raio.xl, padding: t.espaco.xl },
    modalIconeCirculo: {
        width: 44, height: 44, borderRadius: t.raio.md, backgroundColor: t.cor.primariaClara,
        justifyContent: 'center', alignItems: 'center', marginBottom: t.espaco.md,
    },
    modalTitulo: { fontSize: 17, fontWeight: '700', color: t.cor.texto, marginBottom: 8 },
    modalAviso: { fontSize: 12.5, color: t.cor.textoSecundario, lineHeight: 18 },
    modalInput: {
        borderWidth: 1.5, borderColor: t.cor.borda, borderRadius: t.raio.sm,
        padding: 12, fontSize: 15, marginTop: t.espaco.sm, color: t.cor.texto,
    },
    modalBotoes: { flexDirection: 'row', justifyContent: 'flex-end', gap: t.espaco.sm, marginTop: t.espaco.lg },
    modalBotaoCancelar: { paddingVertical: 11, paddingHorizontal: 16, borderRadius: t.raio.sm },
    modalBotaoCancelarTexto: { color: t.cor.textoSecundario, fontWeight: '600' },
    modalBotaoSalvar: { backgroundColor: t.cor.primaria, paddingVertical: 11, paddingHorizontal: 20, borderRadius: t.raio.sm },
    modalBotaoSalvarTexto: { color: t.cor.superficie, fontWeight: '700' },
    opcaoMesclagem: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: t.cor.borda,
    },
    opcaoMesclagemTexto: { color: t.cor.texto, fontSize: 14.5 },
});
