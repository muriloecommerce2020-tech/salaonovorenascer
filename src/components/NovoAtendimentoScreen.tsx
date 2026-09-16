import React, { useState, useEffect } from 'react';
import { Appointment, TodayRecord } from '../types';
import { SERVICE_TEMPLATES, QUICK_CLIENTS } from '../data/mockData';
import { fetchServices } from '../lib/supabase';

interface NovoAtendimentoScreenProps {
  onAddAppointment: (appointment: Appointment, todayRecord: TodayRecord) => void;
  todayRecords: TodayRecord[];
}

export const NovoAtendimentoScreen: React.FC<NovoAtendimentoScreenProps> = ({
  onAddAppointment,
  todayRecords
}) => {
  const [professional, setProfessional] = useState('Dorinha Ferreira (Você)');
  const [clientName, setClientName] = useState('');
  const [servicesList, setServicesList] = useState<Array<{ id: string; name: string; price: number; category: string }>>(SERVICE_TEMPLATES);
  const [serviceName, setServiceName] = useState('Mechas Criativas');
  const [servicePrice, setServicePrice] = useState<number>(200.0);
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'Crédito' | 'Débito' | 'Dinheiro'>('PIX');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [badgeTime, setBadgeTime] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [selectedServiceIndex, setSelectedServiceIndex] = useState<number | null>(2);

  useEffect(() => {
    fetchServices().then((srvs) => {
      if (srvs && srvs.length > 0) {
        setServicesList(srvs);
        if (srvs[0]) {
          setServiceName(srvs[0].name);
          setServicePrice(srvs[0].price);
          setSelectedServiceIndex(0);
        }
      }
    }).catch(() => {});
  }, []);

  // Set current date & time on mount
  const fillNow = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const d = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const t = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    setDate(d);
    setTime(t);

    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    };
    setBadgeTime(now.toLocaleDateString('pt-BR', options));
  };

  useEffect(() => {
    fillNow();
  }, []);

  const commission = servicePrice * 0.40;
  const salonShare = servicePrice * 0.60;

  const handleSelectService = (index: number, template: typeof SERVICE_TEMPLATES[0]) => {
    setSelectedServiceIndex(index);
    setServiceName(template.name);
    setServicePrice(template.price);
  };

  const handleSelectQuickClient = (name: string) => {
    setClientName(name);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalClient = clientName.trim() || 'Cliente Avulso';
    const finalPrice = servicePrice > 0 ? servicePrice : 150;
    const finalCommission = finalPrice * 0.40;

    const newAppointment: Appointment = {
      id: 'apt-' + Date.now(),
      clientName: finalClient,
      serviceName: serviceName || 'Procedimento Estético',
      price: finalPrice,
      commissionRate: 0.40,
      commissionAmount: finalCommission,
      date: `Hoje · ${time || '12:00'}`,
      time: time || '12:00',
      notes: notes || undefined,
      confirmed: true,
      paymentMethod
    };

    const newRecord: TodayRecord = {
      id: 'rec-' + Date.now(),
      clientName: finalClient,
      serviceName: serviceName || 'Procedimento',
      time: time || '12:00',
      price: finalPrice,
      commission: finalCommission,
      icon: 'content_cut'
    };

    onAddAppointment(newAppointment, newRecord);

    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3500);

    // Reset inputs
    setClientName('');
    setNotes('');
  };

  const totalToday = todayRecords.reduce((sum, r) => sum + r.price, 0);

  const fmtCurrency = (val: number) =>
    'R$ ' + val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="flex flex-col w-full max-w-[480px] mx-auto px-5 pt-20 pb-28 min-h-screen">
      <div className="flex flex-col w-full gap-5 pb-8">
        {/* Real-time Status Card */}
        <div className="relative overflow-hidden rounded-xl bg-[#f3f4f3] p-4 shadow-xs border border-[#e1e3e2]/60">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#cfe5d7] text-[#53675c]">
              <span className="w-2 h-2 rounded-full bg-[#4c6358] animate-pulse" />
              <span className="text-[11px] font-semibold">Registro em tempo real</span>
            </div>
            <span className="text-[11px] text-[#526259] capitalize">{badgeTime}</span>
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <div>
              <h1 className="font-serif-display text-[24px] font-semibold text-[#191c1c] tracking-tight">
                Novo Atendimento
              </h1>
              <p className="text-[12px] text-[#424844] mt-0.5">
                Preencha os detalhes e acompanhe sua comissão imediata
              </p>
            </div>
            <div className="p-2 rounded-full bg-white text-[#4c6358] shadow-xs border border-[#e1e3e2]/60">
              <span className="material-symbols-outlined text-[24px]">content_cut</span>
            </div>
          </div>
        </div>

        {/* Registration Form */}
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {/* Profissional Responsável */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-[#526259] font-semibold uppercase tracking-wider px-1">
              Profissional Responsável
            </label>
            <div className="relative flex items-center bg-white rounded-xl p-3 shadow-xs border border-[#e1e3e2]/70">
              <div className="w-10 h-10 rounded-full bg-[#cee9da] flex items-center justify-center text-[#092017] font-semibold mr-3 shrink-0">
                <span className="material-symbols-outlined text-[20px]">person</span>
              </div>
              <div className="flex-1 min-w-0">
                <select
                  value={professional}
                  onChange={(e) => setProfessional(e.target.value)}
                  className="w-full bg-transparent text-[13px] font-semibold text-[#191c1c] focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="Dorinha Ferreira (Você)">Dorinha Ferreira (Você) • Estética & Cabelo</option>
                  <option value="Camila Santos">Camila Santos • Cabeleireira</option>
                  <option value="Juliana Mendes">Juliana Mendes • Colorista</option>
                  <option value="Patricia Lins">Patricia Lins • Manicure & Nail Care</option>
                </select>
                <span className="block text-[11px] text-[#526259] truncate">
                  Comissão padrão de 40%
                </span>
              </div>
              <span className="material-symbols-outlined text-[#526259] text-[20px] pointer-events-none">
                expand_more
              </span>
            </div>
          </div>

          {/* Data & Horário */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-1">
              <label className="text-[11px] text-[#526259] font-semibold uppercase tracking-wider">
                Data & Horário
              </label>
              <button
                type="button"
                onClick={fillNow}
                className="inline-flex items-center gap-1 text-[11px] text-[#4c6358] font-bold hover:underline"
              >
                <span className="material-symbols-outlined text-[15px]">bolt</span>
                Agora mesmo
              </button>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1 bg-white rounded-xl px-3 py-2 flex items-center shadow-xs border border-[#e1e3e2]/70">
                <span className="material-symbols-outlined text-[#526259] text-[18px] mr-2">
                  calendar_today
                </span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-transparent text-[#191c1c] text-[13px] font-medium focus:outline-none"
                />
              </div>
              <div className="relative w-36 bg-white rounded-xl px-3 py-2 flex items-center shadow-xs border border-[#e1e3e2]/70">
                <span className="material-symbols-outlined text-[#526259] text-[18px] mr-2">
                  schedule
                </span>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-transparent text-[#191c1c] text-[13px] font-medium focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Cliente */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-1">
              <label className="text-[11px] text-[#526259] font-semibold uppercase tracking-wider">
                Cliente
              </label>
              <span className="text-[11px] text-[#526259]">Toque para preencher</span>
            </div>
            <div className="relative">
              <div className="flex items-center bg-white rounded-xl px-3 h-12 shadow-xs border border-[#e1e3e2]/70">
                <span className="material-symbols-outlined text-[#526259] text-[20px] mr-2">
                  search
                </span>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Buscar ou digitar nome da cliente"
                  className="w-full bg-transparent text-[#191c1c] text-[13px] placeholder:text-[#727974] focus:outline-none"
                />
                {clientName && (
                  <button
                    type="button"
                    onClick={() => setClientName('')}
                    className="text-[#526259] hover:text-[#191c1c]"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                )}
              </div>

              {/* Quick Client Chips */}
              <div className="flex gap-2 overflow-x-auto py-2 no-scrollbar">
                {QUICK_CLIENTS.map((qc) => (
                  <button
                    key={qc.name}
                    type="button"
                    onClick={() => handleSelectQuickClient(qc.name)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f3f4f3] text-[#424844] text-[11px] font-semibold hover:bg-[#cfe5d7] hover:text-[#273d33] transition-colors shrink-0 border border-[#e1e3e2]/60 cursor-pointer"
                  >
                    <span className="w-4 h-4 rounded-full bg-[#d5e7db] text-[#0f1f18] text-[9px] font-bold flex items-center justify-center">
                      {qc.initials}
                    </span>
                    {qc.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Serviço Prestado Suggestions */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-[#526259] font-semibold uppercase tracking-wider px-1">
              Serviço Prestado
            </label>
            <div className="grid grid-cols-2 gap-2">
              {servicesList.map((tpl, idx) => {
                const isSelected = selectedServiceIndex === idx;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleSelectService(idx, tpl)}
                    className={`flex flex-col p-3 rounded-xl shadow-xs text-left transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-[#cfe5d7] text-[#273d33] border-[#8fa89b]'
                        : 'bg-white text-[#191c1c] border-[#e1e3e2]/70 hover:border-[#8fa89b]/50'
                    }`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <span className="text-[13px] font-semibold">{tpl.name}</span>
                      <span
                        className={`material-symbols-outlined text-[18px] transition-opacity ${
                          isSelected ? 'text-[#4c6358] opacity-100' : 'opacity-0'
                        }`}
                      >
                        check_circle
                      </span>
                    </div>
                    <span className="text-[11px] text-[#526259] mt-0.5">
                      Sugestão: R$ {tpl.price}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Valor do Serviço + Dynamic Commission Split */}
          <div className="flex flex-col gap-2.5 bg-white rounded-xl p-4 shadow-xs border border-[#e1e3e2]/70">
            <div className="flex items-center justify-between">
              <label className="text-[11px] text-[#526259] font-semibold uppercase tracking-wider">
                Valor do Serviço
              </label>
              <span className="text-[11px] text-[#4c6358] font-bold">Repasse 40%</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-serif-display text-[22px] font-bold text-[#4c6358]">R$</span>
              <input
                type="number"
                step="5"
                min="0"
                value={servicePrice || ''}
                onChange={(e) => setServicePrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-transparent text-[28px] font-bold text-[#191c1c] tracking-tight focus:outline-none"
              />
            </div>

            <div className="rounded-lg bg-[#f3f4f3] p-3 flex flex-col gap-1.5 border border-[#e1e3e2]/50">
              <div className="flex items-center justify-between text-[12px]">
                <span className="flex items-center gap-1 text-[#4c6358] font-bold">
                  <span className="material-symbols-outlined text-[16px]">savings</span>
                  Sua Comissão (40%):
                </span>
                <span className="text-[14px] text-[#4c6358] font-extrabold">
                  {fmtCurrency(commission)}
                </span>
              </div>

              <div className="w-full bg-[#edeeed] rounded-full h-1.5 overflow-hidden">
                <div className="bg-[#4c6358] h-1.5 rounded-full" style={{ width: '40%' }} />
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#526259]">
                <span>Repasse do Salão (60%):</span>
                <span className="font-semibold text-[#424844]">{fmtCurrency(salonShare)}</span>
              </div>
            </div>
          </div>

          {/* Forma de Pagamento */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-[#526259] font-semibold uppercase tracking-wider px-1">
              Forma de Pagamento
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { method: 'PIX' as const, label: 'Pix', icon: 'qr_code_2' },
                { method: 'Crédito' as const, label: 'Crédito', icon: 'credit_card' },
                { method: 'Débito' as const, label: 'Débito', icon: 'payment' },
                { method: 'Dinheiro' as const, label: 'Dinheiro', icon: 'attach_money' }
              ].map((item) => {
                const isSelected = paymentMethod === item.method;
                return (
                  <button
                    key={item.method}
                    type="button"
                    onClick={() => setPaymentMethod(item.method)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl shadow-xs transition-all h-16 border cursor-pointer ${
                      isSelected
                        ? 'bg-[#4c6358] text-white border-[#4c6358]'
                        : 'bg-white text-[#424844] border-[#e1e3e2]/70 hover:bg-[#f3f4f3]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                    <span className="text-[11px] font-semibold mt-1">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Observações */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-[#526259] font-semibold uppercase tracking-wider px-1">
              Observações & Pós-Atendimento
            </label>
            <div className="bg-white rounded-xl p-3 shadow-xs border border-[#e1e3e2]/70">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Ex: Cliente com fios sensibilizados, agendou retorno para retoque em 30 dias..."
                className="w-full bg-transparent text-[13px] text-[#191c1c] placeholder:text-[#727974] focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            className="w-full h-14 rounded-full bg-[#4c6358] hover:bg-[#354c41] text-white text-[15px] font-semibold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all mt-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[22px]">check</span>
            Salvar Registro de Serviço
          </button>
        </form>

        {/* Atendimentos de Hoje Section */}
        <div className="flex flex-col gap-3 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif-display text-[18px] font-semibold text-[#191c1c]">
                Atendimentos de Hoje
              </h2>
              <p className="text-[11px] text-[#526259]">
                {todayRecords.length} registros lançados nesta data
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#cfe5d7] text-[#273d33] text-[11px] font-bold">
              {fmtCurrency(totalToday)} total
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {todayRecords.map((rec) => (
              <div
                key={rec.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white shadow-xs border border-[#e1e3e2]/60 hover:border-[#8fa89b]/40 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#cfe5d7] text-[#273d33] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">
                      {rec.icon || 'content_cut'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-semibold text-[#191c1c]">
                      {rec.clientName}
                    </span>
                    <span className="text-[11px] text-[#526259]">
                      {rec.serviceName} • {rec.time}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span className="text-[13px] font-bold text-[#191c1c]">
                    {fmtCurrency(rec.price)}
                  </span>
                  <span className="inline-flex items-center text-[10px] font-bold text-[#4c6358]">
                    + {fmtCurrency(rec.commission)} comissão
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Toast Notification */}
        {showToast && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-sm p-3.5 rounded-xl bg-[#4c6358] text-white shadow-2xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5">
            <span className="material-symbols-outlined text-[24px]">task_alt</span>
            <div className="flex flex-col">
              <span className="text-[13px] font-bold">Atendimento Registrado!</span>
              <span className="text-[11px] text-[#cee9da]">
                Sua comissão já foi atualizada no painel.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
