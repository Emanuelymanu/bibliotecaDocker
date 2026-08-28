import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import EmojiPicker, { pt as traducaoEmojiPt } from 'rn-emoji-keyboard';
import AdminModal from './AdminModal';
import { adminTheme as t } from '@/src/constants/adminTheme';

export type FormConquista = { nome: string; descricao: string; icone: string; criterio: string };

interface Props {
    visivel: boolean;
    editando: boolean;
    form: FormConquista;
    aoMudarForm: (form: FormConquista) => void;
    aoFechar: () => void;
    aoSalvar: () => void;
}

export default function ConquistaFormModal({ visivel, editando, form, aoMudarForm, aoFechar, aoSalvar }: Props) {
    const [seletorEmojiAberto, setSeletorEmojiAberto] = useState(false);

    return (
        <>
            <AdminModal
                visivel={visivel}
                aoFechar={aoFechar}
                titulo={editando ? 'Editar Conquista' : 'Nova Conquista'}
                scrollavel
                comBotaoFechar
                espacamento={t.espaco.lg}
                alturaMaxima="85%"
                rodape={
                    <View style={styles.modalBotoes}>
                        <TouchableOpacity onPress={aoFechar} style={styles.modalBotaoCancelar}>
                            <Text style={styles.modalBotaoCancelarTexto}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={aoSalvar} style={styles.modalBotaoCriar}>
                            <Text style={styles.modalBotaoCriarTexto}>{editando ? 'Salvar' : 'Criar'}</Text>
                        </TouchableOpacity>
                    </View>
                }
            >
                <Text style={styles.campoLabel}>ÍCONE</Text>
                <TouchableOpacity style={styles.seletorEmojiBotao} onPress={() => setSeletorEmojiAberto(true)} activeOpacity={0.7}>
                    <View style={styles.seletorEmojiIconeContainer}>
                        <Text style={styles.seletorEmojiTexto}>{form.icone}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.seletorEmojiTitulo}>Escolher Ícone</Text>
                        <Text style={styles.seletorEmojiSubtitulo}>Toque para abrir a galeria de emojis</Text>
                    </View>
                    <Ionicons name="happy-outline" size={20} color={t.cor.textoSecundario} />
                </TouchableOpacity>

                <Text style={styles.campoLabel}>NOME DA CONQUISTA *</Text>
                <TextInput
                    style={styles.modalInput}
                    placeholder="ex: Bibliófilo"
                    placeholderTextColor={t.cor.textoTerciario}
                    value={form.nome}
                    onChangeText={(v) => aoMudarForm({ ...form, nome: v })}
                />

                <Text style={styles.campoLabel}>DESCRIÇÃO *</Text>
                <TextInput
                    style={styles.modalInput}
                    placeholder="ex: Dez livros concluídos!"
                    placeholderTextColor={t.cor.textoTerciario}
                    value={form.descricao}
                    onChangeText={(v) => aoMudarForm({ ...form, descricao: v })}
                />

                <Text style={styles.campoLabel}>CRITÉRIO DE DESBLOQUEIO *</Text>
                <TextInput
                    style={styles.modalInput}
                    placeholder="ex: Conclua 10 livros"
                    placeholderTextColor={t.cor.textoTerciario}
                    value={form.criterio}
                    onChangeText={(v) => aoMudarForm({ ...form, criterio: v })}
                />
            </AdminModal>

            <EmojiPicker
                open={seletorEmojiAberto}
                onClose={() => setSeletorEmojiAberto(false)}
                onEmojiSelected={(emojiObject) => {
                    aoMudarForm({ ...form, icone: emojiObject.emoji });
                    setSeletorEmojiAberto(false);
                }}
                translation={traducaoEmojiPt}
                enableCategoryChangeAnimation
            />
        </>
    );
}

const styles = StyleSheet.create({
    campoLabel: { fontSize: 10.5, fontWeight: '700', color: t.cor.textoSecundario, letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
    seletorEmojiBotao: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: t.cor.fundo,
        borderWidth: 1.5,
        borderColor: t.cor.borda,
        borderRadius: t.raio.md,
        padding: 10,
        marginBottom: t.espaco.md,
        gap: 12,
    },
    seletorEmojiIconeContainer: {
        width: 40,
        height: 40,
        borderRadius: t.raio.sm,
        backgroundColor: t.categoria.conquistas.fundo,
        justifyContent: 'center',
        alignItems: 'center',
    },
    seletorEmojiTexto: { fontSize: 22 },
    seletorEmojiTitulo: { fontSize: 13.5, fontWeight: '600', color: t.cor.texto },
    seletorEmojiSubtitulo: { fontSize: 11, color: t.cor.textoTerciario },
    modalInput: {
        borderWidth: 1.5, borderColor: t.cor.borda, borderRadius: t.raio.sm,
        padding: 12, fontSize: 14.5, marginBottom: t.espaco.md, color: t.cor.texto,
    },
    modalBotoes: { flexDirection: 'row', gap: t.espaco.sm, marginTop: t.espaco.sm },
    modalBotaoCancelar: { flex: 1, paddingVertical: 12, borderRadius: t.raio.sm, borderWidth: 1.5, borderColor: t.cor.borda, alignItems: 'center' },
    modalBotaoCancelarTexto: { color: t.cor.textoSecundario, fontWeight: '600' },
    modalBotaoCriar: { flex: 1, backgroundColor: t.categoria.conquistas.icone, paddingVertical: 12, borderRadius: t.raio.sm, alignItems: 'center' },
    modalBotaoCriarTexto: { color: t.cor.superficie, fontWeight: '700' },
});
