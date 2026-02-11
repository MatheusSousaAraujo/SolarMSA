// src/pages/UsinaFormPage.jsx

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { createUsina, getUsinaById, updateUsina, deleteAnexoUsina } from '../services/api'; 
import { Document, Page, pdfjs } from 'react-pdf';
import { useDropzone } from 'react-dropzone';
import { EyeIcon, TrashIcon } from '@heroicons/react/24/outline'; // Ícones

// CSS e Worker (sem alterações)
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`; // Garanta que este ficheiro está na pasta public/

const API_BASE_URL = 'http://127.0.0.1:8000'; // Garanta que esta é a URL correta da sua API

// Componente de Miniatura com Botões Abaixo (Estilo Melhorado)
const MiniaturaPDFComAcoes = ({ anexo, onRemove, isRemoving }) => {
  // Determina a fonte: URL do backend ou URL temporária (blob) do novo ficheiro
  const url = anexo.url || (anexo.file ? URL.createObjectURL(anexo.file) : null);
  // Usa o nome original guardado ou o nome do ficheiro novo
  const nomeOriginal = anexo.nome_original || anexo.file?.name || "Anexo Desconhecido";

  // Limpa a URL temporária (blob) quando o componente é desmontado
  useEffect(() => {
    const isBlob = anexo.file && url?.startsWith('blob:');
    return () => {
      if (isBlob) {
        URL.revokeObjectURL(url);
        console.log("Revoked blob URL:", url); // Debug
      }
    };
  }, [url, anexo.file]);

  if (!url) return null; // Não renderiza se não houver URL

  console.log("Rendering Miniatura for:", nomeOriginal, "URL:", url); // Debug

  // --- Estilos para os Botões Abaixo ---
  const baseButtonClass = "px-3 py-1.5 rounded-md text-xs font-semibold shadow-sm transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 inline-flex items-center gap-1.5 transform hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"; // Ajustado padding, font-size, gap, hover, focus, disabled
  const viewButtonClass = `${baseButtonClass} bg-blue-600 text-white focus:ring-blue-500`; // Fundo azul sólido
  const removeButtonClass = `${baseButtonClass} ${isRemoving ? 'bg-gray-400 text-gray-700' : 'bg-red-600 text-white focus:ring-red-500'}`; // Fundo vermelho sólido / cinza desabilitado
  // ------------------------------------

  return (
    // Container principal - adicionado shadow e bg
    <div className={`flex flex-col items-center p-3 border rounded-lg w-48 shadow-sm ${isRemoving ? 'opacity-60 pointer-events-none bg-gray-50' : 'border-gray-300 bg-white'}`}>
       <p className="text-xs font-medium text-gray-700 mb-2 truncate w-full text-center" title={nomeOriginal}> {/* Fonte ligeiramente mais forte */}
           {nomeOriginal}
       </p>
      {/* Pré-visualização do PDF */}
      <div className="mb-2 border border-gray-200 rounded overflow-hidden"> {/* Borda à volta do PDF e overflow hidden */}
        <Document
          key={url} // Key ajuda o React a identificar
          file={url} // Passa a URL (do backend ou blob)
          loading={<div className="w-40 h-56 flex items-center justify-center text-sm text-gray-500 bg-gray-100">Carregando...</div>}
          error={<div className="w-40 h-56 flex items-center justify-center text-sm text-red-500 bg-red-50 px-2 text-center">Falha ao<br/>carregar prévia.</div>} // Mensagem de erro melhorada
          onLoadError={(error) => console.error(`Erro Doc ${nomeOriginal}:`, error)}
        >
          <Page
            pageNumber={1}
            width={160}
            renderAnnotationLayer={false}
            renderTextLayer={false}
            onRenderError={(error) => console.error(`Erro Page ${nomeOriginal}:`, error)}
          />
        </Document>
      </div>

      {/* --- Container dos Botões Abaixo --- */}
      <div className="flex justify-center gap-2 mt-1 w-full"> {/* Margem superior reduzida */}
         {/* Botão Visualizar */}
         <a
           href={url}
           target="_blank"
           rel="noopener noreferrer"
           title="Visualizar anexo completo"
           className={viewButtonClass} // <-- Classe atualizada
         >
           <EyeIcon className="h-4 w-4" /> {/* Ícone ligeiramente maior */}
           <span>Ver</span>
         </a>
         {/* Botão Remover */}
         <button
            type="button" // Previne submissão do formulário
            onClick={() => onRemove(anexo)}
            disabled={isRemoving} // Desabilita durante a remoção
            title="Remover anexo"
            className={removeButtonClass} // <-- Classe atualizada
         >
            <TrashIcon className="h-4 w-4" /> {/* Ícone ligeiramente maior */}
            <span>Remover</span>
         </button>
      </div>
      {/* ------------------------------------ */}

       {/* Feedback visual durante a remoção (continua a sobrepor tudo) */}
       {isRemoving && (
           <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
               <div className="w-5 h-5 border-2 border-gray-400 border-t-blue-600 rounded-full animate-spin"></div>
           </div>
       )}
    </div>
  );
};



// --- Componente Principal da Página ---
export default function UsinaFormPage() {
  const { usinaId } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(usinaId);

  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    cpf_cnpj: '',
    numero_contrato: '',
    email: '',
    porcentagem_retida: '',
    is_active: true,
  });

  // --- Estados para Múltiplos Ficheiros ---
  const [novosAnexos, setNovosAnexos] = useState([]); // Lista de objetos File para upload
  const [anexosExistentes, setAnexosExistentes] = useState([]); // Lista de {id, nome_original, url} do backend

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingSubmit, setLoadingSubmit] = useState(false); // Loading do submit
  const [loadingData, setLoadingData] = useState(false); // Loading dos dados iniciais
  const [removingId, setRemovingId] = useState(null); // ID do anexo a ser removido

  // Carrega dados da usina
  useEffect(() => {
    if (isEditMode) {
      setLoadingData(true); // Inicia loading dos dados
      setNovosAnexos([]); // Limpa novos anexos ao carregar
      setAnexosExistentes([]); // Limpa anexos existentes

      const fetchUsinaData = async () => {
        try {
          const token = localStorage.getItem('authToken');
          const data = await getUsinaById(usinaId, token); // API deve retornar a lista 'anexos'
          setFormData({
            nome: data.nome || '', // Adiciona fallback para evitar uncontrolled input
            telefone: data.telefone || '',
            cpf_cnpj: data.cpf_cnpj || '',
            numero_contrato: data.numero_contrato || '',
            email: data.email || '',
            porcentagem_retida: data.porcentagem_retida || '',
            is_active: data.is_active !== undefined ? data.is_active : true, // Garante valor booleano
          });

          // Preenche a lista de anexos existentes
          if (data.anexos && data.anexos.length > 0) {
            setAnexosExistentes(data.anexos.map(anexo => ({
                id: anexo.id,
                // Tenta usar nome_original, senão extrai do caminho
                nome_original: anexo.nome_original || anexo.caminho_anexo.split('/').pop() || "Anexo sem nome", 
                url: `${API_BASE_URL}/${anexo.caminho_anexo}` // Monta URL completa
            })));
          } else {
            setAnexosExistentes([]);
          }
        } catch (err) {
             setError('Falha ao carregar dados da usina.');
             console.error("Error fetching usina data:", err);
        } finally {
            setLoadingData(false); // Termina loading dos dados
        }
      };
      fetchUsinaData();
    }
  }, [usinaId, isEditMode]);

  // Handle change para inputs normais
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Adiciona novos ficheiros via Dropzone
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      // Filtra para evitar duplicados exatos (nome + tamanho)
      const ficheirosRealmenteNovos = acceptedFiles.filter(
        newFile => !novosAnexos.some(
            existingFile => existingFile.name === newFile.name && existingFile.size === newFile.size
        )
      );
      // Adiciona apenas os ficheiros que ainda não estão na lista
      setNovosAnexos(prevAnexos => [...prevAnexos, ...ficheirosRealmenteNovos]);
    }
  }, [novosAnexos]); // Dependência: novosAnexos

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true, // Permitir múltiplos ficheiros
  });

  // Função para remover um NOVO anexo da lista (antes do upload)
  const handleRemoveNovoAnexo = (fileToRemove) => {
    setNovosAnexos(prev => prev.filter(file => file !== fileToRemove));
  };

  // Função para remover um anexo EXISTENTE (chama a API)
  const handleRemoveAnexoExistente = async (anexoToRemove) => {
    // Verifica se já está a remover outro ou se não há ID (segurança)
    if (!usinaId || removingId === anexoToRemove.id) return; 

    const confirmar = window.confirm(`Tem a certeza que deseja remover o anexo "${anexoToRemove.nome_original}" permanentemente?`);
    if (!confirmar) return;

    setRemovingId(anexoToRemove.id); // Marca este anexo como "a remover"
    setError(''); // Limpa erros antigos

    try {
        const token = localStorage.getItem('authToken');
        await deleteAnexoUsina(usinaId, anexoToRemove.id, token); // Chama a API de remoção
        // Remove da lista local após sucesso
        setAnexosExistentes(prev => prev.filter(anexo => anexo.id !== anexoToRemove.id));
        setSuccess('Anexo removido com sucesso.'); // Feedback opcional
        setTimeout(() => setSuccess(''), 3000); // Limpa sucesso após 3s
    } catch (err) {
        setError(`Falha ao remover o anexo: ${err.message || 'Erro desconhecido'}`);
        console.error("Erro ao remover anexo existente:", err);
    } finally {
        setRemovingId(null); // Liberta o estado de remoção
    }
  };


  // Submissão do formulário
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoadingSubmit(true); // Inicia loading do submit

    const dataToSend = new FormData();
    // Adiciona os dados básicos do formulário
    Object.keys(formData).forEach(key => dataToSend.append(key, formData[key]));

    // Adiciona os NOVOS ficheiros selecionados
    if (novosAnexos.length > 0) {
      novosAnexos.forEach((file, index) => {
        // O backend espera uma lista chamada 'anexo_files'
        dataToSend.append('anexo_files', file, file.name); 
      });
    }

    try {
      const token = localStorage.getItem('authToken');
      let message = '';
      if (isEditMode) {
        // A rota PUT só adiciona novos anexos. A remoção foi feita à parte.
        await updateUsina(usinaId, dataToSend, token); 
        message = 'Usina atualizada com sucesso!';
        if (novosAnexos.length > 0) message += ' Novos anexos adicionados.';
      } else {
        await createUsina(dataToSend, token);
        message = 'Usina criada com sucesso!';
      }
      setSuccess(message + ' Redirecionando...');
      setNovosAnexos([]); // Limpa a lista de novos anexos após sucesso

      setTimeout(() => navigate('/usinas'), 2000); // Redireciona

    } catch (err) {
        setError(`Erro ao salvar: ${err.message || 'Erro desconhecido'}`);
        console.error("Erro no handleSubmit:", err);
    } finally {
        setLoadingSubmit(false); // Termina loading do submit
    }
  };

  // Estilos
  const inputStyle = "w-full p-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500";
  const dropzoneClasses = "p-6 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer transition-colors bg-gray-50 hover:border-blue-500"; // Remover estilos de drag/reject daqui se usar os do hook

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
         <div className="p-6 border-b border-gray-200">
           <h1 className="text-xl font-semibold text-gray-900">
             {isEditMode ? 'Editar Usina' : 'Criar Nova Usina'}
           </h1>
         </div>

        {/* Feedback de loading inicial */}
        {loadingData && (
            <div className="p-6 text-center text-gray-500">Carregando dados da usina...</div>
        )}

        {/* Mostra o formulário apenas se não estiver a carregar os dados */}
        {!loadingData && (
             <form onSubmit={handleSubmit} className="p-6">
               <div className="space-y-6">
                 {/* --- Campos do formulário --- */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                     <label htmlFor="nome" className="block mb-2 text-sm font-medium text-gray-700">Nome da Usina</label>
                     <input id="nome" type="text" name="nome" value={formData.nome} onChange={handleChange} required className={inputStyle} />
                   </div>
                   <div>
                     <label htmlFor="telefone" className="block mb-2 text-sm font-medium text-gray-700">Telefone</label>
                     <input id="telefone" type="tel" name="telefone" value={formData.telefone} onChange={handleChange} className={inputStyle} /> {/* Tornar não obrigatório? */}
                   </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                         <label htmlFor="cpf_cnpj" className="block mb-2 text-sm font-medium text-gray-700">CPF/CNPJ</label>
                         <input id="cpf_cnpj" type="text" name="cpf_cnpj" value={formData.cpf_cnpj} onChange={handleChange} required className={inputStyle} />
                     </div>
                     <div>
                         <label htmlFor="numero_contrato" className="block mb-2 text-sm font-medium text-gray-700">Número do Contrato</label>
                         <input id="numero_contrato" type="text" name="numero_contrato" value={formData.numero_contrato} onChange={handleChange} required className={inputStyle} />
                     </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                     <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700">Email</label>
                     <input id="email" type="email" name="email" value={formData.email} onChange={handleChange} className={inputStyle} /> {/* Tornar não obrigatório? */}
                   </div>
                   <div>
                     <label htmlFor="porcentagem_retida" className="block mb-2 text-sm font-medium text-gray-700">Porcentagem Retida (%)</label>
                     <input id="porcentagem_retida" type="number" step="0.01" name="porcentagem_retida" value={formData.porcentagem_retida} onChange={handleChange} required placeholder="Ex: 5.50" className={inputStyle} />
                   </div>
                 </div>

                 {/* --- SEÇÃO DE ANEXOS --- */}
                 <div>
                   <label className="block mb-2 text-sm font-medium text-gray-700">Anexos do Contrato (PDF)</label>

                   {/* O Dropzone */}
                   <div {...getRootProps()} className={`${dropzoneClasses} ${isDragActive ? 'border-blue-600 bg-blue-50' : ''} ${isDragReject ? 'border-red-600 bg-red-50' : ''}`}>
                     <input {...getInputProps()} />
                     {
                       isDragActive ?
                       <p className="text-blue-600">Solte os ficheiros aqui...</p> :
                       isDragReject ?
                       <p className="text-red-600">Ficheiro(s) não suportado(s) (apenas PDF).</p> :
                       <p className="text-gray-500">Arraste e solte os anexos (PDF) aqui, ou clique para selecionar.</p>
                     }
                   </div>

                   {/* Área de Pré-visualização e Gestão */}
                   <div className="mt-4 space-y-4">

                     {/* 1. Anexos Existentes (com botão de remover) */}
                     {isEditMode && anexosExistentes.length > 0 && (
                       <div>
                         <p className="text-sm font-medium text-gray-700 mb-2">Anexos Atuais:</p>
                         <div className="flex flex-wrap gap-4">
                           {anexosExistentes.map(anexo => (
                             <MiniaturaPDFComAcoes
                               key={`existing-${anexo.id}`} // Key única para existentes
                               anexo={anexo}
                               onRemove={handleRemoveAnexoExistente}
                               isRemoving={removingId === anexo.id} // Passa estado de remoção
                             />
                           ))}
                         </div>
                       </div>
                     )}

                     {/* 2. Novos Anexos (com botão de remover da lista) */}
                     {novosAnexos.length > 0 && (
                       <div>
                         <p className="text-sm font-medium text-gray-700 mb-2">Novos Anexos para Upload:</p>
                         <div className="flex flex-wrap gap-4">
                           {novosAnexos.map((file, index) => (
                              <MiniaturaPDFComAcoes
                                 key={`new-${file.name}-${index}`} // Key única para novos
                                 anexo={{ file: file }} // Passa o objeto File
                                 onRemove={handleRemoveNovoAnexo}
                                 isRemoving={false} // Novos anexos não têm estado de remoção API
                              />
                           ))}
                         </div>
                       </div>
                     )}

                      {/* Mensagem se não houver anexos */}
                      {anexosExistentes.length === 0 && novosAnexos.length === 0 && (
                         <p className="text-sm text-gray-500 italic mt-2">Nenhum anexo adicionado.</p>
                      )}

                   </div>
                 </div>
               </div> {/* Fim do space-y-6 */}

               {/* --- Mensagens de erro/sucesso --- */}
               <div className="mt-6 text-center h-5">
                 {error && <p className="text-red-600 text-sm">{error}</p>}
                 {success && <p className="text-green-600 text-sm">{success}</p>}
               </div>

               {/* --- Botões de Ação --- */}
               <div className="flex items-center justify-end gap-4 pt-6 mt-2 border-t border-gray-200">
                 <Link to="/usinas" className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100">
                   Cancelar
                 </Link>

                 <button
                   type="submit"
                   disabled={loadingSubmit || removingId} // Desabilita durante submit ou remoção
                   className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
                 >
                   {loadingSubmit ? 'Salvando...' : (isEditMode ? 'Salvar Alterações' : 'Criar Usina')}
                 </button>
               </div>
             </form>
        )} {/* Fim do !loadingData */}
      </div>
    </div>
  );
}