import { useState, useEffect } from "react";
import { Sidebar } from "../components/sidebar";
import { LivroCard } from "../components/LivroCard";
import { leituraService } from "../services/leituraService";
import { anotacaoService } from "../services/anotacaoService";
import type { Anotacao } from "../types/anotacao";
import type { Leitura, StatusLeitura } from "../types/leitura";
import { showErrorToast, showSuccessToast, showWarningToast, showConfirmDialog } from "../utils/alertUtils";
import "../css/tags.css";
import "../css/leitura.css";


import { TagsManager } from "../components/TagsManager";
import { tagService } from "../services/tagsService";
import type { Tag } from "../types/tags";


export default function LeiturasPage() {
  const [leituras, setLeituras] = useState<Leitura[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [mostrarModalTags, setMostrarModalTags] = useState(false);
  const [loading, setLoading] = useState(true);
  // const [error, setError] = useState(""); // Removido pois não está sendo utilizado
  const [livroSelecionado, setLivroSelecionado] = useState<Leitura | null>(null);
  const [statusNovo, setStatusNovo] = useState<StatusLeitura | "">("");
  const [avaliacao, setAvaliacao] = useState(0);
  const [resenha, setResenha] = useState("");
  const [aguardandoAvaliacao, setAguardandoAvaliacao] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);


  const [anotacoes, setAnotacoes] = useState<Anotacao[]>([]);
  const [paginaSelecionada, setPaginaSelecionada] = useState<number>(1);
  const [novaAnotacao, setNovaAnotacao] = useState({ titulo: "", conteudo: "" });
  const [editandoAnotacao, setEditandoAnotacao] = useState<Anotacao | null>(null);
  const [mostrarFormAnotacao, setMostrarFormAnotacao] = useState(false);
  const [carregandoAnotacoes, setCarregandoAnotacoes] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<"progresso" | "anotacoes" | "tags">("progresso");



  useEffect(() => {
    carregarLeituras();
    carregarTags();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const carregarTags = async () => {
    try {
      const response = await tagService.listarTags();
      setTags(response.tags);
    } catch (err: any) {
      showErrorToast("Erro ao carregar tags");
    }
  };

  const carregarLeituras = async () => {
    setLoading(true);

    try {
      const leiturasEmAndamento = await leituraService.listarLeiturasEmAndamento();
      setLeituras(leiturasEmAndamento);
    } catch (err: any) {
      showErrorToast("Erro ao carregar leituras:");

    } finally {
      setLoading(false);
    }
  };



  const handleAbrirModal = async (leitura: Leitura) => {
    setLivroSelecionado(leitura);
    setPaginaAtual(leitura.pagina_atual || 0);
    setTotalPaginas(leitura.livro?.num_paginas || 0);
    setPaginaSelecionada(leitura.pagina_atual || 1);
    setStatusNovo("");
    setAvaliacao(0);
    setResenha("");
    setAbaAtiva("progresso");
    await carregarAnotacoes(leitura.id_leitura, leitura.pagina_atual || 1);
  };





  const carregarAnotacoes = async (id_leitura: number, pagina: number) => {
    setCarregandoAnotacoes(true);
    try {
      const response = await anotacaoService.buscarPorPagina(id_leitura, pagina);
      setAnotacoes(response.anotacoes);
    } catch (err) {
      showErrorToast("Erro ao carregar anotações");
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
      showWarningToast("O conteúdo da anotação é obrigatório");
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
      showSuccessToast("Anotação criada com sucesso!");
    } catch (err: any) {
      showErrorToast("Erro ao criar anotação");
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
      showSuccessToast("Anotação atualizada com sucesso!");
    } catch (err: any) {
      showErrorToast("Erro ao atualizar anotação");
    }
  };

  const handleDeletarAnotacao = async (id: number) => {
    if (!await showConfirmDialog("", "Tem certeza que deseja excluir esta anotação?")) return;

    try {
      await anotacaoService.deletarAnotacao(id);

      if (livroSelecionado) {
        await carregarAnotacoes(livroSelecionado.id_leitura, paginaSelecionada);
      }

      showSuccessToast("Anotação excluída com sucesso!");
    } catch (err: any) {
      showErrorToast("Erro ao excluir anotação");
    }
  };

  const handleAtualizarProgresso = async () => {
    if (!livroSelecionado) return;

    try {
      console.log({
        pagina_atual: paginaAtual,
        status: statusNovo as StatusLeitura || livroSelecionado.status
      });

      await leituraService.atualizarProgresso(livroSelecionado.id_leitura, {
        pagina_atual: paginaAtual,
        status: statusNovo as StatusLeitura || livroSelecionado.status
      });

      await carregarLeituras();
      setLivroSelecionado(null);
      showSuccessToast("Progresso atualizado com sucesso!");
    } catch (err: any) {
      showErrorToast("Erro ao atualizar progresso");
    }
  };


  const handleConfirmarLido = async () => {
    if (!livroSelecionado) return;
    try {
      await leituraService.atualizarProgresso(livroSelecionado.id_leitura, {
        pagina_atual: paginaAtual,
        status: 'lido'
      });
      setAguardandoAvaliacao(true);
      showSuccessToast("Status alterado para lido! Agora avalie o livro.");
    } catch (err: any) {
      showErrorToast("Erro ao marcar como lido");
    }
  };


  const handleAvaliarLivro = async () => {
    if (!livroSelecionado) return;
    try {
      await leituraService.avaliarLeitura(livroSelecionado.id_leitura, {
        avaliacao,
        resenha
      });
      await carregarLeituras();
      setLivroSelecionado(null);
      setStatusNovo("");
      setAguardandoAvaliacao(false);
      showSuccessToast("Livro avaliado com sucesso!");
    } catch (err: any) {
      showErrorToast("Erro ao avaliar livro");
    }
  };

  const handleAbandonar = async () => {
    if (!livroSelecionado) return;

    try {
      await leituraService.atualizarProgresso(livroSelecionado.id_leitura, {
        pagina_atual: paginaAtual,
        status: 'abandonado'
      });

      await carregarLeituras();
      setLivroSelecionado(null);
      showSuccessToast("Leitura abandonada!");
    } catch (err: any) {
      showErrorToast("Erro ao abandonar leitura");
    }
  };

  if (loading) {
    return (
      <div className="biblioteca-container">
        <Sidebar onLogout={handleLogout} active="leitura" />
        <main className="main-content">
          <div style={{ textAlign: "center", padding: "50px" }}>
            Carregando suas leituras...
          </div>
        </main>
      </div>
    );
  }



  return (
    <div className="biblioteca-container">
      <Sidebar onLogout={handleLogout} active="leitura" />

      <main className="main-content">
        <header className="page-header">
          <h1>Minhas Leituras</h1>
          <p>{leituras.length} livro(s) em leitura</p>
        </header>




        <button
          className="btn-nova-tag"
          onClick={() => setMostrarModalTags(true)}
        >
          Gerenciar Tags
        </button>

        <TagsManager
          tags={tags}
          setTags={setTags}
          mostrarModalTags={mostrarModalTags}
          setMostrarModalTags={setMostrarModalTags}
        />

        <div className="books-grid">
          {leituras.length === 0 ? (
            <p>Nenhum livro em leitura. Comece uma nova leitura na biblioteca!</p>
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
                  genero: leitura.livro?.genero || "",
                  avaliacao: leitura.avaliacao || 0,
                  capa: leitura.livro?.capa || "",
                  status: leitura.status
                }}
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


              <div className="tags-vinculadas-container">
                <h4>Tags:</h4>
                <div className="tags-vinculadas-lista">
                  {tags.length === 0 && <span style={{ color: '#888' }}>Nenhuma tag cadastrada.</span>}
                  {tags.map(tag => {
                    const vinculada = !!livroSelecionado?.tags?.some((t: Tag) => t.id_tag === tag.id_tag);
                    return (
                      <div key={tag.id_tag} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          className="tag-badge-small"
                          style={{ backgroundColor: tag.cor, opacity: vinculada ? 1 : 0.5, padding: '4px 10px', borderRadius: '16px', color: '#fff', fontWeight: 500, fontSize: 13, border: 'none', cursor: 'pointer' }}
                          title={vinculada ? 'Desvincular ou vincular tag' : 'Vincular tag ao livro'}
                          onClick={async () => {

                            if (!livroSelecionado) return;
                            console.log('tag', tag.nome, vinculada)
                            const { value } = await import('../utils/alertUtils').then(m => m.showTagActionDialog(tag.nome, vinculada));

                            if (value === 'vincular' && !vinculada) {
                              try {

                                await tagService.vincularTag(tag.id_tag, livroSelecionado.id_leitura);
                                setLivroSelecionado({
                                  ...livroSelecionado,
                                  tags: [...(livroSelecionado.tags || []), tag]
                                });
                                showSuccessToast('Tag vinculada ao livro!');
                              } catch (err: any) {
                                alert(err.erro || 'Erro ao vincular tag');
                              }
                            } else if (value === 'desvincular' && vinculada) {
                              try {

                                await tagService.removerTag(tag.id_tag, livroSelecionado.id_leitura);
                                setLivroSelecionado({
                                  ...livroSelecionado,
                                  tags: (livroSelecionado.tags || []).filter((t: Tag) => t.id_tag !== tag.id_tag)
                                });
                                showSuccessToast('Tag desvinculada do livro!');
                              } catch (err: any) {
                                alert(err.erro || 'Erro ao desvincular tag');
                              }
                            }
                          }}
                        >
                          {tag.nome}
                        </button>
                        {vinculada && (
                          <button
                            className="btn btn-delete"
                            style={{ padding: '0px 6px', fontSize: 10, margin: 0, height: 22, lineHeight: '18px', minWidth: 0 }}
                            title="Desvincular tag deste livro"
                            onClick={async () => {
                              console.log('chamada 1')
                              if (!livroSelecionado) return;
                              console.log('chamada 2')
                              try {
                                await tagService.removerTag(tag.id_tag, livroSelecionado.id_leitura);
                                setLivroSelecionado({
                                  ...livroSelecionado,
                                  tags: (livroSelecionado.tags || []).filter((t: Tag) => t.id_tag !== tag.id_tag)
                                });
                                setTimeout(() => showSuccessToast('Tag desvinculada do livro!'), 0);
                              } catch (err: any) {
                                alert(err.erro || 'Erro ao desvincular tag');
                              }
                            }}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="tabs">
                <button
                  className={abaAtiva === "progresso" ? "tab-active" : "tab"}
                  onClick={() => setAbaAtiva("progresso")}
                >
                  Progresso
                </button>
                <button
                  className={abaAtiva === "anotacoes" ? "tab-active" : "tab"}
                  onClick={() => setAbaAtiva("anotacoes")}
                >
                  Anotações ({anotacoes.length})
                </button>
              </div>


              {abaAtiva === "progresso" && (
                <div className="tab-content">
                  <div className="progress-info">
                    <p><strong>Progresso:</strong> {paginaAtual} / {totalPaginas} páginas</p>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${(paginaAtual / totalPaginas) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label>Página atual:</label>
                    <input
                      type="number"
                      value={paginaAtual}
                      onChange={(e) => setPaginaAtual(Number(e.target.value))}
                      min={0}
                      max={totalPaginas}
                    />
                  </div>

                  {!statusNovo && (
                    <>
                      <p>O que deseja fazer?</p>
                      <div className="button-group">
                        <button onClick={() => setStatusNovo("lido")}>
                          Marcar como Lido
                        </button>
                        <button onClick={() => setStatusNovo("abandonado")}>
                          Abandonar
                        </button>
                        <button onClick={handleAtualizarProgresso}>
                          Atualizar Progresso
                        </button>
                      </div>
                    </>
                  )}

                  {statusNovo === "lido" && !aguardandoAvaliacao && (
                    <>
                      <p>Tem certeza que deseja marcar este livro como lido?</p>
                      <button onClick={handleConfirmarLido}>Sim, marcar como lido</button>
                      <button onClick={() => setStatusNovo("")}>Cancelar</button>
                    </>
                  )}

                  {statusNovo === "lido" && aguardandoAvaliacao && (
                    <>
                      <p>Avaliação (0-5):</p>
                      <div className="avaliacao-buttons">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            className={avaliacao === n ? "active" : ""}
                            onClick={() => setAvaliacao(n)}
                          >
                            {n} ⭐
                          </button>
                        ))}
                      </div>

                      <div className="input-group">
                        <label>Resenha (opcional):</label>
                        <textarea
                          value={resenha}
                          onChange={(e) => setResenha(e.target.value)}
                          rows={3}
                          placeholder="Escreva sua resenha aqui..."
                        />
                      </div>

                      <button onClick={handleAvaliarLivro}>Salvar Avaliação</button>
                    </>
                  )}

                  {statusNovo === "abandonado" && (
                    <button onClick={handleAbandonar}>Confirmar Abandono</button>
                  )}
                </div>
              )}


              {abaAtiva === "anotacoes" && (
                <div className="tab-content">
                  <div className="pagina-navegacao">
                    <button
                      onClick={() => handlePaginaChange(paginaSelecionada - 1)}
                      disabled={paginaSelecionada <= 1}
                    >
                      ◀ Página {paginaSelecionada - 1}
                    </button>
                    <span>Página {paginaSelecionada}</span>
                    <button
                      onClick={() => handlePaginaChange(paginaSelecionada + 1)}
                      disabled={paginaSelecionada >= totalPaginas}
                    >
                      Página {paginaSelecionada + 1} ▶
                    </button>
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
                                placeholder="Título"
                                value={editandoAnotacao.titulo || ""}
                                onChange={(e) => setEditandoAnotacao({
                                  ...editandoAnotacao,
                                  titulo: e.target.value
                                })}
                              />
                              <textarea
                                placeholder="Conteúdo"
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
                              <div className="anotacao-botoes">
                                <button onClick={() => setEditandoAnotacao(anotacao)}>Editar</button>
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
                        <button onClick={handleCriarAnotacao}>Salvar</button>
                        <button onClick={() => {
                          setMostrarFormAnotacao(false);
                          setNovaAnotacao({ titulo: "", conteudo: "" });
                        }}>Cancelar</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="modal-footer">
                <button onClick={() => setLivroSelecionado(null)}>Fechar</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );


}