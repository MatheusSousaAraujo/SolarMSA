// src/pages/UsersListPage.jsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUsers, deleteUser, recoverUser } from '../services/api';
import { UserPlusIcon, PencilSquareIcon, TrashIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import SplitDropdownButton from '../components/ui/SplitDropdownButton';
import ConfirmationModal from '../components/ui/ConfirmationModal';

function LoadingSpinner() {
  return (<div className="flex justify-center items-center py-20"><div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div></div>);
}

function EmptyState({ filter }) {
  const messages = { ativos: "Nenhum usuário ativo.", excluidos: "Nenhum usuário na lixeira.", todos: "Não há usuários cadastrados." };
  return (<div className="text-center py-16 px-4"><h3 className="text-lg font-semibold text-gray-800">Nenhum Resultado</h3><p className="text-gray-500 mt-1">{messages[filter]}</p></div>);
}

export default function UsersListPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ativos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('authToken');
        const data = await getUsers(token, filter);
        setUsers(data);
      } catch (err) {
        setError('Falha ao carregar usuários.');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [filter]);

  const handleDelete = (userId) => {
    setActionToConfirm({ type: 'delete', id: userId });
    setIsModalOpen(true);
  };

  const handleRecover = (userId) => {
    setActionToConfirm({ type: 'recover', id: userId });
    setIsModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!actionToConfirm) return;
    const { type, id } = actionToConfirm;
    try {
      const token = localStorage.getItem('authToken');
      if (type === 'delete') {
        await deleteUser(id, token);
      } else if (type === 'recover') {
        await recoverUser(id, token);
      }
      setUsers(currentUsers => currentUsers.filter(user => user.id !== id));
    } catch (err) {
      setError(`Falha ao ${type === 'delete' ? 'excluir' : 'recuperar'} o usuário.`);
    } finally {
      setIsModalOpen(false);
      setActionToConfirm(null);
    }
  };

  const filterOptions = [
    { label: 'Ativos', action: () => setFilter('ativos') },
    { label: 'Excluídos', action: () => setFilter('excluidos') },
    { label: 'Todos', action: () => setFilter('todos') },
  ];
  const mainButtonAction = (
    <Link to="/usuarios/novo" className="inline-flex items-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-l-lg font-semibold text-white shadow-sm transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
      <UserPlusIcon className="h-5 w-5" />
      <span>Novo</span>
    </Link>
  );

  return (
    <div className="bg-gray-50 p-4 sm:p-6 lg:p-8 min-h-full font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gerenciamento de Usuários</h1>
          <p className="mt-1 text-sm text-gray-500">Filtro atual: <span className="font-semibold text-gray-700 capitalize">{filter}</span></p>
        </div>
        <SplitDropdownButton mainAction={mainButtonAction} options={filterOptions} />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {error && <p className="p-4 text-center text-red-600 bg-red-50">{error}</p>}
        {loading ? <LoadingSpinner /> : users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              {/* --- CABEÇALHO DA TABELA RESTAURADO --- */}
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-xs text-gray-500 uppercase font-medium tracking-wider">
                  <th className="px-6 py-3">Nome do Consumidor</th>
                  <th className="px-6 py-3">Email (Login)</th>
                  <th className="px-6 py-3">Perfil</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-center">Ações</th>
                </tr>
              </thead>
              {/* --- CORPO DA TABELA RESTAURADO --- */}
              <tbody className="divide-y divide-gray-200">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-800 font-medium">
                      {/* Verificamos se user.consumidor existe e, em caso afirmativo, 
                        acessamos user.consumidor.nome
                      */}
                      {user.consumidor?.nome || <span className="text-gray-400 font-normal">Não vinculado</span>}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{user.email}</td>
                    <td className="px-6 py-4 text-gray-600 capitalize">{user.role}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                        }`}>
                        {user.is_active ? 'Ativo' : 'Excluído'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center items-center gap-4">
                        {user.is_active ? (
                          <>
                            <Link to={`/usuarios/editar/${user.id}`} className="text-gray-400 hover:text-blue-600 transition-colors" title="Editar">
                              <PencilSquareIcon className="h-5 w-5" />
                            </Link>
                            <button onClick={() => handleDelete(user.id)} className="text-gray-400 hover:text-red-600 transition-colors" title="Excluir">
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </>
                        ) : (
                          <button onClick={() => handleRecover(user.id)} className="text-gray-400 hover:text-green-600 transition-colors" title="Recuperar">
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
        ) : (<EmptyState filter={filter} />)}
      </div>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmAction}
        title={`Confirmar ${actionToConfirm?.type === 'delete' ? 'Exclusão' : 'Recuperação'}`}
        message={`Você tem certeza que deseja ${actionToConfirm?.type === 'delete' ? 'excluir' : 'recuperar'} este usuário?`}
      />
    </div>
  );
}