import { useEffect, useState } from "react";
import { LivroCard } from "./LivroCard";
import { leituraService } from "../services/leituraService";
import { anotacaoService } from "../services/anotacaoService";
import type { Anotacao } from "../types/anotacao";
import type { Leitura, Livro } from "../types";
import "../css/LeiturasCard.css";

export function LeiturasCard() {
    const [leituras, setLeituras] = useState<Leitura[]>([]);
    const [loading, setLoading] = useState(true);
    const [livroSelecionado, setLivroSelecionado] = useState<Leitura | null>(null);
    const [paginaAtual, setPaginaAtual] = useState(0);
    const [totalPaginas, setTotalPaginas] = useState(0);

    // Estados para anotações
    const [anotacoes, setAnotacoes] = useState<Anotacao[]>([]);
    const [paginaSelecionada, setPaginaSelecionada] = useState<number>(1);
    const [novaAnotacao, setNovaAnotacao] = useState({ titulo: "", conteudo: "" });
    const [editandoAnotacao, setEditandoAnotacao] = useState<Anotacao | null>(null);
    const [mostrarFormAnotacao, setMostrarFormAnotacao] = useState(false);
    const [carregandoAnotacoes, setCarregandoAnotacoes] = useState(false);

    useEffect(() => {
        carregarLeituras();
    }, []);

    const carregarLeituras = async () => {
        setLoading(true);
        try {
            const leiturasEmAndamento = await leituraService.listarLeiturasEmAndamento();
            setLeituras(leiturasEmAndamento);
        } catch (err) {
            console.error("Erro ao carregar leituras:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAbrirModal = async (leitura: Leitura) => {
        setLivroSelecionado(leitura);
        setPaginaAtual(leitura.pagina_atual || 0);
        setTotalPaginas(leitura.livro?.num_paginas || 0);
        setPaginaSelecionada(leitura.pagina_atual || 1);
        await carregarAnotacoes(leitura.id_leitura, leitura.pagina_atual || 1);
    };

    const carregarAnotacoes = async (id_leitura: number, pagina: number) => {
        setCarregandoAnotacoes(true);
        try {
            const response = await anotacaoService.buscarPorPagina(id_leitura, pagina);
            setAnotacoes(response.anotacoes);
        } catch (err) {
            console.error("Erro ao carregar anotações:", err);
            setAnotacoes([]);
        } finally {
            setCarregandoAnotacoes(false);
        }
    };

    const handlePaginaChange = async (novaPagina: number) => {
        if (novaPagina < 1 || novaPagina > totalPaginas) return;
        setPaginaSelecionada(novaPagina);
        if (livroSelecionado) {
            await carregarAnotacoes(livroSelecionado.id_leitura, novaPagina);
        }
    };

    const handleCriarAnotacao = async () => {
        if (!livroSelecionado) return;
        if (!novaAnotacao.conteudo.trim()) {
            alert("O conteúdo da anotação é obrigatório");
            return;
        }

        try {
            await anotacaoService.criarAnotacao({
                id_leitura: livroSelecionado.id_leitura,
                pagina: paginaSelecionada,
                titulo: novaAnotacao.titulo || undefined,
                conteudo: novaAnotacao.conteudo
            });

            await carregarAnotacoes(livroSelecionado.id_leitura, paginaSelecionada);

            setNovaAnotacao({ titulo: "", conteudo: "" });
            setMostrarFormAnotacao(false);

            alert("Anotação criada com sucesso!");
        } catch (err: any) {
            alert(err.erro || "Erro ao criar anotação");
        }
    };

    const handleAtualizarAnotacao = async () => {
        if (!editandoAnotacao) return;

        try {
            await anotacaoService.atualizarAnotacao(editandoAnotacao.id_anotacao, {
                titulo: editandoAnotacao.titulo,
                conteudo: editandoAnotacao.conteudo
            });

            if (livroSelecionado) {
                await carregarAnotacoes(livroSelecionado.id_leitura, paginaSelecionada);
            }

            setEditandoAnotacao(null);
            alert("Anotação atualizada com sucesso!");
        } catch (err: any) {
            alert(err.erro || "Erro ao atualizar anotação");
        }
    };

    const handleDeletarAnotacao = async (id: number) => {
        if (!confirm("Tem certeza que deseja excluir esta anotação?")) return;

        try {
            await anotacaoService.deletarAnotacao(id);

            if (livroSelecionado) {
                await carregarAnotacoes(livroSelecionado.id_leitura, paginaSelecionada);
            }

            alert("Anotação excluída com sucesso!");
        } catch (err: any) {
            alert(err.erro || "Erro ao excluir anotação");
        }
    };

    const handleAtualizarProgresso = async () => {
        if (!livroSelecionado) return;

        try {
            await leituraService.atualizarProgresso(livroSelecionado.id_leitura, {
                pagina_atual: paginaAtual
            });

            await carregarLeituras();
            alert("Progresso atualizado com sucesso!");
        } catch (err: any) {
            alert(err.erro || "Erro ao atualizar progresso");
        }
    };

    if (loading) {
        return <div>Carregando suas leituras...</div>;
    }

    return (
        <div>
            <div className="books-grid">
                {leituras.length === 0 ? (
                    <p>Você não tem leituras em andamento.</p>
                ) : (
                    leituras.map((leitura) => (
                        <LivroCard
                            key={leitura.id_leitura}
                            livro={{
                                id_livro: leitura.livro?.id_livro || leitura.id_livro,
                                titulo: leitura.livro?.titulo || "",
                                autor: leitura.livro?.autor || "",
                                tipo_obra: "unico",
                                num_paginas: leitura.livro?.num_paginas || 0,
                                capa: leitura.livro?.capa || "",
                                genero: leitura.livro?.genero || "",
                                avaliacao: leitura.avaliacao || 0
                            } as Livro}
                            onClick={() => handleAbrirModal(leitura)}
                        />
                    ))
                )}
            </div>

            {livroSelecionado && (
                <div className="modal-overlay" onClick={() => setLivroSelecionado(null)}>
                    <div className="modal-content-large" onClick={(e) => e.stopPropagation()}>

                        <div className="modal-header">
                            <h2>{livroSelecionado.livro?.titulo}</h2>
                            <p><strong>Autor:</strong> {livroSelecionado.livro?.autor}</p>
                        </div>

                        <div className="progress-section">
                            <h3>Progresso de Leitura</h3>
                            <div className="progress-controls">
                                <input
                                    type="range"
                                    min="0"
                                    max={totalPaginas}
                                    value={paginaAtual}
                                    onChange={(e) => setPaginaAtual(Number(e.target.value))}
                                />
                                <span>{paginaAtual} / {totalPaginas} páginas</span>
                                <button onClick={handleAtualizarProgresso}>Atualizar Progresso</button>
                            </div>
                        </div>

                        <div className="anotacoes-section">
                            <div className="anotacoes-header">
                                <h3>Anotações</h3>
                                <div className="pagina-navegacao">
                                    <button
                                        onClick={() => handlePaginaChange(paginaSelecionada - 1)}
                                        disabled={paginaSelecionada <= 1}
                                    >
                                        ◀ Página anterior
                                    </button>
                                    <span>Página {paginaSelecionada}</span>
                                    <button
                                        onClick={() => handlePaginaChange(paginaSelecionada + 1)}
                                        disabled={paginaSelecionada >= totalPaginas}
                                    >
                                        Próxima página ▶
                                    </button>
                                </div>
                            </div>

                            <div className="anotacoes-lista">
                                {carregandoAnotacoes ? (
                                    <p>Carregando anotações...</p>
                                ) : anotacoes.length === 0 ? (
                                    <p className="sem-anotacoes">Nenhuma anotação nesta página.</p>
                                ) : (
                                    anotacoes.map((anotacao) => (
                                        <div key={anotacao.id_anotacao} className="anotacao-item">
                                            {editandoAnotacao?.id_anotacao === anotacao.id_anotacao ? (
                                                <div className="anotacao-edicao">
                                                    <input
                                                        type="text"
                                                        placeholder="Título (opcional)"
                                                        value={editandoAnotacao.titulo || ""}
                                                        onChange={(e) => setEditandoAnotacao({
                                                            ...editandoAnotacao,
                                                            titulo: e.target.value
                                                        })}
                                                    />
                                                    <textarea
                                                        placeholder="Conteúdo da anotação"
                                                        value={editandoAnotacao.conteudo}
                                                        onChange={(e) => setEditandoAnotacao({
                                                            ...editandoAnotacao,
                                                            conteudo: e.target.value
                                                        })}
                                                        rows={4}
                                                    />
                                                    <div className="anotacao-botoes">
                                                        <button onClick={handleAtualizarAnotacao}>Salvar</button>
                                                        <button onClick={() => setEditandoAnotacao(null)}>Cancelar</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    {anotacao.titulo && <h4>{anotacao.titulo}</h4>}
                                                    <p>{anotacao.conteudo}</p>
                                                    <small>Página {anotacao.pagina}</small>
                                                    <div className="anotacao-botoes">
                                                        <button onClick={() => setEditandoAnotacao(anotacao)}> Editar</button>
                                                        <button onClick={() => handleDeletarAnotacao(anotacao.id_anotacao)}>Excluir</button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            {!mostrarFormAnotacao ? (
                                <button
                                    className="btn-nova-anotacao"
                                    onClick={() => setMostrarFormAnotacao(true)}
                                >
                                    + Nova Anotação na Página {paginaSelecionada}
                                </button>
                            ) : (
                                <div className="nova-anotacao-form">
                                    <h4>Nova Anotação</h4>
                                    <input
                                        type="text"
                                        placeholder="Título (opcional)"
                                        value={novaAnotacao.titulo}
                                        onChange={(e) => setNovaAnotacao({ ...novaAnotacao, titulo: e.target.value })}
                                    />
                                    <textarea
                                        placeholder="Escreva sua anotação aqui..."
                                        value={novaAnotacao.conteudo}
                                        onChange={(e) => setNovaAnotacao({ ...novaAnotacao, conteudo: e.target.value })}
                                        rows={5}
                                    />
                                    <div className="anotacao-botoes">
                                        <button onClick={handleCriarAnotacao}>Salvar Anotação</button>
                                        <button onClick={() => {
                                            setMostrarFormAnotacao(false);
                                            setNovaAnotacao({ titulo: "", conteudo: "" });
                                        }}>Cancelar</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button onClick={() => setLivroSelecionado(null)}>Fechar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}