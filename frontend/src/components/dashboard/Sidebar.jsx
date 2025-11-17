// src/components/Sidebar.jsx

import { NavLink } from 'react-router-dom';
import { ChartPieIcon, UserGroupIcon, BoltIcon, UsersIcon } from '@heroicons/react/24/outline';

export default function Sidebar({ isOpen }) {
  const getNavLinkClass = ({ isActive }) => {
    const baseClasses = 'flex items-center gap-3 p-3 rounded-lg font-semibold transition-colors';
    const activeClasses = 'bg-blue-50 text-blue-700';
    const inactiveClasses = 'text-gray-600 hover:bg-gray-100 hover:text-gray-900';
    const justification = isOpen ? '' : 'justify-center';
    return `${baseClasses} ${justification} ${isActive ? activeClasses : inactiveClasses}`;
  };

  return (
    <aside 
      className={`bg-white text-gray-900 flex-shrink-0 border-r border-gray-200 transition-all duration-300 ease-in-out ${isOpen ? 'w-64' : 'w-20'}`}
    >
      {/* CORREÇÃO APLICADA AQUI: Usando o acento grave (`) para a string inteira */}
      <div className={`h-18 flex items-center border-b border-gray-200 ${isOpen ? 'px-6 justify-start' : 'justify-center'}`}>
        <span className={`text-2xl font-bold text-blue-600 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
          Solar MSA
        </span>
      </div>

      <nav className="p-4">
        <ul className="space-y-2">
          <li>
            <NavLink to="/" className={getNavLinkClass} end title="Dashboard">
              <ChartPieIcon className="h-6 w-6 flex-shrink-0" />
              <span className={`transition-all duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>Dashboard</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/usuarios" className={getNavLinkClass} title="Usuários">
              <UserGroupIcon className="h-6 w-6 flex-shrink-0" />
              <span className={`transition-all duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>Usuários</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/usinas" className={getNavLinkClass} title="Usinas">
              <BoltIcon className="h-6 w-6 flex-shrink-0" />
              <span className={`transition-all duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>Usinas</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/consumidores" className={getNavLinkClass} title="Consumidores">
              <UsersIcon className="h-6 w-6 flex-shrink-0" />
              <span className={`transition-all duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>Consumidores</span>
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
}