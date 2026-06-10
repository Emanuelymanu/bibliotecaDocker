import Swal from "sweetalert2";
// Função para adicionar livro à biblioteca
import { useNavigate } from "react-router-dom";

const adicionarLivro = async (livro: any, navigate?: (path: string) => void) => {
    try {
        // Monta o objeto esperado pelo backend (LivroInput)
        const livroParaCadastro = {
            id_google: livro.id_google || livro.id, // Garante o envio do id_google
            titulo: livro.titulo,
            autor: livro.autor,
            genero: livro.genero || "",
            tipo_obra: livro.tipo_obra,
            num_paginas: String(livro.num_paginas || ""),
            subtitulo: livro.subtitulo || "",
            nome_serie: livro.nome_serie || "",
            ano_publicacao: livro.ano_publicacao ? String(livro.ano_publicacao) : "",
            editora: livro.editora || "",
            status: "Quero Ler" as "Quero Ler",
            avaliacao: 0,
            capa: livro.capa || ""
        };
        await LivroService.criar(livroParaCadastro);
        await Swal.fire({
            title: "Sucesso!",
            text: "Livro adicionado à sua biblioteca!",
            icon: "success",
            confirmButtonText: "Ir para a biblioteca",
            confirmButtonColor: "#3b82f6"
        });
        if (navigate) navigate("/biblioteca");
    } catch (err: any) {
        if (err?.response?.status === 409) {
            Swal.fire("Atenção", err?.response?.data?.message || "Este livro já está na sua estante!", "info");
        } else {
            Swal.fire("Erro", err?.response?.data?.message || "Erro ao adicionar livro.", "error");
        }
    }
};
// Gera um id numérico a partir do id string do Google Books
function stringToNumberId(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}
import React, { useState } from "react";
import LivroService from "../services/livroService";
import { LivroCard } from "../components/LivroCard";
import "../css/LivroCard.css";

import type { Livro } from "../types/livro";


export default function GoogleBooksList() {
    const [query, setQuery] = useState(""); // campo vazio por padrão
    const [books, setBooks] = useState<Livro[]>([]);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const searchBooks = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!query) return;
        setError(null);
        try {
            const livros = await LivroService.buscarGoogleBooks(query);
            console.log('Livros recebidos do backend:', livros);
            setBooks(livros);
        } catch (err) {
            setError("Erro ao buscar livros no backend.");
            setBooks([]);
        }
    };

    return (
        <div style={{ border: '2px solid #007bff', borderRadius: 8, padding: 16, background: '#f8f9fa' }}>
            <div style={{ marginBottom: 12, color: '#007bff', fontWeight: 'bold' }}>
                Digite um termo e clique em Buscar para ver livros do Google Books abaixo.
            </div>
            <form onSubmit={searchBooks} style={{ marginBottom: 24 }}>
                <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Buscar livros no Google Books..."
                    style={{ padding: 8, width: 300 }}
                />
                <button type="submit" style={{ marginLeft: 8, padding: 8 }}>
                    Buscar
                </button>
            </form>
            {error && (
                <div style={{ color: 'red', marginBottom: 16 }}>
                    {error}
                </div>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                {books.map((livro, idx) => {
                    // Se vier no formato Google Books, faz o mapeamento
                    const info = (livro as any).volumeInfo || {};
                    const livroCorrigido = {
                        id_livro: (livro as any).id ? stringToNumberId((livro as any).id) : idx,
                        id_google: (livro as any).id || undefined,
                        titulo: info.title || "Sem título",
                        autor: info.authors ? info.authors.join(", ") : "",
                        capa: info.imageLinks?.thumbnail,
                        tipo_obra: "unico" as const,
                        num_paginas: info.pageCount || 0,
                        editora: info.publisher || "",
                        genero: info.categories ? info.categories.join(", ") : "",
                    };
                    return (
                        <div key={livroCorrigido.id_livro} style={{ position: "relative" }}>
                            <LivroCard
                                livro={livroCorrigido}
                                onClick={() => { }}
                            />
                            <button
                                style={{
                                    position: "absolute",
                                    bottom: 8,
                                    right: 8,
                                    background: "#007bff",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: 4,
                                    padding: "6px 12px",
                                    cursor: "pointer",
                                    fontWeight: "bold"
                                }}
                                onClick={() => adicionarLivro(livroCorrigido, navigate)}
                            >
                                Adicionar à biblioteca
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
