import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import AdminModal from './AdminModal';
import { adminTheme as t } from '@/src/constants/adminTheme';

interface Props {
    visivel: boolean;
    nomeConquista?: string;
    idUsuario: string;
    aoMudarIdUsuario: (valor: string) => void;
    aoFechar: () => void;
    aoConfirmar: () => void;
}

export default function ConcederConquistaModal({
    visivel, nomeConquista, idUsuario, aoMudarIdUsuario, aoFechar, aoConfirmar,
}: Props) {
    return (
        <AdminModal
            visivel={visivel}
            aoFechar={aoFechar}
            titulo={`Conceder "${nomeConquista}"`}
            espacamento={t.espaco.lg}
            alturaMaxima="85%"
        >
            <TextInput
                style={styles.modalInput}
                placeholder="ID do usuário"
                placeholderTextColor={t.cor.textoTerciario}
                keyboardType="numeric"
                value={idUsuario}
                onChangeText={aoMudarIdUsuario}
            />
            <View style={styles.modalBotoes}>
                <TouchableOpacity onPress={aoFechar} style={styles.modalBotaoCancelar}>
                    <Text style={styles.modalBotaoCancelarTexto}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={aoConfirmar} style={[styles.modalBotaoCriar, { backgroundColor: t.cor.sucesso }]}>
                    <Text style={styles.modalBotaoCriarTexto}>Conceder</Text>
                </TouchableOpacity>
            </View>
        </AdminModal>
    );
}

const styles = StyleSheet.create({
    modalInput: {
        borderWidth: 1.5, borderColor: t.cor.borda, borderRadius: t.raio.sm,
        padding: 12, fontSize: 14.5, marginBottom: t.espaco.md, color: t.cor.texto,
    },
    modalBotoes: { flexDirection: 'row', gap: t.espaco.sm, marginTop: t.espaco.sm },
    modalBotaoCancelar: { flex: 1, paddingVertical: 12, borderRadius: t.raio.sm, borderWidth: 1.5, borderColor: t.cor.borda, alignItems: 'center' },
    modalBotaoCancelarTexto: { color: t.cor.textoSecundario, fontWeight: '600' },
    modalBotaoCriar: { flex: 1, paddingVertical: 12, borderRadius: t.raio.sm, alignItems: 'center' },
    modalBotaoCriarTexto: { color: t.cor.superficie, fontWeight: '700' },
});
