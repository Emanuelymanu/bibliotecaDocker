// app/(tabs)/index.tsx
//
// Tela Início (Home) — layout ajustado pra bater com o mockup do Figma:
// banner -> atalhos (Lista de Desejos / Conquistas / Sessões) -> Buscar
// Livros -> Meta do ano (com 2 barras: livros e páginas) -> Mais Bem Avaliados.
//
// O que já é real: nome de quem logou (useAuth) e a lista de mais bem
// avaliados (livrosService, puxa do backend).
// O que ainda é fixo (placeholder): os números da Meta do ano — a rota
// /api/metas ainda não foi ligada aqui. Quando ligar, é só trocar essas
// 4 constantes (livrosAtual, livrosAlvo, paginasAtual, paginasAlvo) por
// dados vindos da API.

import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { Brand } from '@/constants/Brand';
import { BookCard } from '@/components/BookCard';
import { livrosService, LivroTopAvaliado } from '@/src/services/livrosService';
import { useAuth } from '@/src/context/AuthContext';

// TODO: substituir por GET /api/metas/:ano quando essa rota for ligada no mobile
const METAS_PLACEHOLDER = {
  ano: new Date().getFullYear(),
  livrosAtual: 5,
  livrosAlvo: 24,
  paginasAtual: 1747,
  paginasAlvo: 8000,
};

