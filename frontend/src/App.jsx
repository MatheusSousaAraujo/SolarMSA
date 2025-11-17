import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Outlet } from 'react-router-dom';

// Páginas de Login e Layout
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/dashboard/DashboardLayout';

// Páginas Principais do Dashboard
import DashboardPage from './pages/DashboardPage';
import UsersListPage from './pages/UsersListPage';
import UserFormPage from './pages/UserFormPage';
import ConsumidorListPage from "./pages/ConsumidorListPage"; // Nome correto da lista
import ConsumidorFormPage from './pages/ConsumidorFormPage'; // Importar página do formulário
import UsinasListPage from './pages/UsinasListPage';
import UsinaFormPage from './pages/UsinaFormPage';
import UsinaConsumidoresPage from './pages/UsinaConsumidoresPage';
import DocumentosFormPage from './pages/DocumentosFormPage'; // <<< CORREÇÃO: Importar o componente
import RelatorioViewerPage from './pages/RelatorioViewerPage';
import './index.css';

// Componente Wrapper para usar o hook useNavigate
function AppWrapper() {
    const [token, setToken] = useState(localStorage.getItem('authToken'));
    const navigate = useNavigate();

    const handleLoginSuccess = (newToken) => {
        setToken(newToken);
        localStorage.setItem('authToken', newToken);
        navigate('/');
    };

    const handleLogout = () => {
        setToken(null);
        localStorage.removeItem('authToken');
        navigate('/login');
    };

    return (
        <Routes>
            {/* Rota de Login */}
            <Route
                path="/login"
                element={!token ? <LoginPage onLoginSuccess={handleLoginSuccess} /> : <Navigate replace to="/" />}
            />

            {/* Rotas Protegidas do Dashboard (CORREÇÃO DE ESTRUTURA) */}
            <Route
                path="/"
                element={token ? <DashboardLayout onLogout={handleLogout} /> : <Navigate replace to="/login" />}
            >
                {/* 1. Rota Index (página inicial do dashboard) */}
                <Route index element={<DashboardPage />} />

                {/* 2. Rotas de Usuários */}
                <Route path="usuarios" element={<UsersListPage />} />
                <Route path="usuarios/novo" element={<UserFormPage />} />
                <Route path="usuarios/editar/:userId" element={<UserFormPage />} />

                {/* 3. Rotas de Usinas */}
                <Route path="usinas" element={<UsinasListPage />} />
                <Route path="usinas/novo" element={<UsinaFormPage />} />
                <Route path="usinas/editar/:usinaId" element={<UsinaFormPage />} />
                
                {/* ROTA PARA DETALHE DE USINA/CONSUMIDORES (Já estava aqui) */}
                <Route path="usinas/:usinaId/consumidores" element={<UsinaConsumidoresPage />} />


                {/* 4. ROTAS DE CONSUMIDORES */}
                <Route path="consumidores" element={<ConsumidorListPage />} />
                <Route path="consumidores/novo" element={<ConsumidorFormPage />} />
                <Route path="consumidores/editar/:consumidorId" element={<ConsumidorFormPage />} />
                <Route path="relatorios/:relatorioId" element={<RelatorioViewerPage />} />

                {/* <<< CORREÇÃO PRINCIPAL: ROTA DOCUMENTOS MOVIDA PARA A ÁREA PROTEGIDA >>> */}
                <Route
                    path="consumidores/:consumidorId/documentos" 
                    element={<DocumentosFormPage />} 
                />
                
            </Route> {/* Fim da Rota Protegida com DashboardLayout */}

            {/* Rota "Catch-all" para qualquer outro caminho não encontrado */}
            {/* Esta deve ser sempre a última rota */}
            <Route path="*" element={<Navigate replace to={token ? "/" : "/login"} />} />
        </Routes>
    );
}

// O componente principal agora envolve o AppWrapper com o BrowserRouter
function App() {
    return (
        <BrowserRouter>
            <AppWrapper />
        </BrowserRouter>
    );
}

export default App;