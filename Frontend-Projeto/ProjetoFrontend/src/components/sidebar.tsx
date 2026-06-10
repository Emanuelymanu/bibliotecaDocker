import {
  Home,
  LayoutDashboard,
  Library,
  BookPlus,
  User,
  LogOut,
  BookOpen,
  Menu
} from "lucide-react";

import { Link } from "react-router-dom";
import { useState } from "react";
import "../css/sidebar.css";

interface SidebarProps {
  onLogout: () => void;
  active: string;
}

export function Sidebar({ onLogout, active }: SidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="hamburger" onClick={() => setOpen(!open)}>
        <Menu size={24} />
      </button>

      {open && <div className="overlay" onClick={() => setOpen(false)} />}

      <aside className={`sidebar ${open ? "open" : ""}`}>

        <div className="sidebar-header">
          <BookOpen size={28} color="#1d4ed8" />
          <h2>Diário Digital</h2>
        </div>

        <nav className="sidebar-menu">
          <Link to="/home" className={`menu-item ${active === "home" ? "active" : ""}`}>
            <Home size={20} /> <span>Início</span>
          </Link>

          <Link to="/dashboard" className={`menu-item ${active === "dashboard" ? "active" : ""}`}>
            <LayoutDashboard size={20} /> <span>Dashboard</span>
          </Link>

          <Link to="/biblioteca" className={`menu-item ${active === "biblioteca" ? "active" : ""}`}>
            <Library size={20} /> <span>Biblioteca</span>
          </Link>

          <Link to="/CadastroLivro" className={`menu-item ${active === "CadastroLivro" ? "active" : ""}`}>
            <BookPlus size={20} /> <span>Cadastrar</span>
          </Link>

          <Link to="/leitura" className={`menu-item ${active === "leitura" ? "active" : ""}`}>
            <BookOpen size={20} /> <span>Leituras</span>
          </Link>

          <Link to="/anotacoes-resenhas" className={`menu-item ${active === "anotacoes-resenhas" ? "active" : ""}`}>
            <BookOpen size={20} /> <span>Anotações</span>
          </Link>

          <Link to="/MeuPerfil" className={`menu-item ${active === "MeuPerfil" ? "active" : ""}`}>
            <User size={20} /> <span>Conta</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <button onClick={onLogout} className="menu-item logout">
            <LogOut size={20} /> <span>Sair</span>
          </button>
        </div>

      </aside>
    </>
  );
}