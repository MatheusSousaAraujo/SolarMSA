import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { ArrowLeftIcon, CloudArrowUpIcon, CheckCircleIcon, ExclamationCircleIcon, EyeIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { getConsumidorById, uploadFaturaConsumidor, calcularGerarRelatorio } from '../services/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// Configuração para react-pdf
import { Document, Page, pdfjs } from 'react-pdf'; 
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// 🚨 CORREÇÃO CRÍTICA DO WORKER: Tenta um caminho relativo para o worker
// Isso exige que o pdf.worker.min.js esteja na pasta 'public' ou no local correto da build.
// Se o erro 404 persistir, você deve usar a URL absoluta, ex: 'https://matheussousaaraujo.github.io/SolarMSA/frontend/pdf.worker.min.mjs'
pdfjs.GlobalWorkerOptions.workerSrc = `./pdf.worker.min.mjs`;


// --- VARIÁVEL DE AMBIENTE DA API ---
// 🚨 CORREÇÃO ESSENCIAL: URL de PRODUÇÃO da sua API no Render
const API_BASE_URL = 'https://solarmsa.onrender.com'; 
// -----------------------------------------------------------------------

/**
 * Componente de Miniatura de PDF com botões de Ação (Ver/Baixar).
 */
const MiniaturaPDFComAcoesComponent = ({ anexo }) => { 
    const [isDownloading, setIsDownloading] = useState(false);
    const url = useMemo(() => anexo?.url || (anexo?.file ? URL.createObjectURL(anexo.file) : null), [anexo]);
    const nomeOriginal = anexo?.nome_original || anexo?.file?.name || "Documento";

    useEffect(() => {
        const isBlob = anexo?.file && url?.startsWith('blob:');

        return () => {
            if (isBlob && url) {
                // Limpa a URL temporária do Blob
                URL.revokeObjectURL(url);
            }
        };
    }, [url, anexo]); 

    if (!anexo || !url) return ( 
        <div className="flex flex-col items-center p-3 border rounded-lg w-48 shadow-sm border-gray-300 bg-gray-50 h-[300px] justify-center">
            <p className="text-sm text-gray-500 text-center">Nenhum documento anexado.</p>
        </div>
    ); 

    // MÉTODO CORRIGIDO PARA FORÇAR O DOWNLOAD VIA FETCH/BLOB E ENVIAR TOKEN
    const handleDownload = async () => {
        if (!url) return;

        // Verifica se a URL é externa (API) e precisa de autenticação
        const needsAuth = url.startsWith(API_BASE_URL);
        
        setIsDownloading(true);
        try {
            const token = localStorage.getItem('authToken');
            
            // 1. Fetch o arquivo como um Blob, incluindo o cabeçalho de Autorização se necessário
            const fetchOptions = needsAuth && token ? {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            } : {};
            
            const response = await fetch(url, fetchOptions);

            if (response.status === 401) {
                    alert("Sessão expirada ou não autorizada. Não foi possível baixar o arquivo.");
                    return;
            }
            if (!response.ok) throw new Error(`Falha ao buscar o arquivo. Status: ${response.status}`);
            
            const blob = await response.blob();
            
            // 2. Cria uma URL temporária para o Blob
            const blobUrl = window.URL.createObjectURL(blob);

            // 3. Cria um link invisível para forçar o clique e download
            const link = document.createElement('a');
            link.href = blobUrl;
            link.setAttribute('download', nomeOriginal); // Usa o nome original
            document.body.appendChild(link);
            link.click(); // Simula o clique
            document.body.removeChild(link);
            
            // 4. Limpa a URL temporária
            window.URL.revokeObjectURL(blobUrl);

        } catch (error) {
            console.error("Erro ao forçar o download:", error);
            alert(`Erro ao baixar: ${error.message}. Verifique a API e o token.`);
        } finally {
            setIsDownloading(false);
        }
    };


    const baseButtonClass = "px-3 py-1.5 rounded-md text-xs font-semibold shadow-sm transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 inline-flex items-center gap-1.5 transform hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"; 
    const viewButtonClass = `${baseButtonClass} bg-blue-600 text-white focus:ring-blue-500 w-1/2`; 
    const downloadButtonClass = `${baseButtonClass} bg-red-600 text-white focus:ring-red-500 w-1/2`;

    return (
        <div className={`flex flex-col items-center p-3 border rounded-lg w-48 shadow-sm relative h-[300px] border-gray-300 bg-white`}>
           <p className="text-xs font-medium text-gray-700 mb-2 truncate w-full text-center" title={nomeOriginal}> 
                {nomeOriginal}
           </p>
            
           {/* Pré-visualização do PDF */}
           <div className="mb-2 border border-gray-200 rounded overflow-hidden"> 
                <Document
                    key={url} 
                    file={url} 
                    loading={<div className="w-40 h-56 flex items-center justify-center text-sm text-gray-500 bg-gray-100">Carregando...</div>}
                    error={<div className="w-40 h-56 flex items-center justify-center text-sm text-red-500 bg-red-50 px-2 text-center">Falha ao<br/>carregar prévia.</div>} 
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
           <div className="flex justify-center gap-2 mt-1 w-full"> 
                {/* 1. Botão Visualizar/Ver (Abre em nova aba para visualização) */}
                <a
                    href={url}
                    target="_blank" 
                    rel="noopener noreferrer"
                    title="Visualizar documento completo"
                    className={viewButtonClass} 
                >
                    <EyeIcon className="h-4 w-4" /> 
                    <span>Ver</span>
                </a>
                
                {/* 2. Botão de Baixar (Força o Download via JavaScript) */}
                <button
                    type="button" 
                    onClick={handleDownload} 
                    disabled={isDownloading} 
                    title="Baixar Documento"
                    className={downloadButtonClass}
                >
                    {isDownloading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <ArrowDownTrayIcon className="h-4 w-4" /> 
                    )}
                    <span>{isDownloading ? 'Baixando...' : 'Baixar'}</span>
                </button>
           </div>
        </div>
    );
};

