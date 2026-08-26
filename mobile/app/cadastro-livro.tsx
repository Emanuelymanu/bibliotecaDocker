import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { livroService } from '@/src/services/livroService';
import { validarImagemCapa } from '@/src/utils/validarImagem';
import { CapaSelecionada, TipoObra } from '@/src/types/livro';

const TIPOS_OBRA: { valor: TipoObra; label: string }[] = [
    { valor: 'unico', label: 'Único' },
    { valor: 'trilogia', label: 'Trilogia' },
    { valor: 'serie', label: 'Série' },
    { valor: 'colecao', label: 'Coleção' },
];

export default function CadastroLivroScreen() {
    const router = useRouter();
    const [salvando, setSalvando] = useState(false);

    const [titulo, setTitulo] = useState('');
    const [subtitulo, setSubtitulo] = useState('');
    const [autor, setAutor] = useState('');
    const [tipoObra, setTipoObra] = useState<TipoObra>('unico');
    const [anoPublicacao, setAnoPublicacao] = useState('');
    const [numPaginas, setNumPaginas] = useState('');
    const [genero, setGenero] = useState('');
    const [editora, setEditora] = useState('');
    const [capa, setCapa] = useState<CapaSelecionada | null>(null);

    async function escolherCapa() {
        const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissao.granted) {
            Alert.alert('Permissão necessária', 'Autorize o acesso às fotos pra escolher uma capa.');
            return;
        }

        const resultado = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: false,
            quality: 0.8,
        });

        if (resultado.canceled || !resultado.assets?.[0]) {
            return;
        }

        const asset = resultado.assets[0];
        const erroValidacao = validarImagemCapa(asset);
        if (erroValidacao) {
            Alert.alert('Imagem inválida', erroValidacao);
            return;
        }

        setCapa({
            uri: asset.uri,
            nome: asset.fileName ?? `capa-${Date.now()}.jpg`,
            tipoMime: asset.mimeType ?? 'image/jpeg',
            tamanhoBytes: asset.fileSize,
        });
    }

    async function salvar() {
        if (!titulo.trim()) {
            Alert.alert('Atenção', 'Título é obrigatório');
            return;
        }
        if (!autor.trim()) {
            Alert.alert('Atenção', 'Autor é obrigatório');
            return;
        }
        if (!numPaginas.trim()) {
            Alert.alert('Atenção', 'Número de páginas é obrigatório');
            return;
        }
        if (!capa) {
            Alert.alert('Atenção', 'Capa é obrigatória');
            return;
        }

        setSalvando(true);
        try {
            await livroService.cadastrarComCapa({
                titulo: titulo.trim(),
                subtitulo: subtitulo.trim() || undefined,
                autor: autor.trim(),
                tipo_obra: tipoObra,
                ano_publicacao: anoPublicacao.trim() || undefined,
                num_paginas: numPaginas.trim(),
                genero: genero.trim() || undefined,
                editora: editora.trim() || undefined,
            }, capa);

            Alert.alert('Sucesso', 'Livro cadastrado com sucesso!', [
                { text: 'OK', onPress: () => router.back() },
            ]);
        } catch (error: any) {
            Alert.alert('Erro', error.response?.data?.message || error.response?.data?.erro || 'Não foi possível cadastrar o livro');
        } finally {
            setSalvando(false);
        }
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.voltarBotao}>
                    <Ionicons name="chevron-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitulo}>Cadastrar Livro</Text>
            </View>

            <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
                <TouchableOpacity style={styles.capaBotao} onPress={escolherCapa} activeOpacity={0.8}>
                    {capa ? (
                        <Image source={{ uri: capa.uri }} style={styles.capaPreview} resizeMode="cover" />
                    ) : (
                        <View style={styles.capaPlaceholder}>
                            <Ionicons name="image-outline" size={32} color="#999" />
                            <Text style={styles.capaPlaceholderTexto}>Escolher capa *</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <Text style={styles.label}>TÍTULO *</Text>
                <TextInput style={styles.input} value={titulo} onChangeText={setTitulo} placeholder="ex: Dom Casmurro" placeholderTextColor="#999" />

                <Text style={styles.label}>SUBTÍTULO</Text>
                <TextInput style={styles.input} value={subtitulo} onChangeText={setSubtitulo} placeholderTextColor="#999" />

                <Text style={styles.label}>AUTOR *</Text>
                <TextInput style={styles.input} value={autor} onChangeText={setAutor} placeholder="ex: Machado de Assis" placeholderTextColor="#999" />

                <Text style={styles.label}>TIPO DE OBRA</Text>
                <View style={styles.chipsLinha}>
                    {TIPOS_OBRA.map((tipo) => (
                        <TouchableOpacity
                            key={tipo.valor}
                            style={[styles.chip, tipoObra === tipo.valor && styles.chipSelecionado]}
                            onPress={() => setTipoObra(tipo.valor)}
                        >
                            <Text style={[styles.chipTexto, tipoObra === tipo.valor && styles.chipTextoSelecionado]}>{tipo.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>ANO DE PUBLICAÇÃO</Text>
                <TextInput style={styles.input} value={anoPublicacao} onChangeText={setAnoPublicacao} keyboardType="numeric" placeholderTextColor="#999" />

                <Text style={styles.label}>NÚMERO DE PÁGINAS *</Text>
                <TextInput style={styles.input} value={numPaginas} onChangeText={setNumPaginas} keyboardType="numeric" placeholderTextColor="#999" />

                <Text style={styles.label}>GÊNERO</Text>
                <TextInput style={styles.input} value={genero} onChangeText={setGenero} placeholderTextColor="#999" />

                <Text style={styles.label}>EDITORA</Text>
                <TextInput style={styles.input} value={editora} onChangeText={setEditora} placeholderTextColor="#999" />

                <TouchableOpacity style={styles.botaoSalvar} onPress={salvar} disabled={salvando}>
                    {salvando ? <ActivityIndicator color="#fff" /> : <Text style={styles.botaoSalvarTexto}>Salvar Livro</Text>}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#fff', paddingHorizontal: 16, paddingBottom: 16,
        borderBottomWidth: 1, borderBottomColor: '#ddd',
    },
    voltarBotao: { padding: 4, marginRight: 4 },
    headerTitulo: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    conteudo: { padding: 16, paddingBottom: 40 },
    capaBotao: { alignSelf: 'center', marginBottom: 20 },
    capaPreview: { width: 140, height: 200, borderRadius: 8, backgroundColor: '#eee' },
    capaPlaceholder: {
        width: 140, height: 200, borderRadius: 8, backgroundColor: '#eee',
        justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderStyle: 'dashed',
    },
    capaPlaceholderTexto: { color: '#999', fontSize: 12, marginTop: 8, textAlign: 'center' },
    label: { fontSize: 11, fontWeight: '700', color: '#666', letterSpacing: 0.5, marginBottom: 6, marginTop: 12 },
    input: {
        backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
        paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#333',
    },
    chipsLinha: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
        paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20,
        borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff',
    },
    chipSelecionado: { backgroundColor: '#6200ee', borderColor: '#6200ee' },
    chipTexto: { fontSize: 13, color: '#666', fontWeight: '600' },
    chipTextoSelecionado: { color: '#fff' },
    botaoSalvar: {
        backgroundColor: '#6200ee', borderRadius: 8, paddingVertical: 14,
        alignItems: 'center', marginTop: 28,
    },
    botaoSalvarTexto: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
