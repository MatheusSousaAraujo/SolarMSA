import React, { useState, useEffect, useCallback, useMemo, Fragment } from 'react'; // Adicionado Fragment
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getUsinaById, getUsinas, getConsumidoresByUsinaId, getConsumidorMonthlyDocuments } from '../services/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// --- NOVOS IMPORTS (Headless UI) ---
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';

// --- ÍCONES ---
import { 
    ArrowLeftIcon, 
    UserIcon, 
    // ChevronDownIcon, // Não é mais necessário para o Listbox
    DocumentTextIcon, 
    ChevronRightIcon, 
    PencilSquareIcon, 
    CloudArrowUpIcon, 
    TrashIcon 
} from '@heroicons/react/24/outline'; 

// --- Constante da API (necessária para gerar as URLs completas de download/visualização) ---
const API_BASE_URL = 'http://127.0.0.1:8000'; 
// ------------------------------------------------------------------------------------------

// --- NOVO COMPONENTE SVG CUSTOMIZADO PARA VISUALIZAÇÃO DE DOCUMENTOS ---
const DocumentViewIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
);


// --- FUNÇÃO AUXILIAR DE FORMATAÇÃO DE DATA ---
const formatDate = (dateString) => {
    if (!dateString) return 'Data Indefinida';
    const [year, month] = dateString.split('-');
    if (!month || !year) return dateString;
    
    const monthNames = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    
    const monthIndex = parseInt(month, 10) - 1; 

    if (monthIndex >= 0 && monthIndex < 12) {
        return `${monthNames[monthIndex]} de ${year}`;
    }
    return dateString;
};


