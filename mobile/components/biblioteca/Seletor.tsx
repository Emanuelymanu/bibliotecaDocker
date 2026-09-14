import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Brand } from '@/constants/Brand';
import { estiloFormulario as styles } from './estiloFormulario';

export function Seletor({
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
            <ScrollView showsVerticalScrollIndicator={false}>
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
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
