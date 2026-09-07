import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import { Brand } from '@/constants/Brand';
import { BookCard } from '@/components/BookCard';
import { leiturasService, LeituraItem } from '@/src/services/leiturasService';
import { anotacoesService, Anotacao } from '@/src/services/anotacoesService';
import { celebrarConquistas } from '@/src/utils/celebrarConquistas';

export default function LeiturasScreen() {
  const [leituras, setLeituras] = useState<LeituraItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [selecionada, setSelecionada] = useState<LeituraItem | null>(null);
  const [atualizando, setAtualizando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setErro(null);
      setCarregando(true);
      const lista = await leiturasService.listar('lendo');
      setLeituras(lista);
    } catch (e) {
      setErro('Não foi possível carregar suas leituras.');
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

  const onRefresh = useCallback(async () => {
    setAtualizando(true);
    await carregar();
    setAtualizando(false);
  }, [carregar]);

  function removerDaLista(idLeitura: number) {
    setLeituras((lista) => lista.filter((l) => l.id_leitura !== idLeitura));
    setSelecionada(null);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Minhas Leituras</Text>
        <Text style={styles.contagem}>{leituras.length} livro{leituras.length === 1 ? '' : 's'} em leitura</Text>
      </View>

      <ScrollView
        contentContainerStyle={leituras.length > 0 ? styles.grid : styles.centro}
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
        ) : leituras.length === 0 ? (
          <Text style={styles.vazioTexto}>Nenhum livro em leitura no momento.</Text>
        ) : (
          leituras.map((item) => (
            <BookCard
              key={item.id_leitura}
              titulo={item.livro?.titulo ?? 'Sem título'}
              autor={item.livro?.autor}
              capa={item.livro?.capa}
              statusLabel={
                item.livro?.num_paginas
                  ? `${item.pagina_atual ?? 0}/${item.livro.num_paginas} pág.`
                  : undefined
              }
              statusTom="aviso"
              width="47%"
              onPress={() => setSelecionada(item)}
            />
          ))
        )}
      </ScrollView>

      {selecionada && (
        <LeituraSheet leitura={selecionada} onClose={() => setSelecionada(null)} onFinalizada={removerDaLista} />
      )}
    </SafeAreaView>
  );
}

function LeituraSheet({
  leitura,
  onClose,
  onFinalizada,
}: {
  leitura: LeituraItem;
  onClose: () => void;
  onFinalizada: (idLeitura: number) => void;
}) {
  const [aba, setAba] = useState<'progresso' | 'anotacoes'>('progresso');
  const numPaginas = leitura.livro?.num_paginas ?? null;
  const [paginaAtual, setPaginaAtual] = useState(String(leitura.pagina_atual ?? 0));
  const [salvando, setSalvando] = useState(false);

  const pct = numPaginas ? Math.min(100, Math.round((Number(paginaAtual) / numPaginas) * 100)) : 0;

  async function salvarProgresso() {
    const valor = Number(paginaAtual);
    if (isNaN(valor) || valor < 0) {
      Alert.alert('Valor inválido', 'Digite um número de página válido.');
      return;
    }
    if (numPaginas != null && valor > numPaginas) {
      Alert.alert('Valor inválido', `A página não pode passar de ${numPaginas}.`);
      return;
    }
    setSalvando(true);
    try {
      const novasConquistas = await leiturasService.atualizarProgresso(leitura.id_leitura, { pagina_atual: valor });
      if (numPaginas != null && valor === numPaginas) {
        Alert.alert('Parabéns! 🎉', 'Livro marcado como lido automaticamente.');
        onFinalizada(leitura.id_leitura);
      } else {
        onClose();
      }
      celebrarConquistas(novasConquistas);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível atualizar o progresso.');
      console.error(e);
    } finally {
      setSalvando(false);
    }
  }

  async function marcarComoLido() {
    setSalvando(true);
    try {
      const novasConquistas = await leiturasService.atualizarProgresso(leitura.id_leitura, { status: 'lido' });
      onFinalizada(leitura.id_leitura);
      celebrarConquistas(novasConquistas);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível marcar como lido.');
      console.error(e);
    } finally {
      setSalvando(false);
    }
  }

  function confirmarAbandono() {
    Alert.alert('Abandonar leitura', `Tem certeza que quer abandonar "${leitura.livro?.titulo}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Abandonar',
        style: 'destructive',
        onPress: async () => {
          try {
            await leiturasService.atualizarProgresso(leitura.id_leitura, { status: 'abandonado' });
            onFinalizada(leitura.id_leitura);
          } catch (e) {
            Alert.alert('Erro', 'Não foi possível abandonar a leitura.');
            console.error(e);
          }
        },
      },
    ]);
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />

        <View style={styles.sheetHeader}>
          {leitura.livro?.capa ? (
            <Image source={{ uri: leitura.livro.capa }} style={styles.sheetCapa} />
          ) : (
            <View style={[styles.sheetCapa, styles.sheetCapaPlaceholder]}>
              <Ionicons name="book-outline" size={20} color={Brand.placeholderIcon} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.sheetTitulo}>{leitura.livro?.titulo}</Text>
            <Text style={styles.sheetAutor}>{leitura.livro?.autor}</Text>
          </View>
        </View>

        <View style={styles.tabsRow}>
          <TouchableOpacity onPress={() => setAba('progresso')} style={[styles.tab, aba === 'progresso' && styles.tabAtiva]}>
            <Text style={[styles.tabTexto, aba === 'progresso' && styles.tabTextoAtivo]}>Progresso</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setAba('anotacoes')} style={[styles.tab, aba === 'anotacoes' && styles.tabAtiva]}>
            <Text style={[styles.tabTexto, aba === 'anotacoes' && styles.tabTextoAtivo]}>Anotações</Text>
          </TouchableOpacity>
        </View>

        {aba === 'progresso' ? (
          <ScrollView style={styles.abaConteudo}>
            <Text style={styles.progressoTexto}>
              {paginaAtual} {numPaginas ? `/ ${numPaginas}` : ''} páginas
            </Text>
            {!!numPaginas && (
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${pct}%` }]} />
              </View>
            )}

            <Text style={styles.campoLabel}>Página atual</Text>
            <TextInput
              style={styles.input}
              value={paginaAtual}
              onChangeText={(t) => setPaginaAtual(t.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
            />

            <View style={styles.botoesDuplos}>
              <TouchableOpacity style={styles.botaoLido} onPress={marcarComoLido} disabled={salvando}>
                <Text style={styles.botaoLidoTexto}>Marcar como Lido</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.botaoAbandonar} onPress={confirmarAbandono} disabled={salvando}>
                <Text style={styles.botaoAbandonarTexto}>Abandonar</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.botaoAtualizar} onPress={salvarProgresso} disabled={salvando}>
              {salvando ? <ActivityIndicator color="#fff" /> : <Text style={styles.botaoAtualizarTexto}>Atualizar Progresso</Text>}
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <AbaAnotacoes idLeitura={leitura.id_leitura} paginaInicial={leitura.pagina_atual ?? 1} numPaginas={numPaginas} />
        )}
      </View>
    </Modal>
  );
}

