import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Brand } from '@/constants/Brand';
import { BookCard } from '@/components/BookCard';
import { listaDesejosService, ItemDesejo } from '@/src/services/listaDesejosService';

export default function ListaDesejosScreen() {
  const router = useRouter();
  const [itens, setItens] = useState<ItemDesejo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [atualizando, setAtualizando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setErro(null);
      setCarregando(true);
      const lista = await listaDesejosService.listar();
      setItens(lista);
    } catch (e) {
      setErro('Não foi possível carregar sua lista de desejos.');
      console.error(e);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const onRefresh = useCallback(async () => {
    setAtualizando(true);
    await carregar();
    setAtualizando(false);
  }, [carregar]);

  function confirmarRemocao(idLivro: number, titulo: string) {
    Alert.alert('Remover', `Remover "${titulo}" da lista de desejos?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            await listaDesejosService.remover(idLivro);
            setItens((lista) => lista.filter((i) => i.livro?.id_livro !== idLivro));
          } catch (e) {
            Alert.alert('Erro', 'Não foi possível remover.');
            console.error(e);
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={22} color={Brand.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.tituloTela}>Lista de Desejos</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={itens.length > 0 ? styles.grid : styles.centro}
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
        ) : itens.length === 0 ? (
          <View style={styles.vazioBox}>
            <Ionicons name="heart-outline" size={40} color={Brand.placeholderIcon} />
            <Text style={styles.vazioTexto}>Sua lista de desejos está vazia.</Text>
            <Text style={styles.vazioSubtexto}>Adicione livros pela tela de Buscar.</Text>
          </View>
        ) : (
          itens.map((item) =>
            item.livro ? (
              <View key={item.livro.id_livro} style={{ width: '47%' }}>
                <BookCard titulo={item.livro.titulo} autor={item.livro.autores?.[0]} capa={item.livro.capa} width="100%" />
                <TouchableOpacity
                  style={styles.botaoRemover}
                  onPress={() => confirmarRemocao(item.livro!.id_livro, item.livro!.titulo)}
                >
                  <Ionicons name="trash-outline" size={14} color={Brand.danger} />
                  <Text style={styles.botaoRemoverTexto}>Remover</Text>
                </TouchableOpacity>
              </View>
            ) : null
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8 },
  tituloTela: { fontSize: 16, fontWeight: '700', color: Brand.textPrimary },
  grid: { padding: 16, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 16 },
  centro: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  botaoRemover: { flexDirection: 'row', gap: 4, alignItems: 'center', justifyContent: 'center', marginTop: 6, paddingVertical: 6, borderRadius: 8, backgroundColor: Brand.dangerBg },
  botaoRemoverTexto: { fontSize: 11, fontWeight: '700', color: Brand.danger },
  erroBox: { margin: 16, backgroundColor: Brand.dangerBg, borderRadius: 10, padding: 12, gap: 6 },
  erroTexto: { fontSize: 13, color: Brand.danger },
  erroBotao: { fontSize: 13, fontWeight: '700', color: Brand.danger },
  vazioBox: { alignItems: 'center', marginTop: 60, paddingHorizontal: 32, gap: 6 },
  vazioTexto: { fontSize: 14, fontWeight: '600', color: Brand.textPrimary, textAlign: 'center', marginTop: 8 },
  vazioSubtexto: { fontSize: 12, color: Brand.textSecondary, textAlign: 'center' },
});