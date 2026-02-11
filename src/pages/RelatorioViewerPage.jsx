// src/pages/RelatorioViewerPage.jsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';

// Configuração do Worker
pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

const API_BASE_URL = 'http://127.0.0.1:8000';

export default function RelatorioViewerPage() {
    const { relatorioId } = useParams();
    const navigate = useNavigate();
    
    const [fileUrl, setFileUrl] = useState(null);
    const [numPages, setNumPages] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // A URL para o endpoint de download do backend
    const endpointUrl = `${API_BASE_URL}/relatorios/${relatorioId}/download`;

    useEffect(() => {
        // Carrega o PDF a partir do backend e cria uma URL local (Blob URL)
        const loadPdf = async () => {
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch(endpointUrl, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (response.status === 404) {
                    throw new Error("Relatório não encontrado.");
                }
                if (!response.ok) {
                    throw new Error("Falha ao carregar o ficheiro do servidor.");
                }

                // 1. Converte a resposta para um Blob (tipo de arquivo binário)
                const blob = await response.blob();
                // 2. Cria uma URL temporária na memória do navegador
                const url = URL.createObjectURL(blob);
                
                setFileUrl(url);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        loadPdf();

        // Cleanup: Revogar a URL Blob quando o componente desmonta
        return () => {
            if (fileUrl) {
                URL.revokeObjectURL(fileUrl);
            }
        };
    }, [relatorioId]); 

    function onDocumentLoadSuccess({ numPages }) {
        setNumPages(numPages);
    }

    if (loading) {
        return <div className="text-center p-20">Carregando relatório...</div>;
    }

    if (error) {
        return <div className="text-center p-20 text-red-600">Erro: {error}</div>;
    }
    
    // --- Renderização do Visualizador PDF ---
    return (
        <div className="p-4 bg-gray-100 min-h-screen">
            <div className="flex justify-between items-center bg-white p-3 shadow-md mb-4 rounded-lg sticky top-0 z-10">
                <h1 className="text-xl font-bold">Relatório ID: {relatorioId}</h1>
                <div className="flex gap-3">
                    <button onClick={() => navigate(-1)} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">
                        Voltar
                    </button>
                    {/* Link direto para o download (o navegador deve tratar o FileResponse) */}
                    <a href={endpointUrl} download={`Relatorio_${relatorioId}.pdf`} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Baixar PDF
                    </a>
                </div>
            </div>

            <div className="flex justify-center">
                <div className="shadow-2xl bg-white p-6">
                    <Document 
                        file={fileUrl} 
                        onLoadSuccess={onDocumentLoadSuccess}
                        onLoadError={(err) => setError(`Falha ao carregar documento: ${err.message}`)}
                    >
                        {/* Mapeia todas as páginas para renderização contínua */}
                        {Array.from(new Array(numPages), (el, index) => (
                            <div key={`page_${index + 1}`} className="mb-4">
                                <Page pageNumber={index + 1} renderAnnotationLayer={false} renderTextLayer={false} />
                            </div>
                        ))}
                    </Document>
                </div>
            </div>
        </div>
    );
}