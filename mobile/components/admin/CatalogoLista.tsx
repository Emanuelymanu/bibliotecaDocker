import React, { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    TextInput,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '@/src/services/adminService';
import { tipoCatalogo } from '../../src/types/adminTypes';
import { adminTheme as t, corDoAvatar, iniciais } from '@/src/constants/adminTheme';
import AdminModal from './AdminModal';

type ItemCatalogo = { nome: string; total_livros: number; [key: string]: any };

interface Props {
    tipo: tipoCatalogo;
    pk: string;
    titulo: string;
    icone: keyof typeof Ionicons.glyphMap;
    corCategoria: { icone: string; fundo: string };
    placeholderBusca: string;
    /** nome do campo que aparece como "subtítulo" abaixo do nome (ex: nacionalidade, pais). Opcional. */
    campoSubtitulo?: string;
    /** nome do campo de texto longo (ex: bio). Opcional. */
    campoDescricao?: string;
    /** campos do modal de edição, além do nome */
    camposEdicao?: { campo: string; label: string; placeholder: string }[];
}

export default function CatalogoLista({
    tipo, pk, titulo, icone, corCategoria, placeholderBusca,
    campoSubtitulo, campoDescricao, camposEdicao = [],
}: Props) {
    const router = useRouter();
    const [itens, setItens] = useState<ItemCatalogo[]>([]);
    const [busca, setBusca] = useState('');
    const [carregando, setCarregando] = useState(true);

    const [itemEditando, setItemEditando] = useState<ItemCatalogo | null>(null);
    const [form, setForm] = useState<Record<string, string>>({});

    const [itemMesclando, setItemMesclando] = useState<ItemCatalogo | null>(null);

    const carregar = useCallback(async () => {
        setCarregando(true);
        try {
            const dados = await adminService.listarCatalogo(tipo);
            setItens(dados as ItemCatalogo[]);
        } catch (error) {
            console.error(`Erro ao carregar ${tipo}:`, error);
            Alert.alert('Erro', `Não foi possível carregar ${titulo.toLowerCase()}`);
        } finally {
            setCarregando(false);
        }
    }, [tipo]);

    useEffect(() => {
        carregar();
    }, [carregar]);

    const itensFiltrados = itens.filter((item) =>
        item.nome.toLowerCase().includes(busca.toLowerCase())
    );

    function abrirEdicao(item: ItemCatalogo) {
        setItemEditando(item);
        const dadosIniciais: Record<string, string> = { nome: item.nome };
        camposEdicao.forEach((c) => { dadosIniciais[c.campo] = item[c.campo] || ''; });
        setForm(dadosIniciais);
    }

    async function salvarEdicao() {
        if (!itemEditando || !form.nome?.trim()) return;
        try {
            await adminService.editarItemCatalogo(tipo, itemEditando[pk], form);
            setItemEditando(null);
            carregar();
        } catch (error: any) {
            Alert.alert('Erro', error.response?.data?.erro || 'Não foi possível editar');
        }
    }

    function confirmarExclusao(item: ItemCatalogo) {
        Alert.alert('Apagar item', `Tem certeza que quer apagar "${item.nome}"?`, [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Apagar', style: 'destructive', onPress: async () => {
                    try {
                        await adminService.apagarItemCatalogo(tipo, item[pk]);
                        carregar();
                    } catch (error: any) {
                        Alert.alert('Não foi possível apagar', error.response?.data?.erro || 'Erro desconhecido');
                    }
                }
            },
        ]);
    }

    async function confirmarMesclagem(destino: ItemCatalogo) {
        if (!itemMesclando) return;
        try {
            await adminService.mesclarItensCatalogo(tipo, itemMesclando[pk], destino[pk]);
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
                    <Ionicons name="chevron-back" size={24} color={t.cor.texto} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitulo}>{titulo}</Text>
                    <Text style={styles.headerSubtitulo}>{itens.length} cadastrado{itens.length === 1 ? '' : 's'}</Text>
                </View>
            </View>

            <View style={styles.buscaContainer}>
                <Ionicons name="search" size={17} color={t.cor.textoTerciario} style={{ marginRight: 8 }} />
                <TextInput
                    style={styles.busca}
                    placeholder={placeholderBusca}
                    placeholderTextColor={t.cor.textoTerciario}
                    value={busca}
                    onChangeText={setBusca}
                />
            </View>

            {carregando ? (
                <ActivityIndicator size="large" color={t.cor.primaria} style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={itensFiltrados}
                    keyExtractor={(item) => String(item[pk])}
                    contentContainerStyle={styles.lista}
                    ListEmptyComponent={
                        <View style={styles.vazioContainer}>
                            <Ionicons name={icone} size={36} color={t.cor.textoTerciario} />
                            <Text style={styles.vazio}>{busca ? 'Nada encontrado' : 'Nada cadastrado ainda'}</Text>
                        </View>
                    }
                    renderItem={({ item }) => {
                        const cores = corDoAvatar(item.nome);
                        return (
                            <TouchableOpacity
                                style={styles.item}
                                activeOpacity={0.8}
                                onLongPress={() => setItemMesclando(item)}
                            >
                                <View style={[styles.avatar, { backgroundColor: cores.fundo }]}>
                                    <Text style={[styles.avatarTexto, { color: cores.texto }]}>{iniciais(item.nome)}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.itemNome}>{item.nome}</Text>
                                    {campoSubtitulo && item[campoSubtitulo] ? (
                                        <Text style={[styles.itemSubtitulo, { color: corCategoria.icone }]}>{item[campoSubtitulo]}</Text>
                                    ) : null}
                                    {campoDescricao && item[campoDescricao] ? (
                                        <Text style={styles.itemDescricao} numberOfLines={1}>{item[campoDescricao]}</Text>
                                    ) : null}
                                </View>
                                <TouchableOpacity onPress={() => abrirEdicao(item)} style={[styles.botaoIcone, styles.botaoIconeCinza]}>
                                    <Ionicons name="create-outline" size={16} color={t.cor.textoSecundario} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => confirmarExclusao(item)} style={[styles.botaoIcone, styles.botaoIconeVermelho]}>
                                    <Ionicons name="trash-outline" size={16} color={t.cor.perigo} />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        );
                    }}
                />
            )}

            <Text style={styles.dicaMesclar}>Segure um item pra mesclar com outro</Text>

            {/* Modal de edição */}
            <AdminModal
                visivel={!!itemEditando}
                aoFechar={() => setItemEditando(null)}
                titulo={`Editar ${titulo.slice(0, -1).toLowerCase()}`}
            >
                <TextInput
                    style={styles.modalInput}
                    placeholder="Nome"
                    value={form.nome}
                    onChangeText={(v) => setForm({ ...form, nome: v })}
                    autoFocus
                />
                {camposEdicao.map((c) => (
                    <TextInput
                        key={c.campo}
                        style={styles.modalInput}
                        placeholder={c.placeholder}
                        value={form[c.campo]}
                        onChangeText={(v) => setForm({ ...form, [c.campo]: v })}
                    />
                ))}
                <View style={styles.modalBotoes}>
                    <TouchableOpacity onPress={() => setItemEditando(null)} style={styles.modalBotaoCancelar}>
                        <Text style={styles.modalBotaoCancelarTexto}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={salvarEdicao} style={[styles.modalBotaoSalvar, { backgroundColor: corCategoria.icone }]}>
                        <Text style={styles.modalBotaoSalvarTexto}>Salvar</Text>
                    </TouchableOpacity>
                </View>
            </AdminModal>

            {/* Modal de mesclagem */}
            <AdminModal
                visivel={!!itemMesclando}
                aoFechar={() => setItemMesclando(null)}
                titulo={`Mesclar "${itemMesclando?.nome}"`}
            >
                <Text style={styles.modalAviso}>
                    Os livros vinculados passam pro item escolhido, e "{itemMesclando?.nome}" é apagado.
                </Text>
                <FlatList
                    style={{ maxHeight: 240, marginTop: t.espaco.sm }}
                    data={itens.filter((i) => i[pk] !== itemMesclando?.[pk])}
                    keyExtractor={(item) => String(item[pk])}
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
            </AdminModal>
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
    headerTitulo: { fontSize: 17, fontWeight: '700', color: t.cor.texto },
    headerSubtitulo: { fontSize: 12.5, color: t.cor.textoSecundario },
    buscaContainer: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: t.cor.superficie, marginHorizontal: t.espaco.lg, marginTop: t.espaco.md,
        borderRadius: t.raio.md, paddingHorizontal: t.espaco.md, borderWidth: 1, borderColor: t.cor.borda,
    },
    busca: { flex: 1, paddingVertical: 11, fontSize: 14, color: t.cor.texto },
    lista: { padding: t.espaco.lg, paddingBottom: 4 },
    vazioContainer: { alignItems: 'center', marginTop: 48, gap: t.espaco.sm },
    vazio: { textAlign: 'center', color: t.cor.textoTerciario },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: t.cor.superficie,
        borderRadius: t.raio.lg,
        padding: t.espaco.md,
        marginBottom: t.espaco.sm,
        ...t.sombra,
    },
    avatar: {
        width: 44, height: 44, borderRadius: t.raio.pill,
        justifyContent: 'center', alignItems: 'center', marginRight: t.espaco.md,
    },
    avatarTexto: { fontWeight: '700', fontSize: 14 },
    itemNome: { fontSize: 15, fontWeight: '700', color: t.cor.texto },
    itemSubtitulo: { fontSize: 12, fontWeight: '600', marginTop: 1 },
    itemDescricao: { fontSize: 11.5, color: t.cor.textoTerciario, marginTop: 2 },
    botaoIcone: { width: 30, height: 30, borderRadius: t.raio.sm, justifyContent: 'center', alignItems: 'center', marginLeft: 6 },
    botaoIconeCinza: { backgroundColor: '#F1F2F5' },
    botaoIconeVermelho: { backgroundColor: t.cor.perigoClaro },
    dicaMesclar: { textAlign: 'center', color: t.cor.textoTerciario, fontSize: 11, paddingBottom: t.espaco.md },
    modalAviso: { fontSize: 12.5, color: t.cor.textoSecundario, lineHeight: 18 },
    modalInput: {
        borderWidth: 1.5, borderColor: t.cor.borda, borderRadius: t.raio.sm,
        padding: 12, fontSize: 15, marginBottom: t.espaco.sm, color: t.cor.texto,
    },
    modalBotoes: { flexDirection: 'row', justifyContent: 'flex-end', gap: t.espaco.sm, marginTop: t.espaco.sm },
    modalBotaoCancelar: { paddingVertical: 11, paddingHorizontal: 16, borderRadius: t.raio.sm },
    modalBotaoCancelarTexto: { color: t.cor.textoSecundario, fontWeight: '600' },
    modalBotaoSalvar: { paddingVertical: 11, paddingHorizontal: 20, borderRadius: t.raio.sm },
    modalBotaoSalvarTexto: { color: t.cor.superficie, fontWeight: '700' },
    opcaoMesclagem: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: t.cor.borda,
    },
    opcaoMesclagemTexto: { color: t.cor.texto, fontSize: 14.5 },
});
