// src/pages/ConsumidorFormPage.jsx

import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { createConsumidor, getConsumidorById, updateConsumidor, getUsinas } from '../services/api';

export default function ConsumidorFormPage() {
  const { consumidorId } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(consumidorId);

  const [formData, setFormData] = useState({
    nome: '',
    numero_unidade_consumidora: '',
    telefone: '',
    cpf_cnpj: '',
    numero_contrato: '',
    email: '',
    porcentagem_desconto: '',
    usina_id: '', // Valor inicial vazio indica "não selecionado"
  });

  const [availableUsinas, setAvailableUsinas] = useState([]);
  const [loadingUsinas, setLoadingUsinas] = useState(false);
  const [errorUsinas, setErrorUsinas] = useState('');

  const [error, setError] = useState(''); // Erro geral do formulário
  const [success, setSuccess] = useState('');
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // useEffect para buscar Usinas Ativas (sem alterações)
  useEffect(() => {
    // ... (código para buscar usinas)
    const fetchActiveUsinas = async () => {
      setLoadingUsinas(true);
      setErrorUsinas('');
      try {
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error("Token não encontrado");
        const usinasData = await getUsinas(token, 'ativas');
        setAvailableUsinas(usinasData);
      } catch (err) {
        setErrorUsinas(`Falha ao carregar lista de usinas: ${err.message}`);
        console.error("Erro ao buscar usinas:", err);
      } finally {
        setLoadingUsinas(false);
      }
    };
    fetchActiveUsinas();
  }, []);

  // useEffect para buscar dados do Consumidor (sem alterações)
  useEffect(() => {
    // ... (código para buscar consumidor)
    if (isEditMode) {
      setLoadingData(true);
      const fetchConsumidorData = async () => {
        try {
          // ... (fetch e setFormData como antes)
          const token = localStorage.getItem('authToken');
          if (!token) throw new Error("Token não encontrado");
          const data = await getConsumidorById(consumidorId, token);
          setFormData({
            nome: data.nome || '',
            numero_unidade_consumidora: data.numero_unidade_consumidora || '',
            telefone: data.telefone || '',
            cpf_cnpj: data.cpf_cnpj || '',
            numero_contrato: data.numero_contrato || '',
            email: data.email || '',
            porcentagem_desconto: data.porcentagem_desconto !== null ? String(data.porcentagem_desconto) : '',
            usina_id: data.usina_id !== null ? String(data.usina_id) : '', // Mantém string
          });
          setIsActive(data.is_active);
        } catch (err) { /* ... trata erro ... */ }
        finally { setLoadingData(false); }
      };
      fetchConsumidorData();
    }
  }, [consumidorId, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target; // Pega o nome e o valor do input
    setFormData(prev => ({
      ...prev,
      [name]: value, // Atualiza a propriedade correta no estado formData
    }));
  };

  // --- Handle submit (COM VALIDAÇÃO) ---
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(''); // Limpa erros anteriores
    setSuccess('');
    setLoadingSubmit(true);

    // --- VALIDAÇÃO ADICIONADA ---
    if (!formData.usina_id) {
        setError('Por favor, selecione uma Usina Associada.');
        setLoadingSubmit(false); // Interrompe o loading
        return; // Impede a submissão
    }
    // ----------------------------

    // Prepara os dados para enviar (convertendo números)
    const dataToSend = {
      ...formData,
      porcentagem_desconto: parseFloat(formData.porcentagem_desconto) || 0,
      // usina_id agora é obrigatório, então a conversão é segura
      usina_id: parseInt(formData.usina_id, 10),
      is_active: isEditMode ? isActive : true,
    };

    try {
      // ... (lógica de chamada API create/update Consumidor)
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error("Token não encontrado");

      let message = '';
      if (isEditMode) {
        await updateConsumidor(consumidorId, dataToSend, token);
        message = 'Consumidor atualizado com sucesso!';
      } else {
        await createConsumidor(dataToSend, token);
        message = 'Consumidor criado com sucesso!';
      }

      setSuccess(message + ' Redirecionando...');
      setTimeout(() => navigate('/consumidores'), 2000);

    } catch (err) {
      setError(`Erro ao salvar: ${err.message || 'Erro desconhecido'}`);
      console.error("Erro no handleSubmit:", err);
    } finally {
      setLoadingSubmit(false);
    }
  };

  const inputStyle = "w-full p-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200";

  if (isEditMode && loadingData) {
      return <div className="p-6 text-center text-gray-500">Carregando dados...</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {/* Cabeçalho */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">
            {isEditMode ? 'Editar Consumidor' : 'Criar Novo Consumidor'}
          </h1>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">

            {/* ... Campos anteriores ... */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                 <label htmlFor="nome" className="block mb-2 text-sm font-medium text-gray-700">Nome Completo*</label>
                 <input id="nome" type="text" name="nome" value={formData.nome} onChange={handleChange} required className={inputStyle} />
               </div>
               <div>
                 <label htmlFor="numero_unidade_consumidora" className="block mb-2 text-sm font-medium text-gray-700">Nº Unidade Consumidora*</label>
                 <input id="numero_unidade_consumidora" type="text" name="numero_unidade_consumidora" value={formData.numero_unidade_consumidora} onChange={handleChange} required className={inputStyle} />
               </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                     <label htmlFor="telefone" className="block mb-2 text-sm font-medium text-gray-700">Telefone</label>
                     <input id="telefone" type="tel" name="telefone" value={formData.telefone} onChange={handleChange} placeholder="(XX) XXXXX-XXXX" className={inputStyle} />
                 </div>
                 <div>
                     <label htmlFor="cpf_cnpj" className="block mb-2 text-sm font-medium text-gray-700">CPF/CNPJ*</label>
                     <input id="cpf_cnpj" type="text" name="cpf_cnpj" value={formData.cpf_cnpj} onChange={handleChange} required className={inputStyle} />
                 </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                 <label htmlFor="numero_contrato" className="block mb-2 text-sm font-medium text-gray-700">Nº do Contrato*</label>
                 <input id="numero_contrato" type="text" name="numero_contrato" value={formData.numero_contrato} onChange={handleChange} required className={inputStyle} />
               </div>
               <div>
                 <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700">Email*</label>
                 <input id="email" type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="exemplo@dominio.com" className={inputStyle} />
               </div>
             </div>


            {/* --- Linha 4: % Desconto e SELECT Usina (ATUALIZADO) --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                 <label htmlFor="porcentagem_desconto" className="block mb-2 text-sm font-medium text-gray-700">Desconto Aplicado (%)*</label>
                 <input id="porcentagem_desconto" type="number" step="0.01" min="0" max="100" name="porcentagem_desconto" value={formData.porcentagem_desconto} onChange={handleChange} required placeholder="Ex: 10.50" className={inputStyle} />
               </div>
               <div>
                 {/* --- ALTERAÇÕES AQUI --- */}
                 <label htmlFor="usina_id" className="block mb-2 text-sm font-medium text-gray-700">Usina Associada*</label> {/* Adicionado '*' */}
                 {errorUsinas && <p className="text-xs text-red-600 -mt-1 mb-1">{errorUsinas}</p>}
                 <select
                    id="usina_id"
                    name="usina_id"
                    value={formData.usina_id}
                    onChange={handleChange}
                    disabled={loadingUsinas || !!errorUsinas}
                    required // Adicionado atributo required
                    className={inputStyle}
                 >
                    {/* Opção padrão - Atualizado o texto */}
                    <option value="" disabled={loadingUsinas || !!errorUsinas}>
                        {loadingUsinas ? 'Carregando usinas...' : (errorUsinas ? 'Erro ao carregar' : '-- Selecione a Usina --')}
                    </option>
                    {!loadingUsinas && !errorUsinas && availableUsinas.map(usina => (
                        <option key={usina.id} value={usina.id}>
                            {usina.nome} {/* Mostra apenas o nome */}
                        </option>
                    ))}
                 </select>
                 {/* ----------------------- */}
               </div>
            </div>
          </div>

          {/* Mensagens e Botões */}
          <div className="mt-6 text-center h-5">
            {error && <p className="text-red-600 text-sm">{error}</p>}
            {success && <p className="text-green-600 text-sm">{success}</p>}
          </div>
          <div className="flex items-center justify-end gap-4 pt-6 mt-2 border-t border-gray-200">
            <Link to="/consumidores" className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100">
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loadingSubmit || loadingUsinas || loadingData}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {loadingSubmit ? 'Salvando...' : (isEditMode ? 'Salvar Alterações' : 'Criar Consumidor')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}