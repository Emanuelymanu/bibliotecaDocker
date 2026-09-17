import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Brand } from '@/constants/Brand';
import { STATUS_LABEL, STATUS_TOM } from '@/src/constants/livroForm';
import { LeituraItem } from '@/src/services/leiturasService';

const CORES_STATUS_PILL: Record<string, string> = {
  sucesso: '#dcfce7',
  aviso: '#fef3c7',
  perigo: '#fee2e2',
  neutro: '#f1f5f9',
};

export function LivroDetalhesSheet({
  item,
  statusPendente,
  salvandoStatus,
  carregandoEdicao,
  onFechar,
  onSelecionarStatus,
  onConfirmarNovoStatus,
  onAvaliar,
  onAbrirEdicao,
  onConfirmarExclusao,
}: {
  item: LeituraItem;
  statusPendente: string | null;
  salvandoStatus: boolean;
  carregandoEdicao: boolean;
  onFechar: () => void;
  onSelecionarStatus: (status: string) => void;
  onConfirmarNovoStatus: () => void;
  onAvaliar: (nota: number) => void;
  onAbrirEdicao: () => void;
  onConfirmarExclusao: () => void;
}) {
  const router = useRouter();

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onFechar}>
      <Pressable style={styles.overlay} onPress={onFechar} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />

        <View style={styles.sheetHeader}>
          {item.livro?.capa ? (
            <Image source={{ uri: item.livro.capa }} style={styles.sheetCapa} />
          ) : (
            <View style={[styles.sheetCapa, styles.sheetCapaPlaceholder]}>
              <Ionicons name="book-outline" size={20} color={Brand.placeholderIcon} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.sheetTitulo}>{item.livro?.titulo}</Text>
            <TouchableOpacity
              onPress={() => {
                const primeiroAutor = item.livro?.autor?.split(',')[0]?.trim();
                if (primeiroAutor) router.push(`/autor/${encodeURIComponent(primeiroAutor)}`);
              }}
            >
              <Text style={[styles.sheetAutor, { textDecorationLine: 'underline' }]}>{item.livro?.autor}</Text>
            </TouchableOpacity>
            {!!item.livro?.num_paginas && <Text style={styles.sheetMeta}>{item.livro.num_paginas} pág.</Text>}
            <View
              style={[
                styles.statusPillGrande,
                { backgroundColor: CORES_STATUS_PILL[STATUS_TOM[item.status]] ?? CORES_STATUS_PILL.neutro },
              ]}
            >
              <Text style={styles.statusPillGrandeTexto}>{STATUS_LABEL[item.status]}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.secaoLabel}>Sua avaliação</Text>
        {item.status === 'lido' ? (
          <View style={styles.estrelas}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity key={n} onPress={() => onAvaliar(n)}>
                <Ionicons name={n <= (item.avaliacao ?? 0) ? 'star' : 'star-outline'} size={26} color="#fbbf24" />
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
              onPress={() => onSelecionarStatus(s)}
            >
              <Text style={[styles.statusOpcaoTexto, statusPendente === s && styles.statusOpcaoTextoAtivo]}>
                {STATUS_LABEL[s]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.botaoAtualizar, statusPendente === item.status && styles.botaoDesabilitado]}
          onPress={onConfirmarNovoStatus}
          disabled={statusPendente === item.status || salvandoStatus}
        >
          {salvandoStatus ? <ActivityIndicator color="#fff" /> : <Text style={styles.botaoAtualizarTexto}>Atualizar</Text>}
        </TouchableOpacity>

        <View style={styles.acoesRow}>
          <TouchableOpacity style={styles.botaoEditar} onPress={onAbrirEdicao} disabled={carregandoEdicao}>
            {carregandoEdicao ? (
              <ActivityIndicator color={Brand.textPrimary} />
            ) : (
              <>
                <Ionicons name="pencil" size={16} color={Brand.textPrimary} />
                <Text style={styles.botaoEditarTexto}>Editar</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.botaoExcluir} onPress={onConfirmarExclusao}>
            <Ionicons name="trash" size={18} color="#dc2626" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  sheetCapaPlaceholder: { alignItems: 'center', justifyContent: 'center' },
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
});
