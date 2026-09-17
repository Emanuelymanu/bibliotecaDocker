import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

import { Brand } from '@/constants/Brand';
import { GENEROS_SUGERIDOS, STATUS_LABEL, TIPOS_OBRA } from '@/src/constants/livroForm';
import { validarImagemCapa } from '@/src/utils/validarImagem';
import { solicitarPermissaoGaleria } from '@/src/utils/permissoes';
import { CapaSelecionada } from '@/src/types/livro';
import { Seletor } from './Seletor';
import { estiloFormulario as styles } from './estiloFormulario';

export interface FormularioCadastro {
  titulo: string;
  subtitulo: string;
  autor: string;
  tipo_obra: string;
  ano_publicacao: string;
  num_paginas: string;
  genero: string;
  editora: string;
  statusInicial: string;
}

export function CadastrarLivroModal({
  onCancelar,
  onSalvar,
}: {
  onCancelar: () => void;
  onSalvar: (form: FormularioCadastro, capa: CapaSelecionada | null) => Promise<void>;
}) {
  const [form, setForm] = useState<FormularioCadastro>({
    titulo: '',
    subtitulo: '',
    autor: '',
    tipo_obra: 'unico',
    ano_publicacao: '',
    num_paginas: '',
    genero: GENEROS_SUGERIDOS[0],
    editora: '',
    statusInicial: 'quero_ler',
  });
  const [capa, setCapa] = useState<CapaSelecionada | null>(null);
  const [salvando, setSalvando] = useState(false);

  function atualizarCampo<K extends keyof FormularioCadastro>(campo: K, valor: FormularioCadastro[K]) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function escolherCapa() {
    const permitido = await solicitarPermissaoGaleria();
    if (!permitido) return;

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 0.8,
    });

    if (resultado.canceled || !resultado.assets?.[0]) {
      return;
    }

    const asset = resultado.assets[0];
    const erroValidacao = validarImagemCapa(asset);
    if (erroValidacao) {
      Alert.alert('Imagem inválida', erroValidacao);
      return;
    }

    setCapa({
      uri: asset.uri,
      nome: asset.fileName ?? `capa-${Date.now()}.jpg`,
      tipoMime: asset.mimeType ?? 'image/jpeg',
      tamanhoBytes: asset.fileSize,
    });
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
    if (!form.ano_publicacao || !form.num_paginas) {
      Alert.alert('Campo obrigatório', 'Preencha o ano e o número de páginas.');
      return;
    }
    setSalvando(true);
    try {
      await onSalvar(form, capa);
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
          <Text style={styles.editHeaderTitulo}>Cadastrar Livro</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView contentContainerStyle={styles.editScroll}>
          <TouchableOpacity style={styles.editCapaWrapper} onPress={escolherCapa} activeOpacity={0.8}>
            {capa ? (
              <Image source={{ uri: capa.uri }} style={styles.editCapa} />
            ) : (
              <View style={[styles.editCapa, styles.editCapaPlaceholder]}>
                <Ionicons name="image-outline" size={28} color={Brand.placeholderIcon} />
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.editCapaAviso}>
            {capa ? 'Toque na imagem pra trocar a capa.' : 'Toque pra escolher uma capa da sua galeria (opcional).'}
          </Text>

          <View style={styles.editCard}>
            <Text style={styles.campoLabel}>Título *</Text>
            <TextInput
              style={styles.input}
              value={form.titulo}
              onChangeText={(t) => atualizarCampo('titulo', t)}
              placeholder="Ex: Duna"
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
                <Text style={styles.campoLabel}>Ano *</Text>
                <TextInput
                  style={styles.input}
                  value={form.ano_publicacao}
                  onChangeText={(t) => atualizarCampo('ano_publicacao', t.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  maxLength={4}
                  placeholder="2024"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.campoLabel}>Páginas *</Text>
                <TextInput
                  style={styles.input}
                  value={form.num_paginas}
                  onChangeText={(t) => atualizarCampo('num_paginas', t.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  placeholder="320"
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
              label="Status inicial"
              valor={form.statusInicial}
              opcoes={['quero_ler', 'lendo', 'lido'].map((s) => ({ label: STATUS_LABEL[s], valor: s }))}
              onSelecionar={(v) => atualizarCampo('statusInicial', v)}
            />
          </View>
        </ScrollView>

        <View style={styles.editRodape}>
          <TouchableOpacity style={styles.botaoCancelar} onPress={onCancelar} disabled={salvando}>
            <Text style={styles.botaoCancelarTexto}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.botaoSalvar} onPress={salvar} disabled={salvando}>
            {salvando ? <ActivityIndicator color="#fff" /> : <Text style={styles.botaoSalvarTexto}>Cadastrar Livro</Text>}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
