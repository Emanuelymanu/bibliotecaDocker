import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Brand } from '@/constants/Brand';
import { sessoesService, Sessao } from '@/src/services/sessoesService';
import { leiturasService, LeituraItem } from '@/src/services/leiturasService';
import { celebrarConquistas } from '@/src/utils/celebrarConquistas';

const CHAVE_SESSAO_ATIVA = '@estante:sessaoAtiva';

interface SessaoAtiva {
  id_leitura: number;
  titulo: string;
  capa: string | null;
  pagina_inicial: number;
  iniciadaEm: number; 
}

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatarData(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('pt-BR');
}

function formatarCronometro(segundos: number) {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = Math.floor(segundos % 60);
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export default function SessoesScreen() {
  const router = useRouter();
  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [leiturasEmAndamento, setLeiturasEmAndamento] = useState<LeituraItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [atualizando, setAtualizando] = useState(false);

  const [sessaoAtiva, setSessaoAtiva] = useState<SessaoAtiva | null>(null);
  const [segundosDecorridos, setSegundosDecorridos] = useState(0);
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const carregar = useCallback(async () => {
    try {
      setErro(null);
      setCarregando(true);
      const [respSessoes, lendo] = await Promise.all([
        sessoesService.listarTodas(),
        leiturasService.listar('lendo'),
      ]);
      setSessoes(respSessoes.sessoes);
      setLeiturasEmAndamento(lendo);
    } catch (e) {
      setErro('Não foi possível carregar suas sessões.');
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


  useEffect(() => {
    AsyncStorage.getItem(CHAVE_SESSAO_ATIVA).then((salvo) => {
      if (salvo) setSessaoAtiva(JSON.parse(salvo));
    });
  }, []);


  useEffect(() => {
    if (!sessaoAtiva) {
      if (intervaloRef.current) clearInterval(intervaloRef.current);
      setSegundosDecorridos(0);
      return;
    }
    const atualizar = () => setSegundosDecorridos(Math.floor((Date.now() - sessaoAtiva.iniciadaEm) / 1000));
    atualizar();
    intervaloRef.current = setInterval(atualizar, 1000);
    return () => {
      if (intervaloRef.current) clearInterval(intervaloRef.current);
    };
  }, [sessaoAtiva]);

  async function iniciarSessao(leitura: LeituraItem, paginaInicial: number) {
    const nova: SessaoAtiva = {
      id_leitura: leitura.id_leitura,
      titulo: leitura.livro?.titulo ?? 'Sem título',
      capa: leitura.livro?.capa ?? null,
      pagina_inicial: paginaInicial,
      iniciadaEm: Date.now(),
    };
    await AsyncStorage.setItem(CHAVE_SESSAO_ATIVA, JSON.stringify(nova));
    setSessaoAtiva(nova);
  }

  async function cancelarSessao() {
    await AsyncStorage.removeItem(CHAVE_SESSAO_ATIVA);
    setSessaoAtiva(null);
  }

  async function finalizarSessao(paginaFinal: number) {
    if (!sessaoAtiva) return;
    const duracaoMinutos = Math.max(1, Math.round((Date.now() - sessaoAtiva.iniciadaEm) / 60000));
    try {
      const { novasConquistas } = await sessoesService.registrar({
        id_leitura: sessaoAtiva.id_leitura,
        data: hojeISO(),
        pagina_inicial: sessaoAtiva.pagina_inicial,
        pagina_final: paginaFinal,
        duracao_minutos: duracaoMinutos,
      });
      await AsyncStorage.removeItem(CHAVE_SESSAO_ATIVA);
      setSessaoAtiva(null);
      await carregar();
      celebrarConquistas(novasConquistas);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível registrar a sessão.');
      console.error(e);
    }
  }

  function tituloDaSessao(sessao: Sessao): { titulo: string; capa: string | null } {
    const leitura = leiturasEmAndamento.find((l) => l.id_leitura === sessao.id_leitura);
    return { titulo: leitura?.livro?.titulo ?? 'Sessão de leitura', capa: leitura?.livro?.capa ?? null };
  }

  function paginasLidas(sessao: Sessao): number | null {
    if (sessao.pagina_inicial == null || sessao.pagina_final == null) return null;
    return Math.max(0, sessao.pagina_final - sessao.pagina_inicial);
  }

  function confirmarExclusao(id: number) {
    Alert.alert('Excluir sessão', 'Tem certeza que quer excluir essa sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await sessoesService.deletar(id);
            setSessoes((lista) => lista.filter((s) => s.id_sessao !== id));
          } catch (e) {
            Alert.alert('Erro', 'Não foi possível excluir a sessão.');
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
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={styles.tituloTela}>Sessões de Leitura</Text>
          <Text style={styles.subtituloTela}>
            {sessoes.length} sessõe{sessoes.length === 1 ? '' : 's'} registrada{sessoes.length === 1 ? '' : 's'}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={carregando || erro ? styles.centro : styles.lista}
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
        ) : (
          <>
          {sessaoAtiva ? (
            <SessaoAtivaCard
              sessaoAtiva={sessaoAtiva}
              segundos={segundosDecorridos}
              onFinalizar={finalizarSessao}
              onCancelar={cancelarSessao}
            />
          ) : (
            <IniciarSessaoCard leiturasEmAndamento={leiturasEmAndamento} onIniciar={iniciarSessao} />
          )}

          <Text style={styles.secaoTitulo}>Histórico</Text>
          {sessoes.length === 0 ? (
            <View style={styles.vazioBox}>
              <Ionicons name="timer-outline" size={36} color={Brand.placeholderIcon} />
              <Text style={styles.vazioTexto}>Nenhuma sessão registrada ainda.</Text>
            </View>
          ) : (
            sessoes.map((s) => {
              const { titulo, capa } = tituloDaSessao(s);
              const paginas = paginasLidas(s);
              return (
                <View key={s.id_sessao} style={styles.card}>
                  {capa ? (
                    <Image source={{ uri: capa }} style={styles.capa} />
                  ) : (
                    <View style={[styles.capa, styles.capaPlaceholder]}>
                      <Ionicons name="book-outline" size={18} color={Brand.placeholderIcon} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.livroTitulo} numberOfLines={1}>{titulo}</Text>
                    <Text style={styles.detalhe}>
                      {s.pagina_inicial != null && s.pagina_final != null
                        ? `pág. ${s.pagina_inicial} → ${s.pagina_final} (${paginas} pág.)`
                        : 'Sem páginas registradas'}
                    </Text>
                    <Text style={styles.data}>{formatarData(s.data)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    {s.duracao_minutos != null && (
                      <View style={styles.duracaoChip}>
                        <Ionicons name="time-outline" size={12} color={Brand.success} />
                        <Text style={styles.duracaoTexto}>{s.duracao_minutos}min</Text>
                      </View>
                    )}
                    <TouchableOpacity onPress={() => confirmarExclusao(s.id_sessao)} style={{ padding: 2 }}>
                      <Ionicons name="trash-outline" size={16} color={Brand.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function IniciarSessaoCard({
  leiturasEmAndamento,
  onIniciar,
}: {
  leiturasEmAndamento: LeituraItem[];
  onIniciar: (leitura: LeituraItem, paginaInicial: number) => void;
}) {
  const [seletorAberto, setSeletorAberto] = useState(false);
  const [leituraSelecionada, setLeituraSelecionada] = useState<LeituraItem | null>(null);
  const [paginaInicial, setPaginaInicial] = useState('');

  function selecionarLivro(l: LeituraItem) {
    setLeituraSelecionada(l);
    setPaginaInicial(l.pagina_atual != null ? String(l.pagina_atual) : '');
    setSeletorAberto(false);
  }

  function confirmar() {
    if (!leituraSelecionada) {
      Alert.alert('Escolha um livro', 'Selecione o livro que você vai ler.');
      return;
    }
    const inicial = Number(paginaInicial);
    if (paginaInicial === '' || isNaN(inicial) || inicial < 0) {
      Alert.alert('Página inválida', 'Digite a página em que você está.');
      return;
    }
    onIniciar(leituraSelecionada, inicial);
  }

  if (leiturasEmAndamento.length === 0) {
    return (
      <View style={[styles.card, styles.cardIniciar, { flexDirection: 'column', alignItems: 'stretch' }]}>
        <Text style={styles.avisoSemLivro}>
          Marque um livro como "Lendo" na Biblioteca antes de registrar uma sessão.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.cardIniciar}>
      <View style={styles.cardIniciarHeader}>
        <View style={styles.iconWrapperAzul}>
          <Ionicons name="play" size={16} color={Brand.primary} />
        </View>
        <Text style={styles.cardIniciarTitulo}>Iniciar Sessão</Text>
      </View>

      <Text style={styles.campoLabel}>Livro</Text>
      <TouchableOpacity style={styles.seletorLivro} onPress={() => setSeletorAberto(true)}>
        <Text style={leituraSelecionada ? styles.seletorLivroTexto : styles.seletorLivroPlaceholder} numberOfLines={1}>
          {leituraSelecionada?.livro?.titulo ?? 'Selecione um livro...'}
        </Text>
        <Ionicons name="chevron-down" size={16} color={Brand.textSecondary} />
      </TouchableOpacity>

      <Text style={styles.campoLabel}>Página inicial</Text>
      <TextInput
        style={styles.input}
        value={paginaInicial}
        onChangeText={(t) => setPaginaInicial(t.replace(/[^0-9]/g, ''))}
        keyboardType="numeric"
        placeholder="ex: 120"
        placeholderTextColor={Brand.textSecondary}
      />

      <TouchableOpacity style={styles.botaoIniciar} onPress={confirmar}>
        <Ionicons name="play" size={16} color="#fff" />
        <Text style={styles.botaoIniciarTexto}>Iniciar Sessão</Text>
      </TouchableOpacity>

      <Modal visible={seletorAberto} animationType="slide" transparent onRequestClose={() => setSeletorAberto(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalListaCard}>
            <Text style={styles.modalTitulo}>Selecione um livro</Text>
            <ScrollView>
              {leiturasEmAndamento.map((l) => (
                <TouchableOpacity key={l.id_leitura} style={styles.opcaoLivro} onPress={() => selecionarLivro(l)}>
                  {l.livro?.capa ? (
                    <Image source={{ uri: l.livro.capa }} style={styles.capaPequena} />
                  ) : (
                    <View style={[styles.capaPequena, styles.capaPlaceholder]}>
                      <Ionicons name="book-outline" size={14} color={Brand.placeholderIcon} />
                    </View>
                  )}
                  <Text style={styles.opcaoLivroTexto} numberOfLines={1}>{l.livro?.titulo}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.botaoCancelar} onPress={() => setSeletorAberto(false)}>
              <Text style={styles.botaoCancelarTexto}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SessaoAtivaCard({
  sessaoAtiva,
  segundos,
  onFinalizar,
  onCancelar,
}: {
  sessaoAtiva: SessaoAtiva;
  segundos: number;
  onFinalizar: (paginaFinal: number) => void;
  onCancelar: () => void;
}) {
  const [modalFinalizar, setModalFinalizar] = useState(false);
  const [paginaFinal, setPaginaFinal] = useState(String(sessaoAtiva.pagina_inicial));

  function confirmarFinalizacao() {
    const final = Number(paginaFinal);
    if (paginaFinal === '' || isNaN(final) || final < sessaoAtiva.pagina_inicial) {
      Alert.alert('Página inválida', 'A página final não pode ser menor que a inicial.');
      return;
    }
    setModalFinalizar(false);
    onFinalizar(final);
  }

  return (
    <LinearGradient colors={[Brand.gradientStart, Brand.primaryDark]} style={styles.cardAtivo} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <TouchableOpacity onPress={onCancelar} style={styles.botaoCancelarSessao}>
        <Ionicons name="close" size={18} color="rgba(255,255,255,0.85)" />
      </TouchableOpacity>

      <View style={styles.iconWrapperAtivo}>
        <Ionicons name="timer-outline" size={22} color="#fff" />
      </View>
      <Text style={styles.tituloAtivo} numberOfLines={1}>{sessaoAtiva.titulo}</Text>
      <Text style={styles.cronometro}>{formatarCronometro(segundos)}</Text>
      <Text style={styles.paginaAtivaTexto}>a partir da página {sessaoAtiva.pagina_inicial}</Text>

      <TouchableOpacity style={styles.botaoFinalizar} onPress={() => setModalFinalizar(true)}>
        <Ionicons name="stop" size={14} color={Brand.primary} />
        <Text style={styles.botaoFinalizarTexto}>Finalizar Sessão</Text>
      </TouchableOpacity>

      <Modal visible={modalFinalizar} animationType="fade" transparent onRequestClose={() => setModalFinalizar(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitulo}>Em que página você parou?</Text>
            <Text style={styles.campoLabel}>Página final</Text>
            <TextInput
              style={styles.input}
              value={paginaFinal}
              onChangeText={(t) => setPaginaFinal(t.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              autoFocus
            />
            <View style={styles.modalBotoes}>
              <TouchableOpacity style={styles.botaoCancelar} onPress={() => setModalFinalizar(false)}>
                <Text style={styles.botaoCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.botaoSalvar} onPress={confirmarFinalizacao}>
                <Text style={styles.botaoSalvarTexto}>Finalizar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 8, paddingBottom: 12 },
  tituloTela: { fontSize: 17, fontWeight: '700', color: Brand.textPrimary },
  subtituloTela: { fontSize: 12, color: Brand.textSecondary, marginTop: 2 },
  lista: { padding: 16, paddingTop: 0 },
  centro: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  secaoTitulo: { fontSize: 15, fontWeight: '700', color: Brand.textPrimary, marginTop: 20, marginBottom: 10 },


  cardIniciar: { backgroundColor: Brand.card, borderRadius: 16, padding: 16 },
  cardIniciarHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  iconWrapperAzul: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#dbeafe', alignItems: 'center', justifyContent: 'center' },
  cardIniciarTitulo: { fontSize: 15, fontWeight: '700', color: Brand.textPrimary },
  campoLabel: { fontSize: 12, fontWeight: '600', color: Brand.primary, marginBottom: 6, marginTop: 10 },
  input: { borderWidth: 1, borderColor: Brand.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: Brand.textPrimary },
  seletorLivro: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: Brand.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12 },
  seletorLivroTexto: { fontSize: 14, color: Brand.textPrimary, flex: 1 },
  seletorLivroPlaceholder: { fontSize: 14, color: Brand.textSecondary, flex: 1 },
  botaoIniciar: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: Brand.primary, borderRadius: 12, paddingVertical: 14, marginTop: 18 },
  botaoIniciarTexto: { fontSize: 14, fontWeight: '700', color: '#fff' },
  avisoSemLivro: { fontSize: 13, color: Brand.textSecondary, textAlign: 'center', paddingVertical: 8 },


  cardAtivo: { borderRadius: 16, padding: 24, alignItems: 'center' },
  botaoCancelarSessao: { position: 'absolute', top: 12, right: 12, padding: 4 },
  iconWrapperAtivo: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  tituloAtivo: { fontSize: 14, color: 'rgba(255,255,255,0.9)', maxWidth: '90%' },
  cronometro: { fontSize: 40, fontWeight: '800', color: '#fff', marginTop: 6, letterSpacing: 1 },
  paginaAtivaTexto: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  botaoFinalizar: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: '#fff', borderRadius: 30, paddingVertical: 12, paddingHorizontal: 22, marginTop: 18 },
  botaoFinalizarTexto: { fontSize: 13, fontWeight: '700', color: Brand.primary },

  card: { flexDirection: 'row', gap: 12, backgroundColor: Brand.card, borderRadius: 14, padding: 12, marginBottom: 10, alignItems: 'center' },
  capa: { width: 40, height: 56, borderRadius: 6, backgroundColor: Brand.placeholder },
  capaPequena: { width: 32, height: 44, borderRadius: 5, backgroundColor: Brand.placeholder },
  capaPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  livroTitulo: { fontSize: 14, fontWeight: '700', color: Brand.textPrimary },
  detalhe: { fontSize: 12, color: Brand.textSecondary, marginTop: 2 },
  data: { fontSize: 11, color: Brand.placeholderIcon, marginTop: 2 },
  duracaoChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  duracaoTexto: { fontSize: 12, fontWeight: '700', color: Brand.success },

  erroBox: { margin: 16, backgroundColor: Brand.dangerBg, borderRadius: 10, padding: 12, gap: 6 },
  erroTexto: { fontSize: 13, color: Brand.danger },
  erroBotao: { fontSize: 13, fontWeight: '700', color: Brand.danger },
  vazioBox: { alignItems: 'center', paddingVertical: 24, gap: 6 },
  vazioTexto: { fontSize: 13, color: Brand.textSecondary },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: Brand.card, borderRadius: 16, padding: 20 },
  modalListaCard: { backgroundColor: Brand.card, borderRadius: 16, padding: 20, maxHeight: '70%' },
  modalTitulo: { fontSize: 15, fontWeight: '700', color: Brand.textPrimary, marginBottom: 12 },
  opcaoLivro: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Brand.borderLight },
  opcaoLivroTexto: { fontSize: 14, color: Brand.textPrimary, flex: 1 },
  modalBotoes: { flexDirection: 'row', gap: 10, marginTop: 18 },
  botaoCancelar: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center', backgroundColor: '#f1f5f9', marginTop: 14 },
  botaoCancelarTexto: { fontSize: 13, fontWeight: '700', color: Brand.textTertiary },
  botaoSalvar: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center', backgroundColor: Brand.primary },
  botaoSalvarTexto: { fontSize: 13, fontWeight: '700', color: '#fff' },
});