import { useState, useEffect } from "react";
import StatCard from "../components/dashboard/StatCard";
// Importar useNavigate do react-router-dom
import { useNavigate } from 'react-router-dom'; 
// A linha de importação do componente agora está ativa
import RecentInvoicesTable from "../components/dashboard/RecentInvoicesTable"; 
// Importar getUsers para a nova estatística
import { getConsumidores, getUsinas, getUsers } from "../services/api";
// Importar UsersIcon (usado no primeiro card de Consumidores) e ajustando os ícones
import { UsersIcon, BoltIcon, UserIcon } from '@heroicons/react/24/outline'; 

export default function DashboardPage({ onLogout }) {
  // Inicializa a função de navegação
  const navigate = useNavigate();
  
  // Atualizado para incluir total_users
  const [stats, setStats] = useState({ total_consumers: 0, total_usinas: 0, total_users: 0 }); 
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(''); 

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); 
      setError(''); 
      try {
        const token = localStorage.getItem('authToken'); 
        if (!token) { 
          if (onLogout) onLogout(); 
          return; 
        }
        
        // CORRIGIDO: Agora as chamadas usam o filtro para obter APENAS itens ATIVOS
        const [consumidoresData, usinasData, usersData] = await Promise.all([
          // Consumidores Ativos
          getConsumidores(token, 'ativos'),
          // Usinas Ativas
          getUsinas(token, 'ativas'),
          // Usuários Ativos
          getUsers(token, 'ativos'), 
        ]);
        
        setStats({
          total_consumers: consumidoresData.length,
          total_usinas: usinasData.length,
          total_users: usersData.length, 
        }); 

      } catch (error) {
        console.error("Erro ao carregar dados do dashboard:", error); 
        // A mensagem de erro original do dashboard é mantida em caso de falha.
        setError("Não foi possível carregar os dados. Tente novamente mais tarde."); 
      } finally {
        setLoading(false); 
      }
    };

    fetchData(); 
  }, [onLogout]); 

  return (
    <div className="p-4 sm:p-6 lg:p-8"> 
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1> 
      {error && <p className="text-center text-red-500 bg-red-50 p-4 rounded-lg">{error}</p>} 
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"> 
        
        {/* Card 1: Consumidores Ativos */}
        <div 
          onClick={() => navigate('/consumidores')} 
          className="cursor-pointer transition-shadow duration-300 hover:shadow-xl rounded-lg"
        >
          <StatCard 
            title="Consumidores Ativos" 
            value={loading ? '...' : stats.total_consumers} 
            icon={<UsersIcon className="h-6 w-6 text-sky-600" />}
            iconBgColor="bg-sky-100"
          />
        </div>

        {/* Card 2: Usinas Ativas */}
        <div 
          onClick={() => navigate('/usinas')} 
          className="cursor-pointer transition-shadow duration-300 hover:shadow-xl rounded-lg"
        >
          <StatCard 
            title="Usinas Ativas" 
            value={loading ? '...' : stats.total_usinas}
            icon={<BoltIcon className="h-6 w-6 text-amber-600" />}
            iconBgColor="bg-amber-100"
          />
        </div>

        {/* Card 3: Usuários Ativos (AJUSTADO) */}
        <div 
          onClick={() => navigate('/usuarios')} 
          className="cursor-pointer transition-shadow duration-300 hover:shadow-xl rounded-lg"
        >
          <StatCard 
            title="Usuários Ativos" 
            value={loading ? '...' : stats.total_users} 
            icon={<UserIcon className="h-6 w-6 text-purple-600" />} 
            iconBgColor="bg-purple-100"
          />
        </div>
        
      </div>
      <div>
        <RecentInvoicesTable invoices={[]} loading={loading} />
      </div>
    </div>
  );
}