// --- APLICAÇÃO DA MEMOIZAÇÃO ---
const MiniaturaPDFComAcoes = React.memo(MiniaturaPDFComAcoesComponent);

// -----------------------------------------------------------------------
// --- COMPONENTE PRINCIPAL DOCUMENTOS FORMPAGE ---
// -----------------------------------------------------------------------

export default function DocumentosFormPage() {
    const navigate = useNavigate();
    const { consumidorId } = useParams();
    const cId = parseInt(consumidorId);
    const token = localStorage.getItem('authToken');

    // --- ESTADOS ---
    const [consumidor, setConsumidor] = useState(null);
    const [faturaFile, setFaturaFile] = useState(null);
    const [faturaData, setFaturaData] = useState(null);
    const [relatorioData, setRelatorioData] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Prepara o objeto anexo da fatura para o MiniaturaPDFComAcoes
    const faturaAnexo = useMemo(() => faturaFile ? { file: faturaFile } : null, [faturaFile]);

    // Prepara o objeto anexo do relatório para o MiniaturaPDFComAcoes
    const relatorioAnexo = useMemo(() => {
      if (!relatorioData || !relatorioData.caminho_armazenamento) return null;
      return {
        id: relatorioData.id,
        nome_original: relatorioData.nome || `Relatório-${relatorioData.id}.pdf`,
        // Usa a URL CORRETA do Render para download/visualização
        url: `${API_BASE_URL}/${relatorioData.caminho_armazenamento}` 
      };
    }, [relatorioData]);


    // --- LÓGICA DE BUSCA DE DADOS ---
    useEffect(() => {
        if (!cId || !token) {
            setError("ID do consumidor ausente ou sessão inválida.");
            return;
        }
        const fetchConsumidor = async () => {
            try {
                const data = await getConsumidorById(cId, token);
                setConsumidor(data);
            } catch (err) {
                // Aqui pode estar o outro erro 401 se o token falhar na carga inicial
                setError(`Consumidor ID ${cId} não encontrado. Verifique sua conexão e autenticação.`);
            }
        };
        fetchConsumidor();
    }, [cId, token]);

    // --- LÓGICA DO DROPZONE (APENAS FATURA) ---
    const onFaturaDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles.length > 0) {
            setFaturaFile(acceptedFiles[0]);
            setFaturaData(null); 
            setRelatorioData(null); 
            setError('');
            setSuccess('');
        }
    }, []);
    const faturaDropzone = useDropzone({ onDrop: onFaturaDrop, accept: { 'application/pdf': ['.pdf'] }, multiple: false });

    // Função de remoção mantida
    const handleRemoveFaturaLocal = useCallback(() => {
      setFaturaFile(null);
      setFaturaData(null);
      setRelatorioData(null);
      setError('');
      setSuccess('Fatura removida do anexo. Selecione um novo arquivo.');
    }, []);

    // --- AÇÕES DOS BOTÕES (Mantidas) ---
    const handleExtrairSalvarFatura = async () => {
        if (!faturaFile) return setError("Por favor, selecione um ficheiro PDF de fatura primeiro.");
        if (faturaData) return setError("Os dados desta fatura já foram extraídos e salvos.");

        setIsUploading(true);
        setError('');
        setSuccess('');

        try {
            const dataToSend = new FormData();
            dataToSend.append('file', faturaFile);
            // uploadFaturaConsumidor deve garantir que o token é enviado
            const responseData = await uploadFaturaConsumidor(cId, dataToSend, token); 
            setFaturaData(responseData);
            setSuccess(`Fatura salva! ID: ${responseData.id}. Agora pode gerar o relatório.`);
        } catch (err) {
            setError(`Falha ao salvar a fatura: ${err.message}. Verifique a rota da API e o token.`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleGerarRelatorio = async () => {
        if (!faturaData || !faturaData.id) return setError("Salve a fatura primeiro para obter o ID.");
        
        if (relatorioData) {
            return navigate(`/relatorios/${relatorioData.id}`);
        }

        setIsProcessing(true);
        setError('');

        try {
            // calcularGerarRelatorio deve garantir que o token é enviado
            const responseData = await calcularGerarRelatorio(faturaData.id, token); 
            setRelatorioData(responseData.relatorio_gerado); 
            setSuccess("Relatório gerado e salvo com sucesso! Veja a pré-visualização na Coluna 3.");
            
        } catch (err) {
            setError(`Falha ao gerar relatório: ${err.message}. Verifique a rota da API e o token.`);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!consumidor) {
        return <LoadingSpinner />;
    }

    const baseCardClass = "bg-white p-6 rounded-xl border border-gray-200 shadow-md h-full";
    const buttonBaseClass = "px-4 py-2 rounded-lg font-semibold transition-colors duration-150 flex items-center justify-center gap-2 w-full";

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-full bg-gray-50">
            {/* TÍTULO E NAVEGAÇÃO */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <button onClick={() => navigate(-1)} className="p-2 text-gray-500 hover:text-blue-600 rounded-full mr-4" title="Voltar">
                        <ArrowLeftIcon className="h-6 w-6" />
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Documentos: {consumidor.nome}
                    </h1>
                </div>
            </div>

            {/* LAYOUT DE 3 COLUNAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                
                {/* === COLUNA 1: UPLOAD DE FATURA E AÇÕES === */}
                <div className={baseCardClass}>
                    <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">1. Fatura para Análise</h2>
                    <div {...faturaDropzone.getRootProps()} className={`p-8 mb-4 border-2 border-dashed rounded-lg text-center cursor-pointer ${faturaDropzone.isDragActive ? 'border-blue-600 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}>
                        <input {...faturaDropzone.getInputProps()} />
                        <CloudArrowUpIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Arraste ou clique para selecionar Fatura (PDF)</p>
                    </div>
                    {faturaFile && (
                        <div className="mb-4">
                            <p className="text-sm font-semibold text-gray-700">Ficheiro: <span className="text-blue-600 truncate">{faturaFile.name}</span></p>
                            <p className={`text-xs ${faturaData ? 'text-green-600' : 'text-orange-600'}`}>
                                {faturaData ? `Extraído. Chave: ${faturaData.chave_acesso_nfe.slice(-8)}` : 'Pronto para extração.'}
                            </p>
                        </div>
                    )}
                    
                    <button onClick={handleExtrairSalvarFatura} disabled={isUploading || !faturaFile || faturaData} className={`${buttonBaseClass} bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-400`}>
                        {isUploading ? 'Salvando Fatura...' : (faturaData ? 'Fatura Salva' : 'Extrair Dados e Salvar Fatura')}
                    </button>
                    
                    <button onClick={handleGerarRelatorio} disabled={isProcessing || !faturaData} className={`${buttonBaseClass} mt-3 ${faturaData ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-200 text-gray-700'} disabled:bg-gray-400`}>
                        {isProcessing ? 'Gerando Relatório...' : (relatorioData ? 'Ver Relatório Gerado' : 'Gerar Relatório de Desconto')}
                    </button>
                </div>

                {/* === COLUNA 2: PRÉ-VISUALIZAÇÃO DO DOCUMENTO ANEXADO (Fatura) === */}
                <div className={baseCardClass}>
                    <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">2. Fatura </h2>
                    <div className="flex justify-center items-start">
                        <MiniaturaPDFComAcoes
                            anexo={faturaAnexo} 
                        />
                    </div>
                </div>

                {/* === COLUNA 3: PRÉ-VISUALIZAÇÃO DO RELATÓRIO GERADO === */}
                <div className={baseCardClass}>
                    <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">3. Relatório </h2>
                    <div className="flex justify-center items-start">
                        <MiniaturaPDFComAcoes
                            anexo={relatorioAnexo} 
                        />
                    </div>
                </div>

            </div>

            {/* Mensagens Globais de Erro/Sucesso */}
            {(error || success) && (
                <div className={`mt-6 p-3 rounded-lg text-sm ${error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {error && <p className="flex items-center gap-2"><ExclamationCircleIcon className="h-5 w-5" /> {error}</p>}
                    {success && <p className="flex items-center gap-2"><CheckCircleIcon className="h-5 w-5" /> {success}</p>}
                </div>
            )}
        </div>
    );
}