import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/Brand';
import { GENEROS_SUGERIDOS, STATUS_LABEL, TIPOS_OBRA } from '@/src/constants/livroForm';
import { LivroCompleto } from '@/src/services/livrosService';
import { Seletor } from './Seletor';
import { estiloFormulario as styles } from './estiloFormulario';

export interface FormularioEdicao {
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

export function EditarLivroModal({
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
      <SafeAreaView style={styles.editContainer} edges={['top']}>
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
                <Text style={styles.campoLabel}>Ano</Text>
                <TextInput
                  style={styles.input}
                  value={form.ano_publicacao}
                  onChangeText={(t) => atualizarCampo('ano_publicacao', t.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.campoLabel}>Páginas</Text>
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
      </SafeAreaView>
    </Modal>
  );
}
