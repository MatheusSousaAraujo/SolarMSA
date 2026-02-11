// src/pages/LoginPage.jsx
import { useState } from 'react';
import { loginUser } from '../services/api';

export default function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // Estado para feedback de carregamento

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await loginUser({ username, password });
      if (data.access_token) {
        onLoginSuccess(data.access_token);
      }
    } catch (err) {
      setError(err.message || 'Ocorreu um erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // Fundo cinza claro que preenche a tela
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo ou Título da Aplicação */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">Solar MSA</h1>
          <p className="text-gray-500">Bem-vindo de volta! Faça login para continuar.</p>
        </div>
        
        {/* Card de login branco com sombra sutil */}
        <div className="p-8 bg-white rounded-xl border border-gray-200 shadow-sm">
          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label htmlFor="username" className="block mb-2 text-sm font-medium text-gray-700">Usuário (Email)</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="seu@email.com"
                required
              />
            </div>
            <div className="mb-6">
              <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-700">Senha</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="••••••••"
                required
              />
            </div>
            {error && <p className="text-red-600 text-sm text-center mb-4">{error}</p>}
            <button
              type="submit"
              disabled={loading} // Desabilita o botão durante o carregamento
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-white shadow-sm transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}