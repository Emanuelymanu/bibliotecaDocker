// app/conquistas.tsx
//
// Mostra TODAS as conquistas (desbloqueadas e bloqueadas), com barra de
// progresso — no modelo do Figma. Usa /api/conquistas/catalogo, a rota
// nova que devolve o catálogo completo já marcado com desbloqueada: true/
// false pra esse usuário.

import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';

import { Brand } from '@/constants/Brand';
import { conquistasService, ConquistaCatalogo } from '@/src/services/conquistasService';
import { iconeConquista } from '@/src/utils/iconeConquista';

export default function ConquistasScreen() {
  const router = useRouter();
  const [conquistas, setConquistas] = useState<ConquistaCatalogo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      setErro(null);
      setCarregando(true);
      const { conquistas: lista } = await conquistasService.listarCatalogo();
      setConquistas(lista);
    } catch (e) {
      setErro('Não foi possível carregar as conquistas.');
      console.error(e);
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  const total = conquistas.length;
  const desbloqueadas = conquistas.filter((c) => c.desbloqueada).length;
  const pct = total > 0 ? Math.round((desbloqueadas / total) * 100) : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={22} color={Brand.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={styles.tituloTela}>Conquistas</Text>
          {total > 0 && (
            <Text style={styles.subtituloTela}>{desbloqueadas} de {total} desbloqueadas</Text>
          )}
        </View>
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
      ) : conquistas.length === 0 ? (
        <View style={styles.vazioBox}>
          <Ionicons name="trophy-outline" size={40} color={Brand.placeholderIcon} />
          <Text style={styles.vazioTexto}>Nenhuma conquista cadastrada ainda.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.lista}>
          <View style={styles.progressoLinha}>
            <View style={styles.progressoTrack}>
              <View style={[styles.progressoFill, { width: `${pct}%` }]} />
            </View>
            <Text style={styles.progressoTexto}>{pct}% completo</Text>
          </View>

          <View style={styles.grid}>
            {conquistas.map((c) => (
              <View key={c.id_conquista} style={styles.card}>
                <View style={[styles.iconWrapper, !c.desbloqueada && styles.iconWrapperBloqueado]}>
                  {c.desbloqueada ? (
                    <Ionicons name={iconeConquista(c)} size={22} color="#d97706" />
                  ) : (
                    <Ionicons name="lock-closed" size={18} color={Brand.placeholderIcon} />
                  )}
                </View>
                <Text style={[styles.nome, !c.desbloqueada && styles.textoBloqueado]} numberOfLines={2}>
                  {c.nome}
                </Text>
                {!!c.descricao && (
                  <Text
                    style={[styles.descricao, c.desbloqueada ? styles.descricaoDesbloqueada : styles.textoBloqueado]}
                    numberOfLines={2}
                  >
                    {c.descricao}
                  </Text>
                )}
                {c.desbloqueada && (
                  <View style={styles.badge}>
                    <Ionicons name="checkmark" size={11} color="#92400e" />
                    <Text style={styles.badgeTexto}>Desbloqueada</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 8, paddingBottom: 12 },
  tituloTela: { fontSize: 17, fontWeight: '700', color: Brand.textPrimary },
  subtituloTela: { fontSize: 12, color: Brand.textSecondary, marginTop: 2 },
  lista: { padding: 16, paddingTop: 4 },

  progressoLinha: { marginBottom: 18 },
  progressoTrack: { height: 8, borderRadius: 4, backgroundColor: Brand.border, overflow: 'hidden' },
  progressoFill: { height: 8, borderRadius: 4, backgroundColor: '#f59e0b' },
  progressoTexto: { fontSize: 12, fontWeight: '600', color: Brand.textSecondary, alignSelf: 'flex-end', marginTop: 6 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    width: '48%',
    backgroundColor: Brand.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  iconWrapperBloqueado: { backgroundColor: Brand.placeholder },
  nome: { fontSize: 13, fontWeight: '700', color: Brand.textPrimary, textAlign: 'center' },
  descricao: { fontSize: 11, marginTop: 4, textAlign: 'center' },
  descricaoDesbloqueada: { color: Brand.primary },
  textoBloqueado: { color: Brand.placeholderIcon },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#fde68a',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 8,
  },
  badgeTexto: { fontSize: 10, fontWeight: '700', color: '#92400e' },

  erroBox: { margin: 16, backgroundColor: Brand.dangerBg, borderRadius: 10, padding: 12, gap: 6 },
  erroTexto: { fontSize: 13, color: Brand.danger },
  erroBotao: { fontSize: 13, fontWeight: '700', color: Brand.danger },
  vazioBox: { alignItems: 'center', marginTop: 60, paddingHorizontal: 32, gap: 6 },
  vazioTexto: { fontSize: 14, fontWeight: '600', color: Brand.textPrimary, textAlign: 'center', marginTop: 8 },
});