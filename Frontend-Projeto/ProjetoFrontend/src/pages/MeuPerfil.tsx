import { useState, useEffect } from "react";
import { Sidebar } from "../components/sidebar";
import { perfilService } from "../services/perfilServece";
import { authService } from "../services/authService";
import type { UsuarioPerfil } from "../types/perfil";
import { showErrorToast, showSuccessToast, showWarningToast } from "../utils/alertUtils";
import "../css/MeuPerfil.css";

function validarCPF(cpf: string) {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let soma = 0;
  let resto;
  for (let i = 1; i <= 9; i++) {
    soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10))) return false;
  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  return resto === parseInt(cpf.substring(10, 11));
}

export function MeuPerfil() {
  const [editando, setEditando] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [perfil, setPerfil] = useState<UsuarioPerfil | null>(null);

  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  useEffect(() => {
    carregarPerfil();
  }, []);

  const carregarPerfil = async () => {
    setLoading(true);
    try {
      const data = await perfilService.buscarPerfil();
      setPerfil(data);
      setNome(data.nome);
      setCpf(formatarCPF(data.cpf));
    } catch (err: any) {
      showErrorToast("Erro ao carregar perfil:");
    } finally {
      setLoading(false);
    }
  };

  const formatarCPF = (valor: string) => {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length <= 11) {
      let formatado = numeros;
      if (numeros.length > 3) formatado = numeros.replace(/(\d{3})(\d)/, '$1.$2');
      if (numeros.length > 6) formatado = formatado.replace(/(\d{3})(\d)/, '$1.$2');
      if (numeros.length > 9) formatado = formatado.replace(/(\d{3})(\d{1,2})/, '$1-$2');
      return formatado.slice(0, 14);
    }
    return valor;
  };

  const desformatarCPF = (valor: string) => {
    return valor.replace(/\D/g, '');
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorFormatado = formatarCPF(e.target.value);
    setCpf(valorFormatado);
  };

  const handleSalvar = async () => {
    if (!nome.trim()) {
      showWarningToast("O nome é obrigatório");
      return;
    }

    if (nome.trim().length < 3) {
      showWarningToast("O nome deve ter pelo menos 3 caracteres");
      return;
    }

    if (nome.trim().length > 100) {
      showWarningToast("O nome deve ter no máximo 100 caracteres");
      return;
    }

    let cpfEnviar: string | undefined;
    if (cpf !== formatarCPF(perfil?.cpf || "")) {
      const cpfLimpo = desformatarCPF(cpf);
      if (!validarCPF(cpfLimpo)) {
        showWarningToast("CPF inválido");
        return;
      }
      cpfEnviar = cpfLimpo;
    }

    let senhaEnviar: string | undefined;
    if (novaSenha) {
      if (novaSenha !== confirmarSenha) {
        showWarningToast("As senhas não conferem");
        return;
      }

      if (novaSenha.length < 6) {
        showWarningToast("A nova senha deve ter no mínimo 6 caracteres");
        return;
      }

      const senhaForte = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
      if (!senhaForte.test(novaSenha)) {
        showWarningToast("A senha deve conter letras e números");
        return;
      }

      senhaEnviar = novaSenha;
    }

    if (nome === perfil?.nome && !cpfEnviar && !senhaEnviar) {
      setEditando(false);
      return;
    }

    setSaving(true);

    try {
      const dadosAtualizar: any = {};
      if (nome !== perfil?.nome) dadosAtualizar.nome = nome;
      if (cpfEnviar) dadosAtualizar.cpf = cpfEnviar;
      if (senhaEnviar) dadosAtualizar.senha = senhaEnviar;

      const response = await perfilService.atualizarPerfil(dadosAtualizar);

      setPerfil(response.usuario);
      showSuccessToast("Perfil atualizado com sucesso!");

      const user = authService.getUser();
      if (user && response.usuario) {
        user.nome = response.usuario.nome;
        localStorage.setItem('usuario', JSON.stringify(user));
      }

      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");

      setTimeout(() => {
        setEditando(false);
      }, 2000);

    } catch (err: any) {
      showErrorToast("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelar = () => {
    if (perfil) {
      setNome(perfil.nome);
      setCpf(formatarCPF(perfil.cpf));
    }
    setSenhaAtual("");
    setNovaSenha("");
    setConfirmarSenha("");
    setEditando(false);
  };

  if (loading) {
    return (
      <div className="biblioteca-container">
        <Sidebar onLogout={handleLogout} active="MeuPerfil" />
        <main className="main-content">
          <div className="loading-container">
            <p>Carregando perfil...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="biblioteca-container">
      <Sidebar onLogout={handleLogout} active="MeuPerfil" />

      <main className="main-content">
        <header className="page-header">
          <h1>Meu Perfil</h1>
          <p>Gerencie suas informações pessoais</p>
        </header>

        <div className="perfil-card">
          {!editando ? (
            <div className="perfil-visualizacao">
              <div className="avatar-placeholder">
                <span>{perfil?.nome.charAt(0).toUpperCase()}</span>
              </div>

              <h2>{perfil?.nome}</h2>

              <div className="info-group">
                <label> Email</label>
                <p>{perfil?.email}</p>
              </div>

              <div className="info-group">
                <label> CPF</label>
                <p>{formatarCPF(perfil?.cpf || "")}</p>
              </div>

              <button className="btn-editar" onClick={() => setEditando(true)}>
                Editar Perfil
              </button>
            </div>
          ) : (
            <div className="perfil-edicao">
              <h2>Editar Perfil</h2>

              <div className="form-group">
                <label>Nome completo *</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome completo"
                  disabled={saving}
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={perfil?.email || ""}
                  disabled
                  className="field-disabled"
                />
                <small>O email não pode ser alterado</small>
              </div>

              <div className="form-group">
                <label>CPF</label>
                <input
                  type="text"
                  value={cpf}
                  onChange={handleCpfChange}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  disabled={saving}
                />
              </div>

              <div className="form-divider">
                <hr />
                <span>Alterar senha (opcional)</span>
                <hr />
              </div>

              <div className="form-group">
                <label>Nova senha</label>
                <input
                  type="password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="••••••••"
                  disabled={saving}
                />
                <small>Mínimo 6 caracteres, com letras e números</small>
              </div>

              <div className="form-group">
                <label>Confirmar nova senha</label>
                <input
                  type="password"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="••••••••"
                  disabled={saving}
                />
              </div>

              <div className="form-buttons">
                <button
                  className="btn-salvar"
                  onClick={handleSalvar}
                  disabled={saving}
                >
                  {saving ? "Salvando..." : " Salvar alterações"}
                </button>
                <button
                  className="btn-cancelar"
                  onClick={handleCancelar}
                  disabled={saving}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}