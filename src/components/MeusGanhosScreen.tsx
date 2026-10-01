import React, { useState } from 'react';
import { Appointment, ScreenType, UserRole } from '../types';

interface MeusGanhosScreenProps {
  appointments: Appointment[];
  onNavigate: (screen: ScreenType) => void;
  userName?: string;
  userRole?: UserRole;
  onDeleteAppointment?: (id: string) => void;
  onUpdateAppointment?: (appointment: Appointment) => void;
}

export const MeusGanhosScreen: React.FC<MeusGanhosScreenProps> = ({
  appointments,
  onNavigate,
  userName = 'Dorinha',
  userRole = 'employee',
  onDeleteAppointment,
  onUpdateAppointment
}) => {
  const [periodFilter, setPeriodFilter] = useState<'hoje' | 'semana' | 'mes' | 'custom'>('mes');
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customRange, setCustomRange] = useState({ start: '2026-09-01', end: '2026-09-30' });

  // Estado para Edição de Atendimento
  const [editingApt, setEditingApt] = useState<Appointment | null>(null);
  const [editClient, setEditClient] = useState('');
  const [editService, setEditService] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editPayment, setEditPayment] = useState<'PIX' | 'Crédito' | 'Débito' | 'Dinheiro'>('PIX');
  const [editNotes, setEditNotes] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const isEmployee = userRole === 'employee';

  // Filtragem dinâmica por período
  const filteredAppointments = appointments.filter((apt) => {
    const aptDateStr = apt.date || '';
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const todayISO = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    if (periodFilter === 'hoje') {
      return aptDateStr.toLowerCase().includes('hoje') || aptDateStr.startsWith(todayISO);
    }
    if (periodFilter === 'semana') {
      if (apt.createdAt) {
        const diffDays = (Date.now() - new Date(apt.createdAt).getTime()) / (1000 * 3600 * 24);
        return diffDays <= 7;
      }
      return true;
    }
    if (periodFilter === 'mes') {
      return true;
    }
    if (periodFilter === 'custom') {
      const rawDate = aptDateStr.startsWith('20') ? aptDateStr.slice(0, 10) : todayISO;
      return rawDate >= customRange.start && rawDate <= customRange.end;
    }
    return true;
  });

  // Cálculo 100% dinâmico a partir dos atendimentos filtrados
  const totalGross = filteredAppointments.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
  const totalCommission = filteredAppointments.reduce((sum, a) => sum + (Number(a.commissionAmount) || 0), 0);
  const totalServices = filteredAppointments.length;
  const ticketMedio = totalServices > 0 ? totalGross / totalServices : 0;

  const fmtCurrency = (val: number) =>
    'R$ ' + val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Abertura do modal de edição
  const startEdit = (apt: Appointment) => {
    setEditingApt(apt);
    setEditClient(apt.clientName);
    setEditService(apt.serviceName);
    setEditPrice(String(apt.price));
    setEditPayment(apt.paymentMethod || 'PIX');
    setEditNotes(apt.notes || '');
  };

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApt) return;

    const finalPrice = parseFloat(editPrice) || 0;
    const finalCommission = isEmployee ? 0 : finalPrice * 0.40;

    const updated: Appointment = {
      ...editingApt,
      clientName: editClient.trim() || editingApt.clientName,
      serviceName: editService.trim() || editingApt.serviceName,
      price: finalPrice,
      commissionAmount: finalCommission,
      paymentMethod: editPayment,
      notes: editNotes.trim() || undefined,
    };

    if (onUpdateAppointment) {
      onUpdateAppointment(updated);
    }
    setEditingApt(null);
    showToast('Atendimento atualizado com sucesso no Supabase!');
  };

  const handleDelete = (id: string, client: string) => {
    if (window.confirm(`Deseja realmente excluir o atendimento de "${client}"?`)) {
      if (onDeleteAppointment) {
        onDeleteAppointment(id);
      }
      showToast('Atendimento excluído com sucesso!');
    }
  };

  return (
    <div className="flex flex-col w-full max-w-[480px] mx-auto px-5 pt-20 pb-28 min-h-screen">
      <div className="flex flex-col w-full gap-y-5">
        {/* Title and New Service Action */}
        <div className="flex items-center justify-between gap-x-3 pt-1">
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#526259]">
              Painel Pessoal • {isEmployee ? 'Colaboradora CLT' : 'Prestadora Parceira'}
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
              {periodFilter === 'hoje'
                ? 'Hoje'
                : periodFilter === 'semana'
                ? 'Últimos 7 dias'
                : periodFilter === 'mes'
                ? 'Este Mês'
                : `${customRange.start.slice(8)}/${customRange.start.slice(5, 7)} — ${customRange.end.slice(8)}/${customRange.end.slice(5, 7)}`}
            </span>
          </div>

          <div className="flex items-center gap-x-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => {
                setPeriodFilter('hoje');
                setShowCustomPicker(false);
              }}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold shrink-0 active:scale-95 transition-all cursor-pointer ${
                periodFilter === 'hoje'
                  ? 'bg-[#4c6358] text-white shadow-xs'
                  : 'bg-[#e7e8e7] text-[#424844] hover:bg-[#d9dad9]'
              }`}
              type="button"
            >
              Hoje
            </button>
            <button
              onClick={() => {
                setPeriodFilter('semana');
                setShowCustomPicker(false);
              }}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold shrink-0 active:scale-95 transition-all cursor-pointer ${
                periodFilter === 'semana'
                  ? 'bg-[#4c6358] text-white shadow-xs'
                  : 'bg-[#e7e8e7] text-[#424844] hover:bg-[#d9dad9]'
              }`}
              type="button"
            >
              Esta Semana
            </button>
            <button
              onClick={() => {
                setPeriodFilter('mes');
                setShowCustomPicker(false);
              }}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold shrink-0 active:scale-95 transition-all cursor-pointer ${
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
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold shrink-0 flex items-center gap-1 active:scale-95 transition-all cursor-pointer ${
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
        {/* Se for CLT (colaboradora), removemos o card "Minha Comissão" conforme exigido */}
        <div className={`grid gap-3 ${isEmployee ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {/* Faturado Bruto */}
          <div className="flex flex-col p-4 rounded-xl bg-white shadow-xs border border-[#e1e3e2]/60 justify-between">
            <div className="flex items-center justify-between text-[#526259]">
              <span className="text-[11px] font-medium uppercase tracking-wider">Faturado Bruto</span>
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            </div>
            <div className="mt-2">
              <span className="text-[20px] font-bold text-[#191c1c] tracking-tight block">
                {fmtCurrency(totalGross)}
              </span>
              <span className="text-[10px] text-[#526259] mt-0.5">Produção apurada</span>
            </div>
          </div>

          {/* Minha Comissão (40%) - SOMENTE PARA PRESTADORA */}
          {!isEmployee && (
            <div className="flex flex-col p-4 rounded-xl bg-[#cfe5d7] shadow-xs justify-between border border-[#b6ccbe]/60">
              <div className="flex items-center justify-between text-[#53675c]">
                <span className="text-[11px] font-bold uppercase tracking-wider">Minha Comissão (40%)</span>
                <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
              </div>
              <div className="mt-2">
                <span className="text-[20px] font-extrabold text-[#273d33] tracking-tight block">
                  {fmtCurrency(totalCommission)}
                </span>
                <span className="text-[10px] font-medium text-[#53675c]">Seu repasse no ciclo</span>
              </div>
            </div>
          )}

          {/* Atendimentos */}
          <div className="flex flex-col p-4 rounded-xl bg-white shadow-xs border border-[#e1e3e2]/60 justify-between">
            <div className="flex items-center justify-between text-[#526259]">
              <span className="text-[11px] font-medium uppercase tracking-wider">Atendimentos</span>
              <span className="material-symbols-outlined text-[18px]">face_3</span>
            </div>
            <div className="mt-2">
              <span className="text-[20px] font-bold text-[#191c1c] tracking-tight block">
                {totalServices}
              </span>
              <span className="text-[10px] text-[#424844]">Clientes atendidas</span>
            </div>
          </div>

          {/* Ticket Médio */}
          <div className="flex flex-col p-4 rounded-xl bg-white shadow-xs border border-[#e1e3e2]/60 justify-between">
            <div className="flex items-center justify-between text-[#526259]">
              <span className="text-[11px] font-medium uppercase tracking-wider">Ticket Médio</span>
              <span className="material-symbols-outlined text-[18px]">analytics</span>
            </div>
            <div className="mt-2">
              <span className="text-[20px] font-bold text-[#191c1c] tracking-tight block">
                {fmtCurrency(ticketMedio)}
              </span>
              <span className="text-[10px] text-[#424844]">Por atendimento</span>
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
              <span className="px-2.5 py-0.5 rounded-full bg-[#cfe5d7] text-[#273d33] text-[11px] font-bold">
                {filteredAppointments.length}
              </span>
            </div>
            <span className="text-[#4c6358] text-[11px] font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">cloud_done</span>
              Sincronizado Supabase
            </span>
          </div>

          {/* Cards List */}
          <div className="flex flex-col gap-y-3">
            {filteredAppointments.length === 0 ? (
              <div className="p-8 rounded-xl bg-white border border-[#e1e3e2]/60 text-center flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-[36px] text-[#526259]">content_cut</span>
                <span className="text-[14px] font-bold text-[#191c1c]">
                  Nenhum atendimento registrado neste período
                </span>
                <p className="text-[12px] text-[#526259] max-w-xs">
                  Toque em "Novo Serviço" acima para lançar um procedimento com dia e horário.
                </p>
              </div>
            ) : (
              filteredAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex flex-col p-4 rounded-xl bg-white shadow-xs border border-[#e1e3e2]/60 gap-y-2.5 hover:border-[#4c6358]/40 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#cfe5d7] text-[#273d33] font-bold flex items-center justify-center shrink-0 border border-[#8fa89b]/40">
                        {apt.clientName ? apt.clientName.slice(0, 2).toUpperCase() : 'CL'}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[14px] font-bold text-[#191c1c] truncate">
                          {apt.clientName}
                        </span>
                        <span className="text-[11px] text-[#526259]">
                          {apt.date} • {apt.time}
                        </span>
                      </div>
                    </div>

                    {/* Botões de Ação: Editar e Excluir */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(apt)}
                        className="p-1.5 rounded-lg bg-[#f3f4f3] hover:bg-[#e7e8e7] text-[#4c6358] transition-colors cursor-pointer"
                        title="Editar Atendimento"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(apt.id, apt.clientName)}
                        className="p-1.5 rounded-lg bg-[#f3f4f3] hover:bg-[#ffdad6] text-[#ba1a1a] transition-colors cursor-pointer"
                        title="Excluir Atendimento"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col bg-[#f3f4f3] p-2.5 rounded-lg gap-y-1">
                    <div className="flex items-center justify-between text-[#191c1c]">
                      <span className="text-[12px] font-bold">{apt.serviceName}</span>
                      <span className="text-[13px] font-extrabold">{fmtCurrency(apt.price)}</span>
                    </div>

                    {!isEmployee ? (
                      <div className="flex items-center justify-between pt-1 border-t border-[#e1e3e2]/50">
                        <span className="text-[11px] text-[#424844]">
                          Sua Comissão ({Math.round(apt.commissionRate * 100)}%)
                        </span>
                        <span className="text-[13px] text-[#4c6358] font-bold">
                          {fmtCurrency(apt.commissionAmount)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between pt-1 border-t border-[#e1e3e2]/50">
                        <span className="text-[11px] text-[#526259]">Forma de Pagamento</span>
                        <span className="text-[11px] font-bold text-[#273d33]">
                          {apt.paymentMethod || 'PIX'}
                        </span>
                      </div>
                    )}
                  </div>

                  {apt.notes && (
                    <div className="flex items-center gap-1.5 text-[#424844] text-[11px]">
                      <span className="material-symbols-outlined text-[14px] text-[#526259]">notes</span>
                      <span className="italic truncate">{apt.notes}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal de Edição de Atendimento */}
        {editingApt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#191c1c]/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl p-5 w-full max-w-[420px] shadow-2xl border border-[#e1e3e2] flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#e1e3e2]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#4c6358] text-[22px]">edit</span>
                  <h3 className="font-serif-display text-[17px] font-bold text-[#191c1c]">
                    Editar Atendimento
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingApt(null)}
                  className="w-8 h-8 rounded-full bg-[#f3f4f3] flex items-center justify-center text-[#526259]"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <form onSubmit={saveEdit} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-[#526259] uppercase">
                    Nome da Cliente
                  </label>
                  <input
                    type="text"
                    required
                    value={editClient}
                    onChange={(e) => setEditClient(e.target.value)}
                    className="h-10 px-3 bg-[#f3f4f3] rounded-xl text-[13px] border border-[#e1e3e2] outline-none focus:border-[#4c6358]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-[#526259] uppercase">
                    Procedimento(s)
                  </label>
                  <input
                    type="text"
                    required
                    value={editService}
                    onChange={(e) => setEditService(e.target.value)}
                    className="h-10 px-3 bg-[#f3f4f3] rounded-xl text-[13px] border border-[#e1e3e2] outline-none focus:border-[#4c6358]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-[#526259] uppercase">
                      Valor Total (R$)
                    </label>
                    <input
                      type="number"
                      step="5"
                      required
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="h-10 px-3 bg-[#f3f4f3] rounded-xl text-[13px] font-bold border border-[#e1e3e2] outline-none focus:border-[#4c6358]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-[#526259] uppercase">
                      Pagamento
                    </label>
                    <select
                      value={editPayment}
                      onChange={(e) => setEditPayment(e.target.value as any)}
                      className="h-10 px-2 bg-[#f3f4f3] rounded-xl text-[12px] font-semibold border border-[#e1e3e2] outline-none focus:border-[#4c6358]"
                    >
                      <option value="PIX">PIX</option>
                      <option value="Crédito">Crédito</option>
                      <option value="Débito">Débito</option>
                      <option value="Dinheiro">Dinheiro</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-[#526259] uppercase">
                    Observações
                  </label>
                  <textarea
                    rows={2}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="p-2.5 bg-[#f3f4f3] rounded-xl text-[12px] border border-[#e1e3e2] outline-none focus:border-[#4c6358] resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 h-11 bg-[#4c6358] hover:bg-[#354c41] text-white rounded-xl text-[13px] font-bold cursor-pointer transition-all"
                  >
                    Salvar Alterações
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingApt(null)}
                    className="px-4 h-11 bg-[#edeeed] text-[#424844] rounded-xl text-[12px] font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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
