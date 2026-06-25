import React, { useState } from "react";

import LivroDetalhesModal from "../components/LivroDetalhesModal";
import LivroService from "../services/livroService";
import { LivroCard } from "../components/LivroCard";

import "../css/LivroCard.css";

import type { Livro } from "../types/livro";

function stringToNumberId(str: string): number {
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }

    return Math.abs(hash);
}

export default function GoogleBooksList() {
    const [query, setQuery] = useState("");
    const [books, setBooks] = useState<Livro[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const [livroSelecionado, setLivroSelecionado] = useState<any>(null);

    const [paginaAtual, setPaginaAtual] = useState(1);

    const livrosPorPagina = 8;

    const totalPaginas = Math.ceil(books.length / livrosPorPagina);

    const indiceInicial = (paginaAtual - 1) * livrosPorPagina;
    const indiceFinal = indiceInicial + livrosPorPagina;

    const livrosDaPagina = books.slice(indiceInicial, indiceFinal);

    const searchBooks = async (e?: React.FormEvent) => {
        if (e) {
            e.preventDefault();
        }

        if (!query.trim()) {
            return;
        }

        setError(null);
        setLoading(true);

        try {
            const livros = await LivroService.buscarGoogleBooks(query);

            console.log("Livros recebidos do backend:", livros);

            setBooks(livros);

           setPaginaAtual(1);
        } catch (err) {
            console.error("Erro ao buscar livros:", err);

            setError("Erro ao buscar livros no backend.");
            setBooks([]);
            setPaginaAtual(1);
        } finally {
            setLoading(false);
        }
    };

    const irParaPaginaAnterior = () => {
        setPaginaAtual((pagina) => Math.max(pagina - 1, 1));
    };

    const irParaProximaPagina = () => {
        setPaginaAtual((pagina) =>
            Math.min(pagina + 1, totalPaginas)
        );
    };

    return (
        <div
            style={{
                border: "2px solid #007bff",
                borderRadius: 8,
                padding: 16,
                background: "#f8f9fa",
                width: "100%",
                boxSizing: "border-box"
            }}
        >
            <div
                style={{
                    marginBottom: 12,
                    color: "#007bff",
                    fontWeight: "bold"
                }}
            >
                Digite um termo e clique em Buscar para ver livros abaixo.
            </div>

            <form
                onSubmit={searchBooks}
                style={{
                    marginBottom: 24,
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap"
                }}
            >
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar livros..."
                    style={{
                        padding: 8,
                        width: 300,
                        border: "1px solid #d1d5db",
                        borderRadius: 6
                    }}
                />

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        padding: "8px 16px",
                        border: "none",
                        borderRadius: 6,
                        background: "#007bff",
                        color: "#ffffff",
                        fontWeight: "bold",
                        cursor: loading ? "not-allowed" : "pointer",
                        opacity: loading ? 0.7 : 1
                    }}
                >
                    {loading ? "Buscando..." : "Buscar"}
                </button>
            </form>

            {error && (
                <div
                    style={{
                        color: "red",
                        marginBottom: 16
                    }}
                >
                    {error}
                </div>
            )}

            {!loading && books.length === 0 && !error && (
                <p
                    style={{
                        color: "#6b7280"
                    }}
                >
                    Faça uma busca para encontrar livros.
                </p>
            )}

            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    alignItems: "stretch",
                    gap: 24,
                    width: "100%"
                }}
            >
                {livrosDaPagina.map((livro, idx) => {
                    const info = (livro as any).volumeInfo || {};

                    const indiceReal = indiceInicial + idx;

                    const livroCorrigido = {
                        id_livro: (livro as any).id
                            ? stringToNumberId((livro as any).id)
                            : indiceReal,

                        id_google: (livro as any).id || "",

                        titulo: info.title || "Sem título",

                        autor: info.authors
                            ? info.authors.join(", ")
                            : "Autor não informado",

                        capa: info.imageLinks?.thumbnail || "",

                        tipo_obra: "unico" as const,

                        num_paginas: info.pageCount || 0,

                        editora: info.publisher || "",

                        genero: info.categories
                            ? info.categories.join(", ")
                            : "",

                        subtitulo: info.subtitle || "",

                        ano_publicacao: info.publishedDate || "",

                        nome_serie: "",

                        descricao: info.description || ""
                    };

                    return (
                        <div
                            key={
                                livroCorrigido.id_google ||
                                livroCorrigido.id_livro
                            }
                            style={{
                                width: 220,
                                display: "flex",
                                flexDirection: "column"
                            }}
                        >
                            <LivroCard
                                livro={livroCorrigido}
                                onClick={() => {
                                    setLivroSelecionado(livroCorrigido);
                                }}
                            />
                        </div>
                    );
                })}
            </div>

            {/* Paginação */}
            {books.length > 0 && totalPaginas > 1 && (
                <div
                    style={{
                        marginTop: 30,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap"
                    }}
                >
                    <button
                        type="button"
                        onClick={irParaPaginaAnterior}
                        disabled={paginaAtual === 1}
                        style={{
                            padding: "8px 14px",
                            border: "none",
                            borderRadius: 6,
                            background:
                                paginaAtual === 1
                                    ? "#d1d5db"
                                    : "#007bff",
                            color: "#ffffff",
                            cursor:
                                paginaAtual === 1
                                    ? "not-allowed"
                                    : "pointer"
                        }}
                    >
                        Anterior
                    </button>

                    {Array.from(
                        { length: totalPaginas },
                        (_, index) => index + 1
                    ).map((numeroPagina) => (
                        <button
                            key={numeroPagina}
                            type="button"
                            onClick={() => setPaginaAtual(numeroPagina)}
                            style={{
                                width: 38,
                                height: 38,
                                border: "none",
                                borderRadius: 6,
                                background:
                                    paginaAtual === numeroPagina
                                        ? "#0056b3"
                                        : "#e5e7eb",
                                color:
                                    paginaAtual === numeroPagina
                                        ? "#ffffff"
                                        : "#1f2937",
                                fontWeight: "bold",
                                cursor: "pointer"
                            }}
                        >
                            {numeroPagina}
                        </button>
                    ))}

                    <button
                        type="button"
                        onClick={irParaProximaPagina}
                        disabled={paginaAtual === totalPaginas}
                        style={{
                            padding: "8px 14px",
                            border: "none",
                            borderRadius: 6,
                            background:
                                paginaAtual === totalPaginas
                                    ? "#d1d5db"
                                    : "#007bff",
                            color: "#ffffff",
                            cursor:
                                paginaAtual === totalPaginas
                                    ? "not-allowed"
                                    : "pointer"
                        }}
                    >
                        Próxima
                    </button>
                </div>
            )}

            {books.length > 0 && (
                <p
                    style={{
                        marginTop: 16,
                        textAlign: "center",
                        color: "#6b7280",
                        fontSize: 14
                    }}
                >
                    Mostrando {indiceInicial + 1} até{" "}
                    {Math.min(indiceFinal, books.length)} de{" "}
                    {books.length} livros
                </p>
            )}

            {livroSelecionado && (
                <LivroDetalhesModal
                    livro={livroSelecionado}
                    onClose={() => setLivroSelecionado(null)}
                />
            )}
        </div>
    );
}