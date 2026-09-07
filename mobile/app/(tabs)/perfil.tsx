import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/Brand';
import { perfilService, PerfilUsuario } from '@/src/services/perfilService';
import { useAuth } from '@/src/context/AuthContext';

function formatarCpf(cpf: string) {
  const digitos = cpf.replace(/\D/g, '');
  if (digitos.length !== 11) return cpf;
  return digitos.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export default function PerfilScreen() {
  const { logout, atualizarUsuario } = useAuth();

  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [editando, setEditando] = useState(false);
  const [atualizando, setAtualizando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setErro(null);
      setCarregando(true);
      const dados = await perfilService.buscar();
      setPerfil(dados);
    } catch (e) {
      setErro('Não foi possível carregar seu perfil.');
      console.error(e);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const onRefresh = useCallback(async () => {
    setAtualizando(true);
    await carregar();
    setAtualizando(false);
  }, [carregar]);

  function aoSalvar(atualizado: PerfilUsuario) {
    setPerfil(atualizado);
    atualizarUsuario({ nome: atualizado.nome }); // reflete o novo nome na Home também
    setEditando(false);
  }

  function confirmarLogout() {
    Alert.alert('Sair', 'Tem certeza que quer sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: logout },
    ]);
  }

  if (carregando) {
    return (
      <SafeAreaView style={[styles.container, styles.centro]} edges={['top']}>
        <ActivityIndicator size="small" color={Brand.primary} />
      </SafeAreaView>
    );
  }

  if (erro || !perfil) {
    return (
      <SafeAreaView style={[styles.container, styles.centro]} edges={['top']}>
        <View style={styles.erroBox}>
          <Text style={styles.erroTexto}>{erro ?? 'Não foi possível carregar seu perfil.'}</Text>
          <TouchableOpacity onPress={carregar}>
            <Text style={styles.erroBotao}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={[styles.botaoSair, { marginTop: 16, marginHorizontal: 16 }]} onPress={confirmarLogout}>
          <Ionicons name="log-out-outline" size={18} color={Brand.danger} />
          <Text style={styles.botaoSairTexto}>Sair</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const iniciais = perfil.nome
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={atualizando} onRefresh={onRefresh} tintColor={Brand.primary} />}
    >
      <View style={styles.header}>
        <Text style={styles.titulo}>Meu Perfil</Text>
      </View>

      <View style={styles.avatarBox}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTexto}>{iniciais}</Text>
        </View>
      </View>

      {editando ? (
        <FormularioEdicao
          perfil={perfil}
          onCancelar={() => setEditando(false)}
          onSalvo={aoSalvar}
        />
      ) : (
        <View style={styles.card}>
          <View style={styles.linhaInfo}>
            <Text style={styles.linhaLabel}>Nome</Text>
            <Text style={styles.linhaValor}>{perfil.nome}</Text>
          </View>
          <View style={styles.linhaInfo}>
            <Text style={styles.linhaLabel}>Email</Text>
            <Text style={styles.linhaValor}>{perfil.email}</Text>
          </View>
          <View style={styles.linhaInfo}>
            <Text style={styles.linhaLabel}>CPF</Text>
            <Text style={styles.linhaValor}>{formatarCpf(perfil.cpf)}</Text>
          </View>

          <TouchableOpacity style={styles.botaoEditar} onPress={() => setEditando(true)}>
            <Ionicons name="pencil" size={16} color={Brand.primary} />
            <Text style={styles.botaoEditarTexto}>Editar Perfil</Text>
          </TouchableOpacity>
        </View>
      )}

      {!editando && (
        <TouchableOpacity style={styles.botaoSair} onPress={confirmarLogout}>
          <Ionicons name="log-out-outline" size={18} color={Brand.danger} />
          <Text style={styles.botaoSairTexto}>Sair</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
    </SafeAreaView>
  );
}

function FormularioEdicao({
  perfil,
  onCancelar,
  onSalvo,
}: {
  perfil: PerfilUsuario;
  onCancelar: () => void;
  onSalvo: (atualizado: PerfilUsuario) => void;
}) {
  const [nome, setNome] = useState(perfil.nome);
  const [cpf, setCpf] = useState(formatarCpf(perfil.cpf));
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    if (nome.trim().length < 3) {
      Alert.alert('Nome inválido', 'O nome deve ter pelo menos 3 caracteres.');
      return;
    }
    const cpfDigitos = cpf.replace(/\D/g, '');
    if (cpfDigitos.length !== 11) {
      Alert.alert('CPF inválido', 'O CPF deve ter 11 dígitos.');
      return;
    }
    if (novaSenha && novaSenha !== confirmarSenha) {
      Alert.alert('Senhas diferentes', 'A nova senha e a confirmação precisam ser iguais.');
      return;
    }
    if (novaSenha && novaSenha.length < 6) {
      Alert.alert('Senha muito curta', 'A senha precisa ter pelo menos 6 caracteres, com letras e números.');
      return;
    }

    setSalvando(true);
    try {
      const atualizado = await perfilService.atualizar({
        nome: nome.trim(),
        cpf: cpfDigitos,
        senha: novaSenha || undefined,
      });
      onSalvo(atualizado);
    } catch (e: any) {
      const mensagem = e?.response?.data?.erro ?? 'Não foi possível salvar as alterações.';
      Alert.alert('Erro', mensagem);
      console.error(e);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.campoLabel}>Nome completo</Text>
      <TextInput style={styles.input} value={nome} onChangeText={setNome} />

      <Text style={styles.campoLabel}>Email</Text>
      <TextInput style={[styles.input, styles.inputDesabilitado]} value={perfil.email} editable={false} />
      <Text style={styles.notaCampo}>O e-mail não pode ser alterado.</Text>

      <Text style={styles.campoLabel}>CPF</Text>
      <TextInput
        style={styles.input}
        value={cpf}
        onChangeText={(t) => setCpf(t.replace(/[^0-9.\-]/g, ''))}
        keyboardType="numeric"
        maxLength={14}
      />

      <View style={styles.divisor} />
      <Text style={styles.secaoLabel}>Alterar senha (opcional)</Text>

      <Text style={styles.campoLabel}>Nova senha</Text>
      <TextInput
        style={styles.input}
        value={novaSenha}
        onChangeText={setNovaSenha}
        secureTextEntry
        placeholder="Deixe em branco pra não alterar"
      />

      <Text style={styles.campoLabel}>Confirmar nova senha</Text>
      <TextInput style={styles.input} value={confirmarSenha} onChangeText={setConfirmarSenha} secureTextEntry />

      <View style={styles.botoesDuplos}>
        <TouchableOpacity style={styles.botaoCancelar} onPress={onCancelar} disabled={salvando}>
          <Text style={styles.botaoCancelarTexto}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.botaoSalvar} onPress={salvar} disabled={salvando}>
          {salvando ? <ActivityIndicator color="#fff" /> : <Text style={styles.botaoSalvarTexto}>Salvar alterações</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.background },
  centro: { alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 40, gap: 16 },
  header: { alignItems: 'center' },
  titulo: { fontSize: 20, fontWeight: '700', color: Brand.textPrimary },
  avatarBox: { alignItems: 'center' },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: { color: '#fff', fontSize: 24, fontWeight: '700' },
  card: {
    backgroundColor: Brand.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  linhaInfo: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Brand.borderLight },
  linhaLabel: { fontSize: 11, color: Brand.textSecondary, marginBottom: 2 },
  linhaValor: { fontSize: 14, fontWeight: '600', color: Brand.textPrimary },
  botaoEditar: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
  },
  botaoEditarTexto: { fontSize: 13, fontWeight: '700', color: Brand.primary },
  botaoSair: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Brand.dangerBg,
  },
  botaoSairTexto: { fontSize: 13, fontWeight: '700', color: Brand.danger },
  erroBox: { backgroundColor: Brand.dangerBg, borderRadius: 10, padding: 16, gap: 8, marginHorizontal: 16 },
  erroTexto: { fontSize: 13, color: Brand.danger, textAlign: 'center' },
  erroBotao: { fontSize: 13, fontWeight: '700', color: Brand.danger, textAlign: 'center' },
  campoLabel: { fontSize: 12, fontWeight: '600', color: Brand.textTertiary, marginTop: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Brand.textPrimary,
  },
  inputDesabilitado: { backgroundColor: '#f1f5f9', color: Brand.textSecondary },
  notaCampo: { fontSize: 11, color: Brand.textSecondary, marginTop: 4 },
  divisor: { height: 1, backgroundColor: Brand.borderLight, marginTop: 18 },
  secaoLabel: { fontSize: 13, fontWeight: '700', color: Brand.textPrimary, marginTop: 12 },
  botoesDuplos: { flexDirection: 'row', gap: 10, marginTop: 18 },
  botaoCancelar: { flex: 1, borderRadius: 10, paddingVertical: 13, alignItems: 'center', backgroundColor: '#f1f5f9' },
  botaoCancelarTexto: { fontSize: 14, fontWeight: '700', color: Brand.textTertiary },
  botaoSalvar: { flex: 2, borderRadius: 10, paddingVertical: 13, alignItems: 'center', backgroundColor: Brand.primary },
  botaoSalvarTexto: { fontSize: 14, fontWeight: '700', color: '#fff' },
});