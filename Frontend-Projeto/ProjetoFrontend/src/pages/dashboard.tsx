import { useEffect, useState } from "react";
import { Sidebar } from "../components/sidebar";
import {
  BookOpen,
  BookMarked,
  CheckCircle2,
  Circle,
  TrendingUp,
  Star,
  Clock
} from "lucide-react";
import { dashboardService } from "../services/dashboardService";
import type { DashboardResponse, GeneroMaisLido } from "../types/dashboard";
import "../css/dashboard.css";

export function Dashboard() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const handleLogout = () => {
  localStorage.removeItem("token");
  window.location.href = "/login";
};

  useEffect(() => {
    carregarDashboard();
  }, []);

  const carregarDashboard = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await dashboardService.obterDashboard();
      setDashboard(data);
      console.log("Dashboard carregado:", data);
    } catch (err: any) {
      console.error("Erro ao carregar dashboard:", err);
      setError(err.erro || "Erro ao carregar estatísticas");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="biblioteca-container">
        <Sidebar onLogout={handleLogout} active="dashboard" />
        <main className="main-content">
          <div className="loading-container">
            <p>Carregando estatísticas...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="biblioteca-container">
        <Sidebar onLogout={handleLogout} active="dashboard" />
        <main className="main-content">
          <div className="error-container">
            <p>❌ {error}</p>
            <button onClick={carregarDashboard}>Tentar novamente</button>
          </div>
        </main>
      </div>
    );
  }

  if (!dashboard) {
    return null;
  }

  const { estatisticas, generos_mais_lidos, avaliacao_media } = dashboard;

  return (
    <div className="biblioteca-container">
      <Sidebar onLogout={handleLogout} active="dashboard" />

      <main className="main-content">
        <header className="page-header">
          <h1>Dashboard</h1>
          <p>Visão geral da sua biblioteca</p>
        </header>

       
        <div className="dashboard-cards">
          <div className="card">
            <div>
              <p>Total de Leituras</p>
              <h2>{estatisticas.total_leituras}</h2>
            </div>
            <BookOpen size={40} />
          </div>

          <div className="card">
            <div>
              <p>Quero Ler</p>
              <h2>{estatisticas.livros_quero_ler}</h2>
            </div>
            <Circle size={40} />
          </div>

          <div className="card">
            <div>
              <p>Lendo</p>
              <h2>{estatisticas.livros_lendo}</h2>
            </div>
            <BookMarked size={40} />
          </div>

          <div className="card">
            <div>
              <p>Lidos</p>
              <h2>{estatisticas.livros_lidos}</h2>
            </div>
            <CheckCircle2 size={40} />
          </div>
        </div>

        
        <div className="dashboard-cards-secondary">
          <div className="card-secondary">
            <div className="card-icon">
              <TrendingUp size={24} color="#3b82f6" />
            </div>
            <div className="card-info">
              <p>Total de Livros na Biblioteca</p>
              <h3>{estatisticas.total_livros}</h3>
            </div>
          </div>

          <div className="card-secondary">
            <div className="card-icon">
              <Star size={24} color="#fbbf24" />
            </div>
            <div className="card-info">
              <p>Avaliação Média</p>
              <h3>{avaliacao_media.toFixed(1)} / 5.0</h3>
              <div className="stars">
                {"⭐".repeat(Math.round(avaliacao_media))}
              </div>
            </div>
          </div>

          <div className="card-secondary">
            <div className="card-icon">
              <Clock size={24} color="#10b981" />
            </div>
            <div className="card-info">
              <p>Total de Páginas Lidas</p>
              <h3>{estatisticas.total_paginas_lidas.toLocaleString()}</h3>
            </div>
          </div>
        </div>

        
        <div className="filter-card">
          <h2> Gêneros Mais Lidos</h2>
          {generos_mais_lidos.length === 0 ? (
            <p className="empty-message">Nenhum gênero registrado ainda.</p>
          ) : (
            <div className="generos-lista">
              {generos_mais_lidos.map((genero: GeneroMaisLido, index: number) => (
                <div key={genero.genero} className="genre-item">
                  <div className="genre-rank">
                    <span className={`rank-badge rank-${index + 1}`}>
                      {index + 1}º
                    </span>
                    <span className="genre-name">{genero.genero}</span>
                  </div>
                  <div className="genre-count">
                    <span className="count-number">{genero.quantidade}</span>
                    <span className="count-label">
                      {genero.quantidade === 1 ? "livro" : "livros"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      
        <div className="progress-card">
          <h2> Progresso de Leitura</h2>
          <div className="progress-stats">
            <div className="progress-item">
              <div className="progress-label">
                <span>Taxa de conclusão</span>
                <strong>
                  {estatisticas.total_leituras > 0
                    ? Math.round((estatisticas.livros_lidos / estatisticas.total_leituras) * 100)
                    : 0}%
                </strong>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill success"
                  style={{
                    width: `${estatisticas.total_leituras > 0
                      ? (estatisticas.livros_lidos / estatisticas.total_leituras) * 100
                      : 0}%`
                  }}
                />
              </div>
            </div>

            <div className="progress-item">
              <div className="progress-label">
                <span>Em andamento</span>
                <strong>
                  {estatisticas.total_leituras > 0
                    ? Math.round((estatisticas.livros_lendo / estatisticas.total_leituras) * 100)
                    : 0}%
                </strong>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill warning"
                  style={{
                    width: `${estatisticas.total_leituras > 0
                      ? (estatisticas.livros_lendo / estatisticas.total_leituras) * 100
                      : 0}%`
                  }}
                />
              </div>
            </div>

            <div className="progress-item">
              <div className="progress-label">
                <span>Planejados (Quero Ler)</span>
                <strong>
                  {estatisticas.total_leituras > 0
                    ? Math.round((estatisticas.livros_quero_ler / estatisticas.total_leituras) * 100)
                    : 0}%
                </strong>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill info"
                  style={{
                    width: `${estatisticas.total_leituras > 0
                      ? (estatisticas.livros_quero_ler / estatisticas.total_leituras) * 100
                      : 0}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}