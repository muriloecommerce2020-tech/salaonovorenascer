import React, { useState } from 'react';
import { ScreenType, UserRole } from '../types';
import { IMAGES } from '../data/mockData';

interface HeaderProps {
  currentScreen: ScreenType;
  currentRole: UserRole;
  userName?: string;
  onNavigate: (screen: ScreenType) => void;
  onOpenNotifications: () => void;
  onSwitchRole: (role: UserRole) => void;
  onLogout: () => void;
  unreadCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  currentRole,
  userName = 'Dorinha Ferreira',
  onNavigate,
  onOpenNotifications,
  onSwitchRole,
  onLogout,
  unreadCount = 2
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const getScreenSubtitle = () => {
    switch (currentScreen) {
      case 'ganhos':
        return 'Meus Ganhos';
      case 'novo':
        return 'Registrar Atendimento';
      case 'ponto':
        return 'Registro de Ponto';
      case 'painel':
        return 'Painel Geral';
      case 'extrato':
        return 'Extrato PDF';
      case 'perfil':
        return 'Perfil Profissional';
      default:
        return 'Gestão';
    }
  };

  const getRoleBadge = () => {
    switch (currentRole) {
      case 'admin':
        return { label: 'Administradora', bg: 'bg-[#cee9da] text-[#092017]' };
      case 'employee':
        return { label: 'Colaboradora', bg: 'bg-[#cfe5d7] text-[#273d33]' };
      case 'service_provider':
      default:
        return { label: 'Prestador de Serviço', bg: 'bg-[#f3f4f3] text-[#526259] border border-[#e1e3e2]' };
    }
  };

  const roleInfo = getRoleBadge();

  return (
    <>
      <header className="fixed top-0 w-full z-40 pt-safe bg-[#f9f9f8]/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-[#e1e3e2]/60">
        <div className="max-w-[480px] mx-auto h-16 px-4 flex items-center justify-between">
          <div
            onClick={() =>
              onNavigate(
                currentRole === 'admin' && currentScreen === 'painel'
                  ? 'painel'
                  : currentRole === 'employee' && currentScreen === 'ponto'
                  ? 'ponto'
                  : 'ganhos'
              )
            }
            className="flex flex-col justify-center min-w-0 pr-2 cursor-pointer select-none"
          >
            <div className="flex items-center gap-2">
              <span className="font-serif-display text-[18px] font-semibold text-[#4c6358] tracking-tight truncate leading-tight">
                Novo Renascer
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${roleInfo.bg}`}
              >
                {roleInfo.label}
              </span>
            </div>
            <span className="font-sans-body text-[11px] font-semibold text-[#526259] truncate uppercase tracking-wider">
              {userName} · {getScreenSubtitle()}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 relative">
            <button
              aria-label="Notificações"
              onClick={onOpenNotifications}
              className="relative w-10 h-10 flex items-center justify-center rounded-full text-[#424844] hover:text-[#4c6358] hover:bg-[#edeeed] transition-colors cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#ba1a1a] ring-2 ring-[#f9f9f8]" />
              )}
            </button>

            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              aria-label="Abrir Menu de Usuário"
              className="flex items-center p-0.5 rounded-full hover:ring-2 hover:ring-[#4c6358]/40 transition-all cursor-pointer relative"
              type="button"
            >
              <img
                alt="Dorinha Ferreira"
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover shadow-xs border border-[#cee9da]"
                src={IMAGES.DORINHA_AVATAR}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                  currentRole === 'admin'
                    ? 'bg-[#4c6358]'
                    : currentRole === 'employee'
                    ? 'bg-[#273d33]'
                    : 'bg-[#95a69c]'
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Quick Profile / Role Switch Popover */}
      {showProfileMenu && (
        <div
          className="fixed inset-0 z-50 bg-black/15 backdrop-blur-xs"
          onClick={() => setShowProfileMenu(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute top-18 right-4 max-w-[300px] w-[92%] bg-white rounded-2xl shadow-xl border border-[#e1e3e2] p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2"
          >
            <div className="flex items-center gap-2.5 pb-2.5 border-b border-[#e1e3e2]/70">
              <div className="w-10 h-10 rounded-full bg-[#cfe5d7] text-[#273d33] font-bold flex items-center justify-center shrink-0 border border-[#8fa89b]/40">
                {userName ? userName.slice(0, 2).toUpperCase() : 'US'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-bold text-[#191c1c] truncate">
                  {userName}
                </span>
                <span className="text-[11px] text-[#526259]">
                  Perfil: <strong>{roleInfo.label}</strong>
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => {
                  onNavigate('perfil');
                  setShowProfileMenu(false);
                }}
                className="w-full py-2.5 px-3 rounded-xl hover:bg-[#f3f4f3] text-[#191c1c] text-[12px] font-semibold flex items-center gap-2 transition-colors cursor-pointer text-left"
              >
                <span className="material-symbols-outlined text-[18px] text-[#4c6358]">person</span>
                Meu Perfil &amp; Chave Pix
              </button>
            </div>

            <div className="pt-2 border-t border-[#e1e3e2]/70">
              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(false);
                  onLogout();
                }}
                className="w-full py-2 px-3 rounded-xl hover:bg-[#ffdad6]/40 text-[#ba1a1a] text-[12px] font-bold flex items-center gap-2 transition-colors cursor-pointer text-left"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Desconectar (Tela de Login)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
