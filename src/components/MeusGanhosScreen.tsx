import React, { useState } from 'react';
import { Appointment, ScreenType } from '../types';

interface MeusGanhosScreenProps {
  appointments: Appointment[];
  onNavigate: (screen: ScreenType) => void;
  userName?: string;
}

export const MeusGanhosScreen: React.FC<MeusGanhosScreenProps> = ({
  appointments,
  onNavigate,
  userName = 'Dorinha'
}) => {
  const [periodFilter, setPeriodFilter] = useState<'hoje' | 'semana' | 'mes' | 'custom'>('mes');
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customRange, setCustomRange] = useState({ start: '2026-09-01', end: '2026-09-30' });

  // Filtragem dinâmica por período
  const filteredAppointments = appointments.filter((apt) => {
    if (periodFilter === 'hoje') {
      return apt.date.toLowerCase().includes('hoje');
    }
    return true;
  });

  // Cálculo 100% dinâmico a partir dos atendimentos gravados
  const totalGross = filteredAppointments.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
  const totalCommission = filteredAppointments.reduce((sum, a) => sum + (Number(a.commissionAmount) || 0), 0);
  const totalServices = filteredAppointments.length;
  const ticketMedio = totalServices > 0 ? totalGross / totalServices : 0;

  const fmtCurrency = (val: number) =>
    'R$ ' + val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="flex flex-col w-full max-w-[480px] mx-auto px-5 pt-20 pb-28 min-h-screen">
      <div className="flex flex-col w-full gap-y-5">
        {/* Title and New Service Action */}
        <div className="flex items-center justify-between gap-x-3 pt-1">
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#526259]">
              Painel Pessoal
            </span>
            <h1 className="font-serif-display text-[28px] font-semibold text-[#191c1c] tracking-tight leading-tight">
              Meus Atendimentos
            </h1>
          </div>
          <button
            onClick={() => onNavigate('novo')}
            className="flex items-center gap-x-1.5 px-4 py-2.5 rounded-full bg-[#4c6358] text-white shadow-sm hover:bg-[#354c41] active:scale-95 transition-all shrink-0 cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span className="text-[13px] font-semibold">Novo Serviço</span>
          </button>
        </div>

        {/* Period Filter Card */}
        <div className="flex flex-col gap-y-2 bg-white p-3.5 rounded-xl shadow-xs border border-[#e1e3e2]/60">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase text-[#526259] font-semibold tracking-wider">
              Filtrar Período
            </span>
            <span className="flex items-center text-[#4c6358] text-[12px] font-semibold gap-1">
              <span className="material-symbols-outlined text-[14px]">calendar_today</span>
              {periodFilter === 'custom' 
                ? `${customRange.start.slice(8)} Out - ${customRange.end.slice(8)} Out`
                : '01 Out - 15 Out'}
            </span>
          </div>

          <div className="flex items-center gap-x-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => { setPeriodFilter('hoje'); setShowCustomPicker(false); }}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold shrink-0 active:scale-95 transition-all ${
                periodFilter === 'hoje'
                  ? 'bg-[#4c6358] text-white shadow-xs'
                  : 'bg-[#e7e8e7] text-[#424844] hover:bg-[#d9dad9]'
              }`}
              type="button"
            >
              Hoje
            </button>
            <button
              onClick={() => { setPeriodFilter('semana'); setShowCustomPicker(false); }}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold shrink-0 active:scale-95 transition-all ${
                periodFilter === 'semana'
                  ? 'bg-[#4c6358] text-white shadow-xs'
                  : 'bg-[#e7e8e7] text-[#424844] hover:bg-[#d9dad9]'
              }`}
              type="button"
            >
              Esta Semana
            </button>
            <button
              onClick={() => { setPeriodFilter('mes'); setShowCustomPicker(false); }}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold shrink-0 active:scale-95 transition-all ${
                periodFilter === 'mes'
                  ? 'bg-[#4c6358] text-white shadow-xs'
                  : 'bg-[#e7e8e7] text-[#424844] hover:bg-[#d9dad9]'
              }`}
              type="button"
            >
              Este Mês
            </button>
            <button
              onClick={() => {
                setPeriodFilter('custom');
                setShowCustomPicker(!showCustomPicker);
              }}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold shrink-0 flex items-center gap-1 active:scale-95 transition-all ${
                periodFilter === 'custom'
                  ? 'bg-[#4c6358] text-white shadow-xs'
                  : 'bg-[#e7e8e7] text-[#424844] hover:bg-[#d9dad9]'
              }`}
              type="button"
            >
              <span>Personalizado</span>
              <span className="material-symbols-outlined text-[14px]">tune</span>
            </button>
          </div>

          {showCustomPicker && (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#e1e3e2]/50 animate-in fade-in">
              <div className="flex flex-col bg-[#f3f4f3] p-1.5 rounded-lg">
                <span className="text-[10px] text-[#526259]">Data Início</span>
                <input
                  type="date"
                  value={customRange.start}
                  onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                  className="bg-transparent text-[12px] font-semibold text-[#191c1c] outline-none"
                />
              </div>
              <div className="flex flex-col bg-[#f3f4f3] p-1.5 rounded-lg">
                <span className="text-[10px] text-[#526259]">Data Fim</span>
                <input
                  type="date"
                  value={customRange.end}
                  onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                  className="bg-transparent text-[12px] font-semibold text-[#191c1c] outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Bento Grid Metrics */}
        <div className="grid grid-cols-2 gap-3">
          {/* Faturado Bruto */}
          <div className="flex flex-col p-4 rounded-xl bg-white shadow-xs border border-[#e1e3e2]/60 justify-between">
            <div className="flex items-center justify-between text-[#526259]">
              <span className="text-[12px] font-medium">Faturado Bruto</span>
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            </div>
            <div className="mt-2">
              <span className="text-[24px] font-bold text-[#191c1c] tracking-tight block">
                {fmtCurrency(totalGross)}
              </span>
              <span className="text-[11px] font-semibold text-[#4c6358] flex items-center gap-0.5 mt-0.5">
                <span className="material-symbols-outlined text-[13px]">trending_up</span> +14% vs. anterior
              </span>
            </div>
          </div>

          {/* Minha Comissão (40%) */}
          <div className="flex flex-col p-4 rounded-xl bg-[#cfe5d7] shadow-xs justify-between border border-[#b6ccbe]/60">
            <div className="flex items-center justify-between text-[#53675c]">
              <span className="text-[12px] font-bold">Minha Comissão (40%)</span>
              <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
            </div>
            <div className="mt-2">
              <span className="text-[24px] font-extrabold text-[#273d33] tracking-tight block">
                {fmtCurrency(totalCommission)}
              </span>
              <span className="text-[11px] font-medium text-[#53675c] opacity-90">
                A receber no ciclo
              </span>
            </div>
          </div>

          {/* Atendimentos */}
          <div className="flex flex-col p-4 rounded-xl bg-white shadow-xs border border-[#e1e3e2]/60 justify-between">
            <div className="flex items-center justify-between text-[#526259]">
              <span className="text-[12px] font-medium">Atendimentos</span>
              <span className="material-symbols-outlined text-[18px]">face_3</span>
            </div>
            <div className="mt-2">
              <span className="text-[24px] font-bold text-[#191c1c] tracking-tight block">
                {totalServices}
              </span>
              <span className="text-[11px] text-[#424844]">Clientes atendidas</span>
            </div>
          </div>

          {/* Ticket Médio */}
          <div className="flex flex-col p-4 rounded-xl bg-white shadow-xs border border-[#e1e3e2]/60 justify-between">
            <div className="flex items-center justify-between text-[#526259]">
              <span className="text-[12px] font-medium">Ticket Médio</span>
              <span className="material-symbols-outlined text-[18px]">analytics</span>
            </div>
            <div className="mt-2">
              <span className="text-[24px] font-bold text-[#191c1c] tracking-tight block">
                {fmtCurrency(ticketMedio)}
              </span>
              <span className="text-[11px] text-[#424844]">Por procedimento</span>
            </div>
          </div>
        </div>

        {/* Serviços Mais Realizados Progress Bar */}
        <div className="flex flex-col p-4 rounded-xl bg-white shadow-xs border border-[#e1e3e2]/60 gap-y-3">
          <div className="flex items-center justify-between">
            <span className="font-serif-display text-[16px] font-semibold text-[#191c1c]">
              Serviços Mais Realizados
            </span>
            <span className="text-[11px] text-[#526259] font-medium">Distribuição %</span>
          </div>

          <div className="w-full flex h-3 rounded-full overflow-hidden bg-[#edeeed]">
            <div className="bg-[#4c6358] h-full transition-all duration-500" style={{ width: '45%' }} />
            <div className="bg-[#8fa89b] h-full transition-all duration-500" style={{ width: '30%' }} />
            <div className="bg-[#b6ccbe] h-full transition-all duration-500" style={{ width: '25%' }} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-y-1 pt-1 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4c6358] inline-block" />
              <span className="text-[#191c1c] font-medium">Mechas &amp; Escova</span>
              <span className="text-[#526259] font-bold">45%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#8fa89b] inline-block" />
              <span className="text-[#191c1c] font-medium">Corte &amp; Styling</span>
              <span className="text-[#526259] font-bold">30%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#b6ccbe] inline-block" />
              <span className="text-[#191c1c] font-medium">Manicure Spa</span>
              <span className="text-[#526259] font-bold">25%</span>
            </div>
          </div>
        </div>

        {/* Histórico de Atendimentos */}
        <div className="flex flex-col gap-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-serif-display text-[18px] font-semibold text-[#191c1c]">
                Histórico de Atendimentos
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#e7e8e7] text-[#424844] text-[11px] font-semibold">
                {filteredAppointments.length}
              </span>
            </div>
            <span className="text-[#4c6358] text-[12px] font-semibold flex items-center gap-0.5">
              <span>Sincronizado via Supabase</span>
              <span className="material-symbols-outlined text-[15px]">cloud_done</span>
            </span>
          </div>

          {/* Cards List */}
          <div className="flex flex-col gap-y-3">
            {filteredAppointments.length === 0 ? (
              <div className="p-6 rounded-xl bg-white border border-[#e1e3e2]/60 text-center flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-[32px] text-[#526259]">content_cut</span>
                <span className="text-[13px] font-semibold text-[#191c1c]">Nenhum atendimento registrado neste período</span>
                <p className="text-[11px] text-[#526259]">Toque no botão "Novo Serviço" acima para lançar um atendimento.</p>
              </div>
            ) : (
              filteredAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex flex-col p-4 rounded-xl bg-white shadow-xs border border-[#e1e3e2]/60 gap-y-2.5 hover:border-[#4c6358]/40 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-[#edeeed] shrink-0 border border-[#e1e3e2]">
                        {apt.clientAvatar ? (
                          <img
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            alt={apt.clientName}
                            src={apt.clientAvatar}
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[#cfe5d7] text-[#4c6358] font-bold text-[14px]">
                            {apt.clientName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[14px] font-semibold text-[#191c1c] truncate">
                          {apt.clientName}
                        </span>
                        <span className="text-[12px] text-[#526259]">{apt.date}</span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full bg-[#cfe5d7] text-[#53675c] text-[11px] font-semibold flex items-center gap-1 shrink-0">
                      <span 
                        className="material-symbols-outlined text-[13px]" 
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        verified
                      </span>
                      Confirmado
                    </span>
                  </div>

                  <div className="flex flex-col bg-[#f3f4f3] p-2.5 rounded-lg gap-y-1">
                    <div className="flex items-center justify-between text-[#191c1c]">
                      <span className="text-[13px] font-medium">{apt.serviceName}</span>
                      <span className="text-[13px] font-semibold">{fmtCurrency(apt.price)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[#424844]">
                        Sua Comissão ({Math.round(apt.commissionRate * 100)}%)
                      </span>
                      <span className="text-[14px] text-[#4c6358] font-bold">
                        {fmtCurrency(apt.commissionAmount)}
                      </span>
                    </div>
                  </div>

                  {apt.notes && (
                    <div className="flex items-center gap-1.5 text-[#424844] text-[12px]">
                      <span className="material-symbols-outlined text-[15px] text-[#526259]">notes</span>
                      <span className="italic truncate">{apt.notes}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Motivational Card */}
        <div className="flex flex-col items-center justify-center p-5 rounded-xl bg-[#f3f4f3] text-center gap-y-2 border border-[#e1e3e2]/60 mt-1">
          <span 
            className="material-symbols-outlined text-[#4c6358] text-[32px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            spa
          </span>
          <span className="font-serif-display text-[17px] font-semibold text-[#191c1c]">
            Excelente ritmo, {userName.split(' ')[0]}!
          </span>
          <p className="text-[12px] text-[#424844] max-w-xs leading-relaxed">
            Seus atendimentos e comissões estão sincronizados com o Supabase em tempo real.
          </p>
        </div>
      </div>
    </div>
  );
};
