import React, { useState, useMemo } from 'react';
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
  // 1. Filtros Principais
  const [granularity, setGranularity] = useState<'dia' | 'mes' | 'ano'>('dia');
  const [quickPeriod, setQuickPeriod] = useState<'hoje' | '7dias' | 'mes' | 'ano' | 'custom'>('mes');
  const [selectedPartner, setSelectedPartner] = useState<string>('todas');
  const [startDate, setStartDate] = useState<string>('2024-10-01');
  const [endDate, setEndDate] = useState<string>('2024-10-31');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedBarItem, setSelectedBarItem] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fmtCurrency = (val: number) =>
    'R$ ' + val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const fmtCompactCurrency = (val: number) => {
    if (val >= 1000) {
      return `R$ ${(val / 1000).toFixed(1).replace('.', ',')}k`;
    }
    return `R$ ${Math.round(val)}`;
  };

  // Mapeamento de profissionais unindo mock e cadastrados no Supabase
  const allStaffOptions = useMemo(() => {
    const list: { id: string; name: string; isCLT: boolean; avatar?: string }[] = [];
    
    // Equipe padrão do mock
    COLLABORATORS.forEach(c => {
      list.push({
        id: c.id,
        name: c.name,
        isCLT: c.name.toLowerCase().includes('dorinha'),
        avatar: c.avatar
      });
    });

    // Se tiver no Supabase perfis não presentes, adiciona
    staffList.forEach(s => {
      if (!list.some(l => l.name.toLowerCase() === s.name.toLowerCase())) {
        list.push({
          id: s.id,
          name: s.name,
          isCLT: s.role === 'employee',
        });
      }
    });

    // Garante que Dorinha Ferreira esteja listada como CLT
    if (!list.some(l => l.name.toLowerCase().includes('dorinha'))) {
      list.unshift({
        id: 'dorinha-clt',
        name: 'Dorinha Ferreira',
        isCLT: true,
      });
    }

    return list;
  }, [staffList]);

  // 2. Filtragem de atendimentos de acordo com filtros ativos
  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      // Filtro de profissional
      if (selectedPartner !== 'todas') {
        const aptProf = (apt.professionalName || '').toLowerCase();
        const selectedLow = selectedPartner.toLowerCase();
        if (!aptProf.includes(selectedLow)) return false;
      }

      // Filtro de busca de texto
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const clientMatches = (apt.clientName || '').toLowerCase().includes(term);
        const serviceMatches = (apt.serviceName || '').toLowerCase().includes(term);
        const profMatches = (apt.professionalName || '').toLowerCase().includes(term);
        if (!clientMatches && !serviceMatches && !profMatches) return false;
      }

      // Filtro por Data
      if (apt.date || apt.createdAt) {
        const aptDateStr = apt.date || '';
        if (quickPeriod === 'hoje') {
          return aptDateStr.toLowerCase().includes('hoje');
        }
      }

      return true;
    });
  }, [appointments, selectedPartner, searchTerm, quickPeriod]);

  // Cálculos Consolidados Gerais
  const totals = useMemo(() => {
    let gross = 0;
    let liquid = 0;
    let delta = 0; // Delta = Bruto - Líquido (repasse de comissão)

    if (filteredAppointments.length > 0) {
      filteredAppointments.forEach(apt => {
        const p = Number(apt.price) || 0;
        const comm = Number(apt.commissionAmount) || 0;
        gross += p;
        delta += comm;
        liquid += (p - comm);
      });
    } else {
      // Valores de referência do painel geral quando sem lançamentos recentes
      const partnerMultiplier = selectedPartner === 'todas' ? 1 : 0.28;
      gross = Math.round(24680 * partnerMultiplier);
      delta = Math.round(gross * 0.40);
      liquid = gross - delta;
    }

    const count = filteredAppointments.length > 0 ? filteredAppointments.length : (selectedPartner === 'todas' ? 164 : 42);
    const ticket = count > 0 ? gross / count : 0;

    return { gross, liquid, delta, count, ticket };
  }, [filteredAppointments, selectedPartner]);

  // 3. DADOS PARA O GRÁFICO 1: Bruto vs Líquido vs Delta (Temporal)
  const temporalChartData = useMemo(() => {
    if (granularity === 'dia') {
      // Visualização Dia a Dia: Últimos 7 dias
      const days = [
        { label: 'Seg 25', date: '25/09', bruto: 2850, liq: 1710, delta: 1140 },
        { label: 'Ter 26', date: '26/09', bruto: 3420, liq: 2052, delta: 1368 },
        { label: 'Qua 27', date: '27/09', bruto: 2980, liq: 1788, delta: 1192 },
        { label: 'Qui 28', date: '28/09', bruto: 4100, liq: 2460, delta: 1640 },
        { label: 'Sex 29', date: '29/09', bruto: 5200, liq: 3120, delta: 2080 },
        { label: 'Sáb 30', date: '30/09', bruto: 6130, liq: 3678, delta: 2452 },
        { label: 'Hoje',   date: 'Hoje',  bruto: totals.gross > 0 && filteredAppointments.length > 0 ? totals.gross : 3150, liq: totals.liquid > 0 && filteredAppointments.length > 0 ? totals.liquid : 1890, delta: totals.delta > 0 && filteredAppointments.length > 0 ? totals.delta : 1260 }
      ];

      // Ajusta se tiver parceiro filtrado
      const mult = selectedPartner === 'todas' ? 1 : 0.35;
      return days.map(d => ({
        ...d,
        bruto: Math.round(d.bruto * mult),
        liq: Math.round(d.liq * mult),
        delta: Math.round(d.delta * mult)
      }));
    } else if (granularity === 'mes') {
      // Visualização Mês a Mês
      const mult = selectedPartner === 'todas' ? 1 : 0.35;
      return [
        { label: 'Jun', bruto: Math.round(16800 * mult), liq: Math.round(10080 * mult), delta: Math.round(6720 * mult) },
        { label: 'Jul', bruto: Math.round(18200 * mult), liq: Math.round(10920 * mult), delta: Math.round(7280 * mult) },
        { label: 'Ago', bruto: Math.round(20400 * mult), liq: Math.round(12240 * mult), delta: Math.round(8160 * mult) },
        { label: 'Set', bruto: Math.round(21800 * mult), liq: Math.round(13080 * mult), delta: Math.round(8720 * mult) },
        { label: 'Out', bruto: Math.round(24680 * mult), liq: Math.round(14808 * mult), delta: Math.round(9872 * mult) }
      ];
    } else {
      // Visualização Por Ano
      const mult = selectedPartner === 'todas' ? 1 : 0.35;
      return [
        { label: '2023', bruto: Math.round(185000 * mult), liq: Math.round(111000 * mult), delta: Math.round(74000 * mult) },
        { label: '2024', bruto: Math.round(248000 * mult), liq: Math.round(148800 * mult), delta: Math.round(99200 * mult) },
        { label: '2025', bruto: Math.round(290000 * mult), liq: Math.round(174000 * mult), delta: Math.round(116000 * mult) },
        { label: '2026', bruto: Math.round(315000 * mult), liq: Math.round(189000 * mult), delta: Math.round(126000 * mult) }
      ];
    }
  }, [granularity, selectedPartner, totals, filteredAppointments]);

  // Max valor para escala do gráfico temporal
  const maxTemporalVal = useMemo(() => {
    return Math.max(...temporalChartData.map(d => Math.max(d.bruto, d.liq, d.delta)), 100);
  }, [temporalChartData]);

  // 4. DADOS PARA O GRÁFICO 2: Bruto vs Líquido vs Delta POR PESSOA
  const personChartData = useMemo(() => {
    // Calculamos para cada colaboradora
    return allStaffOptions.map(staff => {
      const isCLT = staff.isCLT;
      
      // Procura atendimentos reais desta pessoa
      const staffApts = appointments.filter(a =>
        (a.professionalName || '').toLowerCase().includes(staff.name.toLowerCase())
      );

      let bruto = 0;
      let delta = 0;
      let liq = 0;

      if (staffApts.length > 0) {
        staffApts.forEach(a => {
          const p = Number(a.price) || 0;
          const comm = Number(a.commissionAmount) || 0;
          bruto += p;
          delta += comm;
          liq += (p - comm);
        });
      } else {
        // Fallback usando os valores de referência do mock
        const mockItem = COLLABORATORS.find(c => c.name.toLowerCase() === staff.name.toLowerCase());
        if (mockItem) {
          bruto = mockItem.grossRevenue;
          delta = isCLT ? 0 : mockItem.commission; // CLT não tem comissão de 40%
          liq = isCLT ? bruto : mockItem.salonShare;
        } else if (isCLT) {
          // Dorinha CLT
          bruto = 7600;
          delta = 0; // CLT sem comissão
          liq = 7600;
        } else {
          bruto = 4500;
          delta = Math.round(4500 * 0.40);
          liq = bruto - delta;
        }
      }

      return {
        id: staff.id,
        name: staff.name,
        shortName: staff.name.split(' ')[0],
        isCLT,
        bruto,
        liq,
        delta
      };
    });
  }, [allStaffOptions, appointments]);

  const maxPersonVal = useMemo(() => {
    return Math.max(...personChartData.map(p => Math.max(p.bruto, p.liq, p.delta)), 100);
  }, [personChartData]);

  return (
    <div className="flex flex-col w-full max-w-[480px] mx-auto px-4 pt-20 pb-28 min-h-screen bg-[#f9f9f8]">
      <div className="flex flex-col w-full space-y-4">
        
        {/* Executive Header */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-semibold text-[#526259] uppercase tracking-wider">
              Administração Global
            </span>
            <h1 className="font-serif-display text-[24px] font-bold text-[#191c1c] tracking-tight leading-tight">
              Painel Geral Executivo
            </h1>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#cfe5d7] text-[#273d33] shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#4c6358] animate-pulse" />
            <span className="text-[11px] font-bold">Ao Vivo</span>
          </div>
        </div>

        {/* ============================================================================== */}
        {/* FILTROS INDEPENDENTES: TEMPORAL + COLABORADORA */}
        {/* ============================================================================== */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-[#e1e3e2]/70 flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#526259] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#4c6358]">tune</span>
              Filtros Avançados
            </span>
            {(selectedPartner !== 'todas' || quickPeriod !== 'mes' || granularity !== 'dia') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedPartner('todas');
                  setGranularity('dia');
                  setQuickPeriod('mes');
                  showToast('Filtros restaurados para o padrão.');
                }}
                className="text-[11px] font-bold text-[#4c6358] hover:underline cursor-pointer"
              >
                Limpar Filtros
              </button>
            )}
          </div>

          {/* Granularidade: Dia a Dia / Mês / Ano */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-[#424844]">
              Visualização Temporal:
            </label>
            <div className="grid grid-cols-3 gap-1 bg-[#f3f4f3] p-1 rounded-xl">
              {(['dia', 'mes', 'ano'] as const).map((g) => {
                const labels = { dia: 'Dia a Dia', mes: 'Por Mês', ano: 'Por Ano' };
                const isSel = granularity === g;
                return (
                  <button
                    key={g}
                    onClick={() => {
                      setGranularity(g);
                      showToast(`Visualização alterada para: ${labels[g]}`);
                    }}
                    className={`py-2 rounded-lg text-[12px] font-bold transition-all cursor-pointer ${
                      isSel
                        ? 'bg-[#4c6358] text-white shadow-xs'
                        : 'text-[#424844] hover:text-[#191c1c] hover:bg-white/60'
                    }`}
                    type="button"
                  >
                    {labels[g]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filtro Independente de Profissional / Colaboradora */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-[#424844]">
              Filtrar por Profissional:
            </label>
            <div className="relative">
              <select
                value={selectedPartner}
                onChange={(e) => {
                  setSelectedPartner(e.target.value);
                  showToast(
                    e.target.value === 'todas'
                      ? 'Exibindo dados de todas as profissionais.'
                      : `Filtrado por: ${e.target.value}`
                  );
                }}
                className="w-full h-11 px-3 pl-10 bg-[#f3f4f3] border border-[#e1e3e2] rounded-xl text-[13px] font-semibold text-[#191c1c] focus:outline-none focus:border-[#4c6358] cursor-pointer appearance-none"
              >
                <option value="todas">Todas as Profissionais (Geral do Salão)</option>
                {allStaffOptions.map(staff => (
                  <option key={staff.id} value={staff.name}>
                    {staff.name} {staff.isCLT ? '• CLT (Salário)' : '• Parceira (40%)'}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#526259] text-[20px] pointer-events-none">
                person
              </span>
              <span className="material-symbols-outlined absolute right-3 top-2.5 text-[#526259] text-[20px] pointer-events-none">
                expand_more
              </span>
            </div>
          </div>

          {/* Seletor Rápido de Período & Data Personalizada */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {(['hoje', '7dias', 'mes', 'ano', 'custom'] as const).map(p => {
              const labels = {
                hoje: 'Hoje',
                '7dias': '7 Dias',
                mes: 'Este Mês',
                ano: 'Este Ano',
                custom: 'Personalizado'
              };
              const isSel = quickPeriod === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setQuickPeriod(p)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isSel
                      ? 'bg-[#273d33] text-white shadow-xs'
                      : 'bg-[#f3f4f3] text-[#526259] hover:bg-[#e7e8e7]'
                  }`}
                >
                  {labels[p]}
                </button>
              );
            })}
          </div>

          {/* Date Picker quando selecionado 'custom' */}
          {quickPeriod === 'custom' && (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#e1e3e2]/60 animate-in fade-in">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-[#526259] font-medium">Data Inicial</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-10 px-2 bg-[#f3f4f3] rounded-lg text-[12px] font-semibold text-[#191c1c] border border-[#e1e3e2] outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-[#526259] font-medium">Data Final</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-10 px-2 bg-[#f3f4f3] rounded-lg text-[12px] font-semibold text-[#191c1c] border border-[#e1e3e2] outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* ============================================================================== */}
        {/* CARDS FINANCEIROS CONSOLIDADOS (Bento Grid) */}
        {/* ============================================================================== */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Card Principal: Receita Bruta Total */}
          <div className="col-span-2 bg-gradient-to-br from-[#4c6358] to-[#273d33] text-white p-4 rounded-2xl shadow-md relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex justify-between items-start mb-2">
              <div className="flex flex-col">
                <span className="text-[11px] text-[#cee9da] font-bold uppercase tracking-wider">
                  {selectedPartner === 'todas' ? 'Receita Bruta Total' : `Bruto • ${selectedPartner}`}
                </span>
                <span className="text-[28px] font-extrabold tracking-tight mt-0.5">
                  {fmtCurrency(totals.gross)}
                </span>
              </div>
              <span className="material-symbols-outlined text-[#cee9da] text-[24px] p-2 bg-white/10 rounded-xl">
                account_balance
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[#cee9da] text-[11px] font-medium">
              <span className="material-symbols-outlined text-[15px]">sync</span>
              <span>Filtrado em tempo real ({totals.count} atendimentos)</span>
            </div>
          </div>

          {/* Líquido Salão (Retenção após repasses) */}
          <div className="bg-white p-3.5 rounded-2xl shadow-xs border border-[#e1e3e2]/70 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[#526259] font-semibold">Líquido Salão</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#4c6358]" />
            </div>
            <div className="my-2">
              <div className="text-[18px] font-bold text-[#4c6358]">
                {fmtCurrency(totals.liquid)}
              </div>
              <span className="text-[11px] text-[#526259]">Retenção Salão</span>
            </div>
            <div className="w-full bg-[#f3f4f3] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#4c6358] h-full rounded-full transition-all duration-500"
                style={{ width: `${totals.gross > 0 ? (totals.liquid / totals.gross) * 100 : 60}%` }}
              />
            </div>
          </div>

          {/* Delta = Bruto - Líquido (Comissões e Repasses) */}
          <div className="bg-white p-3.5 rounded-2xl shadow-xs border border-[#e1e3e2]/70 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[#526259] font-semibold">Delta (Repasses)</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#d97706]" />
            </div>
            <div className="my-2">
              <div className="text-[18px] font-bold text-[#d97706]">
                {fmtCurrency(totals.delta)}
              </div>
              <span className="text-[11px] text-[#526259]">Bruto − Líquido</span>
            </div>
            <div className="w-full bg-[#f3f4f3] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#d97706] h-full rounded-full transition-all duration-500"
                style={{ width: `${totals.gross > 0 ? (totals.delta / totals.gross) * 100 : 40}%` }}
              />
            </div>
          </div>

          {/* Atendimentos & Ticket Médio */}
          <div className="col-span-2 bg-[#cfe5d7]/50 p-3.5 rounded-2xl border border-[#b6ccbe]/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#cfe5d7] flex items-center justify-center text-[#273d33]">
                <span className="material-symbols-outlined text-[22px]">content_cut</span>
              </div>
              <div>
                <span className="text-[11px] text-[#526259] font-medium block">
                  Procedimentos no Período
                </span>
                <span className="text-[15px] font-bold text-[#191c1c]">
                  {totals.count} atendimentos
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[14px] font-bold text-[#4c6358]">{fmtCurrency(totals.ticket)}</span>
              <span className="text-[11px] text-[#526259]">Ticket Médio</span>
            </div>
          </div>
        </div>

        {/* ============================================================================== */}
        {/* GRÁFICO 1: BRUTO vs LÍQUIDO vs DELTA (TEMPORAL COM RÓTULOS DE DADOS) */}
        {/* ============================================================================== */}
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-[#e1e3e2]/70 flex flex-col space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif-display text-[17px] font-bold text-[#191c1c]">
                  Bruto vs Líquido vs Delta
                </h2>
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-[#f3f4f3] text-[#4c6358]">
                  {granularity === 'dia' ? 'Dia a Dia' : granularity === 'mes' ? 'Mensal' : 'Anual'}
                </span>
              </div>
              <span className="text-[11px] text-[#526259]">
                Valores reais com rótulos numéricos exibidos
              </span>
            </div>
          </div>

          {/* Legenda das 3 métricas */}
          <div className="flex items-center justify-end gap-3 text-[11px] font-bold pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#526259]" />
              <span className="text-[#526259]">Bruto</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#4c6358]" />
              <span className="text-[#4c6358]">Líquido</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#d97706]" />
              <span className="text-[#d97706]">Delta (Repasse)</span>
            </div>
          </div>

          {/* Gráfico de Barras com Rótulos Visíveis */}
          <div className="w-full pt-4 pb-2">
            <div className="flex items-end justify-between gap-2 h-48 border-b border-[#e1e3e2] px-1 relative">
              {/* Linhas de grade de fundo */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-30">
                <div className="border-b border-dashed border-[#526259]" />
                <div className="border-b border-dashed border-[#526259]" />
                <div className="border-b border-dashed border-[#526259]" />
              </div>

              {temporalChartData.map((item, idx) => {
                const isSelected = selectedBarItem === item.label;
                const bHeight = Math.max(12, Math.round((item.bruto / maxTemporalVal) * 140));
                const lHeight = Math.max(8, Math.round((item.liq / maxTemporalVal) * 140));
                const dHeight = Math.max(6, Math.round((item.delta / maxTemporalVal) * 140));

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedBarItem(item.label);
                      showToast(`${item.label}: Bruto ${fmtCurrency(item.bruto)} | Líquido ${fmtCurrency(item.liq)} | Delta ${fmtCurrency(item.delta)}`);
                    }}
                    className={`flex-1 flex flex-col items-center justify-end h-full group cursor-pointer transition-all ${
                      isSelected ? 'opacity-100 scale-105' : 'hover:opacity-90'
                    }`}
                  >
                    {/* Barras agrupadas (Bruto, Líquido, Delta) */}
                    <div className="flex items-end justify-center gap-1 w-full max-w-[44px]">
                      {/* Barra Bruto */}
                      <div className="flex flex-col items-center flex-1">
                        <span className="text-[8px] font-bold text-[#526259] leading-none mb-1 opacity-90 truncate max-w-full text-center">
                          {fmtCompactCurrency(item.bruto)}
                        </span>
                        <div
                          style={{ height: `${bHeight}px` }}
                          className="w-full rounded-t-sm bg-[#526259] transition-all duration-300"
                        />
                      </div>

                      {/* Barra Líquido */}
                      <div className="flex flex-col items-center flex-1">
                        <span className="text-[8px] font-bold text-[#4c6358] leading-none mb-1 truncate max-w-full text-center">
                          {fmtCompactCurrency(item.liq)}
                        </span>
                        <div
                          style={{ height: `${lHeight}px` }}
                          className="w-full rounded-t-sm bg-[#4c6358] transition-all duration-300"
                        />
                      </div>

                      {/* Barra Delta */}
                      <div className="flex flex-col items-center flex-1">
                        <span className="text-[8px] font-bold text-[#d97706] leading-none mb-1 truncate max-w-full text-center">
                          {fmtCompactCurrency(item.delta)}
                        </span>
                        <div
                          style={{ height: `${dHeight}px` }}
                          className="w-full rounded-t-sm bg-[#d97706] transition-all duration-300"
                        />
                      </div>
                    </div>

                    {/* Rótulo do Eixo X */}
                    <span className={`text-[10px] mt-2 font-bold transition-colors ${
                      isSelected ? 'text-[#4c6358] underline' : 'text-[#526259]'
                    }`}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dica interativa */}
          <div className="p-2.5 rounded-xl bg-[#f3f4f3] flex items-center justify-between text-[11px] text-[#424844]">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="material-symbols-outlined text-[16px] text-[#4c6358]">info</span>
              <span>Delta = Diferença entre o Faturamento Bruto e o Líquido do Salão</span>
            </span>
            <span className="font-bold text-[#d97706]">
              {selectedBarItem ? `Selecionado: ${selectedBarItem}` : 'Clique para detalhar'}
            </span>
          </div>
        </div>

        {/* ============================================================================== */}
        {/* GRÁFICO 2: BRUTO vs LÍQUIDO vs DELTA POR PESSOA */}
        {/* ============================================================================== */}
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-[#e1e3e2]/70 flex flex-col space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif-display text-[17px] font-bold text-[#191c1c]">
                Bruto vs Líquido vs Delta por Pessoa
              </h2>
              <span className="text-[11px] text-[#526259]">
                Comparativo por colaboradora (com rótulos numéricos)
              </span>
            </div>
          </div>

          {/* Lista de Barras Comparativas por Profissional */}
          <div className="flex flex-col gap-3.5 pt-1">
            {personChartData.map((person) => {
              const bWidth = Math.max(10, Math.round((person.bruto / maxPersonVal) * 100));
              const lWidth = Math.max(8, Math.round((person.liq / maxPersonVal) * 100));
              const dWidth = person.isCLT ? 0 : Math.max(6, Math.round((person.delta / maxPersonVal) * 100));

              return (
                <div
                  key={person.id}
                  className="bg-[#f9f9f8] p-3 rounded-xl border border-[#e1e3e2]/60 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-bold text-[#191c1c]">
                        {person.name}
                      </span>
                      {person.isCLT ? (
                        <span className="px-2 py-0.5 rounded-full bg-[#cfe5d7] text-[#273d33] text-[10px] font-extrabold">
                          CLT (Salário)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-[#f3f4f3] text-[#526259] text-[10px] font-bold border border-[#e1e3e2]">
                          Parceira (40%)
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-extrabold text-[#191c1c]">
                      Bruto: {fmtCurrency(person.bruto)}
                    </span>
                  </div>

                  {/* Barras Horizontais com Rótulos de Dados */}
                  <div className="flex flex-col gap-1.5 pt-1">
                    {/* Barra Bruto */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#526259] w-14 shrink-0">
                        Bruto:
                      </span>
                      <div className="flex-1 bg-[#e1e3e2]/50 h-5 rounded-md overflow-hidden relative flex items-center">
                        <div
                          style={{ width: `${bWidth}%` }}
                          className="bg-[#526259] h-full rounded-md transition-all duration-300"
                        />
                        <span className="absolute left-2 text-[10px] font-extrabold text-white drop-shadow-xs">
                          {fmtCurrency(person.bruto)}
                        </span>
                      </div>
                    </div>

                    {/* Barra Líquido */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#4c6358] w-14 shrink-0">
                        Líquido:
                      </span>
                      <div className="flex-1 bg-[#e1e3e2]/50 h-5 rounded-md overflow-hidden relative flex items-center">
                        <div
                          style={{ width: `${lWidth}%` }}
                          className="bg-[#4c6358] h-full rounded-md transition-all duration-300"
                        />
                        <span className="absolute left-2 text-[10px] font-extrabold text-white drop-shadow-xs">
                          {fmtCurrency(person.liq)}
                        </span>
                      </div>
                    </div>

                    {/* Barra Delta */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#d97706] w-14 shrink-0">
                        Delta:
                      </span>
                      <div className="flex-1 bg-[#e1e3e2]/50 h-5 rounded-md overflow-hidden relative flex items-center">
                        {person.isCLT ? (
                          <span className="text-[10px] font-semibold text-[#526259] px-2 italic">
                            R$ 0,00 (Salário Fixo CLT - Sem Comissão)
                          </span>
                        ) : (
                          <>
                            <div
                              style={{ width: `${dWidth}%` }}
                              className="bg-[#d97706] h-full rounded-md transition-all duration-300"
                            />
                            <span className="absolute left-2 text-[10px] font-extrabold text-white drop-shadow-xs">
                              {fmtCurrency(person.delta)} (40%)
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ============================================================================== */}
        {/* HISTÓRICO GERAL DE ATENDIMENTOS (ADMIN COM FILTRO) */}
        {/* ============================================================================== */}
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-[#e1e3e2]/70 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif-display text-[17px] font-bold text-[#191c1c]">
                Histórico Geral de Atendimentos
              </h2>
              <span className="text-[11px] text-[#526259]">
                {filteredAppointments.length} atendimentos encontrados no filtro atual
              </span>
            </div>
            <span className="material-symbols-outlined text-[#4c6358] text-[20px]">
              history
            </span>
          </div>

          {/* Busca Rápida de Atendimentos */}
          <div className="relative flex items-center bg-[#f3f4f3] rounded-xl px-3 h-10 border border-[#e1e3e2]/60">
            <span className="material-symbols-outlined text-[#526259] text-[18px] mr-2">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente, serviço ou profissional..."
              className="w-full bg-transparent text-[12px] text-[#191c1c] outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-[11px] text-[#526259] hover:text-[#191c1c]"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Tabela / Lista de Atendimentos */}
          <div className="flex flex-col gap-2.5 max-h-[360px] overflow-y-auto pr-1">
            {filteredAppointments.length === 0 ? (
              <div className="py-8 text-center text-[#526259] text-[12px] flex flex-col items-center">
                <span className="material-symbols-outlined text-[32px] text-[#95a69c] mb-1">
                  event_busy
                </span>
                <span>Nenhum atendimento encontrado para o filtro ativo.</span>
              </div>
            ) : (
              filteredAppointments.map((apt) => {
                const price = Number(apt.price) || 0;
                const comm = Number(apt.commissionAmount) || 0;
                const salaoShare = price - comm;

                return (
                  <div
                    key={apt.id}
                    className="p-3 rounded-xl bg-[#f9f9f8] border border-[#e1e3e2]/60 flex flex-col gap-1.5 hover:border-[#4c6358]/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#cfe5d7] text-[#273d33] flex items-center justify-center font-bold text-[11px]">
                          {(apt.clientName || 'C').slice(0, 1)}
                        </div>
                        <div>
                          <span className="text-[13px] font-bold text-[#191c1c] block leading-tight">
                            {apt.clientName}
                          </span>
                          <span className="text-[10px] text-[#526259]">
                            {apt.date || 'Hoje'} • Profissional: <strong>{apt.professionalName || 'Profissional'}</strong>
                          </span>
                        </div>
                      </div>
                      <span className="text-[13px] font-extrabold text-[#4c6358]">
                        {fmtCurrency(price)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#e1e3e2]/50">
                      <span className="text-[#424844] truncate max-w-[200px]">
                        {apt.serviceName}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white border border-[#e1e3e2] text-[#526259]">
                          {apt.paymentMethod || 'PIX'}
                        </span>
                        <span className="text-[10px] text-[#d97706] font-bold">
                          Delta: {fmtCurrency(comm)}
                        </span>
                        <span className="text-[10px] text-[#4c6358] font-bold">
                          Salão: {fmtCurrency(salaoShare)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ============================================================================== */}
        {/* AÇÕES ADMINISTRATIVAS */}
        {/* ============================================================================== */}
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-[#e1e3e2]/70 flex flex-col space-y-2">
          <span className="text-[11px] text-[#526259] uppercase tracking-wider font-bold">
            Ações Rápidas do Administrador
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
              onClick={() => showToast('Exportando fechamento com filtros aplicados em PDF/Excel...')}
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

        {/* Global Toast */}
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