const ATALHOS = [
  { key: 'wishlist', label: 'Lista de Desejos', icon: 'heart' as const, cor: '#ec4899', fundo: '#fce7f3' },
  { key: 'conquistas', label: 'Conquistas', icon: 'trophy' as const, cor: '#d97706', fundo: '#fef3c7' },
  { key: 'sessoes', label: 'Sessões', icon: 'timer' as const, cor: '#0d9488', fundo: '#ccfbf1' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { usuario } = useAuth();

  const [topAvaliados, setTopAvaliados] = useState<LivroTopAvaliado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [atualizando, setAtualizando] = useState(false);

  const carregarTopAvaliados = useCallback(async () => {
    try {
      setErro(null);
      const livros = await livrosService.buscarTopAvaliados();
      setTopAvaliados(livros);
    } catch (e) {
      setErro('Não foi possível carregar os livros mais bem avaliados.');
      console.error(e);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setCarregando(true);
      await carregarTopAvaliados();
      setCarregando(false);
    })();
  }, [carregarTopAvaliados]);

  const onRefresh = useCallback(async () => {
    setAtualizando(true);
    await carregarTopAvaliados();
    setAtualizando(false);
  }, [carregarTopAvaliados]);

  const primeiroNome = usuario?.nome?.split(' ')[0] ?? 'Leitor(a)';
  const pctLivros = Math.round((METAS_PLACEHOLDER.livrosAtual / METAS_PLACEHOLDER.livrosAlvo) * 100);
  const pctPaginas = Math.round((METAS_PLACEHOLDER.paginasAtual / METAS_PLACEHOLDER.paginasAlvo) * 100);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={atualizando} onRefresh={onRefresh} tintColor={Brand.primary} />}
    >
      {/* Banner de boas-vindas */}
      <LinearGradient
        colors={[Brand.gradientStart, Brand.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}
      >
        <View style={styles.bannerIconWrapper}>
          <Ionicons name="book" size={22} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitulo}>Bem-vindo, {primeiroNome}!</Text>
          <Text style={styles.bannerSubtitulo}>Organize sua biblioteca pessoal</Text>
        </View>
      </LinearGradient>

      {/* Atalhos */}
      <View style={styles.atalhosRow}>
        {ATALHOS.map((a) => (
          <TouchableOpacity key={a.key} style={styles.atalhoCard} activeOpacity={0.8}>
            <View style={[styles.atalhoIconWrapper, { backgroundColor: a.fundo }]}>
              <Ionicons name={a.icon} size={16} color={a.cor} />
            </View>
            <Text style={styles.atalhoLabel} numberOfLines={2}>
              {a.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Buscar Livros */}
      <View>
        <Text style={styles.secaoTitulo}>Buscar Livros</Text>
        <TouchableOpacity style={styles.searchShortcut} onPress={() => router.push('/busca')} activeOpacity={0.8}>
          <Ionicons name="search" size={18} color={Brand.placeholderIcon} />
          <Text style={styles.searchShortcutTexto}>Título, autor...</Text>
        </TouchableOpacity>
      </View>

      {/* Meta do ano */}
      <View>
        <Text style={styles.secaoTitulo}>Meta de {METAS_PLACEHOLDER.ano}</Text>
        <View style={styles.metaCard}>
          <View style={styles.metaHeader}>
            <View style={styles.metaIconWrapper}>
              <Ionicons name="locate-outline" size={18} color="#7c3aed" />
            </View>
            <View>
              <Text style={styles.metaHeaderTitulo}>
                {METAS_PLACEHOLDER.livrosAtual} de {METAS_PLACEHOLDER.livrosAlvo} livros
              </Text>
              <Text style={styles.metaHeaderSubtitulo}>
                {METAS_PLACEHOLDER.paginasAtual.toLocaleString('pt-BR')} de{' '}
                {METAS_PLACEHOLDER.paginasAlvo.toLocaleString('pt-BR')} páginas
              </Text>
            </View>
          </View>

          <View style={styles.metaBarraBloco}>
            <View style={styles.metaBarraLabelRow}>
              <Text style={styles.metaBarraLabel}>Livros</Text>
              <Text style={styles.metaBarraPct}>{pctLivros}%</Text>
            </View>
            <View style={styles.metaBarTrack}>
              <View style={[styles.metaBarFill, { width: `${pctLivros}%`, backgroundColor: Brand.gradientStart }]} />
            </View>
          </View>

          <View style={styles.metaBarraBloco}>
            <View style={styles.metaBarraLabelRow}>
              <Text style={styles.metaBarraLabel}>Páginas</Text>
              <Text style={styles.metaBarraPct}>{pctPaginas}%</Text>
            </View>
            <View style={styles.metaBarTrack}>
              <View style={[styles.metaBarFill, { width: `${pctPaginas}%`, backgroundColor: Brand.gradientEnd }]} />
            </View>
          </View>
        </View>
      </View>

      {/* Mais Bem Avaliados */}
      <View>
        <Text style={styles.secaoTitulo}>Mais Bem Avaliados</Text>

        {carregando ? (
          <ActivityIndicator size="small" color={Brand.primary} style={styles.loading} />
        ) : erro ? (
          <View style={styles.erroBox}>
            <Text style={styles.erroTexto}>{erro}</Text>
            <TouchableOpacity onPress={carregarTopAvaliados}>
              <Text style={styles.erroBotao}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : topAvaliados.length === 0 ? (
          <Text style={styles.vazioTexto}>Ainda não há livros avaliados na sua biblioteca.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carrosselScroll} contentContainerStyle={styles.carrossel}>
            {topAvaliados.map((livro) => {
              const nota = livro.avaliacao_media != null ? Number(livro.avaliacao_media).toFixed(1) : null;
              return (
                <BookCard
                  key={livro.id_livro}
                  titulo={livro.titulo}
                  autor={livro.autores?.[0]}
                  capa={livro.capa}
                  badgeNota={nota}
                  onPress={() => {
                    // TODO: navegar para a tela de detalhes do livro quando ela existir
                    console.log('Abrir detalhes de', livro.titulo);
                  }}
                />
              );
            })}
          </ScrollView>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 18,
  },
  banner: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bannerIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  bannerSubtitulo: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  atalhosRow: {
    flexDirection: 'row',
    gap: 10,
  },
  atalhoCard: {
    flex: 1,
    backgroundColor: Brand.card,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  atalhoIconWrapper: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  atalhoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Brand.textTertiary,
    textAlign: 'center',
  },
  secaoTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: Brand.textPrimary,
    marginBottom: 8,
  },
  searchShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  searchShortcutTexto: {
    fontSize: 13,
    color: Brand.placeholderIcon,
  },
  metaCard: {
    backgroundColor: Brand.card,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  metaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaHeaderTitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: Brand.textPrimary,
  },
  metaHeaderSubtitulo: {
    fontSize: 12,
    color: Brand.textSecondary,
    marginTop: 2,
  },
  metaBarraBloco: {
    gap: 6,
  },
  metaBarraLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaBarraLabel: {
    fontSize: 12,
    color: Brand.textTertiary,
    fontWeight: '600',
  },
  metaBarraPct: {
    fontSize: 12,
    color: Brand.textTertiary,
    fontWeight: '600',
  },
  metaBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Brand.border,
  },
  metaBarFill: {
    height: 6,
    borderRadius: 3,
  },
  carrosselScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  carrossel: {
    gap: 12,
    paddingRight: 16,
    alignItems: 'flex-start',
  },
  loading: {
    marginTop: 8,
  },
  erroBox: {
    backgroundColor: Brand.dangerBg,
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  erroTexto: {
    fontSize: 13,
    color: Brand.danger,
  },
  erroBotao: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.danger,
  },
  vazioTexto: {
    fontSize: 13,
    color: Brand.textSecondary,
  },
});