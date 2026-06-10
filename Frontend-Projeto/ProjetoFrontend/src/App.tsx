import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { Login } from './pages/login';
import { Cadastro } from './pages/cadastro';
import  Home  from './pages/home'; 
import { Biblioteca } from './pages/biblioteca';
import { EditarLivro } from './pages/EditarLivro';
import { Dashboard } from './pages/dashboard';
import LeiturasPage from "./pages/leituras";
import { MeuPerfil } from "./pages/MeuPerfil";
import { CadastroLivro } from "./pages/CadastroLivro";
import { AnotacoesResenhas } from "./pages/AnotacoesResenhas";

import { authService } from './services/authService';


function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = authService.isAuthenticated();
  console.log('Verificando autenticação:', isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/biblioteca" element={<Biblioteca />} />
        <Route path="/leitura" element={<LeiturasPage />} />
        <Route path="/CadastroLivro" element={<CadastroLivro />} />
        <Route path="/MeuPerfil" element={<MeuPerfil />} />
        <Route path="/EditarLivro" element={<EditarLivro />} />
        <Route path="/anotacoes-resenhas" element={<AnotacoesResenhas />} />


        <Route
          path="/home"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />

        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;