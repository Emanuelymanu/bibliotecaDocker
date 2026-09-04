// components/BookCard.tsx
//
// Card de livro reutilizável (capa + título + autor), no mesmo estilo visual
// do site (cantos arredondados, sombra leve). Usado na Home e na Biblioteca.
// Se a capa não existir ou falhar ao carregar, mostra um placeholder com
// ícone de livro. O "statusLabel" é opcional: quando informado, mostra um
// selo colorido embaixo do autor (ex: "Lido" em verde, "Lendo" em laranja).

import { useState } from 'react';
import { DimensionValue, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Brand } from '@/constants/Brand';

export type StatusTom = 'sucesso' | 'aviso' | 'neutro' | 'perigo';

const TOM_CORES: Record<StatusTom, { fundo: string; texto: string }> = {
  sucesso: { fundo: '#dcfce7', texto: '#16a34a' },
  aviso: { fundo: '#fef3c7', texto: '#d97706' },
  neutro: { fundo: '#f1f5f9', texto: '#475569' },
  perigo: { fundo: '#fee2e2', texto: '#dc2626' },
};

interface BookCardProps {
  titulo: string;
  autor?: string;
  capa?: string | null;
  badgeNota?: number | string | null;
  statusLabel?: string | null;
  statusTom?: StatusTom;
  width?: DimensionValue; // aceita número (130) ou texto ('47%')
  onPress?: () => void;
}

export function BookCard({
  titulo,
  autor,
  capa,
  badgeNota,
  statusLabel,
  statusTom = 'neutro',
  width = 130,
  onPress,
}: BookCardProps) {
  const [erroImagem, setErroImagem] = useState(false);
  const mostrarPlaceholder = !capa || erroImagem;
  const cores = TOM_CORES[statusTom];

  return (
    <TouchableOpacity
      style={[styles.card, { width }]}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={!onPress}
    >
      <View style={styles.capaWrapper}>
        {mostrarPlaceholder ? (
          <View style={styles.capaPlaceholder}>
            <Ionicons name="book-outline" size={28} color={Brand.placeholderIcon} />
          </View>
        ) : (
          <Image
            source={{ uri: capa as string }}
            style={styles.capa}
            resizeMode="cover"
            onError={() => setErroImagem(true)}
          />
        )}

        {badgeNota != null && (
          <View style={styles.badge}>
            <Ionicons name="star" size={10} color="#fbbf24" />
            <Text style={styles.badgeTexto}>{badgeNota}</Text>
          </View>
        )}
      </View>

      <Text style={styles.titulo} numberOfLines={2}>
        {titulo}
      </Text>
      {!!autor && (
        <Text style={styles.autor} numberOfLines={1}>
          {autor}
        </Text>
      )}

      {!!statusLabel && (
        <View style={[styles.statusPill, { backgroundColor: cores.fundo }]}>
          <Text style={[styles.statusPillTexto, { color: cores.texto }]}>{statusLabel}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Brand.card,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  capaWrapper: {
    position: 'relative',
  },
  capa: {
    width: '100%',
    aspectRatio: 2 / 3,
    backgroundColor: Brand.placeholder,
  },
  capaPlaceholder: {
    width: '100%',
    aspectRatio: 2 / 3,
    backgroundColor: Brand.placeholder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeTexto: {
    fontSize: 10,
    fontWeight: '700',
    color: '#b45309',
  },
  titulo: {
    fontSize: 13,
    fontWeight: '600',
    color: Brand.textPrimary,
    paddingHorizontal: 8,
    paddingTop: 6,
  },
  autor: {
    fontSize: 11,
    color: Brand.textSecondary,
    paddingHorizontal: 8,
    paddingTop: 2,
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginHorizontal: 8,
    marginTop: 6,
    marginBottom: 8,
  },
  statusPillTexto: {
    fontSize: 10,
    fontWeight: '700',
  },
});