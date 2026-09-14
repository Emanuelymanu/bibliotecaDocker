import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Brand } from '@/constants/Brand';

export function Chip({ label, ativo, onPress }: { label: string; ativo: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.chip, ativo && styles.chipAtivo]}>
      <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
});
