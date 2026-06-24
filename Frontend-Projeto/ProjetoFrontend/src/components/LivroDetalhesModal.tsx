import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import LivroService from "../services/livroService";
import { normalizeImageUrl } from "../utils/imageUrl";

import "../css/LeiturasCard.css";

interface Props {
    livro: any;
    onClose: () => void;
    mostrarAdicionar?: boolean;
}

export default function LivroDetalhesModal({
    livro,
    onClose,
    mostrarAdicionar = true
}: Props) {
    const navigate = useNavigate();

    const adicionarLivro = async () => {
    try {
        await LivroService.criar({
            titulo: livro.titulo,
            autor: livro.autor,
            genero: livro.genero || "",
            editora: livro.editora || "",
            capa: livro.capa || "",
            status: "Quero Ler",
            avaliacao: 0
        });

        await Swal.fire(
            "Sucesso!",
            "Livro adicionado à biblioteca.",
            "success"
        );

        navigate("/biblioteca");
    } catch (err: any) {
        Swal.fire(
            "Erro",
            err?.response?.data?.message ||
                "Não foi possível adicionar o livro.",
            "error"
        );
    }
};
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content-large"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="modal-header">
                    <h2>{livro.titulo}</h2>

                    <p>
                        <strong>Autor:</strong>{" "}
                        {livro.autor || "Não informado"}
                    </p>
                </div>

                <div
                    style={{
                        display: "flex",
                        gap: "30px",
                        marginBottom: "25px",
                        flexWrap: "wrap"
                    }}
                >
                    {livro.capa ? (
                        <img
                            src={normalizeImageUrl(livro.capa)}
                            alt={livro.titulo}
                            style={{
                                width: "220px",
                                maxHeight: "330px",
                                objectFit: "cover",
                                borderRadius: "10px"
                            }}
                        />
                    ) : (
                        <div
                            style={{
                                width: "220px",
                                height: "330px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "#f3f4f6",
                                borderRadius: "10px",
                                fontSize: "70px"
                            }}
                        >
                            📖
                        </div>
                    )}

                    <div>
                        <p>
                            <strong>Editora:</strong>{" "}
                            {livro.editora || "Não informada"}
                        </p>

                        <p>
                            <strong>Páginas:</strong>{" "}
                            {livro.num_paginas || "Não informado"}
                        </p>

                        <p>
                            <strong>Gênero:</strong>{" "}
                            {livro.genero || "Não informado"}
                        </p>

                        <p>
                            <strong>Ano:</strong>{" "}
                            {livro.ano_publicacao || "Não informado"}
                        </p>

                        {livro.subtitulo && (
                            <p>
                                <strong>Subtítulo:</strong>{" "}
                                {livro.subtitulo}
                            </p>
                        )}

                        {livro.nome_serie && (
                            <p>
                                <strong>Série:</strong>{" "}
                                {livro.nome_serie}
                            </p>
                        )}
                    </div>
                </div>

                <div className="anotacoes-section">
                    <h3>Sinopse</h3>

                    <div className="anotacao-item">
                        <p>
                            {livro.descricao ||
                                "Sem descrição disponível."}
                        </p>
                    </div>
                </div>

                <div className="modal-footer">
                    {mostrarAdicionar && (
                        <button
                            style={{
                                background: "#3b82f6",
                                marginRight: "10px"
                            }}
                            onClick={adicionarLivro}
                        >
                            Adicionar à Biblioteca
                        </button>
                    )}

                    <button onClick={onClose}>
                        Voltar
                    </button>
                </div>
            </div>
        </div>
    );
}