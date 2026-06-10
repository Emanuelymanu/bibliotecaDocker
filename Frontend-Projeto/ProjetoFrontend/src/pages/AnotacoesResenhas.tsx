import { useEffect, useState } from "react";
import { leituraService } from "../services/leituraService";
import { anotacaoService } from "../services/anotacaoService";
import type { Leitura } from "../types/leitura";
import type { Anotacao } from "../types/anotacao";
import { Sidebar } from "../components/sidebar";
import "../css/anotacao-resenhas.css";
import { normalizeImageUrl } from "../utils/imageUrl";

export function AnotacoesResenhas() {
    const [leituras, setLeituras] = useState<Leitura[]>([]);
    const [anotacoesPorLeitura, setAnotacoesPorLeitura] = useState<Record<number, Anotacao[]>>({});
    const [loading, setLoading] = useState(true);
    const [expandedLeitura, setExpandedLeitura] = useState<number | null>(null);
    const handleLogout = () => {
        localStorage.removeItem("token");
        window.location.href = "/login";
    };

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const concluidas = await leituraService.listarLeiturasConcluidas();
                setLeituras(concluidas);

                const anotacoesMap: Record<number, Anotacao[]> = {};
                for (const leitura of concluidas) {
                    try {
                        const anotacoes = await anotacaoService.buscarTodasPorLeitura(leitura.id_leitura);
                        anotacoesMap[leitura.id_leitura] = anotacoes || [];
                    } catch (error) {
                        console.error(`Erro ao buscar anotações para leitura ${leitura.id_leitura}:`, error);
                        anotacoesMap[leitura.id_leitura] = [];
                    }
                }
                setAnotacoesPorLeitura(anotacoesMap);
            } catch (error) {
                console.error("Erro ao carregar dados:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const toggleExpand = (id: number) => {
        setExpandedLeitura(expandedLeitura === id ? null : id);
    };

    if (loading) {
        return (
            <div className="biblioteca-container">
                <Sidebar onLogout={handleLogout} active="anotacoes-resenhas" />
                <main className="main-content">
                    <div className="loading-container">
                        <p>Carregando resenhas e anotações...</p>
                    </div>
                </main>
            </div>
        );
    }

    const leiturasComConteudo = leituras.filter((leitura) => {
        const anotacoes = anotacoesPorLeitura[leitura.id_leitura] || [];
        const temResenha = leitura.resenha && leitura.resenha.trim().length > 0;
        const temAnotacoes = anotacoes.length > 0;
        return temResenha || temAnotacoes;
    });

    return (
        <div className="biblioteca-container">
            <Sidebar onLogout={handleLogout} active="anotacoes-resenhas" />

            <main className="main-content">
                <header className="page-header">
                    <h1> Resenhas e Anotações</h1>
                    <p>{leiturasComConteudo.length} livro(s) lido(s) com anotações</p>
                </header>

                {leiturasComConteudo.length === 0 ? (
                    <div className="empty-state">
                        <p>Nenhuma leitura concluída encontrada.</p>
                        <p>Quando você terminar de ler um livro e escrever resenhas/anotações, elas aparecerão aqui.</p>
                    </div>
                ) : (
                    <div className="resenhas-grid">
                        {leiturasComConteudo.map((leitura) => {
                            const anotacoes = anotacoesPorLeitura[leitura.id_leitura] || [];
                            const temResenha = leitura.resenha && leitura.resenha.trim().length > 0;
                            const temAnotacoes = anotacoes.length > 0;

                            return (
                                <div key={leitura.id_leitura} className="resenha-card">
                                    <div className="resenha-header" onClick={() => toggleExpand(leitura.id_leitura)}>
                                        {leitura.livro?.capa && (
                                            <img
                                                src={normalizeImageUrl(leitura.livro.capa)}
                                                alt={leitura.livro.titulo}
                                                className="resenha-capa"
                                            />
                                        )}
                                        <div className="resenha-info">
                                            <h3>{leitura.livro?.titulo}</h3>
                                            <p className="autor">por {leitura.livro?.autor}</p>
                                            <div className="resenha-meta">
                                                {leitura.avaliacao && (
                                                    <span className="avaliacao">
                                                        {"⭐".repeat(leitura.avaliacao)}
                                                    </span>
                                                )}
                                                <span className="data-leitura">
                                                    Concluído em: {new Date(leitura.data_conclusao || "").toLocaleDateString('pt-BR')}
                                                </span>
                                            </div>
                                        </div>
                                        <button className="expand-btn">
                                            {expandedLeitura === leitura.id_leitura ? "▲" : "▼"}
                                        </button>
                                    </div>

                                    {expandedLeitura === leitura.id_leitura && (
                                        <div className="resenha-body">
                                            {/* RESENHA */}
                                            {temResenha && (
                                                <div className="resenha-section">
                                                    <h4>Resenha</h4>
                                                    <p className="resenha-texto">{leitura.resenha}</p>
                                                </div>
                                            )}

                                            <div className="anotacoes-section">
                                                <h4> Anotações {temAnotacoes && `(${anotacoes.length})`}</h4>
                                                {temAnotacoes ? (
                                                    <div className="anotacoes-lista">
                                                        {anotacoes.map((anotacao) => (
                                                            <div key={anotacao.id_anotacao} className="anotacao-item">
                                                                <div className="anotacao-header">
                                                                    {anotacao.titulo && (
                                                                        <strong className="anotacao-titulo">{anotacao.titulo}</strong>
                                                                    )}
                                                                    <span className="anotacao-pagina">Página {anotacao.pagina}</span>
                                                                </div>
                                                                <p className="anotacao-conteudo">{anotacao.conteudo}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="sem-anotacoes">Nenhuma anotação para este livro.</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}