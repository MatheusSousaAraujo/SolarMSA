// src/pages/ConsumidorListPage.jsx (CÓDIGO ATUALIZADO COM NOVO ÍCONE)

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getConsumidores, deleteConsumidor, recoverConsumidor } from '../services/api';
// EyeIcon removido daqui, pois o SVG customizado será usado
import { UserPlusIcon, PencilSquareIcon, TrashIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline'; 
import SplitDropdownButton from '../components/ui/SplitDropdownButton';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import LoadingSpinner from '../components/ui/LoadingSpinner'; 
import EmptyState from '../components/ui/EmptyState'; 

// --- NOVO COMPONENTE SVG CUSTOMIZADO PARA DOCUMENTOS ---
const DocumentViewIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
);
// -----------------------------------------------------

export default function ConsumidorListPage() {
  const navigate = useNavigate();
  const [consumidores, setConsumidores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ativos'); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState(null); 
  
  const fetchConsumidores = useCallback(async (currentFilter) => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error("Token não encontrado"); 
      const data = await getConsumidores(token, currentFilter);
      setConsumidores(data);
    } catch (err) {
      setError(`Falha ao carregar consumidores: ${err.message}`);
      console.error("Erro ao buscar consumidores:", err);
    } finally {
      setLoading(false);
    }
  }, []); 

  useEffect(() => {
    fetchConsumidores(filter);
  }, [filter, fetchConsumidores]); 

  const handleDelete = (consumidorId) => {
    setActionToConfirm({ type: 'delete', id: consumidorId });
    setIsModalOpen(true);
  };

  const handleRecover = (consumidorId) => {
    setActionToConfirm({ type: 'recover', id: consumidorId });
    setIsModalOpen(true);
  };
  
  // Função de navegação para documentos
  const handleViewDocuments = (id) => {
    navigate(`/consumidores/${id}/documentos`);
  };

  const handleConfirmAction = async () => {
    if (!actionToConfirm) return;
    const { type, id } = actionToConfirm;
    const processingId = id; 

    setIsModalOpen(false);
    setActionToConfirm(null);
    setError(''); 

    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error("Token não encontrado");

      if (type === 'delete') {
        await deleteConsumidor(processingId, token);
      } else if (type === 'recover') {
        await recoverConsumidor(processingId, token);
      }
      
      await fetchConsumidores(filter);
      
    } catch (err) {
      await fetchConsumidores(filter); 
      
      setError(`Falha ao ${type === 'delete' ? 'excluir' : 'recuperar'} o consumidor: ${err.message}`);
      console.error(`Erro na ação ${type}:`, err);
    }
  };

  const filterOptions = [
    { label: 'Ativos', action: () => setFilter('ativos') },
    { label: 'Excluídos', action: () => setFilter('excluidos') },
    { label: 'Todos', action: () => setFilter('todos') },
  ];
  const mainButtonAction = (
    <Link to="/consumidores/novo" className="inline-flex items-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-l-lg font-semibold text-white shadow-sm transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
      <UserPlusIcon className="h-5 w-5" />
      <span>Novo</span>
    </Link>
  );

  return (
    <div className="bg-gray-50 p-4 sm:p-6 lg:p-8 min-h-full font-sans">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gerenciamento de Consumidores</h1>
          <p className="mt-1 text-sm text-gray-500">Filtro atual: <span className="font-semibold text-gray-700 capitalize">{filter}</span></p>
        </div>
        <SplitDropdownButton mainAction={mainButtonAction} options={filterOptions} />
      </div>

      {/* Container da Tabela */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {error && <p className="p-4 text-center text-red-600 bg-red-50 border-b border-red-200">{error}</p>}

        {loading ? <LoadingSpinner /> : consumidores.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-xs text-gray-500 uppercase font-medium tracking-wider">
                  <th className="px-6 py-3">Nome</th>
                  <th className="px-6 py-3">Unidade Consumidora</th>
                  <th className="px-6 py-3">Usina Vinculada</th>
                  <th className="px-6 py-3">CPF/CNPJ</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {consumidores.map(consumidor => (
                  <tr key={consumidor.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-800 font-medium">{consumidor.nome}</td>
                    <td className="px-6 py-4 text-gray-600">{consumidor.numero_unidade_consumidora}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {consumidor.usina?.nome || <span className="text-gray-400 font-normal">Não Vinculada</span>}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{consumidor.cpf_cnpj}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        consumidor.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                      }`}>
                        {consumidor.is_active ? 'Ativo' : 'Excluído'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center items-center gap-4">
                        
                        {/* BOTÃO DE DOCUMENTOS COM O NOVO ÍCONE */}
                        <button
                          onClick={() => handleViewDocuments(consumidor.id)}
                          className="text-gray-400 hover:text-purple-600 transition-colors"
                          title="Gerir Documentos"
                        >
                          <DocumentViewIcon className="h-5 w-5" /> {/* ÍCONE SUBSTITUÍDO */}
                        </button>
                        
                        {consumidor.is_active ? (
                          <>
                            <Link
                              to={`/consumidores/editar/${consumidor.id}`}
                              className="text-gray-400 hover:text-blue-600 transition-colors"
                              title="Editar"
                            >
                              <PencilSquareIcon className="h-5 w-5" />
                            </Link>
                            <button
                              onClick={() => handleDelete(consumidor.id)}
                              className="text-gray-400 hover:text-red-600 transition-colors"
                              title="Excluir"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleRecover(consumidor.id)}
                            className="text-gray-400 hover:text-green-600 transition-colors"
                            title="Recuperar"
                          >
                            <ArrowUturnLeftIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState item="consumidores" filter={filter} />
        )}
      </div>

      {/* Modal de Confirmação */}
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmAction}
        title={`Confirmar ${actionToConfirm?.type === 'delete' ? 'Exclusão' : 'Recuperação'}`}
        message={`Você tem certeza que deseja ${actionToConfirm?.type === 'delete' ? 'excluir' : 'recuperar'} este consumidor?`}
      />
    </div>
  );
}