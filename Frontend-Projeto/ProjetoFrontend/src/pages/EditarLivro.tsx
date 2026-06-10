import { useState } from "react";
import type { StatusLeitura } from "../types/leitura";
import { Sidebar } from "../components/sidebar";
import "../css/CadastroLivro.css";
import LivroService from "../services/livroService";
import LivroServiceUpload from "../services/livroServiceUpload";
import { leituraService } from "../services/leituraService";

import { useNavigate, useLocation } from "react-router-dom";
import type { Livro } from "../types/livro";
import {
    showWarningToast,
    showSuccessAlert,
    showErrorAlert,
} from "../utils/alertUtils";
import { normalizeImageUrl } from "../utils/imageUrl";

export function EditarLivro() {
    const location = useLocation();
    const navigate = useNavigate();
    const livro = location.state?.livro as Livro;
    const uploadsBaseUrl = import.meta.env.VITE_UPLOADS_URL || '/upload/capa';

    const [loading, setLoading] = useState(false);
    const [titulo, setTitulo] = useState(livro?.titulo || "");
    const [subtitulo, setSubtitulo] = useState(livro?.subtitulo || "");
    const [autor, setAutor] = useState(livro?.autor || "");
    const [tipoObra, setTipoObra] = useState<"unico" | "trilogia" | "serie" | "colecao" | "">((livro?.tipo_obra as any) || "");
    const [nomeSerie, setNomeSerie] = useState(livro?.nome_serie || "");
    const [anoPublicacao, setAnoPublicacao] = useState(livro?.ano_publicacao ? String(livro.ano_publicacao) : "");
    const [numPaginas, setNumPaginas] = useState(livro?.num_paginas ? String(livro.num_paginas) : "");
    const [genero, setGenero] = useState(livro?.genero || "");
    const [editora, setEditora] = useState(livro?.editora || "");
    const [capaFile, setCapaFile] = useState<File | null>(null);
    const [capaPreview, setCapaPreview] = useState(normalizeImageUrl(livro?.capa, uploadsBaseUrl));
    const [status, setStatus] = useState<StatusLeitura | "">("");
    const [avaliacao, setAvaliacao] = useState("0");

    const handleLogout = () => {
        localStorage.removeItem("token");
        window.location.href = "/login";
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
            setCapaPreview(normalizeImageUrl(livro?.capa, uploadsBaseUrl));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!titulo) {
            showWarningToast('Título é obrigatório');
            return;
        }
        if (!autor) {
            showWarningToast('Autor é obrigatório');
            return;
        }
        if (!numPaginas) {
            showWarningToast('Numero de páginas é obrigatório');
            return;
        }
        setLoading(true);
        try {

            const dadosLivro = {
                titulo,
                subtitulo,
                autor,
                tipo_obra: tipoObra as any || 'unico',
                nome_serie: nomeSerie,
                ano_publicacao: anoPublicacao,
                num_paginas: numPaginas,
                genero,
                editora,
                avaliacao: Number(avaliacao),
            };
            if (capaFile) {
                await LivroServiceUpload.editarComCapa(livro.id_livro, dadosLivro, capaFile);
            } else {
                await LivroService.editarSemCapa(livro.id_livro, dadosLivro);
            }


            if (livro.leituras && livro.leituras.length > 0 && status) {
                const leitura = livro.leituras[0];
                await leituraService.atualizarProgresso(leitura.id_leitura, { status, pagina_atual: leitura.pagina_atual });
            }

            showSuccessAlert("Livro atualizado com sucesso!");
            navigate("/biblioteca");
        } catch (err: any) {
            showErrorAlert("Erro ao atualizar livro");
        } finally {
            setLoading(false);
        }
    };

    if (!livro) {
        return <div>Carregando...</div>;
    }

    return (
        <div className="cadastro-container">
            <Sidebar onLogout={handleLogout} active="EditarLivro" />
            <main className="main-content">
                <h1>Editar Livro</h1>
                <div className="form-wrapper">
                    <form onSubmit={handleSubmit} className="form-cadastro">

                        <div className="input-group">
                            <label>Capa</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleCapaChange}
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
                                onChange={e => setTipoObra(e.target.value as "unico" | "trilogia" | "serie" | "colecao" | "")}
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

                        <div className="input-group">
                            <label>Status</label>
                            <select
                                value={status}
                                onChange={e => setStatus(e.target.value as StatusLeitura)}
                                disabled={loading}
                            >
                                <option value="">Selecione...</option>
                                <option value="nao_lido">Não lido</option>
                                <option value="quero_ler">Quero ler</option>
                                <option value="lendo">Lendo</option>
                                <option value="lido">Lido</option>
                                <option value="abandonado">Abandonado</option>
                            </select>
                        </div>

                        <div className="input-group">
                            <label>Avaliação</label>
                            <select
                                value={avaliacao}
                                onChange={e => setAvaliacao(e.target.value)}
                                disabled={loading}
                            >
                                <option value="0">0</option>
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                                <option value="4">4</option>
                                <option value="5">5</option>
                            </select>
                        </div>
                        <button type="submit" className="btn-salvar" disabled={loading}>
                            {loading ? "Salvando..." : "Salvar Alterações"}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}
