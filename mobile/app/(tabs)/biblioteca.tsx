// app/(tabs)/biblioteca.tsx
//
// Tela Biblioteca — lista os livros que o usuário logado já marcou com algum
// status de leitura, com busca, filtro por status, selo de status no card,
// e um cartão de baixo (bottom sheet) pra ver detalhes, trocar status, dar
// nota, editar (formulário completo) ou excluir o livro.

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Brand } from '@/constants/Brand';
import { BookCard, StatusTom } from '@/components/BookCard';
import { leiturasService, LeituraItem } from '@/src/services/leiturasService';
import { livrosService, LivroCompleto } from '@/src/services/livrosService';

// ---------- Constantes de status ----------
const FILTROS: { label: string; valor?: string }[] = [
  { label: 'Todos', valor: undefined },
  { label: 'Quero Ler', valor: 'quero_ler' },
  { label: 'Lendo', valor: 'lendo' },
  { label: 'Lido', valor: 'lido' },
  { label: 'Abandonado', valor: 'abandonado' },
];

const STATUS_LABEL: Record<string, string> = {
  nao_lido: 'Não Lido',
  quero_ler: 'Quero Ler',
  lendo: 'Lendo',
  lido: 'Lido',
  abandonado: 'Abandonado',
  relendo: 'Relendo',
};

const STATUS_TOM: Record<string, StatusTom> = {
  quero_ler: 'neutro',
  lendo: 'aviso',
  lido: 'sucesso',
  abandonado: 'perigo',
  relendo: 'aviso',
};

const TIPOS_OBRA: { label: string; valor: string }[] = [
  { label: 'Único', valor: 'unico' },
  { label: 'Trilogia', valor: 'trilogia' },
  { label: 'Série', valor: 'serie' },
  { label: 'Coleção', valor: 'colecao' },
];

// Gêneros mais comuns pra oferecer no seletor. O backend aceita qualquer
// nome de gênero (cria automaticamente se não existir), então isso aqui é
// só uma lista de sugestão, não uma trava.
const GENEROS_SUGERIDOS = [
  'Fantasia', 'Ficção Científica', 'Romance', 'História', 'Biografia',
  'Tecnologia', 'Autoajuda', 'Terror', 'Suspense', 'Poesia', 'Infantil',
];

