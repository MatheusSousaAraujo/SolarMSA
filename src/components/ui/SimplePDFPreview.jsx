// src/components/ui/SimplePDFPreview.jsx

import { useState, useEffect } from 'react';
import { Document, Page } from 'react-pdf';

const API_BASE_URL = 'http://127.0.0.1:8000'; // Mantenha a URL base aqui também

export default function SimplePDFPreview({ file, fileName, isFromServer = false }) {
    const [fileUrl, setFileUrl] = useState(null);

    useEffect(() => {
        // Se não houver arquivo, limpa a URL e não faz mais nada
        if (!file) {
            setFileUrl(null);
            return;
        }

        let url;
        if (!isFromServer) {
            // Se for um arquivo local (do tipo File/Blob), cria uma Object URL
            url = URL.createObjectURL(file);
            setFileUrl(url);
        } else {
            // Se for um caminho vindo do servidor, monta a URL completa
            url = `${API_BASE_URL}/${file}`;
            setFileUrl(url);
        }

        // Função de limpeza: é executada quando o componente é desmontado
        // ou quando o 'file' muda. Ela evita vazamentos de memória.
        return () => {
            if (!isFromServer && url) {
                URL.revokeObjectURL(url);
            }
        };
    }, [file, isFromServer]);

    // Renderiza um placeholder se não houver arquivo para exibir
    if (!fileUrl) {
        return (
            <div className="w-48 text-center">
                <div className="w-48 h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                    {fileName || "Documento pendente"}
                </div>
            </div>
        );
    }

    return (
        <div className="w-48 text-center">
            <div className="p-2 border border-gray-300 rounded-lg shadow-md mb-1 mx-auto w-fit">
                <Document
                    file={fileUrl}
                    loading={<div className="w-40 h-56 flex items-center justify-center">Carregando...</div>}
                    error={<div className="w-40 h-56 flex items-center justify-center text-red-500 text-xs p-2">Erro ao carregar prévia.</div>}
                >
                    <Page pageNumber={1} width={160} />
                </Document>
            </div>
            <p className="text-xs text-gray-600 truncate px-2">{fileName || 'Documento'}</p>
        </div>
    );
}