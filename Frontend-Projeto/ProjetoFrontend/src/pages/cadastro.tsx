import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import '../css/login.css';
import { showErrorToast, showSuccessToast, } from '../utils/alertUtils';

function validarEmail(email: string) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function validarSenha(senha: string) {
  return senha.length >= 6;
}

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

export function Cadastro() {

  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCadastro = async (evento: React.FormEvent) => {
    evento.preventDefault();


    if (!nome || !email || !cpf || !senha || !confirmarSenha) {
      showErrorToast('Preencha todos os campos!');
      return;
    }

    if (!validarEmail(email)) {
      showErrorToast('Email inválido!');
      return;
    }

    const cpfNumerico = cpf.replace(/\D/g, '');

    if (!validarCPF(cpfNumerico)) {
      showErrorToast('CPF inválido!');
      return;
    }

    if (!validarSenha(senha)) {
      showErrorToast('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (senha !== confirmarSenha) {
      showErrorToast('As senhas não conferem!');
      return;
    }

    setLoading(true);

    try {
      await authService.cadastro({
        nome,
        email,
        cpf: cpfNumerico,
        senha
      });

      showSuccessToast("Cadastro realizado com sucesso, faça login para continuar");
      navigate('/login');

    } catch (error: any) {

      let errorMensagem = "Erro ao cadastrar";

      if (error?.mensagem) {
        errorMensagem = error.mensagem;
      } else if (error?.response?.data?.mensagem) {
        errorMensagem = error.response.data.mensagem;
      } else if (error?.message) {
        errorMensagem = error.message;
      }

      showErrorToast(errorMensagem);
    } finally {
      setLoading(false);
    }
  };

  const formatarCPF = (valor: string) => {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length <= 11) {
      return numeros
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .slice(0, 14);
    }
    return valor;
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorFormatado = formatarCPF(e.target.value);
    setCpf(valorFormatado);
  };

  return (
    <div className="login-container">

      <div className="login-card">

        <div className="icon-container">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          </svg>
        </div>

        <h1 className="login-title">Criar Conta</h1>
        <p className="login-subtitle">Cadastre-se para começar</p>

        <form onSubmit={handleCadastro} className="login-form">

          <div className="input-group">
            <label htmlFor="nome">Nome Completo</label>
            <input
              id="nome"
              type="text"
              placeholder="Seu nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label htmlFor="cpf">CPF</label>
            <input
              id="cpf"
              type="text"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={handleCpfChange}
              required
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              type="password"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label htmlFor="confirmarSenha">Confirmar Senha</label>
            <input
              id="confirmarSenha"
              type="password"
              placeholder="••••••••"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>

        </form>

        <div className="login-footer">
          Já tem uma conta? <Link to="/login">Entrar</Link>
        </div>

      </div>
    </div>
  );
}