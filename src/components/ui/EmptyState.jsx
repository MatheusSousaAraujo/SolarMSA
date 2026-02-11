// src/components/ui/EmptyState.jsx

import React from 'react';
import { InboxIcon } from '@heroicons/react/24/outline'; // Exemplo de ícone

/**
 * Componente para exibir quando uma lista está vazia.
 * @param {object} props
 * @param {string} props.item - Nome do item (plural, ex: "consumidores", "usuários")
 * @param {string} props.filter - Filtro atual (ex: "ativos", "excluidos", "todos")
 * @param {string} [props.message] - Mensagem personalizada (opcional, substitui a padrão)
 */
export default function EmptyState({ item = "itens", filter = "todos", message }) {

  // Define mensagens padrão baseadas no filtro
  const defaultMessages = {
    ativos: `Nenhum ${item} ativo encontrado.`,
    excluidos: `Nenhum ${item} na lixeira.`,
    todos: `Não há ${item} cadastrados.`
  };

  // Usa a mensagem personalizada se fornecida, senão usa a padrão baseada no filtro
  const displayMessage = message || defaultMessages[filter] || `Não há ${item} para exibir.`;

  return (
    <div className="text-center py-16 px-4">
      {/* Ícone (opcional, pode ajustar ou remover) */}
      <InboxIcon className="mx-auto h-12 w-12 text-gray-400" />

      {/* Título */}
      <h3 className="mt-2 text-lg font-semibold text-gray-800">
        Nenhum Resultado
      </h3>

      {/* Mensagem */}
      <p className="mt-1 text-sm text-gray-500">
        {displayMessage}
      </p>

      {/* Opcional: Botão de Ação (ex: "Criar Novo") - Pode ser adicionado aqui se fizer sentido */}
      {/*
      <div className="mt-6">
        <Link
          to={`/${item}/novo`} // Ex: /consumidores/novo
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Criar Novo {item === 'usuários' ? 'Usuário' : item.slice(0, -1)} 
        </Link>
      </div>
      */}
    </div>
  );
}