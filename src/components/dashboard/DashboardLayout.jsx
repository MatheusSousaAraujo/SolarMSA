import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function DashboardLayout({ onLogout }) {
  
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Passa o estado 'isOpen' para a Sidebar */}
      <Sidebar isOpen={isSidebarOpen} />

      <div className="flex-1 flex flex-col">
        {/* Passa as funções para o Header */}
        <Header 
          onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)} 
          onLogout={onLogout} 
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          {/* O conteúdo da página (ex: DashboardPage) é renderizado aqui */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}