// --- Componente de Documento Linkado (Permanece) ---
const DocumentLink = ({ document, isBoleto, onAnexar }) => {
    // 1. Caso o documento exista e tenha URL
    if (document && document.nome_arquivo_original && document.caminho_armazenamento) {
        
        // --- INÍCIO DA CORREÇÃO ---
        // 1. Limpa o caminho de barras iniciais/finais redundantes
        let cleanPath = document.caminho_armazenamento.replace(/^\/+|\/+$/g, '');
        
        // 2. Remove o prefixo 'anexos/' do caminho se ele já existir (RESOLVE O 404)
        cleanPath = cleanPath.startsWith('anexos/') ? cleanPath.substring(7) : cleanPath;
        
        // 3. Monta a URL FINAL com o prefixo /anexos do servidor estático do FastAPI
        const fileUrl = `${API_BASE_URL}/anexos/${cleanPath}`;
        // --- FIM DA CORREÇÃO ---


        return (
            <div className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors">
                <DocumentTextIcon className="h-4 w-4 text-gray-500" />
                <a 
                    href={fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    title={`Visualizar/Baixar: ${document.nome_arquivo_original}`}
                    className="truncate max-w-[150px] underline hover:no-underline text-xs"
                >
                    {document.nome_arquivo_original}
                </a>
                {isBoleto && ( 
                    <button 
                        onClick={() => onAnexar(true)} 
                        className="p-1 text-gray-500 hover:text-blue-500 rounded-full"
                        title="Alterar Documento"
                    >
                        <PencilSquareIcon className="h-4 w-4" />
                    </button>
                )}
            </div>
        );
    }
    
    // 2. Caso o documento não exista e seja um Boleto (oferecer opção de anexo)
    if (isBoleto && onAnexar) {
        return (
            <button 
                onClick={() => onAnexar(false)}
                className="bg-purple-100 text-purple-600 hover:bg-purple-200 px-2 py-1 rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1"
                title="Anexar Boleto Bancário"
            >
                <CloudArrowUpIcon className="h-4 w-4" />
                Anexar Boleto
            </button>
        );
    }

    // 3. Documento não existe (Fatura ou Relatório)
    return <span className="text-gray-400 text-xs">N/A</span>;
};


// --- Componente para Item da Lista de Documentos (3 COLUNAS) ---
const DocumentListItem = ({ document, handleAnexarBoleto, uploadingMonthId }) => {
    const isUploading = uploadingMonthId === document.id;
    const handleMonthAnexo = (isAlteration) => handleAnexarBoleto(document.id, isAlteration);

    return (
        <div 
            key={document.id} 
            className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm transition-shadow hover:border-blue-300"
        >
            <div className="flex justify-between items-center mb-3 border-b pb-2">
                <span className="text-sm font-semibold text-gray-900">
                    Documentos de Referência: {document.dataDisplay}
                </span>
                {isUploading && <LoadingSpinner />}
            </div>

            <div className="grid grid-cols-3 gap-x-6 gap-y-3"> 
                
                {/* 1. Fatura */}
                <div>
                    <span className="text-xs font-medium text-gray-500 block mb-1">Fatura (Comp. Elétrica)</span>
                    <DocumentLink document={document.fatura} />
                </div>
                
                {/* 2. Boleto */}
                <div>
                    <span className="text-xs font-medium text-gray-500 block mb-1">Boleto Bancário</span>
                    {isUploading ? (
                        <span className="text-gray-500 text-xs">Upload em andamento...</span> 
                    ) : (
                        <DocumentLink 
                            document={document.boleto} 
                            isBoleto={true} 
                            onAnexar={handleMonthAnexo}
                        />
                    )}
                </div>

                {/* 3. Relatório Gerado */}
                <div>
                    <span className="text-xs font-medium text-gray-500 block mb-1">Relatório Gerado</span>
                    <DocumentLink document={document.relatorio} />
                </div>
            </div>
        </div>
    );
};


// --- Componente Linha Expansível para Documentos ---
const ExpandableDocumentRow = ({ consumidorId, isExpanded, token }) => {
    const [loading, setLoading] = useState(false);
    const [monthlyDocuments, setMonthlyDocuments] = useState([]);
    const [error, setError] = useState(null);
    const [uploadingMonthId, setUploadingMonthId] = useState(null); 
    
    const fetchDocuments = useCallback(async () => {
        if (!isExpanded || !token) {
            setMonthlyDocuments([]);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const data = await getConsumidorMonthlyDocuments(consumidorId, token);
            // O backend retorna {faturas: [...], boletos: [...], relatorios: [...]}
            // Precisamos agrupar isso por mês de referência.
            
            const allDocs = [
                ...(data.faturas || []).map(d => ({...d, type: 'fatura'})),
                ...(data.boletos || []).map(d => ({...d, type: 'boleto'})),
                ...(data.relatorios || []).map(d => ({...d, type: 'relatorio'})),
            ];

            // Inicia o objeto de agrupamento
            const groupedDocs = allDocs.reduce((acc, doc) => {
                let dataRefKey = null; // Chave para agrupar (Ex: '2024-08')
                
                if (doc.type === 'fatura' && doc.mes_referencia) {
                    // Mes_referencia vem como MM/YYYY no schema, ajustamos para YYYY-MM
                    const [month, year] = doc.mes_referencia.split('/');
                    dataRefKey = `${year}-${month}`;
                } else if (doc.type === 'boleto' && doc.data_vencimento) {
                     // data_vencimento vem como YYYY-MM-DD
                     const date = new Date(doc.data_vencimento);
                     const month = String(date.getMonth() + 1).padStart(2, '0');
                     const year = date.getFullYear();
                     dataRefKey = `${year}-${month}`;
                } else if (doc.type === 'relatorio' && doc.titulo) {
                     // Tenta extrair MM/YYYY do título
                     const match = doc.titulo.match(/(\d{2}\/\d{4})/);
                     if (match) {
                         const [month, year] = match[1].split('/');
                         dataRefKey = `${year}-${month}`;
                     }
                }
    
                if (!dataRefKey) return acc; 
    
                if (!acc[dataRefKey]) {
                    acc[dataRefKey] = { fatura: null, boleto: null, relatorio: null };
                }
    
                // Previne sobrescrever se já existir um documento do mesmo tipo para o mesmo mês
                if (!acc[dataRefKey][doc.type]) {
                    acc[dataRefKey][doc.type] = doc;
                }
                
                return acc;
            }, {});

            setMonthlyDocuments(groupedDocs);

        } catch (err) {
            setError('Não foi possível carregar os documentos deste consumidor.');
            console.error("Erro ao carregar documentos mensais:", err);
        } finally {
            setLoading(false);
        }
    }, [consumidorId, isExpanded, token]);


    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);


    const handleAnexarBoleto = useCallback(async (monthId, isAlteration) => {
        console.log(`Abrindo formulário para ${isAlteration ? 'alterar' : 'anexar'} boleto do mês: ${monthId}`);
        setUploadingMonthId(monthId);

        setTimeout(() => {
            alert(`Simulação: Formulário de upload/alteração para o mês ${monthId} seria aberto agora.`);
            setUploadingMonthId(null);
        }, 1000); 

    }, []);


    const documentsToShow = useMemo(() => {
        // Transforma o objeto agrupado em array para renderização ordenada
        return Object.entries(monthlyDocuments)
            .map(([mesReferencia, docs]) => ({
                id: mesReferencia, 
                dataReferencia: mesReferencia,
                dataDisplay: formatDate(mesReferencia),
                ...docs, // Inclui fatura, boleto, relatorio
            }))
            .sort((a, b) => b.dataReferencia.localeCompare(a.dataReferencia)); // Mais recente primeiro
    }, [monthlyDocuments]);
    

    if (!isExpanded) return null;

    return (
        <td colSpan="6" className="p-0 border-t border-gray-200 bg-gray-50">
            <div className="py-4 px-6">
                
                
                {loading && <div className="text-center py-4"><LoadingSpinner text="Carregando Documentos..." /></div>}
                {error && <div className="text-red-600 text-sm p-3 bg-red-50 rounded-lg">{error}</div>}
                
                {(!loading && !error && documentsToShow.length === 0) && (
                    <div className="text-center py-4 text-gray-500 text-sm italic">
                        Nenhum documento encontrado para este consumidor.
                    </div>
                )}

                {documentsToShow.length > 0 && (
                    <div className="space-y-4">
                        {documentsToShow.map(document => (
                            <DocumentListItem 
                                key={document.id} 
                                document={document} 
                                handleAnexarBoleto={handleAnexarBoleto}
                                uploadingMonthId={uploadingMonthId}
                            />
                        ))}
                    </div>
                )}
            </div>
        </td>
    );
};


