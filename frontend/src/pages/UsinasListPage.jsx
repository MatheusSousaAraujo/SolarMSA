// src/pages/UsinasListPage.jsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUsinas, deleteUsina, recoverUsina } from '../services/api';
import { BuildingStorefrontIcon, PencilSquareIcon, TrashIcon, ArrowUturnLeftIcon, UsersIcon } from '@heroicons/react/24/outline';

import SplitDropdownButton from '../components/ui/SplitDropdownButton';
import ConfirmationModal from '../components/ui/ConfirmationModal';

function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center py-20">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
    </div>
  );
}

function EmptyState({ filter }) {
  const messages = {
    ativas: "Nenhuma usina ativa.",
    excluidas: "Nenhuma usina na lixeira.",
    todas: "Não há usinas cadastradas."
  };
  return (
    <div className="text-center py-16 px-4">
      <h3 className="text-lg font-semibold text-gray-800">Nenhum Resultado</h3>
      <p className="text-gray-500 mt-1">{messages[filter]}</p>
    </div>
  );
}

export default function UsinasListPage() {
  const [usinas, setUsinas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ativas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState(null);

  useEffect(() => {
    const fetchUsinas = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('authToken');
        const data = await getUsinas(token, filter);
        setUsinas(data);
      } catch (err) {
        setError('Falha ao carregar usinas.');
      } finally {
        setLoading(false);
      }
    };
    fetchUsinas();
  }, [filter]);

  const handleDelete = (usinaId) => {
    setActionToConfirm({ type: 'delete', id: usinaId });
    setIsModalOpen(true);
  };
  
  const handleRecover = (usinaId) => {
    setActionToConfirm({ type: 'recover', id: usinaId });
    setIsModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!actionToConfirm) return;
    const { type, id } = actionToConfirm;
    try {
      const token = localStorage.getItem('authToken');
      if (type === 'delete') {
        await deleteUsina(id, token);
      } else if (type === 'recover') {
        await recoverUsina(id, token);
      }
      setUsinas(currentUsinas => currentUsinas.filter(usina => usina.id !== id));
    } catch (err) {
      setError(`Falha ao ${type === 'delete' ? 'excluir' : 'recuperar'} a usina.`);
    } finally {
      setIsModalOpen(false);
      setActionToConfirm(null);
    }
  };

  const filterOptions = [
    { label: 'Ativas', action: () => setFilter('ativas') },
    { label: 'Excluídas', action: () => setFilter('excluidas') },
    { label: 'Todas', action: () => setFilter('todas') },
  ];
  const mainButtonAction = (
    <Link to="/usinas/novo" className="inline-flex items-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-l-lg font-semibold text-white shadow-sm transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
      <BuildingStorefrontIcon className="h-5 w-5" />
      <span>Nova</span>
    </Link>
  );

  return (
    <div className="bg-gray-50 p-4 sm:p-6 lg:p-8 min-h-full font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gerenciamento de Usinas</h1>
          <p className="mt-1 text-sm text-gray-500">Filtro atual: <span className="font-semibold text-gray-700 capitalize">{filter}</span></p>
        </div>
        <SplitDropdownButton mainAction={mainButtonAction} options={filterOptions} />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {error && <p className="p-4 text-center text-red-600 bg-red-50">{error}</p>}
        {loading ? <LoadingSpinner /> : usinas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-xs text-gray-500 uppercase font-medium tracking-wider">
                  <th className="px-6 py-3">Nome da Usina</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">CPF/CNPJ</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {usinas.map(usina => (
                  <tr key={usina.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-800 font-medium">{usina.nome}</td>
                    <td className="px-6 py-4 text-gray-600">{usina.email}</td>
                    <td className="px-6 py-4 text-gray-600">{usina.cpf_cnpj}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        usina.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                      }`}>
                        {usina.is_active ? 'Ativa' : 'Excluída'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center items-center gap-4">
                        <Link 
                          to={`/usinas/${usina.id}/consumidores`} 
                          className="text-gray-400 hover:text-green-600 transition-colors" 
                          title="Ver Consumidores"
                        >
                          <UsersIcon className="h-5 w-5" />
                        </Link>
                        
                        {usina.is_active ? (
                          <>
                            <Link to={`/usinas/editar/${usina.id}`} className="text-gray-400 hover:text-blue-600 transition-colors" title="Editar">
                              <PencilSquareIcon className="h-5 w-5" />
                            </Link>
                            <button onClick={() => handleDelete(usina.id)} className="text-gray-400 hover:text-red-600 transition-colors" title="Excluir">
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </>
                        ) : (
                          <button onClick={() => handleRecover(usina.id)} className="text-gray-400 hover:text-green-600 transition-colors" title="Recuperar">
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
        ) : ( <EmptyState filter={filter} /> )}
      </div>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmAction}
        title={`Confirmar ${actionToConfirm?.type === 'delete' ? 'Exclusão' : 'Recuperação'}`}
        message={`Você tem certeza que deseja ${actionToConfirm?.type === 'delete' ? 'excluir' : 'recuperar'} esta usina?`}
      />
      <style jsx>{`
        .min-h-full {
          min-height: calc(100vh - 64px);
        }
      `}</style>
    </div>
  );
}