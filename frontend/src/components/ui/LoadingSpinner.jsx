// src/components/ui/LoadingSpinner.jsx

import React from 'react';

/**
 * Um componente simples de spinner de carregamento usando Tailwind CSS.
 * Pode ajustar o tamanho, cor e espaçamento conforme necessário.
 */
export default function LoadingSpinner({ size = 'h-8 w-8', color = 'border-t-blue-600', className = 'py-20' }) {
  // Classes base para o spinner
  const spinnerBaseClass = `border-4 border-gray-200 rounded-full animate-spin ${size} ${color}`;

  return (
    // Container para centralizar o spinner
    <div className={`flex justify-center items-center ${className}`}>
      <div className={spinnerBaseClass} role="status" aria-label="Carregando...">
        {/* Adiciona um elemento para acessibilidade, lido por leitores de ecrã */}
        <span className="sr-only">Carregando...</span>
      </div>
    </div>
  );
}

// Explicação das Props:
// size: Define a altura e largura (ex: 'h-8 w-8', 'h-12 w-12').
// color: Define a cor da parte superior do spinner (ex: 'border-t-blue-600', 'border-t-green-500').
// className: Permite adicionar classes ao container externo (ex: 'py-20' para espaçamento vertical).