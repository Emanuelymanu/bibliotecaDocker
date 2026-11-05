import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import EmojiPicker, { pt as traducaoEmojiPt } from 'rn-emoji-keyboard';
import AdminModal from './AdminModal';
import { adminTheme as t } from '@/src/constants/adminTheme';
import { Genero } from '@/src/types/adminTypes';
import { OPCOES_TIPO, TipoConquista, semQuantidade, textoDoCriterio } from '@/src/utils/criterioConquista';

export type FormConquista = {
    nome: string;
    descricao: string;
    icone: string;
    tipo: TipoConquista;
    quantidade: string; 
    id_genero: number | null;
    criterioManual: string; 
};

interface Props {
    visivel: boolean;
    editando: boolean;
    form: FormConquista;
    generos: Genero[];
    aoMudarForm: (form: FormConquista) => void;
    aoFechar: () => void;
    aoSalvar: () => void;
}


export function previaDoCriterio(form: FormConquista, generos: Genero[]): string {
    if (form.tipo === 'MANUAL') {
        return form.criterioManual.trim() || textoDoCriterio('MANUAL', 1);
    }
    const n = semQuantidade(form.tipo) ? 1 : Number(form.quantidade) || 0;
    const nomeGenero = generos.find((g) => g.id_genero === form.id_genero)?.nome ?? null;
    return textoDoCriterio(form.tipo, n, nomeGenero);
}

export default function ConquistaFormModal({ visivel, editando, form, generos, aoMudarForm, aoFechar, aoSalvar }: Props) {
    const [seletorEmojiAberto, setSeletorEmojiAberto] = useState(false);

    function escolherTipo(tipo: TipoConquista) {
        aoMudarForm({
            ...form,
            tipo,
            id_genero: tipo === 'LIVROS_GENERO' ? form.id_genero : null,
        });
    }

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

                <Text style={styles.campoLabel}>COMO DESBLOQUEIA *</Text>
                <View style={styles.chips}>
                    {OPCOES_TIPO.map((opcao) => {
                        const ativo = form.tipo === opcao.tipo;
                        return (
                            <TouchableOpacity
                                key={opcao.tipo}
                                onPress={() => escolherTipo(opcao.tipo)}
                                style={[styles.chip, ativo && styles.chipAtivo]}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>{opcao.rotulo}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {!semQuantidade(form.tipo) && (
                    <>
                        <Text style={styles.campoLabel}>QUANTIDADE *</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="ex: 10"
                            placeholderTextColor={t.cor.textoTerciario}
                            keyboardType="number-pad"
                            value={form.quantidade}
                            onChangeText={(v) => aoMudarForm({ ...form, quantidade: v.replace(/\D/g, '') })}
                        />
                    </>
                )}

                {form.tipo === 'LIVROS_GENERO' && (
                    <>
                        <Text style={styles.campoLabel}>GÊNERO *</Text>
                        {generos.length === 0 ? (
                            <Text style={styles.aviso}>Nenhum gênero cadastrado no catálogo.</Text>
                        ) : (
                            <View style={styles.chips}>
                                {generos.map((g) => {
                                    const ativo = form.id_genero === g.id_genero;
                                    return (
                                        <TouchableOpacity
                                            key={g.id_genero}
                                            onPress={() => aoMudarForm({ ...form, id_genero: g.id_genero })}
                                            style={[styles.chip, ativo && styles.chipGeneroAtivo]}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>{g.nome}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}
                    </>
                )}

                {form.tipo === 'MANUAL' && (
                    <>
                        <Text style={styles.campoLabel}>COMO O LEITOR GANHA (OPCIONAL)</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="ex: Participou do clube do livro"
                            placeholderTextColor={t.cor.textoTerciario}
                            value={form.criterioManual}
                            onChangeText={(v) => aoMudarForm({ ...form, criterioManual: v })}
                        />
                    </>
                )}

                <View style={styles.previa}>
                    <Text style={styles.previaLabel}>O LEITOR VAI VER</Text>
                    <Text style={styles.previaTexto}>{previaDoCriterio(form, generos)}</Text>
                    <Text style={styles.previaDica}>
                        {form.tipo === 'MANUAL'
                            ? 'Nunca desbloqueia sozinha: use o botão de presente para conceder.'
                            : 'Desbloqueia sozinha quando o leitor atingir a quantidade.'}
                    </Text>
                </View>
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
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: t.espaco.md },
    chip: {
        paddingVertical: 7, paddingHorizontal: 11, borderRadius: t.raio.pill,
        borderWidth: 1.5, borderColor: t.cor.borda, backgroundColor: t.cor.superficie,
    },
    chipAtivo: { backgroundColor: t.categoria.conquistas.icone, borderColor: t.categoria.conquistas.icone },
    chipGeneroAtivo: { backgroundColor: t.categoria.generos.icone, borderColor: t.categoria.generos.icone },
    chipTexto: { fontSize: 12.5, fontWeight: '600', color: t.cor.textoSecundario },
    chipTextoAtivo: { color: t.cor.superficie },
    aviso: { fontSize: 12, color: t.cor.textoTerciario, marginBottom: t.espaco.md },
    previa: {
        backgroundColor: t.categoria.conquistas.fundo, borderRadius: t.raio.sm,
        padding: 12, marginBottom: t.espaco.md, gap: 4,
    },
    previaLabel: { fontSize: 10, fontWeight: '700', color: t.cor.destaque, letterSpacing: 0.5 },
    previaTexto: { fontSize: 14, fontWeight: '700', color: t.cor.texto },
    previaDica: { fontSize: 11.5, color: t.cor.textoSecundario },
    modalBotoes: { flexDirection: 'row', gap: t.espaco.sm, marginTop: t.espaco.sm },
    modalBotaoCancelar: { flex: 1, paddingVertical: 12, borderRadius: t.raio.sm, borderWidth: 1.5, borderColor: t.cor.borda, alignItems: 'center' },
    modalBotaoCancelarTexto: { color: t.cor.textoSecundario, fontWeight: '600' },
    modalBotaoCriar: { flex: 1, backgroundColor: t.cor.acaoPrimaria, paddingVertical: 12, borderRadius: t.raio.sm, alignItems: 'center' },
    modalBotaoCriarTexto: { color: t.cor.superficie, fontWeight: '700' },
});