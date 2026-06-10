import { useState } from "react";
import type { Tag } from "../types/tags";
import { tagService } from "../services/tagsService";
import { showErrorToast, showSuccessToast, showWarningToast } from '../utils/alertUtils';



const coresDisponiveis = [
    "#3b82f6", "#ef4444", "#f59e42", "#fbbf24", "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#6366f1", "#a21caf", "#f472b6", "#64748b"
];


export function TagsManager({ tags, setTags, mostrarModalTags, setMostrarModalTags }: {
    tags: Tag[];
    setTags: (tags: Tag[]) => void;
    mostrarModalTags: boolean;
    setMostrarModalTags: (show: boolean) => void;
}) {
    const [novaTag, setNovaTag] = useState({ nome: "", cor: "#3b82f6" });
    const [editandoTag, setEditandoTag] = useState<Tag | null>(null);

    const handleCriarTag = async () => {
        if (!novaTag.nome.trim()) {
            showWarningToast("Digite um nome para a tag");
            return;
        }
        try {
            const tag = await tagService.criarTag({
                nome: novaTag.nome.trim(),
                cor: novaTag.cor
            });
            setTags([...tags, tag]);
            setNovaTag({ nome: "", cor: "#3b82f6" });
            
        } catch (err: any) {
            showErrorToast( "Erro ao criar tag");
        }
    };

    const handleAtualizarTag = async () => {
        if (!editandoTag) return;
        try {
            const tag = await tagService.atualizarTag(editandoTag.id_tag, {
                nome: editandoTag.nome,
                cor: editandoTag.cor
            });
            setTags(tags.map(t => t.id_tag === tag.id_tag ? tag : t));
            setEditandoTag(null);
            showSuccessToast("Tag atualizada com sucesso!");
        } catch (err: any) {
            showErrorToast( "Erro ao atualizar tag");
        }
    };

    const handleDeletarTag = async (id: number) => {
        if (!confirm("Tem certeza que deseja excluir esta tag?")) return;
        try {
            await tagService.deletarTag(id);
            setTags(tags.filter(t => t.id_tag !== id));
            showSuccessToast("Tag excluída com sucesso!");
        } catch (err: any) {
            showErrorToast("Erro ao excluir tag");
        }
    };

    if (!mostrarModalTags) return null;

    return (
        <div className="modal-overlay" onClick={() => setMostrarModalTags(false)}>
            <div className="modal-content-tags" onClick={e => e.stopPropagation()}>
                <h2>Gerenciar Tags</h2>
                <div className="criar-tag-form">
                    <input
                        type="text"
                        placeholder="Nome da tag"
                        value={novaTag.nome}
                        onChange={e => setNovaTag({ ...novaTag, nome: e.target.value })}
                    />
                    <div className="cores-selecao">
                        {coresDisponiveis.map(cor => (
                            <button
                                key={cor}
                                className={`cor-opcao ${novaTag.cor === cor ? "selected" : ""}`}
                                style={{ backgroundColor: cor }}
                                onClick={() => setNovaTag({ ...novaTag, cor })}
                            />
                        ))}
                    </div>
                    <button onClick={handleCriarTag}>Criar Tag</button>
                </div>
                <div className="tags-lista-gerenciamento">
                    <h3>Suas Tags</h3>
                    <div className="tags-grid">
                        {tags.map(tag => (
                            <div key={tag.id_tag} className="tag-gerenciamento-item">
                                {editandoTag?.id_tag === tag.id_tag ? (
                                    <div className="tag-edicao">
                                        <input
                                            type="text"
                                            value={editandoTag.nome}
                                            onChange={e => setEditandoTag({ ...editandoTag, nome: e.target.value })}
                                        />
                                        <div className="cores-selecao">
                                            {coresDisponiveis.map(cor => (
                                                <button
                                                    key={cor}
                                                    className={`cor-opcao ${editandoTag.cor === cor ? "selected" : ""}`}
                                                    style={{ backgroundColor: cor }}
                                                    onClick={() => setEditandoTag({ ...editandoTag, cor })}
                                                />
                                            ))}
                                        </div>
                                        <button onClick={handleAtualizarTag}>Salvar</button>
                                        <button onClick={() => setEditandoTag(null)}>Cancelar</button>
                                    </div>
                                ) : (
                                    <>
                                        <span className="tag-badge" style={{ backgroundColor: tag.cor }}>{tag.nome}</span>
                                        <div className="tag-acoes">
                                            <button onClick={() => setEditandoTag(tag)}>Editar</button>
                                            <button onClick={() => handleDeletarTag(tag.id_tag)}>Excluir</button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
                <button onClick={() => setMostrarModalTags(false)}>Fechar</button>
            </div>
        </div>
    );
}