// ---------- Pequeno seletor reutilizável (sem precisar instalar libs) ----------
function Seletor({
  label,
  valor,
  opcoes,
  onSelecionar,
  desabilitado,
}: {
  label: string;
  valor: string;
  opcoes: { label: string; valor: string }[];
  onSelecionar: (valor: string) => void;
  desabilitado?: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const opcaoAtual = opcoes.find((o) => o.valor === valor);

  return (
    <View>
      <Text style={styles.campoLabel}>{label}</Text>
      <TouchableOpacity
        style={[styles.selectBox, desabilitado && styles.inputDesabilitado]}
        onPress={() => !desabilitado && setAberto(true)}
        disabled={desabilitado}
      >
        <Text style={styles.selectTexto}>{opcaoAtual?.label ?? 'Selecionar'}</Text>
        <Ionicons name="chevron-down" size={16} color={Brand.textSecondary} />
      </TouchableOpacity>

      <Modal visible={aberto} transparent animationType="fade" onRequestClose={() => setAberto(false)}>
        <Pressable style={styles.selectOverlay} onPress={() => setAberto(false)}>
          <View style={styles.selectLista}>
            {opcoes.map((o) => (
              <TouchableOpacity
                key={o.valor}
                style={styles.selectItem}
                onPress={() => {
                  onSelecionar(o.valor);
                  setAberto(false);
                }}
              >
                <Text style={[styles.selectItemTexto, o.valor === valor && styles.selectItemTextoAtivo]}>
                  {o.label}
                </Text>
                {o.valor === valor && <Ionicons name="checkmark" size={16} color={Brand.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// ---------- Chip de filtro/status ----------
function Chip({ label, ativo, onPress }: { label: string; ativo: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.chip, ativo && styles.chipAtivo]}>
      <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ---------- Formulário de edição (dentro de um Modal em tela cheia) ----------
interface FormularioEdicao {
  titulo: string;
  subtitulo: string;
  autor: string;
  tipo_obra: string;
  ano_publicacao: string;
  num_paginas: string;
  genero: string;
  editora: string;
  status: string;
  avaliacao: number;
}

function TelaEditarLivro({
  livro,
  statusInicial,
  avaliacaoInicial,
  onCancelar,
  onSalvar,
}: {
  livro: LivroCompleto;
  statusInicial: string;
  avaliacaoInicial: number;
  onCancelar: () => void;
  onSalvar: (form: FormularioEdicao) => Promise<void>;
}) {
  const [form, setForm] = useState<FormularioEdicao>({
    titulo: livro.titulo ?? '',
    subtitulo: livro.subtitulo ?? '',
    autor: (livro.autores ?? []).join(', '),
    tipo_obra: livro.tipo_obra ?? 'unico',
    ano_publicacao: livro.ano_publicacao ? String(livro.ano_publicacao) : '',
    num_paginas: livro.num_paginas ? String(livro.num_paginas) : '',
    genero: livro.generos?.[0] ?? GENEROS_SUGERIDOS[0],
    editora: livro.editora ?? '',
    status: statusInicial,
    avaliacao: avaliacaoInicial,
  });
  const [salvando, setSalvando] = useState(false);

  function atualizarCampo<K extends keyof FormularioEdicao>(campo: K, valor: FormularioEdicao[K]) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function salvar() {
    if (!form.titulo.trim()) {
      Alert.alert('Campo obrigatório', 'O título não pode ficar vazio.');
      return;
    }
    if (!form.autor.trim()) {
      Alert.alert('Campo obrigatório', 'Preencha pelo menos um autor.');
      return;
    }
    setSalvando(true);
    try {
      await onSalvar(form);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal visible animationType="slide" onRequestClose={onCancelar}>
      <View style={styles.editContainer}>
        <View style={styles.editHeader}>
          <TouchableOpacity onPress={onCancelar} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={22} color={Brand.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.editHeaderTitulo}>Editar Livro</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView contentContainerStyle={styles.editScroll}>
          <View style={styles.editCapaWrapper}>
            {livro.capa ? (
              <Image source={{ uri: livro.capa }} style={styles.editCapa} />
            ) : (
              <View style={[styles.editCapa, styles.editCapaPlaceholder]}>
                <Ionicons name="book-outline" size={28} color={Brand.placeholderIcon} />
              </View>
            )}
          </View>
          <Text style={styles.editCapaAviso}>
            A troca de capa ainda não está disponível por aqui (o backend só aceita capa via upload de arquivo).
          </Text>

          <View style={styles.editCard}>
            <Text style={styles.campoLabel}>Título *</Text>
            <TextInput
              style={styles.input}
              value={form.titulo}
              onChangeText={(t) => atualizarCampo('titulo', t)}
            />

            <Text style={styles.campoLabel}>Subtítulo</Text>
            <TextInput
              style={styles.input}
              value={form.subtitulo}
              onChangeText={(t) => atualizarCampo('subtitulo', t)}
            />

            <Text style={styles.campoLabel}>Autor(es) *</Text>
            <TextInput
              style={styles.input}
              value={form.autor}
              onChangeText={(t) => atualizarCampo('autor', t)}
              placeholder="Separe vários autores por vírgula"
            />

            <Seletor
              label="Tipo de Obra"
              valor={form.tipo_obra}
              opcoes={TIPOS_OBRA}
              onSelecionar={(v) => atualizarCampo('tipo_obra', v)}
            />

            <View style={styles.linhaDupla}>
              <View style={{ flex: 1 }}>
                <Text style={styles.campoLabel}>Ano *</Text>
                <TextInput
                  style={styles.input}
                  value={form.ano_publicacao}
                  onChangeText={(t) => atualizarCampo('ano_publicacao', t.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.campoLabel}>Páginas *</Text>
                <TextInput
                  style={styles.input}
                  value={form.num_paginas}
                  onChangeText={(t) => atualizarCampo('num_paginas', t.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Seletor
              label="Gênero"
              valor={form.genero}
              opcoes={GENEROS_SUGERIDOS.map((g) => ({ label: g, valor: g }))}
              onSelecionar={(v) => atualizarCampo('genero', v)}
            />

            <Text style={styles.campoLabel}>Editora</Text>
            <TextInput
              style={styles.input}
              value={form.editora}
              onChangeText={(t) => atualizarCampo('editora', t)}
            />

            <Seletor
              label="Status"
              valor={form.status}
              opcoes={['quero_ler', 'lendo', 'lido', 'abandonado'].map((s) => ({ label: STATUS_LABEL[s], valor: s }))}
              onSelecionar={(v) => atualizarCampo('status', v)}
            />

            <Text style={styles.campoLabel}>Avaliação</Text>
            <View style={styles.estrelas}>
              {[1, 2, 3, 4, 5].map((n) => (
                <TouchableOpacity key={n} onPress={() => atualizarCampo('avaliacao', n)} disabled={form.status !== 'lido'}>
                  <Ionicons
                    name={n <= form.avaliacao ? 'star' : 'star-outline'}
                    size={26}
                    color={form.status === 'lido' ? '#fbbf24' : Brand.border}
                  />
                </TouchableOpacity>
              ))}
            </View>
            {form.status !== 'lido' && (
              <Text style={styles.avaliacaoBloqueada}>Só é possível avaliar quando o status for "Lido"</Text>
            )}
          </View>
        </ScrollView>

        <View style={styles.editRodape}>
          <TouchableOpacity style={styles.botaoCancelar} onPress={onCancelar} disabled={salvando}>
            <Text style={styles.botaoCancelarTexto}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.botaoSalvar} onPress={salvar} disabled={salvando}>
            {salvando ? <ActivityIndicator color="#fff" /> : <Text style={styles.botaoSalvarTexto}>Salvar Alterações</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ---------- Tela principal ----------
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

  useEffect(() => {
    carregar(filtro);
  }, [filtro, carregar]);

  // Filtro de busca por título/autor, aplicado em cima do que já foi carregado
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
      await leiturasService.atualizarStatus(selecionada.id_leitura, statusPendente);
      setLeituras((lista) =>
        lista.map((l) => (l.id_leitura === selecionada.id_leitura ? { ...l, status: statusPendente as LeituraItem['status'] } : l))
      );
      setSelecionada((sel) => (sel ? { ...sel, status: statusPendente as LeituraItem['status'] } : sel));
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
      await carregar(filtro); // recarrega a lista pra já mostrar os dados novos
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
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
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.titulo}>Biblioteca</Text>
          <Text style={styles.contagem}>{leituras.length} livro{leituras.length === 1 ? '' : 's'}</Text>
        </View>
        {/* Ainda não existe uma tela de cadastro manual no mobile — por enquanto
            leva pra Busca, que é onde dá pra encontrar livros pra adicionar. */}
        <TouchableOpacity style={styles.botaoAdicionar}>
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

      {carregando ? (
        <ActivityIndicator size="small" color={Brand.primary} style={{ marginTop: 24 }} />
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
        <ScrollView contentContainerStyle={styles.grid}>
          {listaFiltrada.map((item) => (
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
          ))}
        </ScrollView>
      )}

      {/* Bottom sheet de detalhes */}
      <Modal visible={!!selecionada} animationType="slide" transparent onRequestClose={() => setSelecionada(null)}>
        <Pressable style={styles.overlay} onPress={() => setSelecionada(null)} />
        {selecionada && (
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              {selecionada.livro?.capa ? (
                <Image source={{ uri: selecionada.livro.capa }} style={styles.sheetCapa} />
              ) : (
                <View style={[styles.sheetCapa, styles.editCapaPlaceholder]}>
                  <Ionicons name="book-outline" size={20} color={Brand.placeholderIcon} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitulo}>{selecionada.livro?.titulo}</Text>
                <Text style={styles.sheetAutor}>{selecionada.livro?.autor}</Text>
                {!!selecionada.livro?.num_paginas && (
                  <Text style={styles.sheetMeta}>{selecionada.livro.num_paginas} pág.</Text>
                )}
                <View style={[styles.statusPillGrande, { backgroundColor: STATUS_TOM[selecionada.status] === 'sucesso' ? '#dcfce7' : STATUS_TOM[selecionada.status] === 'aviso' ? '#fef3c7' : STATUS_TOM[selecionada.status] === 'perigo' ? '#fee2e2' : '#f1f5f9' }]}>
                  <Text style={styles.statusPillGrandeTexto}>{STATUS_LABEL[selecionada.status]}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.secaoLabel}>Sua avaliação</Text>
            {selecionada.status === 'lido' ? (
              <View style={styles.estrelas}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <TouchableOpacity key={n} onPress={() => avaliar(n)}>
                    <Ionicons name={n <= (selecionada.avaliacao ?? 0) ? 'star' : 'star-outline'} size={26} color="#fbbf24" />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.avaliacaoBloqueada}>Disponível quando o status for "Lido"</Text>
            )}

            <Text style={styles.secaoLabel}>Status da leitura</Text>
            <View style={styles.statusGrid}>
              {(['quero_ler', 'lendo', 'lido', 'abandonado'] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.statusOpcao, statusPendente === s && styles.statusOpcaoAtiva]}
                  onPress={() => setStatusPendente(s)}
                >
                  <Text style={[styles.statusOpcaoTexto, statusPendente === s && styles.statusOpcaoTextoAtivo]}>
                    {STATUS_LABEL[s]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.botaoAtualizar, statusPendente === selecionada.status && styles.botaoDesabilitado]}
              onPress={confirmarNovoStatus}
              disabled={statusPendente === selecionada.status || salvandoStatus}
            >
              {salvandoStatus ? <ActivityIndicator color="#fff" /> : <Text style={styles.botaoAtualizarTexto}>Atualizar</Text>}
            </TouchableOpacity>

            <View style={styles.acoesRow}>
              <TouchableOpacity style={styles.botaoEditar} onPress={abrirEdicao} disabled={carregandoEdicao}>
                {carregandoEdicao ? (
                  <ActivityIndicator color={Brand.textPrimary} />
                ) : (
                  <>
                    <Ionicons name="pencil" size={16} color={Brand.textPrimary} />
                    <Text style={styles.botaoEditarTexto}>Editar</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.botaoExcluir} onPress={confirmarExclusao}>
                <Ionicons name="trash" size={18} color="#dc2626" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>

      {livroEmEdicao && (
        <TelaEditarLivro
          livro={livroEmEdicao}
          statusInicial={selecionada?.status ?? 'quero_ler'}
          avaliacaoInicial={selecionada?.avaliacao ?? 0}
          onCancelar={() => setLivroEmEdicao(null)}
          onSalvar={salvarEdicao}
        />
      )}
    </View>
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
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.card,
    marginRight: 8,
  },
  chipAtivo: { backgroundColor: Brand.primary, borderColor: Brand.primary },
  chipTexto: { fontSize: 12, fontWeight: '600', color: Brand.textTertiary },
  chipTextoAtivo: { color: '#fff' },
  grid: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
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
    backgroundColor: Brand.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 4,
  },
  sheetHandle: { width: 40, height: 5, borderRadius: 3, backgroundColor: Brand.border, alignSelf: 'center', marginBottom: 14 },
  sheetHeader: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  sheetCapa: { width: 64, height: 88, borderRadius: 8, backgroundColor: Brand.placeholder },
  sheetTitulo: { fontSize: 16, fontWeight: '700', color: Brand.textPrimary },
  sheetAutor: { fontSize: 13, color: Brand.textSecondary, marginTop: 2 },
  sheetMeta: { fontSize: 11, color: Brand.placeholderIcon, marginTop: 2 },
  statusPillGrande: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, marginTop: 6 },
  statusPillGrandeTexto: { fontSize: 11, fontWeight: '700', color: Brand.textTertiary },
  secaoLabel: { fontSize: 13, fontWeight: '600', color: Brand.textTertiary, marginTop: 14, marginBottom: 8 },
  estrelas: { flexDirection: 'row', gap: 6 },
  avaliacaoBloqueada: { fontSize: 12, color: Brand.textSecondary, fontStyle: 'italic' },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusOpcao: {
    width: '47%',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  statusOpcaoAtiva: { backgroundColor: '#eff6ff', borderColor: Brand.primary },
  statusOpcaoTexto: { fontSize: 13, fontWeight: '600', color: Brand.textTertiary },
  statusOpcaoTextoAtivo: { color: Brand.primary },
  botaoAtualizar: { marginTop: 16, backgroundColor: Brand.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  botaoDesabilitado: { opacity: 0.5 },
  botaoAtualizarTexto: { color: '#fff', fontWeight: '700', fontSize: 14 },
  acoesRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  botaoEditar: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingVertical: 12,
  },
  botaoEditarTexto: { fontSize: 13, fontWeight: '600', color: Brand.textPrimary },
  botaoExcluir: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    borderRadius: 10,
  },

  // ---- Edição ----
  editContainer: { flex: 1, backgroundColor: Brand.background },
  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: Brand.card,
    borderBottomWidth: 1,
    borderBottomColor: Brand.border,
  },
  editHeaderTitulo: { fontSize: 16, fontWeight: '700', color: Brand.textPrimary },
  editScroll: { padding: 16, paddingBottom: 32, gap: 12 },
  editCapaWrapper: { alignItems: 'center', marginBottom: 4 },
  editCapa: { width: 100, height: 140, borderRadius: 12, backgroundColor: Brand.placeholder },
  editCapaPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  editCapaAviso: { fontSize: 11, color: Brand.textSecondary, textAlign: 'center', marginBottom: 8 },
  editCard: { backgroundColor: Brand.card, borderRadius: 16, padding: 16, gap: 4 },
  campoLabel: { fontSize: 12, fontWeight: '600', color: Brand.textTertiary, marginTop: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Brand.textPrimary,
  },
  inputDesabilitado: { backgroundColor: '#f1f5f9' },
  linhaDupla: { flexDirection: 'row', gap: 12 },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  selectTexto: { fontSize: 14, color: Brand.textPrimary },
  selectOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 32 },
  selectLista: { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 8, maxHeight: 340 },
  selectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  selectItemTexto: { fontSize: 14, color: Brand.textPrimary },
  selectItemTextoAtivo: { color: Brand.primary, fontWeight: '700' },
  editRodape: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    backgroundColor: Brand.card,
    borderTopWidth: 1,
    borderTopColor: Brand.border,
  },
  botaoCancelar: { flex: 1, borderRadius: 10, paddingVertical: 13, alignItems: 'center', backgroundColor: '#f1f5f9' },
  botaoCancelarTexto: { fontSize: 14, fontWeight: '700', color: Brand.textTertiary },
  botaoSalvar: { flex: 2, borderRadius: 10, paddingVertical: 13, alignItems: 'center', backgroundColor: Brand.primary },
  botaoSalvarTexto: { fontSize: 14, fontWeight: '700', color: '#fff' },
});