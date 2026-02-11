// src/components/dashboard/StatCard.jsx

export default function StatCard({ title, value, icon, iconBgColor }) {
  // Define uma cor de fundo padrão para o ícone se nenhuma for passada
  const bgColor = iconBgColor || 'bg-gray-100';

  return (
    // Card branco com borda e sombra suaves
    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-center">
      {icon && (
        // Círculo colorido para dar destaque ao ícone
        <div className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full mr-4 ${bgColor}`}>
          {icon}
        </div>
      )}
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}