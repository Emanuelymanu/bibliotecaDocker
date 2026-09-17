import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';

import { Brand } from '@/constants/Brand';
import { BookCard } from '@/components/BookCard';
import { livrosService, LivroDescoberta } from '@/src/services/livrosService';
import { leiturasService } from '@/src/services/leiturasService';
import { listaDesejosService } from '@/src/services/listaDesejosService';

export default function EditoraScreen() {
  const { nome } = useLocalSearchParams<{ nome: string }>();
  const router = useRouter();
  const [livros, setLivros] = useState<LivroDescoberta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [adicionando, setAdicionando] = useState<string | null>(null);
  const [atualizando, setAtualizando] = useState(false);

  const carregar = useCallback(async () => {
    if (!nome) return;
    try {
      setErro(null);
      setCarregando(true);
      const lista = await livrosService.buscarPorEditora(nome);
      setLivros(lista);
    } catch (e) {
      setErro('Não foi possível carregar os livros dessa editora.');
      console.error(e);
    } finally {
      setCarregando(false);
    }
  }, [nome]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  const onRefresh = useCallback(async () => {
    setAtualizando(true);
    await carregar();
    setAtualizando(false);
  }, [carregar]);

  function chaveDoItem(item: LivroDescoberta) {
    return item.id_livro != null ? `local-${item.id_livro}` : `google-${item.id_google}`;
  }

  function handleAdicionar(item: LivroDescoberta) {
    Alert.alert(item.titulo, 'Onde você quer adicionar esse livro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Lista de Desejos', onPress: () => adicionarLivro(item, 'wishlist') },
      { text: 'Minha Biblioteca', onPress: () => adicionarLivro(item, 'biblioteca') },
    ]);
  }

  async function adicionarLivro(item: LivroDescoberta, destino: 'biblioteca' | 'wishlist') {
    setAdicionando(chaveDoItem(item));
    try {
      const { id_livro } = await livrosService.cadastrarComGoogle({
        titulo: item.titulo,
        subtitulo: item.subtitulo ?? undefined,
        autores: item.autores,
        ano_publicacao: item.ano_publicacao ?? undefined,
        num_paginas: item.num_paginas ?? undefined,
        generos: item.generos,
        editora: item.editora ?? undefined,
        capa: item.capa ?? undefined,
        id_google: item.id_google ?? undefined,
      });

      if (destino === 'wishlist') {
        await listaDesejosService.adicionar(id_livro);
        Alert.alert('Pronto!', 'Livro adicionado à sua lista de desejos.');
      } else {
        const leituras = await leiturasService.listar();
        const criada = leituras.find((l) => l.livro?.id_livro === id_livro);
        if (criada) {
          await leiturasService.atualizarStatus(criada.id_leitura, 'quero_ler');
        }
        Alert.alert('Pronto!', 'Livro adicionado à sua biblioteca.');
      }
    } catch (e: any) {
      const mensagem = e?.response?.data?.erro || e?.response?.data?.message;
      if (e?.response?.status === 409) {
        Alert.alert('Atenção', mensagem || 'Esse livro já está na sua estante.');
      } else {
        Alert.alert('Erro', mensagem || 'Não foi possível adicionar o livro.');
        console.error(e);
      }
    } finally {
      setAdicionando(null);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={22} color={Brand.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.tituloTela}>Editora</Text>
        </View>
      </View>

      <View style={styles.tituloBox}>
        <View style={styles.iconWrapper}>
          <Ionicons name="business" size={22} color={Brand.primary} />
        </View>
        <Text style={styles.nome}>{nome}</Text>
      </View>

      <ScrollView
        contentContainerStyle={livros.length > 0 ? styles.grid : styles.centro}
        refreshControl={<RefreshControl refreshing={atualizando} onRefresh={onRefresh} tintColor={Brand.primary} />}
      >
        {carregando ? (
          <ActivityIndicator size="small" color={Brand.primary} />
        ) : erro ? (
          <View style={styles.erroBox}>
            <Text style={styles.erroTexto}>{erro}</Text>
            <TouchableOpacity onPress={carregar}>
              <Text style={styles.erroBotao}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : livros.length === 0 ? (
          <Text style={styles.vazioTexto}>Nenhum livro encontrado no catálogo dessa editora.</Text>
        ) : (
          livros.map((l) => (
            <View key={chaveDoItem(l)} style={{ width: '47%' }}>
              <BookCard titulo={l.titulo} autor={l.autores?.[0]} capa={l.capa} width="100%" onPress={() => handleAdicionar(l)} />
              {adicionando === chaveDoItem(l) && (
                <View style={styles.overlayCarregando}>
                  <ActivityIndicator size="small" color={Brand.primary} />
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 8 },
  tituloTela: { fontSize: 16, fontWeight: '700', color: Brand.textPrimary },
  tituloBox: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  iconWrapper: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  nome: { fontSize: 17, fontWeight: '700', color: Brand.textPrimary, textAlign: 'center', paddingHorizontal: 24 },
  grid: { padding: 16, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  centro: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  erroBox: { margin: 16, backgroundColor: Brand.dangerBg, borderRadius: 10, padding: 12, gap: 6 },
  erroTexto: { fontSize: 13, color: Brand.danger },
  erroBotao: { fontSize: 13, fontWeight: '700', color: Brand.danger },
  vazioTexto: { textAlign: 'center', marginTop: 24, fontSize: 13, color: Brand.textSecondary, paddingHorizontal: 32 },
  overlayCarregando: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center', borderRadius: 12,
  },
});
