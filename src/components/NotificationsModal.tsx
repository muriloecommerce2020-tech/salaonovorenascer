import React from 'react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const notifications = [
    {
      id: 'notif-1',
      title: 'Comissão Creditada em Conta',
      description: 'O fechamento quinzenal de R$ 1.540,00 foi processado via Pix.',
      time: 'Há 15 minutos',
      icon: 'payments',
      unread: true
    },
    {
      id: 'notif-2',
      title: 'Novo Atendimento Agendado',
      description: 'Camila Albuquerque confirmou retoque de Mechas Balayage para sexta-feira.',
      time: 'Há 2 horas',
      icon: 'calendar_today',
      unread: true
    },
    {
      id: 'notif-3',
      title: 'Extrato Bancário Sincronizado',
      description: '348 transações do mês de Novembro foram conciliadas com sucesso.',
      time: 'Ontem',
      icon: 'sync_saved_locally',
      unread: false
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-[#191c1c]/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-[420px] bg-white rounded-2xl p-5 shadow-2xl flex flex-col gap-4 border border-[#e1e3e2] max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-2 border-b border-[#e1e3e2]/60">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#4c6358] text-[22px]">
              notifications
            </span>
            <h2 className="font-serif-display text-[18px] font-semibold text-[#191c1c]">
              Notificações do Salão
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#edeeed] flex items-center justify-center text-[#424844] hover:text-[#191c1c] transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-3 rounded-xl border transition-all flex items-start gap-3 ${
                n.unread
                  ? 'bg-[#cfe5d7]/30 border-[#8fa89b]/50'
                  : 'bg-[#f3f4f3] border-[#e1e3e2]/50 opacity-80'
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-[#cfe5d7] text-[#4c6358] flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[18px]">{n.icon}</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-bold text-[#191c1c]">{n.title}</span>
                <p className="text-[11px] text-[#424844] mt-0.5 leading-relaxed">{n.description}</p>
                <span className="text-[10px] text-[#526259] mt-1 font-medium">{n.time}</span>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          type="button"
          className="w-full h-11 bg-[#4c6358] hover:bg-[#354c41] text-white text-[13px] rounded-xl font-semibold transition-colors cursor-pointer mt-1"
        >
          Marcar todas como lidas
        </button>
      </div>
    </div>
  );
};
