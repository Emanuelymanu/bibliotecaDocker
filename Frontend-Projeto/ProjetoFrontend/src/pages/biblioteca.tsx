import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Sidebar } from "../components/sidebar";
import { Filters } from "../components/filters";
import { LivroCard } from "../components/LivroCard";
import LivroDetalhesModal from "../components/LivroDetalhesModal";

import LivroService from "../services/livroService";
import { leituraService } from "../services/leituraService";

import type { Livro } from "../types/livro";
import type { StatusLeitura } from "../types/leitura";

import {
    showConfirmDialog,
    showErrorAlert,
    showSuccessToast
} from "../utils/alertUtils";

import { normalizeImageUrl } from "../utils/imageUrl";

import "../css/biblioteca.css";

interface GoogleBookResultado {
    id?: string;

    volumeInfo?: {
        title?: string;
        subtitle?: string;
        authors?: string[];

        imageLinks?: {
            thumbnail?: string;
            smallThumbnail?: string;
        };

        pageCount?: number;
        publisher?: string;
        categories?: string[];
        publishedDate?: string;
        description?: string;
    };
}

export function Biblioteca() {
    const navigate = useNavigate();
    const location = useLocation();

    const [livros, setLivros] = useState<Livro[]>([]);
    const [livrosFiltrados, setLivrosFiltrados] = useState<Livro[]>([]);
    const [livroSelecionado, setLivroSelecionado] =
        useState<Livro | null>(null);

    const [mostrarDetalhes, setMostrarDetalhes] = useState(false);
    const [livroDetalhado, setLivroDetalhado] = useState<any>(null);
    const [carregandoDetalhes, setCarregandoDetalhes] = useState(false);

    const [statusFilter, setStatusFilter] = useState("todos");
    const [generoFilter, setGeneroFilter] = useState("todos");
    const [editoraFilter, setEditoraFilter] = useState("todos");
    const [avaliacaoFilter, setAvaliacaoFilter] = useState("todos");
    const [sortBy, setSortBy] = useState("titulo");

    const [avaliacaoHover, setAvaliacaoHover] = useState(0);
    const [salvandoAvaliacao, setSalvandoAvaliacao] = useState(false);

    const [statusSelecionado, setStatusSelecionado] =
        useState<StatusLeitura | "">("");

    const [salvandoStatus, setSalvandoStatus] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem("token");
        window.location.href = "/login";
    };

    useEffect(() => {
        carregarLivros();
    }, [location.pathname]);

    const mapStatus = (
        status: string | undefined
    ):
        | "Lido"
        | "Lendo"
        | "Quero Ler"
        | "Não lido"
        | "Abandonado"
        | "Relendo"
        | undefined => {
        switch (status) {
            case "lido":
                return "Lido";

            case "lendo":
                return "Lendo";

            case "quero_ler":
                return "Quero Ler";

            case "nao_lido":
                return "Não lido";

            case "abandonado":
                return "Abandonado";

            case "relendo":
                return "Relendo";

            default:
                return undefined;
        }
    };

    const carregarLivros = async (): Promise<void> => {
        try {
            const data = await LivroService.listar();

            data.forEach((livro) => {
                if (
                    livro.leituras &&
                    Array.isArray(livro.leituras) &&
                    livro.leituras.length > 0
                ) {
                    const primeiraLeitura = livro.leituras[0];

                    livro.status_leitura = mapStatus(
                        primeiraLeitura?.status
                    );

                    livro.avaliacao = primeiraLeitura?.avaliacao;
                } else {
                    livro.status_leitura = undefined;
                    livro.avaliacao = undefined;
                }
            });

            setLivros(data);
            setLivrosFiltrados(data);
        } catch (err) {
            console.error("Erro ao carregar livros:", err);
            showErrorAlert("Erro ao carregar os livros");
        }
    };

    const abrirModal = (livro: Livro) => {
        setLivroSelecionado(livro);
        setLivroDetalhado(null);
        setMostrarDetalhes(false);
        setAvaliacaoHover(0);

        const leitura = livro.leituras?.[0];

        setStatusSelecionado(
            (leitura?.status as StatusLeitura) || ""
        );
    };

    const fecharModal = () => {
        setLivroSelecionado(null);
        setLivroDetalhado(null);
        setMostrarDetalhes(false);
        setAvaliacaoHover(0);
        setStatusSelecionado("");
    };

    const voltarDoDetalhes = () => {
        setMostrarDetalhes(false);
        setLivroDetalhado(null);
    };

    const normalizarTexto = (
        texto: string | undefined
    ) => {
        return (texto || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();
    };

    const abrirInformacoes = async () => {
        if (!livroSelecionado || carregandoDetalhes) {
            return;
        }

        setCarregandoDetalhes(true);

        try {
            const termoBusca =
                `${livroSelecionado.titulo} ${livroSelecionado.autor || ""}`;

            const resposta =
                await LivroService.buscarGoogleBooks(
                    termoBusca
                );

            const resultados = (
                Array.isArray(resposta)
                    ? resposta
                    : []
            ) as unknown as GoogleBookResultado[];

            const idGoogleSalvo =
                (livroSelecionado as any).id_google;

            let livroGoogle = resultados.find(
                (resultado) =>
                    Boolean(idGoogleSalvo) &&
                    resultado.id === idGoogleSalvo
            );

            if (!livroGoogle) {
                livroGoogle = resultados.find(
                    (resultado) => {
                        const tituloGoogle =
                            normalizarTexto(
                                resultado.volumeInfo?.title
                            );

                        const tituloBiblioteca =
                            normalizarTexto(
                                livroSelecionado.titulo
                            );

                        const autoresGoogle =
                            normalizarTexto(
                                resultado.volumeInfo?.authors?.join(", ")
                            );

                        const autorBiblioteca =
                            normalizarTexto(
                                livroSelecionado.autor
                            );

                        const mesmoTitulo =
                            tituloGoogle === tituloBiblioteca;

                        const autorCompativel =
                            !autorBiblioteca ||
                            autoresGoogle.includes(
                                autorBiblioteca
                            ) ||
                            autorBiblioteca.includes(
                                autoresGoogle
                            );

                        return (
                            mesmoTitulo &&
                            autorCompativel
                        );
                    }
                );
            }

            if (!livroGoogle) {
                livroGoogle = resultados.find(
                    (resultado) => {
                        const tituloGoogle =
                            normalizarTexto(
                                resultado.volumeInfo?.title
                            );

                        const tituloBiblioteca =
                            normalizarTexto(
                                livroSelecionado.titulo
                            );

                        return (
                            tituloGoogle.includes(
                                tituloBiblioteca
                            ) ||
                            tituloBiblioteca.includes(
                                tituloGoogle
                            )
                        );
                    }
                );
            }

            if (!livroGoogle && resultados.length > 0) {
                livroGoogle = resultados[0];
            }

            if (livroGoogle) {
                const info = livroGoogle.volumeInfo;

                setLivroDetalhado({
                    ...livroSelecionado,

                    id_google:
                        livroGoogle.id ||
                        idGoogleSalvo ||
                        "",

                    titulo:
                        info?.title ||
                        livroSelecionado.titulo,

                    subtitulo:
                        info?.subtitle ||
                        livroSelecionado.subtitulo ||
                        "",

                    autor:
                        info?.authors?.join(", ") ||
                        livroSelecionado.autor ||
                        "",

                    capa:
                        info?.imageLinks?.thumbnail ||
                        info?.imageLinks?.smallThumbnail ||
                        livroSelecionado.capa ||
                        "",

                    num_paginas:
                        info?.pageCount ||
                        livroSelecionado.num_paginas ||
                        0,

                    editora:
                        info?.publisher ||
                        livroSelecionado.editora ||
                        "",

                    genero:
                        info?.categories?.join(", ") ||
                        livroSelecionado.genero ||
                        "",

                    ano_publicacao:
                        info?.publishedDate
                            ? String(
                                info.publishedDate
                            ).split("-")[0]
                            : livroSelecionado.ano_publicacao || "",

                    descricao:
                        info?.description || ""
                });
            } else {
                setLivroDetalhado({
                    ...livroSelecionado,
                    descricao: ""
                });
            }

            setMostrarDetalhes(true);
        } catch (err) {
            console.error(
                "Erro ao buscar informações do livro:",
                err
            );

            setLivroDetalhado({
                ...livroSelecionado,
                descricao: ""
            });

            setMostrarDetalhes(true);
        } finally {
            setCarregandoDetalhes(false);
        }
    };

    const avaliarLivro = async (
        nota: number
    ) => {
        if (
            !livroSelecionado ||
            salvandoAvaliacao
        ) {
            return;
        }

        setSalvandoAvaliacao(true);

        try {
            const dadosLivro = {
                titulo:
                    livroSelecionado.titulo,

                subtitulo:
                    livroSelecionado.subtitulo || "",

                autor:
                    livroSelecionado.autor,

                tipo_obra:
                    (livroSelecionado.tipo_obra as any) ||
                    "unico",

                nome_serie:
                    livroSelecionado.nome_serie || "",

                ano_publicacao:
                    livroSelecionado.ano_publicacao
                        ? String(
                            livroSelecionado.ano_publicacao
                        )
                        : "",

                num_paginas:
                    livroSelecionado.num_paginas
                        ? String(
                            livroSelecionado.num_paginas
                        )
                        : "",

                genero:
                    livroSelecionado.genero || "",

                editora:
                    livroSelecionado.editora || "",

                avaliacao: nota
            };

            await LivroService.editarSemCapa(
                livroSelecionado.id_livro,
                dadosLivro
            );

            const atualizarAvaliacao = (
                livro: Livro
            ): Livro => {
                if (
                    livro.id_livro !==
                    livroSelecionado.id_livro
                ) {
                    return livro;
                }

                return {
                    ...livro,
                    avaliacao: nota,
                    leituras: livro.leituras?.map(
                        (leitura, index) =>
                            index === 0
                                ? {
                                    ...leitura,
                                    avaliacao: nota
                                }
                                : leitura
                    )
                };
            };

            setLivros((listaAtual) =>
                listaAtual.map(atualizarAvaliacao)
            );

            setLivrosFiltrados((listaAtual) =>
                listaAtual.map(atualizarAvaliacao)
            );

            setLivroSelecionado((livroAtual) =>
                livroAtual
                    ? atualizarAvaliacao(livroAtual)
                    : null
            );

            showSuccessToast(
                `Avaliação de ${nota} estrela${
                    nota === 1 ? "" : "s"
                } salva com sucesso!`
            );
        } catch (err) {
            console.error(
                "Erro ao salvar avaliação:",
                err
            );

            showErrorAlert(
                "Erro ao salvar avaliação"
            );
        } finally {
            setSalvandoAvaliacao(false);
        }
    };

    const atualizarStatusLivro = async () => {
        if (
            !livroSelecionado ||
            !statusSelecionado ||
            salvandoStatus
        ) {
            return;
        }

        const leitura = livroSelecionado.leituras?.[0];

        if (!leitura) {
            showErrorAlert(
                "Este livro não possui uma leitura cadastrada"
            );
            return;
        }

        setSalvandoStatus(true);

        try {
            await leituraService.atualizarProgresso(
                leitura.id_leitura,
                {
                    status: statusSelecionado,
                    pagina_atual:
                        leitura.pagina_atual ?? 0
                }
            );

            const atualizarLivroComStatus = (
                livro: Livro
            ): Livro => {
                if (
                    livro.id_livro !==
                    livroSelecionado.id_livro
                ) {
                    return livro;
                }

                return {
                    ...livro,

                    status_leitura:
                        mapStatus(statusSelecionado),

                    leituras:
                        livro.leituras?.map(
                            (item) =>
                                item.id_leitura ===
                                leitura.id_leitura
                                    ? {
                                        ...item,
                                        status:
                                            statusSelecionado
                                    }
                                    : item
                        )
                };
            };

            setLivros((listaAtual) =>
                listaAtual.map(
                    atualizarLivroComStatus
                )
            );

            setLivrosFiltrados((listaAtual) =>
                listaAtual.map(
                    atualizarLivroComStatus
                )
            );

            setLivroSelecionado((livroAtual) =>
                livroAtual
                    ? atualizarLivroComStatus(
                        livroAtual
                    )
                    : null
            );

            showSuccessToast(
                "Status atualizado com sucesso!"
            );
        } catch (err) {
            console.error(
                "Erro ao atualizar status:",
                err
            );

            showErrorAlert(
                "Erro ao atualizar status"
            );
        } finally {
            setSalvandoStatus(false);
        }
    };

    const excluirLivro = async (
        id: number
    ): Promise<void> => {
        const confirmado =
            await showConfirmDialog(
                "Confirmar exclusão",
                "Tem certeza que deseja excluir este livro? Esta ação não pode ser desfeita.",
                "Sim, excluir",
                "Cancelar"
            );

        if (!confirmado) {
            return;
        }

        try {
            await LivroService.deletar(id);

            showSuccessToast(
                "Livro excluído com sucesso!"
            );

            fecharModal();
            await carregarLivros();
        } catch (err) {
            console.error(
                "Erro ao excluir livro:",
                err
            );

            showErrorAlert(
                "Erro ao excluir livro"
            );
        }
    };

    const editarLivro = (
        livro: Livro
    ) => {
        fecharModal();

        navigate("/EditarLivro", {
            state: {
                livro
            }
        });
    };

    const genero: string[] = [
        ...new Set(
            livros
                .map((livro) => livro.genero)
                .filter(
                    (
                        valor
                    ): valor is string =>
                        Boolean(valor)
                )
        )
    ];

    const editora: string[] = [
        ...new Set(
            livros
                .map((livro) => livro.editora)
                .filter(
                    (
                        valor
                    ): valor is string =>
                        Boolean(valor)
                )
        )
    ];

    const notaExibida =
        avaliacaoHover ||
        Number(livroSelecionado?.avaliacao) ||
        0;

    return (
        <div className="biblioteca-container">
            <Sidebar
                onLogout={handleLogout}
                active="Biblioteca"
            />

            <main className="main-content">
                <h1>Biblioteca</h1>

                <Filters
                    livros={livros}
                    generos={genero}
                    editoras={editora}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    generoFilter={generoFilter}
                    setGeneroFilter={setGeneroFilter}
                    editoraFilter={editoraFilter}
                    setEditoraFilter={setEditoraFilter}
                    avaliacaoFilter={avaliacaoFilter}
                    setAvaliacaoFilter={
                        setAvaliacaoFilter
                    }
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    setLivrosFiltrados={
                        setLivrosFiltrados
                    }
                />

                <div className="livros-grid">
                    {livrosFiltrados.length === 0 ? (
                        <p>
                            Nenhum livro encontrado.
                        </p>
                    ) : (
                        livrosFiltrados.map(
                            (livro) => (
                                <LivroCard
                                    key={livro.id_livro}
                                    livro={livro}
                                    onClick={() =>
                                        abrirModal(livro)
                                    }
                                />
                            )
                        )
                    )}
                </div>
            </main>

            {livroSelecionado &&
                !mostrarDetalhes && (
                    <div
                        className="modal-overlay"
                        onClick={fecharModal}
                    >
                        <div
                            className="biblioteca-modal"
                            onClick={(event) =>
                                event.stopPropagation()
                            }
                        >
                            <button
                                type="button"
                                className="biblioteca-modal-fechar"
                                onClick={fecharModal}
                                aria-label="Fechar"
                                title="Fechar"
                            >
                                ×
                            </button>

                            <div className="biblioteca-modal-conteudo">
                                <div className="biblioteca-modal-capa">
                                    {livroSelecionado.capa ? (
                                        <img
                                            src={normalizeImageUrl(
                                                livroSelecionado.capa
                                            )}
                                            alt={
                                                livroSelecionado.titulo
                                            }
                                        />
                                    ) : (
                                        <div className="biblioteca-sem-capa">
                                            📖
                                        </div>
                                    )}
                                </div>

                                <div className="biblioteca-modal-dados">
                                    <h2>
                                        {livroSelecionado.titulo}
                                    </h2>

                                    <div className="biblioteca-avaliacao">
                                        <h3>
                                            Sua avaliação
                                        </h3>

                                        <div className="biblioteca-estrelas">
                                            {[1, 2, 3, 4, 5].map(
                                                (nota) => (
                                                    <button
                                                        key={nota}
                                                        type="button"
                                                        className={
                                                            nota <=
                                                            notaExibida
                                                                ? "biblioteca-estrela ativa"
                                                                : "biblioteca-estrela"
                                                        }
                                                        onMouseEnter={() =>
                                                            setAvaliacaoHover(
                                                                nota
                                                            )
                                                        }
                                                        onMouseLeave={() =>
                                                            setAvaliacaoHover(
                                                                0
                                                            )
                                                        }
                                                        onClick={() =>
                                                            avaliarLivro(
                                                                nota
                                                            )
                                                        }
                                                        disabled={
                                                            salvandoAvaliacao
                                                        }
                                                        title={`Avaliar com ${nota} estrela${
                                                            nota === 1
                                                                ? ""
                                                                : "s"
                                                        }`}
                                                    >
                                                        ★
                                                    </button>
                                                )
                                            )}
                                        </div>

                                        <p>
                                            {salvandoAvaliacao
                                                ? "Salvando avaliação..."
                                                : livroSelecionado.avaliacao
                                                    ? `${livroSelecionado.avaliacao} de 5 estrelas`
                                                    : "Livro ainda não avaliado"}
                                        </p>
                                    </div>

                                    <div className="biblioteca-status">
                                        <h3>
                                            Status da leitura
                                        </h3>

                                        <div className="biblioteca-status-controles">
                                            <select
                                                value={
                                                    statusSelecionado
                                                }
                                                onChange={(event) =>
                                                    setStatusSelecionado(
                                                        event.target
                                                            .value as StatusLeitura
                                                    )
                                                }
                                                disabled={
                                                    salvandoStatus
                                                }
                                            >
                                                <option value="">
                                                    Selecione...
                                                </option>

                                                <option value="nao_lido">
                                                    Não lido
                                                </option>

                                                <option value="quero_ler">
                                                    Quero ler
                                                </option>

                                                <option value="lendo">
                                                    Lendo
                                                </option>

                                                <option value="lido">
                                                    Lido
                                                </option>

                                                <option value="relendo">
                                                    Relendo
                                                </option>

                                                <option value="abandonado">
                                                    Abandonado
                                                </option>
                                            </select>

                                            <button
                                                type="button"
                                                onClick={
                                                    atualizarStatusLivro
                                                }
                                                disabled={
                                                    !statusSelecionado ||
                                                    salvandoStatus
                                                }
                                            >
                                                {salvandoStatus
                                                    ? "Salvando..."
                                                    : "Atualizar status"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="biblioteca-modal-acoes">
                                <button
                                    type="button"
                                    className="biblioteca-btn biblioteca-btn-editar"
                                    onClick={() =>
                                        editarLivro(
                                            livroSelecionado
                                        )
                                    }
                                >
                                    Editar
                                </button>

                                <button
                                    type="button"
                                    className="biblioteca-btn biblioteca-btn-excluir"
                                    onClick={() =>
                                        excluirLivro(
                                            livroSelecionado.id_livro
                                        )
                                    }
                                >
                                    Excluir
                                </button>

                                <button
                                    type="button"
                                    className="biblioteca-btn biblioteca-btn-informacoes"
                                    onClick={
                                        abrirInformacoes
                                    }
                                    disabled={
                                        carregandoDetalhes
                                    }
                                >
                                    {carregandoDetalhes
                                        ? "Carregando..."
                                        : "Informações"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            {livroDetalhado &&
                mostrarDetalhes && (
                    <LivroDetalhesModal
                        livro={livroDetalhado}
                        onClose={voltarDoDetalhes}
                        mostrarAdicionar={false}
                    />
                )}
        </div>
    );
}