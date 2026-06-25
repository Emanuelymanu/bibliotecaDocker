import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LivroServiceUpload from "../services/livroServiceUpload";
import { Sidebar } from "../components/sidebar";
import "../css/CadastroLivro.css";
import { showErrorAlert, showSuccessAlert, showWarningToast } from '../utils/alertUtils';


export function CadastroLivro() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [subtitulo, setSubtitulo] = useState("");
  const [autor, setAutor] = useState("");
  const [tipoObra, setTipoObra] = useState("");
  const [nomeSerie, setNomeSerie] = useState("");
  const [anoPublicacao, setAnoPublicacao] = useState("");
  const [numPaginas, setNumPaginas] = useState("");
  const [genero, setGenero] = useState("");
  const [editora, setEditora] = useState("");
  const [capaFile, setCapaFile] = useState<File | null>(null);
  const [capaPreview, setCapaPreview] = useState("");
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo) {
      showWarningToast("Título é obrigatório");
      return;
    }
    if (!autor) {
      showWarningToast("autor é obrigatório");
      return;
    }
    if (!numPaginas) {
      showWarningToast("Número de páginas é obrigatório");
      return;
    }
    if (!capaFile) {
      showWarningToast("capa é obrigatório");
      return;
    }
    setLoading(true);
    try {
      await LivroServiceUpload.cadastrarComCapa({
        titulo,
        subtitulo,
        autor,
        tipo_obra: tipoObra as any || 'unico',
        nome_serie: nomeSerie,
        ano_publicacao: anoPublicacao,
        num_paginas: numPaginas,
        genero,
        editora,
      }, capaFile);

      showSuccessAlert("Livro cadastrado com sucesso!");

      setTitulo("");
      setSubtitulo("");
      setAutor("");
      setTipoObra("");
      setNomeSerie("");
      setAnoPublicacao("");
      setNumPaginas("");
      setGenero("");
      setEditora("");
      setCapaPreview("");
      setCapaFile(null);
      navigate("/Biblioteca");
    } catch (err: any) {
      const apiMessage = err?.message || err?.erro || err?.mensagem;
      showErrorAlert(apiMessage || "Erro ao cadastrar livro");
    } finally {
      setLoading(false);
    }
  };
  const handleCapaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCapaFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setCapaPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setCapaFile(null);
      setCapaPreview("");
    }
  };

  return (
    <div className="cadastro-container">
      <Sidebar onLogout={handleLogout} active="CadastroLivro" />
      <main className="main-content">
        <h1>Cadastrar Livro</h1>
        <div className="form-wrapper">
          <form onSubmit={handleSubmit} className="form-cadastro">
            <div className="input-group">
              <label>Capa</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleCapaChange}
                required
                disabled={loading}
              />
            </div>
            <div className="preview">
              {capaPreview ? (
                <img src={capaPreview} alt="capa" />
              ) : (
                <span>📖</span>
              )}
            </div>

            <div className="input-group">
              <label>Título *</label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label>Subtítulo</label>
              <input
                type="text"
                value={subtitulo}
                onChange={(e) => setSubtitulo(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>Autor</label>
              <input
                type="text"
                value={autor}
                onChange={(e) => setAutor(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>Tipo de Obra</label>
              <select
                value={tipoObra}
                onChange={e => setTipoObra(e.target.value)}
                required
                disabled={loading}
              >
                <option value="">Selecione...</option>
                <option value="unico">Único</option>
                <option value="trilogia">Trilogia</option>
                <option value="serie">Série</option>
                <option value="colecao">Coleção</option>
              </select>
            </div>

            <div className="input-group">
              <label>Nome da Série</label>
              <input
                type="text"
                value={nomeSerie}
                onChange={(e) => setNomeSerie(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>Ano de Publicação</label>
              <input
                type="number"
                value={anoPublicacao}
                onChange={(e) => setAnoPublicacao(e.target.value)}
                min={0}
              />
            </div>

            <div className="input-group">
              <label>Número de Páginas</label>
              <input
                type="number"
                value={numPaginas}
                onChange={(e) => setNumPaginas(e.target.value)}
                min={0}
              />
            </div>

            <div className="input-group">
              <label>Gênero</label>
              <input
                type="text"
                value={genero}
                onChange={(e) => setGenero(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>Editora</label>
              <input
                type="text"
                value={editora}
                onChange={(e) => setEditora(e.target.value)}
              />
            </div>

            <button type="submit" className="btn-salvar">
              Salvar Livro
            </button>

          </form>
        </div>
      </main>
    </div>
  );
}