import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
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
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/Brand';
import { BookCard } from '@/components/BookCard';
import { livrosService, LivroTopAvaliado } from '@/src/services/livrosService';
import { metasService, Meta, Progresso } from '@/src/services/metasService';
import { useAuth } from '@/src/context/AuthContext';

const ANO_ATUAL = new Date().getFullYear();

const ATALHOS = [
  { key: 'wishlist', label: 'Lista de Desejos', icon: 'heart' as const, cor: '#ec4899', fundo: '#fce7f3', rota: '/lista-desejos' as const },
  { key: 'conquistas', label: 'Conquistas', icon: 'trophy' as const, cor: '#d97706', fundo: '#fef3c7', rota: '/conquistas' as const },
  { key: 'sessoes', label: 'Sessões', icon: 'timer' as const, cor: '#0d9488', fundo: '#ccfbf1', rota: '/sessoes' as const },
];

export default function HomeScreen() {
  const router = useRouter();
  const { usuario } = useAuth();

  const [topAvaliados, setTopAvaliados] = useState<LivroTopAvaliado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [atualizando, setAtualizando] = useState(false);
  const [meta, setMeta] = useState<{ meta: Meta; progresso: Progresso } | null>(null);
  const [livroSelecionado, setLivroSelecionado] = useState<LivroTopAvaliado | null>(null);

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

  useEffect(() => {
    metasService
      .buscarPorAno(ANO_ATUAL)
      .then(setMeta)
      .catch(() => setMeta(null));
  }, []);

  const onRefresh = useCallback(async () => {
    setAtualizando(true);
    await carregarTopAvaliados();
    setAtualizando(false);
  }, [carregarTopAvaliados]);

  const primeiroNome = usuario?.nome?.split(' ')[0] ?? 'Leitor(a)';
  const livrosAlvo = meta?.meta.qtd_livros_alvo ?? null;
  const paginasAlvo = meta?.meta.qtd_paginas_alvo ?? null;
  const livrosAtual = meta?.progresso.livros_lidos ?? 0;
  const paginasAtual = meta?.progresso.paginas_lidas ?? 0;
  const pctLivros = livrosAlvo ? Math.min(100, Math.round((livrosAtual / livrosAlvo) * 100)) : 0;
  const pctPaginas = paginasAlvo ? Math.min(100, Math.round((paginasAtual / paginasAlvo) * 100)) : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={atualizando} onRefresh={onRefresh} tintColor={Brand.primary} />}
    >
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

      <View style={styles.atalhosRow}>
        {ATALHOS.map((a) => (
          <TouchableOpacity
            key={a.key}
            style={styles.atalhoCard}
            activeOpacity={0.8}
            onPress={() => a.rota && router.push(a.rota)}
          >
            <View style={[styles.atalhoIconWrapper, { backgroundColor: a.fundo }]}>
              <Ionicons name={a.icon} size={16} color={a.cor} />
            </View>
            <Text style={styles.atalhoLabel} numberOfLines={2}>
              {a.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View>
        <Text style={styles.secaoTitulo}>Buscar Livros</Text>
        <TouchableOpacity style={styles.searchShortcut} onPress={() => router.push('/busca')} activeOpacity={0.8}>
          <Ionicons name="search" size={18} color={Brand.placeholderIcon} />
          <Text style={styles.searchShortcutTexto}>Título, autor...</Text>
        </TouchableOpacity>
      </View>

      <View>
        <Text style={styles.secaoTitulo}>Meta de {ANO_ATUAL}</Text>
        <TouchableOpacity style={styles.metaCard} activeOpacity={0.85} onPress={() => router.push('/metas')}>
          <View style={styles.metaHeader}>
            <View style={styles.metaIconWrapper}>
              <Ionicons name="locate-outline" size={18} color="#7c3aed" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.metaHeaderTitulo}>
                {livrosAlvo != null ? `${livrosAtual} de ${livrosAlvo} livros` : 'Nenhuma meta definida ainda'}
              </Text>
              {paginasAlvo != null && (
                <Text style={styles.metaHeaderSubtitulo}>
                  {paginasAtual.toLocaleString('pt-BR')} de {paginasAlvo.toLocaleString('pt-BR')} páginas
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={18} color={Brand.textSecondary} />
          </View>

          {livrosAlvo != null && (
            <View style={styles.metaBarraBloco}>
              <View style={styles.metaBarraLabelRow}>
                <Text style={styles.metaBarraLabel}>Livros</Text>
                <Text style={styles.metaBarraPct}>{pctLivros}%</Text>
              </View>
              <View style={styles.metaBarTrack}>
                <View style={[styles.metaBarFill, { width: `${pctLivros}%`, backgroundColor: Brand.gradientStart }]} />
              </View>
            </View>
          )}

          {paginasAlvo != null && (
            <View style={styles.metaBarraBloco}>
              <View style={styles.metaBarraLabelRow}>
                <Text style={styles.metaBarraLabel}>Páginas</Text>
                <Text style={styles.metaBarraPct}>{pctPaginas}%</Text>
              </View>
              <View style={styles.metaBarTrack}>
                <View style={[styles.metaBarFill, { width: `${pctPaginas}%`, backgroundColor: Brand.gradientEnd }]} />
              </View>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View>
        <Text style={styles.secaoTitulo}>Meus Livros</Text>

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
                  onPress={() => setLivroSelecionado(livro)}
                />
              );
            })}
          </ScrollView>
        )}
      </View>
    </ScrollView>

    <Modal visible={!!livroSelecionado} animationType="slide" transparent onRequestClose={() => setLivroSelecionado(null)}>
      <Pressable style={styles.overlay} onPress={() => setLivroSelecionado(null)} />
      {livroSelecionado && (
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            {livroSelecionado.capa ? (
              <Image source={{ uri: livroSelecionado.capa }} style={styles.sheetCapa} />
            ) : (
              <View style={[styles.sheetCapa, styles.sheetCapaVazia]}>
                <Ionicons name="book" size={28} color={Brand.textSecondary} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitulo}>{livroSelecionado.titulo}</Text>
              {!!livroSelecionado.autores?.length && (
                <Text style={styles.sheetMeta}>
                  {livroSelecionado.autores.map((nome, i) => (
                    <Text key={nome}>
                      {i > 0 && ', '}
                      <Text
                        style={styles.sheetLink}
                        onPress={() => {
                          setLivroSelecionado(null);
                          router.push(`/autor/${encodeURIComponent(nome)}`);
                        }}
                      >
                        {nome}
                      </Text>
                    </Text>
                  ))}
                </Text>
              )}
              {!!livroSelecionado.editora && (
                <Text
                  style={[styles.sheetMeta, styles.sheetLink]}
                  onPress={() => {
                    const editora = livroSelecionado.editora!;
                    setLivroSelecionado(null);
                    router.push(`/editora/${encodeURIComponent(editora)}`);
                  }}
                >
                  {livroSelecionado.editora}
                </Text>
              )}
              {livroSelecionado.avaliacao_media != null && (
                <View style={styles.sheetNotaRow}>
                  <Ionicons name="star" size={14} color="#fbbf24" />
                  <Text style={styles.sheetNota}>{Number(livroSelecionado.avaliacao_media).toFixed(1)}</Text>
                </View>
              )}
            </View>
          </View>

          {!!livroSelecionado.generos?.length && (
            <View style={styles.sheetGenerosRow}>
              {livroSelecionado.generos.map((g) => (
                <View key={g} style={styles.sheetGeneroTag}>
                  <Text style={styles.sheetGeneroTexto}>{g}</Text>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.sheetFechar} onPress={() => setLivroSelecionado(null)}>
            <Text style={styles.sheetFecharTexto}>Fechar</Text>
          </TouchableOpacity>
        </View>
      )}
    </Modal>
    </SafeAreaView>
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Brand.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    gap: 14,
  },
  sheetCapa: {
    width: 80,
    height: 120,
    borderRadius: 8,
    backgroundColor: Brand.border,
  },
  sheetCapaVazia: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitulo: {
    fontSize: 17,
    fontWeight: '700',
    color: Brand.textPrimary,
  },
  sheetMeta: {
    fontSize: 13,
    color: Brand.textSecondary,
    marginTop: 4,
  },
  sheetLink: {
    textDecorationLine: 'underline',
  },
  sheetNotaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  sheetNota: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.textPrimary,
  },
  sheetGenerosRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sheetGeneroTag: {
    backgroundColor: Brand.background,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sheetGeneroTexto: {
    fontSize: 12,
    fontWeight: '600',
    color: Brand.textTertiary,
  },
  sheetFechar: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Brand.background,
  },
  sheetFecharTexto: {
    fontSize: 14,
    fontWeight: '700',
    color: Brand.textPrimary,
  },
});