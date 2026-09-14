import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useFocusEffect } from 'expo-router';
import { Brand } from '@/constants/Brand';
import { BookCard } from '@/components/BookCard';
import { Chip } from '@/components/biblioteca/Chip';
import { EditarLivroModal, FormularioEdicao } from '@/components/biblioteca/EditarLivroModal';
import { CadastrarLivroModal, FormularioCadastro } from '@/components/biblioteca/CadastrarLivroModal';
import { LivroDetalhesSheet } from '@/components/biblioteca/LivroDetalhesSheet';
import { FILTROS, STATUS_LABEL, STATUS_TOM } from '@/src/constants/livroForm';
import { leiturasService, LeituraItem } from '@/src/services/leiturasService';
import { livrosService, LivroCompleto, CadastrarLivroPayload } from '@/src/services/livrosService';
import { celebrarConquistas } from '@/src/utils/celebrarConquistas';
import { CapaSelecionada } from '@/src/types/livro';

export default function BibliotecaScreen() {
  const [filtro, setFiltro] = useState<string | undefined>(undefined);
  const [busca, setBusca] = useState('');
  const [leituras, setLeituras] = useState<LeituraItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [selecionada, setSelecionada] = useState<LeituraItem | null>(null);
  const [salvandoStatus, setSalvandoStatus] = useState(false);
  const [statusPendente, setStatusPendente] = useState<string | null>(null);

  const [livroEmEdicao, setLivroEmEdicao] = useState<LivroCompleto | null>(null);
  const [carregandoEdicao, setCarregandoEdicao] = useState(false);
  const [cadastroAberto, setCadastroAberto] = useState(false);
  const [atualizando, setAtualizando] = useState(false);

  const carregar = useCallback(async (statusAtual?: string) => {
    try {
      setErro(null);
      setCarregando(true);
      const lista = await leiturasService.listar(statusAtual);
      setLeituras(lista);
    } catch (e) {
      setErro('Não foi possível carregar sua biblioteca.');
      console.error(e);
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregar(filtro);
    }, [filtro, carregar])
  );

  const onRefresh = useCallback(async () => {
    setAtualizando(true);
    await carregar(filtro);
    setAtualizando(false);
  }, [carregar, filtro]);

  const listaFiltrada = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return leituras;
    return leituras.filter(
      (item) =>
        item.livro?.titulo?.toLowerCase().includes(termo) ||
        item.livro?.autor?.toLowerCase().includes(termo)
    );
  }, [leituras, busca]);

  function abrirDetalhes(item: LeituraItem) {
    setSelecionada(item);
    setStatusPendente(item.status);
  }

  async function confirmarNovoStatus() {
    if (!selecionada || !statusPendente || statusPendente === selecionada.status) return;
    try {
      setSalvandoStatus(true);
      const novasConquistas = await leiturasService.atualizarStatus(selecionada.id_leitura, statusPendente);
      setLeituras((lista) =>
        lista.map((l) => (l.id_leitura === selecionada.id_leitura ? { ...l, status: statusPendente as LeituraItem['status'] } : l))
      );
      setSelecionada((sel) => (sel ? { ...sel, status: statusPendente as LeituraItem['status'] } : sel));
      celebrarConquistas(novasConquistas);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível atualizar o status.');
      console.error(e);
    } finally {
      setSalvandoStatus(false);
    }
  }

  async function avaliar(nota: number) {
    if (!selecionada || selecionada.status !== 'lido') return;
    try {
      await leiturasService.avaliar(selecionada.id_leitura, nota);
      setLeituras((lista) => lista.map((l) => (l.id_leitura === selecionada.id_leitura ? { ...l, avaliacao: nota } : l)));
      setSelecionada((sel) => (sel ? { ...sel, avaliacao: nota } : sel));
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar a avaliação.');
      console.error(e);
    }
  }

  async function abrirEdicao() {
    if (!selecionada?.livro) return;
    setCarregandoEdicao(true);
    try {
      const livroCompleto = await livrosService.buscarPorId(selecionada.livro.id_livro);
      if (!livroCompleto) {
        Alert.alert('Erro', 'Não encontrei os dados completos desse livro.');
        return;
      }
      setLivroEmEdicao(livroCompleto);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível carregar os dados do livro.');
      console.error(e);
    } finally {
      setCarregandoEdicao(false);
    }
  }

  async function salvarEdicao(form: FormularioEdicao) {
    if (!livroEmEdicao) return;
    try {
      await livrosService.atualizar(livroEmEdicao.id_livro, {
        titulo: form.titulo.trim(),
        subtitulo: form.subtitulo.trim() || undefined,
        autores: form.autor.split(',').map((a) => a.trim()).filter(Boolean),
        tipo_obra: form.tipo_obra,
        ano_publicacao: Number(form.ano_publicacao) || 0,
        num_paginas: Number(form.num_paginas) || 0,
        generos: [form.genero],
        editora: form.editora.trim() || undefined,
        status: form.status,
        avaliacao: form.status === 'lido' ? form.avaliacao : undefined,
      });
      setLivroEmEdicao(null);
      setSelecionada(null);
      await carregar(filtro);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
      console.error(e);
    }
  }

  async function salvarCadastro(form: FormularioCadastro, capa: CapaSelecionada | null) {
    try {
      const payload: CadastrarLivroPayload = {
        titulo: form.titulo.trim(),
        subtitulo: form.subtitulo.trim() || undefined,
        autores: form.autor.split(',').map((a) => a.trim()).filter(Boolean),
        tipo_obra: form.tipo_obra,
        ano_publicacao: Number(form.ano_publicacao) || 0,
        num_paginas: Number(form.num_paginas) || 0,
        generos: [form.genero],
        editora: form.editora.trim() || undefined,
        capa: capa ?? undefined,
      };
      const { id_livro } = await livrosService.cadastrar(payload);

      const listaAtualizada = await leiturasService.listar();
      const leituraCriada = listaAtualizada.find((l) => l.livro?.id_livro === id_livro);
      if (leituraCriada && form.statusInicial !== leituraCriada.status) {
        await leiturasService.atualizarStatus(leituraCriada.id_leitura, form.statusInicial);
      }

      setCadastroAberto(false);
      await carregar(filtro);
    } catch (e: any) {
      const mensagem = e?.response?.data?.message ?? 'Não foi possível cadastrar o livro.';
      Alert.alert('Erro', mensagem);
      console.error(e);
    }
  }

  function confirmarExclusao() {
    if (!selecionada?.livro) return;
    Alert.alert(
      'Excluir livro',
      `Tem certeza que quer excluir "${selecionada.livro.titulo}"? Isso apaga também suas anotações sobre ele.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await livrosService.deletar(selecionada.livro!.id_livro);
              setLeituras((lista) => lista.filter((l) => l.id_leitura !== selecionada.id_leitura));
              setSelecionada(null);
            } catch (e) {
              Alert.alert('Erro', 'Não foi possível excluir o livro.');
              console.error(e);
            }
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.titulo}>Biblioteca</Text>
          <Text style={styles.contagem}>{leituras.length} livro{leituras.length === 1 ? '' : 's'}</Text>
        </View>
        <TouchableOpacity style={styles.botaoAdicionar} onPress={() => setCadastroAberto(true)}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={16} color={Brand.placeholderIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar livro ou autor..."
          value={busca}
          onChangeText={setBusca}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtrosScroll} contentContainerStyle={styles.filtros}>
        {FILTROS.map((f) => (
          <Chip key={f.label} label={f.label} ativo={filtro === f.valor} onPress={() => setFiltro(f.valor)} />
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={listaFiltrada.length > 0 ? styles.grid : styles.centro}
        refreshControl={<RefreshControl refreshing={atualizando} onRefresh={onRefresh} tintColor={Brand.primary} />}
      >
        {carregando ? (
          <ActivityIndicator size="small" color={Brand.primary} />
        ) : erro ? (
          <View style={styles.erroBox}>
            <Text style={styles.erroTexto}>{erro}</Text>
            <TouchableOpacity onPress={() => carregar(filtro)}>
              <Text style={styles.erroBotao}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : listaFiltrada.length === 0 ? (
          <Text style={styles.vazioTexto}>Nenhum livro encontrado.</Text>
        ) : (
          listaFiltrada.map((item) => (
            <BookCard
              key={item.id_leitura}
              titulo={item.livro?.titulo ?? 'Sem título'}
              autor={item.livro?.autor}
              capa={item.livro?.capa}
              badgeNota={item.avaliacao != null ? item.avaliacao.toFixed(1) : undefined}
              statusLabel={STATUS_LABEL[item.status]}
              statusTom={STATUS_TOM[item.status]}
              width="47%"
              onPress={() => abrirDetalhes(item)}
            />
          ))
        )}
      </ScrollView>

      {selecionada && (
        <LivroDetalhesSheet
          item={selecionada}
          statusPendente={statusPendente}
          salvandoStatus={salvandoStatus}
          carregandoEdicao={carregandoEdicao}
          onFechar={() => setSelecionada(null)}
          onSelecionarStatus={setStatusPendente}
          onConfirmarNovoStatus={confirmarNovoStatus}
          onAvaliar={avaliar}
          onAbrirEdicao={abrirEdicao}
          onConfirmarExclusao={confirmarExclusao}
        />
      )}

      {livroEmEdicao && (
        <EditarLivroModal
          livro={livroEmEdicao}
          statusInicial={selecionada?.status ?? 'quero_ler'}
          avaliacaoInicial={selecionada?.avaliacao ?? 0}
          onCancelar={() => setLivroEmEdicao(null)}
          onSalvar={salvarEdicao}
        />
      )}

      {cadastroAberto && (
        <CadastrarLivroModal onCancelar={() => setCadastroAberto(false)} onSalvar={salvarCadastro} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  titulo: { fontSize: 20, fontWeight: '700', color: Brand.textPrimary },
  contagem: { fontSize: 12, color: Brand.textSecondary, marginTop: 2 },
  botaoAdicionar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginTop: 14,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 13, color: Brand.textPrimary },
  filtrosScroll: { flexGrow: 0, flexShrink: 0 },
  filtros: { paddingHorizontal: 16, paddingVertical: 12, gap: 8, alignItems: 'flex-start' },
  grid: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  centro: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  erroBox: { margin: 16, backgroundColor: Brand.dangerBg, borderRadius: 10, padding: 12, gap: 6 },
  erroTexto: { fontSize: 13, color: Brand.danger },
  erroBotao: { fontSize: 13, fontWeight: '700', color: Brand.danger },
  vazioTexto: { textAlign: 'center', marginTop: 24, fontSize: 13, color: Brand.textSecondary },
});
