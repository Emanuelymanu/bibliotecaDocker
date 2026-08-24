import React from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, StyleSheet, DimensionValue } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminTheme as t } from '@/src/constants/adminTheme';

interface Props {
    visivel: boolean;
    aoFechar: () => void;
    titulo: string;
    children: React.ReactNode;
    /** Envolve o conteúdo num ScrollView. Use quando o modal tiver muitos campos (ex: formulários). */
    scrollavel?: boolean;
    /** Renderizado fora do ScrollView, fixo no rodapé (ex: linha de botões Cancelar/Salvar). */
    rodape?: React.ReactNode;
    /** Mostra um "X" ao lado do título, além do fechamento por fora/cancelar. */
    comBotaoFechar?: boolean;
    espacamento?: number;
    alturaMaxima?: DimensionValue;
}

export default function AdminModal({
    visivel, aoFechar, titulo, children, scrollavel, rodape, comBotaoFechar,
    espacamento = t.espaco.xl, alturaMaxima,
}: Props) {
    const conteudo = scrollavel
        ? <ScrollView showsVerticalScrollIndicator={false}>{children}</ScrollView>
        : children;

    return (
        <Modal visible={visivel} transparent animationType="fade" onRequestClose={aoFechar}>
            <View style={[styles.fundo, { padding: espacamento }]}>
                <View style={[styles.caixa, { padding: espacamento }, alturaMaxima ? { maxHeight: alturaMaxima } : null]}>
                    {comBotaoFechar ? (
                        <View style={styles.topo}>
                            <Text style={styles.titulo}>{titulo}</Text>
                            <TouchableOpacity onPress={aoFechar}>
                                <Ionicons name="close" size={22} color={t.cor.textoTerciario} />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <Text style={[styles.titulo, styles.tituloComEspaco]}>{titulo}</Text>
                    )}
                    {conteudo}
                    {rodape}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    fundo: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'center' },
    caixa: { backgroundColor: t.cor.superficie, borderRadius: t.raio.xl },
    topo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: t.espaco.md },
    titulo: { fontSize: 16, fontWeight: '700', color: t.cor.texto, textTransform: 'capitalize' },
    tituloComEspaco: { marginBottom: t.espaco.md },
});
