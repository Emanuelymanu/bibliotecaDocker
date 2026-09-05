import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
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
import { useRouter } from 'expo-router';

import { Brand } from '@/constants/Brand';
import { metasService, Meta, Progresso } from '@/src/services/metasService';
import { celebrarConquistas } from '@/src/utils/celebrarConquistas';

const ANO_ATUAL = new Date().getFullYear();

export default function MetasScreen() {
  const router = useRouter();
  const [metas, setMetas] = useState<{ meta: Meta; progresso: Progresso }[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [editorAberto, setEditorAberto] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setErro(null);
      setCarregando(true);
      const lista = await metasService.listar();
      setMetas(lista);
    } catch (e) {
      setErro('Não foi possível carregar suas metas.');
      console.error(e);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const metaDoAno = metas.find((m) => m.meta.ano === ANO_ATUAL);
  const outrasMetas = metas.filter((m) => m.meta.ano !== ANO_ATUAL);

  async function salvarMeta(livrosAlvo: number, paginasAlvo: number) {
    try {
      const { novasConquistas } = await metasService.salvar(ANO_ATUAL, livrosAlvo || undefined, paginasAlvo || undefined);
      setEditorAberto(false);
      await carregar();
      celebrarConquistas(novasConquistas);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar a meta.');
      console.error(e);
    }
  }

  const pctLivros = metaDoAno?.meta.qtd_livros_alvo
    ? Math.min(100, Math.round((metaDoAno.progresso.livros_lidos / metaDoAno.meta.qtd_livros_alvo) * 100))
    : 0;
  const pctPaginas = metaDoAno?.meta.qtd_paginas_alvo
    ? Math.min(100, Math.round((metaDoAno.progresso.paginas_lidas / metaDoAno.meta.qtd_paginas_alvo) * 100))
    : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={22} color={Brand.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.tituloTela}>Metas de Leitura</Text>
        <View style={{ width: 22 }} />
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
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <LinearGradient
            colors={[Brand.gradientStart, Brand.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardMeta}
          >
            <Text style={styles.cardMetaAno}>Meta de {ANO_ATUAL}</Text>

            {metaDoAno ? (
              <>
                {metaDoAno.meta.qtd_livros_alvo != null && (
                  <View style={{ marginTop: 14 }}>
                    <View style={styles.linhaLabel}>
                      <Text style={styles.cardMetaLabel}>Livros</Text>
                      <Text style={styles.cardMetaValor}>
                        {metaDoAno.progresso.livros_lidos}/{metaDoAno.meta.qtd_livros_alvo} · {pctLivros}%
                      </Text>
                    </View>
                    <View style={styles.trackBranco}>
                      <View style={[styles.fillBranco, { width: `${pctLivros}%` }]} />
                    </View>
                  </View>
                )}

                {metaDoAno.meta.qtd_paginas_alvo != null && (
                  <View style={{ marginTop: 14 }}>
                    <View style={styles.linhaLabel}>
                      <Text style={styles.cardMetaLabel}>Páginas</Text>
                      <Text style={styles.cardMetaValor}>
                        {metaDoAno.progresso.paginas_lidas.toLocaleString('pt-BR')}/
                        {metaDoAno.meta.qtd_paginas_alvo.toLocaleString('pt-BR')} · {pctPaginas}%
                      </Text>
                    </View>
                    <View style={styles.trackBranco}>
                      <View style={[styles.fillBranco, { width: `${pctPaginas}%` }]} />
                    </View>
                  </View>
                )}
              </>
            ) : (
              <Text style={styles.semMetaTexto}>Você ainda não definiu uma meta para {ANO_ATUAL}.</Text>
            )}
          </LinearGradient>

          <TouchableOpacity style={styles.botaoEditar} onPress={() => setEditorAberto(true)}>
            <Text style={styles.botaoEditarTexto}>{metaDoAno ? 'Editar Meta' : 'Definir Meta'}</Text>
          </TouchableOpacity>

          {outrasMetas.length > 0 && (
            <View style={{ marginTop: 24 }}>
              <Text style={styles.secaoTitulo}>Anos anteriores</Text>
              {outrasMetas.map(({ meta, progresso }) => {
                const pctL = meta.qtd_livros_alvo ? Math.round((progresso.livros_lidos / meta.qtd_livros_alvo) * 100) : null;
                return (
                  <View key={meta.id_meta} style={styles.itemAnoAnterior}>
                    <Text style={styles.itemAnoTexto}>{meta.ano}</Text>
                    <Text style={styles.itemAnoValor}>
                      {progresso.livros_lidos} livro{progresso.livros_lidos === 1 ? '' : 's'}
                      {pctL != null ? ` · ${pctL}%` : ''}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      {editorAberto && (
        <EditorMeta
          metaAtual={metaDoAno?.meta}
          onCancelar={() => setEditorAberto(false)}
          onSalvar={salvarMeta}
        />
      )}
    </SafeAreaView>
  );
}

function EditorMeta({
  metaAtual,
  onCancelar,
  onSalvar,
}: {
  metaAtual?: Meta;
  onCancelar: () => void;
  onSalvar: (livros: number, paginas: number) => Promise<void>;
}) {
  const [livros, setLivros] = useState(metaAtual?.qtd_livros_alvo ? String(metaAtual.qtd_livros_alvo) : '');
  const [paginas, setPaginas] = useState(metaAtual?.qtd_paginas_alvo ? String(metaAtual.qtd_paginas_alvo) : '');
  const [salvando, setSalvando] = useState(false);

  async function confirmar() {
    if (!livros && !paginas) {
      Alert.alert('Atenção', 'Preencha ao menos um dos dois campos.');
      return;
    }
    setSalvando(true);
    try {
      await onSalvar(Number(livros) || 0, Number(paginas) || 0);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onCancelar}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitulo}>Meta de {ANO_ATUAL}</Text>

          <Text style={styles.campoLabel}>Quantos livros você quer ler?</Text>
          <TextInput
            style={styles.input}
            value={livros}
            onChangeText={(t) => setLivros(t.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
            placeholder="Ex: 24"
          />

          <Text style={styles.campoLabel}>Quantas páginas?</Text>
          <TextInput
            style={styles.input}
            value={paginas}
            onChangeText={(t) => setPaginas(t.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
            placeholder="Ex: 6000"
          />

          <View style={styles.modalBotoes}>
            <TouchableOpacity style={styles.botaoCancelar} onPress={onCancelar} disabled={salvando}>
              <Text style={styles.botaoCancelarTexto}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.botaoSalvar} onPress={confirmar} disabled={salvando}>
              {salvando ? <ActivityIndicator color="#fff" /> : <Text style={styles.botaoSalvarTexto}>Salvar</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8 },
  tituloTela: { fontSize: 16, fontWeight: '700', color: Brand.textPrimary },
  scroll: { padding: 16 },
  cardMeta: { borderRadius: 16, padding: 20 },
  cardMetaAno: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
  linhaLabel: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  cardMetaLabel: { fontSize: 13, fontWeight: '600', color: '#fff' },
  cardMetaValor: { fontSize: 12, color: 'rgba(255,255,255,0.9)' },
  trackBranco: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)' },
  fillBranco: { height: 8, borderRadius: 4, backgroundColor: '#fff' },
  semMetaTexto: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 10 },
  botaoEditar: { marginTop: 16, backgroundColor: Brand.card, borderRadius: 10, paddingVertical: 13, alignItems: 'center', borderWidth: 1, borderColor: Brand.border },
  botaoEditarTexto: { fontSize: 14, fontWeight: '700', color: Brand.primary },
  secaoTitulo: { fontSize: 14, fontWeight: '700', color: Brand.textPrimary, marginBottom: 10 },
  itemAnoAnterior: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: Brand.card, borderRadius: 10, padding: 12, marginBottom: 8 },
  itemAnoTexto: { fontSize: 13, fontWeight: '700', color: Brand.textPrimary },
  itemAnoValor: { fontSize: 13, color: Brand.textSecondary },
  erroBox: { margin: 16, backgroundColor: Brand.dangerBg, borderRadius: 10, padding: 12, gap: 6 },
  erroTexto: { fontSize: 13, color: Brand.danger },
  erroBotao: { fontSize: 13, fontWeight: '700', color: Brand.danger },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: Brand.card, borderRadius: 16, padding: 20 },
  modalTitulo: { fontSize: 16, fontWeight: '700', color: Brand.textPrimary, marginBottom: 12 },
  campoLabel: { fontSize: 12, fontWeight: '600', color: Brand.textTertiary, marginBottom: 6, marginTop: 10 },
  input: { borderWidth: 1, borderColor: Brand.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: Brand.textPrimary },
  modalBotoes: { flexDirection: 'row', gap: 10, marginTop: 20 },
  botaoCancelar: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center', backgroundColor: '#f1f5f9' },
  botaoCancelarTexto: { fontSize: 13, fontWeight: '700', color: Brand.textTertiary },
  botaoSalvar: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center', backgroundColor: Brand.primary },
  botaoSalvarTexto: { fontSize: 13, fontWeight: '700', color: '#fff' },
});