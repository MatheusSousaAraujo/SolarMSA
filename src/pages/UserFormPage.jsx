// src/pages/UserFormPage.jsx

import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { createUser, getConsumidores, getUserById, updateUser } from '../services/api';

export default function UserFormPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(userId);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'USER',
    consumidor_id: '',
  });

  const [consumidores, setConsumidores] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        const consumidoresData = await getConsumidores(token);
        setConsumidores(consumidoresData);

        if (isEditMode) {
          const userData = await getUserById(userId, token);
          setFormData({
            email: userData.email,
            password: '',
            role: userData.role,
            consumidor_id: userData.consumidor_id || '',
          });
        }
      } catch (err) {
        setError('Falha ao carregar dados necessários.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const dataToSend = {
      ...formData,
      consumidor_id: formData.consumidor_id ? parseInt(formData.consumidor_id, 10) : null,
    };

    try {
      const token = localStorage.getItem('authToken');
      
      if (isEditMode) {
        if (!dataToSend.password) {
          delete dataToSend.password;
        }
        await updateUser(userId, dataToSend, token);
        setSuccess('Usuário atualizado com sucesso! Redirecionando...');
      } else {
        await createUser(dataToSend, token);
        setSuccess('Usuário criado com sucesso! Redirecionando...');
      }
      
      setTimeout(() => navigate('/usuarios'), 2000);

    } catch (err) {
      setError(err.message || 'Ocorreu um erro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">
            {isEditMode ? 'Editar Usuário' : 'Criar Novo Usuário'}
          </h1>
         
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700">Email</label>
              {/* ALTURA DIMINUÍDA: p-3 -> p-2 */}
              <input 
                id="email" type="email" name="email" value={formData.email} onChange={handleChange}
                className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                required 
              />
            </div>

            <div>
              <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-700">Senha</label>
              {/* ALTURA DIMINUÍDA: p-3 -> p-2 */}
              <input
                id="password" type="password" name="password" value={formData.password} onChange={handleChange}
                placeholder={isEditMode ? 'Deixe em branco para não alterar' : '••••••••'}
                className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={!isEditMode}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="role" className="block mb-2 text-sm font-medium text-gray-700">Perfil (Role)</label>
                {/* ALTURA DIMINUÍDA: p-3 -> p-2 */}
                <select
                  id="role" name="role" value={formData.role} onChange={handleChange}
                  className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USER">Usuário</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
              <div>
                <label htmlFor="consumidor_id" className="block mb-2 text-sm font-medium text-gray-700">Associar Consumidor</label>
                {/* ALTURA DIMINUÍDA: p-3 -> p-2 */}
                <select
                  id="consumidor_id" name="consumidor_id" value={formData.consumidor_id} onChange={handleChange}
                  className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Nenhum</option>
                  {consumidores.map((consumidor) => (
                    <option key={consumidor.id} value={consumidor.id}>
                      {consumidor.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <div className="mt-6 text-center h-5">
            {error && <p className="text-red-600 text-sm">{error}</p>}
            {success && <p className="text-green-600 text-sm">{success}</p>}
          </div>
          
          <div className="flex items-center justify-end gap-4 pt-6 mt-2 border-t border-gray-200">
            <Link to="/usuarios" className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100">
              Cancelar
            </Link>
            <button 
              type="submit" disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
            >
              {loading ? 'Salvando...' : (isEditMode ? 'Salvar Alterações' : 'Criar Usuário')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}