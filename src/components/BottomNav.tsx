import React from 'react';
import { ScreenType, UserRole } from '../types';

interface BottomNavProps {
  currentScreen: ScreenType;
  currentRole: UserRole;
  onNavigate: (screen: ScreenType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, currentRole, onNavigate }) => {
  // 1. Prestador de Serviço: apenas Novo e Ganhos
  const serviceProviderItems: { screen: ScreenType; label: string; icon: string }[] = [
    { screen: 'novo', label: 'Novo', icon: 'add_circle' },
    { screen: 'ganhos', label: 'Ganhos', icon: 'payments' },
  ];

  // 2. Colaborador(a) (CLT/com ponto): Novo, Ganhos e Ponto
  const employeeItems: { screen: ScreenType; label: string; icon: string }[] = [
    { screen: 'novo', label: 'Novo', icon: 'add_circle' },
    { screen: 'ganhos', label: 'Ganhos', icon: 'payments' },
    { screen: 'ponto', label: 'Ponto', icon: 'fingerprint' },
  ];

  // 3. Administrador: todos os acessos do sistema
  const adminItems: { screen: ScreenType; label: string; icon: string }[] = [
    { screen: 'novo', label: 'Novo', icon: 'add_circle' },
    { screen: 'ganhos', label: 'Ganhos', icon: 'payments' },
    { screen: 'ponto', label: 'Ponto', icon: 'fingerprint' },
    { screen: 'painel', label: 'Painel', icon: 'dashboard' },
    { screen: 'extrato', label: 'Extrato', icon: 'picture_as_pdf' },
    { screen: 'perfil', label: 'Perfil', icon: 'person' },
  ];

  const itemsToDisplay =
    currentRole === 'service_provider'
      ? serviceProviderItems
      : currentRole === 'employee'
      ? employeeItems
      : adminItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full z-40 pb-safe bg-[#f9f9f8]/92 backdrop-blur-xl shadow-[0_-2px_12px_rgba(45,64,54,0.06)] border-t border-[#e1e3e2]/70">
      <div
        className={`max-w-[480px] mx-auto flex items-center h-20 px-2.5 ${
          currentRole === 'service_provider'
            ? 'justify-center gap-12'
            : currentRole === 'employee'
            ? 'justify-center gap-8'
            : 'justify-between'
        }`}
      >
        {itemsToDisplay.map((item) => {
          const isActive = currentScreen === item.screen;
          return (
            <button
              key={item.screen}
              onClick={() => onNavigate(item.screen)}
              className={`flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${
                currentRole === 'service_provider'
                  ? `px-8 py-2.5 rounded-2xl ${
                      isActive
                        ? 'text-[#4c6358] font-bold bg-[#cfe5d7]/70 shadow-sm ring-1 ring-[#8fa89b]/40'
                        : 'text-[#424844] hover:text-[#191c1c] hover:bg-[#edeeed]/60'
                    }`
                  : currentRole === 'employee'
                  ? `px-5 py-2 rounded-2xl ${
                      isActive
                        ? 'text-[#4c6358] font-bold bg-[#cfe5d7]/70 shadow-sm ring-1 ring-[#8fa89b]/40'
                        : 'text-[#424844] hover:text-[#191c1c] hover:bg-[#edeeed]/60'
                    }`
                  : `w-12 h-14 rounded-xl ${
                      isActive
                        ? 'text-[#4c6358] font-bold bg-[#cfe5d7]/50 shadow-xs'
                        : 'text-[#424844] hover:text-[#191c1c] hover:bg-[#edeeed]/60'
                    }`
              }`}
              type="button"
            >
              <span
                className="material-symbols-outlined text-[23px]"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              <span className="font-sans-body text-[11px] font-semibold tracking-tight truncate pt-0.5">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
