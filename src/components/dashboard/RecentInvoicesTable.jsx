// src/components/dashboard/RecentInvoicesTable.jsx

// Componente para o estado de carregamento (Spinner)
function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center py-20">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
    </div>
  );
}

// Componente para quando a lista estiver vazia
function EmptyState() {
  return (
    <div className="text-center py-16 px-4">
      <h3 className="text-lg font-semibold text-gray-800">Nenhum Resultado</h3>
      <p className="text-gray-500 mt-1">Não há faturas recentes para exibir.</p>
    </div>
  );
}


export default function RecentInvoicesTable({ invoices, loading }) {
  // Mapeamento de status para estilos de cor
  const statusStyles = {
    PAGO: 'bg-green-100 text-green-800',
    PENDENTE: 'bg-yellow-100 text-yellow-800',
    ATRASADO: 'bg-red-100 text-red-800',
    default: 'bg-gray-100 text-gray-800',
  };

  return (
    // Card branco com borda e sombra suaves
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Faturas Recentes</h2>
      </div>
      
      {loading ? (
        <LoadingSpinner />
      ) : invoices.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-xs text-gray-500 uppercase font-medium">
                <th className="px-6 py-3">Consumidor</th>
                <th className="px-6 py-3">Data</th>
                <th className="px-6 py-3">Valor</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-gray-800 font-medium">
                    {invoice.consumer_name}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {new Date(invoice.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {invoice.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(statusStyles[invoice.status.toUpperCase()] || statusStyles.default)}`}>
                      {invoice.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}