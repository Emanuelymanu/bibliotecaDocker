import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Brand } from '@/constants/Brand';
import { BookCard } from '@/components/BookCard';
import { livrosService, LivroTopAvaliado } from '@/src/services/livrosService';

export default function AutorScreen() {
  const { nome } = useLocalSearchParams<{ nome: string }>();
  const router = useRouter();
  const [livros, setLivros] = useState<LivroTopAvaliado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!nome) return;
    try {
      setErro(null);
      setCarregando(true);
      const lista = await livrosService.buscarPorAutor(nome);
      setLivros(lista);
    } catch (e) {
      setErro('Não foi possível carregar os livros desse autor.');
      console.error(e);
    } finally {
      setCarregando(false);
    }
  }, [nome]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={22} color={Brand.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.tituloTela}>Autor</Text>
        </View>
      </View>

      <View style={styles.avatarBox}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTexto}>{nome?.charAt(0)?.toUpperCase()}</Text>
        </View>
        <Text style={styles.nome}>{nome}</Text>
      </View>

      {carregando ? (
        <ActivityIndicator size="small" color={Brand.primary} style={{ marginTop: 24 }} />
      ) : erro ? (
        <View style={styles.erroBox}>
          <Text style={styles.erroTexto}>{erro}</Text>
          <TouchableOpacity onPress={carregar}>
            <Text style={styles.erroBotao}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : livros.length === 0 ? (
        <Text style={styles.vazioTexto}>Nenhum livro encontrado no catálogo pra esse autor.</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.grid}>
          {livros.map((l) => (
            <BookCard key={l.id_livro} titulo={l.titulo} capa={l.capa} width="47%" />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 8 },
  tituloTela: { fontSize: 16, fontWeight: '700', color: Brand.textPrimary },
  avatarBox: { alignItems: 'center', paddingVertical: 20 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: Brand.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  avatarTexto: { color: '#fff', fontSize: 24, fontWeight: '700' },
  nome: { fontSize: 17, fontWeight: '700', color: Brand.textPrimary, textAlign: 'center', paddingHorizontal: 24 },
  grid: { padding: 16, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  erroBox: { margin: 16, backgroundColor: Brand.dangerBg, borderRadius: 10, padding: 12, gap: 6 },
  erroTexto: { fontSize: 13, color: Brand.danger },
  erroBotao: { fontSize: 13, fontWeight: '700', color: Brand.danger },
  vazioTexto: { textAlign: 'center', marginTop: 24, fontSize: 13, color: Brand.textSecondary, paddingHorizontal: 32 },
});