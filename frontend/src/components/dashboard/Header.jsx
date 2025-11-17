import { Bars3Icon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

export default function Header({ onToggleSidebar, onLogout }) {
  console.log('Header recebeu onLogout:', onLogout);
  return (
    <header className="flex-shrink-0 bg-white border-b border-gray-200 h-18">
      <div className="flex items-center justify-between p-2 sm:p-4">
        {/* LADO ESQUERDO: Botão de toggle da sidebar */}
        <button 
          onClick={onToggleSidebar}
          className="p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
        >
          <span className="sr-only">Abrir/Fechar menu</span>
          <Bars3Icon className="h-6 w-6" />
        </button>

        {/* LADO DIREITO: Botão de Sair */}
        <div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
            title="Sair da sua conta"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
}