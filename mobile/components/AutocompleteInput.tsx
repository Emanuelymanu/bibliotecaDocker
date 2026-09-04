import React, { useMemo } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface AutocompleteInputProps {
    valor: string;
    onChangeValor: (texto: string) => void;
    onSelecionarOpcao: (valor: string) => void;
    opcoes: string[];
    excluir?: string[];
    placeholder?: string;
    onSubmitEditing?: () => void;
}

/**
 * Input de texto com sugestões vindas do catálogo (autores/editoras/gêneros já
 * cadastrados). O usuário pode escolher uma sugestão ou simplesmente digitar
 * um valor novo — o backend cria o registro automaticamente (findOrCreate).
 */
export default function AutocompleteInput({
    valor,
    onChangeValor,
    onSelecionarOpcao,
    opcoes,
    excluir = [],
    placeholder,
    onSubmitEditing,
}: AutocompleteInputProps) {
    const sugestoes = useMemo(() => {
        const termo = valor.trim().toLowerCase();
        if (!termo) return [];
        return opcoes
            .filter((opcao) => opcao.toLowerCase().includes(termo) && !excluir.includes(opcao))
            .slice(0, 6);
    }, [valor, opcoes, excluir]);

    return (
        <View>
            <TextInput
                style={styles.input}
                value={valor}
                onChangeText={onChangeValor}
                placeholder={placeholder}
                placeholderTextColor="#999"
                onSubmitEditing={onSubmitEditing}
                returnKeyType="done"
            />
            {sugestoes.length > 0 && (
                <View style={styles.dropdown}>
                    {sugestoes.map((sugestao) => (
                        <TouchableOpacity
                            key={sugestao}
                            style={styles.item}
                            onPress={() => onSelecionarOpcao(sugestao)}
                        >
                            <Text style={styles.itemTexto}>{sugestao}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    input: {
        backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
        paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#333',
    },
    dropdown: {
        backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
        marginTop: 4, overflow: 'hidden',
    },
    item: {
        paddingHorizontal: 14, paddingVertical: 10,
        borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
    },
    itemTexto: { fontSize: 14, color: '#333' },
});