// --- Componente Linha Principal do Consumidor ---
const ConsumidorRow = ({ consumidor, token }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const navigate = useNavigate();

    const handleViewDocuments = (id) => {
        navigate(`/consumidores/${id}/documentos`);
    };

    return (
        <>
            <tr 
                className={`bg-white hover:bg-gray-50 transition-colors cursor-pointer ${isExpanded ? 'border-b-0' : 'border-b border-gray-200'}`}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <ChevronRightIcon className={`h-4 w-4 text-gray-400 mr-2 transform transition-transform inline-block ${isExpanded ? 'rotate-90' : ''}`} />
                    {consumidor.nome}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {consumidor.email || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {consumidor.numero_unidade_consumidora}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {consumidor.cpf_cnpj}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <span 
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${consumidor.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                    >
                        {consumidor.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                    {/* BOTÃO DE DOCUMENTOS COM O NOVO ÍCONE */}
                        <button
                            onClick={() => handleViewDocuments(consumidor.id)}
                            className="text-gray-400 hover:text-purple-600 transition-colors"
                            title="Gerir Documentos"
                        >
                            <DocumentViewIcon className="h-5 w-5" /> {/* ÍCONE SUBSTITUÍDO */}
                        </button>
                </td>
            </tr>

            {isExpanded && (
                <tr className="bg-gray-50">
                    <ExpandableDocumentRow 
                        consumidorId={consumidor.id} 
                        isExpanded={isExpanded} 
                        token={token} 
                    />
                </tr>
            )}
        </>
    );
};


// --- Componente Principal da Página ---
export default function UsinaConsumidoresPage() {
    const navigate = useNavigate();
    const { usinaId: currentUsinaId } = useParams();
    const currentId = parseInt(currentUsinaId);
    
    // OBTENÇÃO DO TOKEN E REDIRECIONAMENTO IMEDIATO
    const token = localStorage.getItem('authToken'); 

    const [usina, setUsina] = useState(null);
    const [usinasList, setUsinasList] = useState([]);
    const [consumidores, setConsumidores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // EFEITO DE VERIFICAÇÃO DE SESSÃO
    useEffect(() => {
        if (!token) {
            // REDIRECIONAMENTO SE NÃO HOUVER TOKEN
            console.log("Token ausente. Redirecionando para login.");
            setError("Sessão expirada ou token ausente. Faça login novamente.");
            setLoading(false);
            // navigate('/login'); // Removido para evitar loop em ambientes específicos, mas é a ação correta.
            return;
        }

        const fetchAllData = async () => {
            if (!currentId) {
                setError("ID da Usina inválido.");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const [usinaData, usinasListData, consumidoresData] = await Promise.all([
                    getUsinaById(currentId, token),
                    getUsinas(token, 'ativas'),
                    getConsumidoresByUsinaId(currentId, token)
                ]);

                setUsina(usinaData);
                setUsinasList(usinasListData);
                setConsumidores(consumidoresData);

            } catch (err) {
                console.error("Erro ao carregar dados da página:", err);
                // Captura o erro 401/Credenciais e sugere o login
                if (err.message.includes('validate credentials') || err.message.includes('401')) {
                    setError("Sessão expirada ou acesso negado. Por favor, faça login.");
                    // navigate('/login'); // Ação recomendada
                } else {
                    setError(`Erro de carregamento: ${err.message}`);
                }
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchAllData();
        }
    }, [currentId, token, navigate]);

    // --- FUNÇÃO DE NAVEGAÇÃO ATUALIZADA ---
    // Recebe o ID diretamente, sem o 'event'
    const handleUsinaChange = (newUsinaId) => {
        if (newUsinaId && newUsinaId !== currentId) {
            navigate(`/usinas/${newUsinaId}/consumidores`);
        }
    };

    // --- RENDERIZAÇÃO DE ESTADOS ---
    if (error) {
        // Exibe o erro e sugere ação
        return (
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Erro!</strong>
                    <span className="block sm:inline"> {error}</span>
                </div>
                <button 
                    onClick={() => navigate('/login')} 
                    className="mt-4 inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
                >
                    Fazer Login
                </button>
            </div>
        );
    }
    
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <LoadingSpinner text="Carregando Página da Usina..." />
            </div>
        );
    }
    
    if (!usina) {
        return <div className="text-center p-8 text-gray-600">Usina não encontrada.</div>;
    }


    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-full font-sans bg-gray-50">
            
            {/* Cabeçalho com navegação e título seletor (Layout correto) */}
            <div className="flex items-center mb-6">
                <button
                    onClick={() => navigate('/usinas')}
                    className="p-2 text-gray-500 hover:text-blue-600 transition-colors rounded-full mr-4"
                    title="Voltar para Usinas"
                >
                    <ArrowLeftIcon className="h-6 w-6" />
                </button>

                {/* HEADER SUBSTITUÍDO ABAIXO 
                  O <select> foi trocado por um <Listbox>
                */}
                <header>
                    <div className="flex items-center">
                        <h1 className="text-3xl font-extrabold text-gray-900 leading-tight flex items-center gap-2">
                            <span className="text-gray-500 font-semibold">Usina:</span>
                        </h1>
                        
                        {/* --- INÍCIO DO NOVO LISTBOX --- */}
                        {/* O z-10 é importante para o menu flutuar 
                          sobre o conteúdo da tabela abaixo
                        */}
                        <Listbox value={currentId} onChange={handleUsinaChange}>
                            <div className="relative ml-2 z-10">
                                <Listbox.Button className="relative w-full cursor-pointer text-3xl text-gray-900 hover:text-blue-600 transition-colors leading-tight py-1 pl-1 pr-10 text-left focus:outline-none">
  
                                    {/* Exibe o nome da usina selecionada */}
                                    <span className="block truncate">{usina.nome}</span>
                                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                        <ChevronUpDownIcon
                                            className="h-7 w-7 text-gray-400"
                                            aria-hidden="true"
                                        />
                                    </span>
                                </Listbox.Button>
                                <Transition
                                    as={Fragment} // Importar o Fragment
                                    leave="transition ease-in duration-100"
                                    leaveFrom="opacity-100"
                                    leaveTo="opacity-0"
                                >
                                    <Listbox.Options className="absolute mt-1 max-h-60 w-auto min-w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                        {usinasList.map((u) => (
                                            <Listbox.Option
                                                key={u.id}
                                                value={u.id}
                                                className={({ active }) =>
                                                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                                        active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                                                    }`
                                                }
                                            >
                                                {({ selected }) => (
                                                    <>
                                                        <span
                                                            className={`block truncate ${
                                                                selected ? 'font-medium' : 'font-normal'
                                                            }`}
                                                        >
                                                            {u.nome}
                                                        </span>
                                                        {selected ? (
                                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                                                                <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                            </span>
                                                        ) : null}
                                                    </>
                                                )}
                                            </Listbox.Option>
                                        ))}
                                    </Listbox.Options>
                                </Transition>
                            </div>
                        </Listbox>
                        {/* --- FIM DO NOVO LISTBOX --- */}

                    </div>
                </header>
            </div>


            {/* Tabela de Consumidores (Layout correto) */}
            <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-xl overflow-hidden">
                <div className="p-4 bg-gray-50 border-b">
                    <h2 className="text-lg font-semibold text-gray-800">
                        Consumidores Ativos ({consumidores.length})
                    </h2>
                </div>

                {consumidores.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="bg-gray-100 border-b border-gray-200">
                                <tr className="text-xs text-gray-600 uppercase font-medium tracking-wider">
                                    <th className="px-6 py-3">Nome</th>
                                    <th className="px-6 py-3">Email</th>
                                    <th className="px-6 py-3">UC</th>
                                    <th className="px-6 py-3">CPF/CNPJ</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {consumidores.map(consumidor => (
                                    <ConsumidorRow key={consumidor.id} consumidor={consumidor} token={token} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-16 px-4">
                        <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-lg font-semibold text-gray-800">Nenhum Consumidor Encontrado</h3>
                        <p className="mt-1 text-gray-500">
                            Esta usina não possui consumidores vinculados no momento.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}