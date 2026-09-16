import React, { useState } from 'react';
import { COLLABORATORS } from '../data/mockData';
import { ScreenType, Appointment } from '../types';
import { UserProfile } from '../lib/supabase';

interface PainelGeralScreenProps {
  onOpenNewServiceModal: () => void;
  onOpenManageStaffModal: () => void;
  onNavigate?: (screen: ScreenType) => void;
  pendingPontoCount?: number;
  appointments?: Appointment[];
  staffList?: UserProfile[];
}

export const PainelGeralScreen: React.FC<PainelGeralScreenProps> = ({
  onOpenNewServiceModal,
  onOpenManageStaffModal,
  onNavigate,
  pendingPontoCount = 1,
  appointments = [],
  staffList = []
}) => {
  const [granularity, setGranularity] = useState<'dia' | 'mes' | 'ano'>('mes');
  const [selectedMonth, setSelectedMonth] = useState('Out');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Cálculos consolidados baseados no Supabase (com baseline de fallback)
  const dynamicGross = appointments.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
  const dynamicCommission = appointments.reduce((sum, a) => sum + (Number(a.commissionAmount) || 0), 0);
  const totalGross = dynamicGross > 0 ? dynamicGross : 24680;
  const totalCommission = dynamicCommission > 0 ? dynamicCommission : Math.round(totalGross * 0.40);
  const totalLiquid = totalGross - totalCommission;
  const totalAppointmentsCount = appointments.length > 0 ? appointments.length : 164;
  const ticketMedio = totalAppointmentsCount > 0 ? totalGross / totalAppointmentsCount : 150.48;
  const activeStaffCount = staffList.length > 0 ? staffList.filter(s => s.active).length : 5;

  const fmtCurrency = (val: number) =>
    'R$ ' + val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleExport = () => {
    showToast('Download iniciado: fechamento-outubro.pdf');
  };

  const chartData = [
    { month: 'Jul', bruto: 18200, liq: 10920, brutoHeight: 65, liqHeight: 40 },
    { month: 'Ago', bruto: 20400, liq: 12240, brutoHeight: 75, liqHeight: 48 },
    { month: 'Set', bruto: 21800, liq: 13080, brutoHeight: 80, liqHeight: 52 },
    { month: 'Out', bruto: 24680, liq: 14808, brutoHeight: 92, liqHeight: 62 }
  ];

  const currentHighlight = chartData.find((d) => d.month === selectedMonth) || chartData[3];

  return (
    <div className="flex flex-col w-full max-w-[480px] mx-auto px-5 pt-20 pb-28 min-h-screen">
      <div className="flex flex-col w-full space-y-4">
        {/* Executive Header */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-semibold text-[#526259] uppercase tracking-wider">
              Gestão Global
            </span>
            <h1 className="font-serif-display text-[24px] font-semibold text-[#191c1c] tracking-tight leading-tight">
              Painel Geral Executivo
            </h1>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#cfe5d7] text-[#273d33] shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#4c6358] animate-pulse" />
            <span className="text-[11px] font-bold">Ao Vivo</span>
          </div>
        </div>

        {/* Date Filter & Granularity */}
        <div className="bg-white rounded-xl p-3 shadow-xs border border-[#e1e3e2]/60 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0 flex-1 bg-[#f3f4f3] px-3 py-2 rounded-lg">
              <span className="material-symbols-outlined text-[#4c6358] text-[20px] shrink-0">
                calendar_month
              </span>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-[#526259] font-medium">Intervalo Selecionado</span>
                <span className="text-[13px] font-semibold text-[#191c1c] truncate">
                  01 Out, 2024 — 31 Out, 2024
                </span>
              </div>
            </div>
            <button
              aria-label="Ajustar período"
              onClick={() => showToast('Período fixado em Outubro/2024')}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#edeeed] hover:bg-[#e7e8e7] text-[#4c6358] transition-colors shrink-0 cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">tune</span>
            </button>
          </div>

          {/* Granularity Toggle */}
          <div className="grid grid-cols-3 gap-1 bg-[#f3f4f3] p-1 rounded-lg">
            {(['dia', 'mes', 'ano'] as const).map((g) => {
              const labels = { dia: 'Dia a Dia', mes: 'Por Mês', ano: 'Por Ano' };
              const isSel = granularity === g;
              return (
                <button
                  key={g}
                  onClick={() => {
                    setGranularity(g);
                    showToast(`Visualização atualizada: ${labels[g]}`);
                  }}
                  className={`py-1.5 rounded-md text-[12px] transition-all cursor-pointer ${
                    isSel
                      ? 'bg-[#4c6358] text-white shadow-xs font-semibold'
                      : 'text-[#424844] hover:text-[#191c1c]'
                  }`}
                  type="button"
                >
                  {labels[g]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Consolidated Financial Metrics Bento Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Faturamento Bruto Total Card */}
          <div className="col-span-2 bg-gradient-to-br from-[#4c6358] to-[#354c41] text-white p-4 rounded-xl shadow-md relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex justify-between items-start mb-2">
              <div className="flex flex-col">
                <span className="text-[12px] text-[#cee9da] font-medium opacity-90">
                  Receita Bruta Total
                </span>
                <span className="text-[30px] font-extrabold tracking-tight mt-0.5">
                  {fmtCurrency(totalGross)}
                </span>
              </div>
              <span className="material-symbols-outlined text-[#cee9da] text-[24px] p-2 bg-white/10 rounded-xl">
                account_balance
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[#cee9da] text-[12px] font-medium">
              <span className="material-symbols-outlined text-[16px]">trending_up</span>
              <span>Sincronizado em tempo real com o banco de dados</span>
            </div>
          </div>

          {/* Líquido Salão (60%) */}
          <div className="bg-white p-3.5 rounded-xl shadow-xs border border-[#e1e3e2]/60 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[#526259] font-medium">Líquido Salão</span>
              <span className="material-symbols-outlined text-[#4c6358] text-[18px]">savings</span>
            </div>
            <div className="my-2">
              <div className="text-[18px] font-bold text-[#4c6358]">{fmtCurrency(totalLiquid)}</div>
              <span className="text-[11px] text-[#526259]">Retenção de 60%</span>
            </div>
            <div className="w-full bg-[#f3f4f3] h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#4c6358] h-full rounded-full" style={{ width: '60%' }} />
            </div>
          </div>

          {/* Comissões Pagas (40%) */}
          <div className="bg-white p-3.5 rounded-xl shadow-xs border border-[#e1e3e2]/60 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[#526259] font-medium">Comissões (40%)</span>
              <span className="material-symbols-outlined text-[#526259] text-[18px]">group</span>
            </div>
            <div className="my-2">
              <div className="text-[18px] font-bold text-[#191c1c]">{fmtCurrency(totalCommission)}</div>
              <span className="text-[11px] text-[#526259]">{activeStaffCount} Profissionais</span>
            </div>
            <div className="w-full bg-[#f3f4f3] h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#95a69c] h-full rounded-full" style={{ width: '40%' }} />
            </div>
          </div>

          {/* Procedimentos Concluídos */}
          <div className="col-span-2 bg-[#cfe5d7]/50 p-3.5 rounded-xl border border-[#b6ccbe]/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#cfe5d7] flex items-center justify-center text-[#273d33]">
                <span className="material-symbols-outlined text-[22px]">spa</span>
              </div>
              <div>
                <span className="text-[11px] text-[#526259] font-medium block">
                  Procedimentos Concluídos
                </span>
                <span className="text-[16px] font-bold text-[#191c1c]">{totalAppointmentsCount} atendimentos</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[14px] font-bold text-[#4c6358]">{fmtCurrency(ticketMedio)}</span>
              <span className="text-[11px] text-[#526259]">Ticket Médio</span>
            </div>
          </div>
        </div>

        {/* Comparative Chart: Bruto vs Líquido */}
        <div className="bg-white p-4 rounded-xl shadow-xs border border-[#e1e3e2]/60 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif-display text-[17px] font-semibold text-[#191c1c]">
                Bruto vs Líquido
              </h2>
              <span className="text-[11px] text-[#526259]">Evolução dos últimos meses</span>
            </div>
            <div className="flex items-center gap-2.5 text-[11px] font-medium">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4c6358]" />
                <span className="text-[#526259]">Líq</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#95a69c]" />
                <span className="text-[#526259]">Bruto</span>
              </div>
            </div>
          </div>

          {/* SVG Bar Chart */}
          <div className="w-full pt-1">
            <svg className="w-full h-32 overflow-visible" viewBox="0 0 320 130">
              <line stroke="#e7e8e7" strokeDasharray="2 2" strokeWidth="1" x1="0" x2="320" y1="110" y2="110" />
              <line stroke="#e7e8e7" strokeDasharray="2 2" strokeWidth="1" x1="0" x2="320" y1="65" y2="65" />
              <line stroke="#e7e8e7" strokeDasharray="2 2" strokeWidth="1" x1="0" x2="320" y1="20" y2="20" />

              {/* Jul */}
              <g className="cursor-pointer" onClick={() => setSelectedMonth('Jul')}>
                <rect fill="#95a69c" height="65" opacity={selectedMonth === 'Jul' ? 1 : 0.6} rx="3" width="14" x="25" y="45" />
                <rect fill="#4c6358" height="40" rx="3" width="14" x="42" y="70" />
                <text className="text-[11px] fill-[#526259] font-medium" textAnchor="middle" x="40" y="125">Jul</text>
              </g>

              {/* Ago */}
              <g className="cursor-pointer" onClick={() => setSelectedMonth('Ago')}>
                <rect fill="#95a69c" height="75" opacity={selectedMonth === 'Ago' ? 1 : 0.6} rx="3" width="14" x="95" y="35" />
                <rect fill="#4c6358" height="48" rx="3" width="14" x="112" y="62" />
                <text className="text-[11px] fill-[#526259] font-medium" textAnchor="middle" x="110" y="125">Ago</text>
              </g>

              {/* Set */}
              <g className="cursor-pointer" onClick={() => setSelectedMonth('Set')}>
                <rect fill="#95a69c" height="80" opacity={selectedMonth === 'Set' ? 1 : 0.6} rx="3" width="14" x="165" y="30" />
                <rect fill="#4c6358" height="52" rx="3" width="14" x="182" y="58" />
                <text className="text-[11px] fill-[#526259] font-medium" textAnchor="middle" x="180" y="125">Set</text>
              </g>

              {/* Out (Active) */}
              <g className="cursor-pointer" onClick={() => setSelectedMonth('Out')}>
                <rect fill="#95a69c" height="92" rx="3" width="14" x="235" y="18" />
                <rect fill="#4c6358" height="62" rx="3" width="14" x="252" y="48" />
                <text className="text-[11px] fill-[#4c6358] font-bold" textAnchor="middle" x="250" y="125">Out</text>
              </g>
            </svg>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-[#f3f4f3] text-[#424844] text-[11px]">
            <span className="flex items-center gap-1 font-medium">
              <span className="material-symbols-outlined text-[16px] text-[#4c6358]">insights</span>
              {selectedMonth === 'Out'
                ? 'Pico em Outubro: +18% de margem'
                : `Dados de ${selectedMonth}: Bruto R$ ${(currentHighlight.bruto / 1000).toFixed(1)}k`}
            </span>
            <span className="font-bold text-[#4c6358]">
              R$ {(currentHighlight.bruto / 1000).toFixed(1).replace('.', ',')}k
            </span>
          </div>
        </div>

        {/* Desempenho por Colaboradora */}
        <div className="flex flex-col space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-serif-display text-[17px] font-semibold text-[#191c1c]">
              Desempenho por Colaboradora
            </h2>
            <span className="text-[11px] text-[#526259] font-medium">4 ativas</span>
          </div>

          {COLLABORATORS.map((col) => (
            <div
              key={col.id}
              className="bg-white p-3.5 rounded-xl shadow-xs border border-[#e1e3e2]/60 flex flex-col space-y-2 hover:border-[#8fa89b]/50 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    alt={col.name}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover shadow-xs border border-[#cee9da]"
                    src={col.avatar}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div>
                    <span className="text-[13px] font-bold text-[#191c1c] block leading-tight">
                      {col.name}
                    </span>
                    <span className="text-[11px] text-[#526259]">{col.role}</span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#cfe5d7] text-[#273d33] text-[11px] font-bold">
                  {col.servicesCount} serviços
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1 pt-1 text-center bg-[#f3f4f3] p-2 rounded-lg">
                <div>
                  <span className="text-[10px] text-[#526259] block">Bruto</span>
                  <span className="text-[12px] text-[#191c1c] font-semibold">
                    R$ {col.grossRevenue.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#526259] block">Comissão (40%)</span>
                  <span className="text-[12px] text-[#424844] font-semibold">
                    R$ {col.commission.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#4c6358] block font-medium">Salão (60%)</span>
                  <span className="text-[12px] text-[#4c6358] font-bold">
                    R$ {col.salonShare.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Ações Administrativas */}
        <div className="bg-white p-4 rounded-xl shadow-xs border border-[#e1e3e2]/60 flex flex-col space-y-2">
          <span className="text-[11px] text-[#526259] uppercase tracking-wider font-semibold">
            Ações Administrativas
          </span>
          <div className="flex flex-col gap-2 pt-1">
            {onNavigate && (
              <button
                onClick={() => onNavigate('ponto')}
                className="w-full h-12 flex items-center justify-between px-4 rounded-xl bg-[#cfe5d7] text-[#273d33] hover:bg-[#b6ccbe] transition-all active:scale-[0.98] shadow-xs cursor-pointer border border-[#8fa89b]/40 font-bold"
                type="button"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-[#4c6358]">fingerprint</span>
                  <span className="text-[13px]">Auditoria &amp; Registros de Ponto</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {pendingPontoCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#ba1a1a] text-white text-[10px] font-bold">
                      {pendingPontoCount} pendente
                    </span>
                  )}
                  <span className="material-symbols-outlined text-[#273d33] text-[18px]">chevron_right</span>
                </div>
              </button>
            )}

            <button
              onClick={onOpenNewServiceModal}
              className="w-full h-12 flex items-center justify-between px-4 rounded-xl bg-[#4c6358] text-white hover:bg-[#354c41] transition-all active:scale-[0.98] shadow-xs cursor-pointer"
              type="button"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">add_task</span>
                <span className="text-[13px] font-semibold">Cadastrar Novo Serviço</span>
              </div>
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>

            <button
              onClick={onOpenManageStaffModal}
              className="w-full h-12 flex items-center justify-between px-4 rounded-xl bg-[#f3f4f3] text-[#191c1c] hover:bg-[#e7e8e7] transition-colors cursor-pointer border border-[#e1e3e2]/60"
              type="button"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#4c6358] text-[20px]">badge</span>
                <span className="text-[13px] font-semibold">Gerenciar Prestadoras</span>
              </div>
              <span className="material-symbols-outlined text-[#526259] text-[18px]">
                chevron_right
              </span>
            </button>

            <button
              onClick={handleExport}
              className="w-full h-12 flex items-center justify-between px-4 rounded-xl bg-[#f3f4f3] text-[#191c1c] hover:bg-[#e7e8e7] transition-colors cursor-pointer border border-[#e1e3e2]/60"
              type="button"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#526259] text-[20px]">
                  file_download
                </span>
                <span className="text-[13px] font-semibold">Exportar Relatório Excel / PDF</span>
              </div>
              <span className="material-symbols-outlined text-[#526259] text-[18px]">download</span>
            </button>
          </div>
        </div>

        {/* Toast */}
        {toastMessage && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#191c1c] text-white px-4 py-2.5 rounded-full text-[12px] font-medium shadow-2xl z-50 flex items-center gap-2 animate-in fade-in">
            <span className="material-symbols-outlined text-[#cee9da] text-[18px]">
              check_circle
            </span>
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};