function AbaAnotacoes({
  idLeitura,
  paginaInicial,
  numPaginas,
}: {
  idLeitura: number;
  paginaInicial: number;
  numPaginas: number | null;
}) {
  const [pagina, setPagina] = useState(Math.max(1, paginaInicial));
  const [todasAnotacoes, setTodasAnotacoes] = useState<Anotacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [novaAberta, setNovaAberta] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novoConteudo, setNovoConteudo] = useState('');
  const [salvando, setSalvando] = useState(false);

  const carregarTudo = useCallback(async () => {
    try {
      setCarregando(true);
      const lista = await anotacoesService.listarPorLeitura(idLeitura);
      setTodasAnotacoes(lista);
    } catch (e) {
      console.error(e);
    } finally {
      setCarregando(false);
    }
  }, [idLeitura]);

  useEffect(() => {
    carregarTudo();
  }, [carregarTudo]);

  const anotacoesDaPagina = todasAnotacoes.filter((a) => a.pagina === pagina);

  async function criarAnotacao() {
    if (!novoConteudo.trim()) {
      Alert.alert('Campo obrigatório', 'Escreva algo na anotação.');
      return;
    }
    setSalvando(true);
    try {
      const anotacao = await anotacoesService.criar(idLeitura, pagina, novoTitulo.trim() || undefined, novoConteudo.trim());
      setTodasAnotacoes((lista) => [...lista, anotacao]);
      setNovoTitulo('');
      setNovoConteudo('');
      setNovaAberta(false);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar a anotação.');
      console.error(e);
    } finally {
      setSalvando(false);
    }
  }

  function confirmarExclusao(id: number) {
    Alert.alert('Excluir anotação', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await anotacoesService.deletar(id);
            setTodasAnotacoes((lista) => lista.filter((a) => a.id_anotacao !== id));
          } catch (e) {
            Alert.alert('Erro', 'Não foi possível excluir.');
            console.error(e);
          }
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.abaConteudo}>
      <View style={styles.paginacaoRow}>
        <TouchableOpacity onPress={() => setPagina((p) => Math.max(1, p - 1))} disabled={pagina <= 1}>
          <Ionicons name="chevron-back" size={20} color={pagina <= 1 ? Brand.border : Brand.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.paginacaoTexto}>Página {pagina}</Text>
        <TouchableOpacity
          onPress={() => setPagina((p) => (numPaginas ? Math.min(numPaginas, p + 1) : p + 1))}
          disabled={numPaginas != null && pagina >= numPaginas}
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={numPaginas != null && pagina >= numPaginas ? Brand.border : Brand.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {carregando ? (
        <ActivityIndicator size="small" color={Brand.primary} style={{ marginTop: 12 }} />
      ) : anotacoesDaPagina.length === 0 ? (
        <Text style={styles.vazioAnotacoes}>Nenhuma anotação nessa página ainda.</Text>
      ) : (
        anotacoesDaPagina.map((a) => (
          <View key={a.id_anotacao} style={styles.anotacaoCard}>
            {!!a.titulo && <Text style={styles.anotacaoTitulo}>{a.titulo}</Text>}
            <Text style={styles.anotacaoConteudo}>{a.conteudo}</Text>
            <TouchableOpacity onPress={() => confirmarExclusao(a.id_anotacao)} style={{ alignSelf: 'flex-end', marginTop: 6 }}>
              <Ionicons name="trash-outline" size={16} color={Brand.danger} />
            </TouchableOpacity>
          </View>
        ))
      )}

      {novaAberta ? (
        <View style={styles.novaAnotacaoBox}>
          <TextInput
            style={styles.input}
            placeholder="Título (opcional)"
            value={novoTitulo}
            onChangeText={setNovoTitulo}
          />
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top', marginTop: 8 }]}
            placeholder="Escreva sua anotação..."
            value={novoConteudo}
            onChangeText={setNovoConteudo}
            multiline
          />
          <View style={styles.botoesDuplos}>
            <TouchableOpacity style={styles.botaoAbandonar} onPress={() => setNovaAberta(false)} disabled={salvando}>
              <Text style={styles.botaoAbandonarTexto}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.botaoLido} onPress={criarAnotacao} disabled={salvando}>
              {salvando ? <ActivityIndicator color="#fff" /> : <Text style={styles.botaoLidoTexto}>Salvar</Text>}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.botaoNovaAnotacao} onPress={() => setNovaAberta(true)}>
          <Text style={styles.botaoNovaAnotacaoTexto}>+ Nova Anotação na Página {pagina}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.background },
  header: { paddingHorizontal: 16, paddingTop: 16 },
  titulo: { fontSize: 20, fontWeight: '700', color: Brand.textPrimary },
  contagem: { fontSize: 12, color: Brand.textSecondary, marginTop: 2 },
  grid: {
    padding: 16,
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

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '85%',
    backgroundColor: Brand.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  sheetHandle: { width: 40, height: 5, borderRadius: 3, backgroundColor: Brand.border, alignSelf: 'center', marginBottom: 14 },
  sheetHeader: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  sheetCapa: { width: 56, height: 78, borderRadius: 8, backgroundColor: Brand.placeholder },
  sheetCapaPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  sheetTitulo: { fontSize: 16, fontWeight: '700', color: Brand.textPrimary },
  sheetAutor: { fontSize: 13, color: Brand.textSecondary, marginTop: 2 },

  tabsRow: { flexDirection: 'row', gap: 8, borderBottomWidth: 1, borderBottomColor: Brand.borderLight, marginBottom: 14 },
  tab: { paddingVertical: 8, paddingHorizontal: 4, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabAtiva: { borderBottomColor: Brand.primary },
  tabTexto: { fontSize: 13, fontWeight: '600', color: Brand.textSecondary },
  tabTextoAtivo: { color: Brand.primary },

  abaConteudo: { maxHeight: 420 },
  progressoTexto: { fontSize: 14, color: Brand.textTertiary, marginBottom: 6 },
  progressBarTrack: { height: 8, borderRadius: 4, backgroundColor: Brand.border, marginBottom: 16 },
  progressBarFill: { height: 8, borderRadius: 4, backgroundColor: Brand.primary },
  campoLabel: { fontSize: 12, fontWeight: '600', color: Brand.textTertiary, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Brand.textPrimary,
  },
  botoesDuplos: { flexDirection: 'row', gap: 10, marginTop: 14 },
  botaoLido: { flex: 1, backgroundColor: '#10b981', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  botaoLidoTexto: { color: '#fff', fontWeight: '700', fontSize: 13 },
  botaoAbandonar: { flex: 1, backgroundColor: Brand.dangerBg, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  botaoAbandonarTexto: { color: Brand.danger, fontWeight: '700', fontSize: 13 },
  botaoAtualizar: { marginTop: 12, backgroundColor: Brand.primary, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  botaoAtualizarTexto: { color: '#fff', fontWeight: '700', fontSize: 14 },

  paginacaoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  paginacaoTexto: { fontSize: 14, fontWeight: '600', color: Brand.textPrimary },
  vazioAnotacoes: { fontSize: 13, color: Brand.textSecondary, fontStyle: 'italic', marginBottom: 12 },
  anotacaoCard: { backgroundColor: '#f8fafc', borderRadius: 10, padding: 12, marginBottom: 10 },
  anotacaoTitulo: { fontSize: 13, fontWeight: '700', color: Brand.textPrimary, marginBottom: 2 },
  anotacaoConteudo: { fontSize: 13, color: Brand.textTertiary },
  novaAnotacaoBox: { marginTop: 4, marginBottom: 20 },
  botaoNovaAnotacao: { backgroundColor: '#eff6ff', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginBottom: 20 },
  botaoNovaAnotacaoTexto: { color: Brand.primary, fontWeight: '600', fontSize: 13 },
});