import React, { useState, useEffect } from 'react';
import { Appointment, TodayRecord, UserRole } from '../types';
import { SERVICE_TEMPLATES, QUICK_CLIENTS } from '../data/mockData';
import { fetchServices, createService, fetchCategories, createCategory, ServiceItem, CategoryItem, UserProfile } from '../lib/supabase';

interface NovoAtendimentoScreenProps {
  onAddAppointment: (appointment: Appointment, todayRecord: TodayRecord) => void;
  todayRecords: TodayRecord[];
  staffList?: UserProfile[];
  currentUserName?: string;
  currentUserId?: string;
  userRole?: UserRole;
}

export const NovoAtendimentoScreen: React.FC<NovoAtendimentoScreenProps> = ({
  onAddAppointment,
  todayRecords,
  staffList = [],
  currentUserName = 'Dorinha Ferreira',
  currentUserId,
  userRole = 'employee'
}) => {
  const [professional, setProfessional] = useState(currentUserName);
  const [clientName, setClientName] = useState('');
  const [servicesList, setServicesList] = useState<ServiceItem[]>(SERVICE_TEMPLATES);
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [customServiceName, setCustomServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'Crédito' | 'Débito' | 'Dinheiro'>('PIX');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [badgeTime, setBadgeTime] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Modal para criar nova categoria / serviço rápido
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [srvs, cats] = await Promise.all([fetchServices(), fetchCategories()]);
      if (srvs && srvs.length > 0) {
        setServicesList(srvs);
        // Seleciona o primeiro serviço como padrão se nenhum estiver selecionado
        if (selectedServiceIds.length === 0 && srvs[0]) {
          setSelectedServiceIds([srvs[0].id]);
          setServicePrice(srvs[0].price);
        }
      }
      if (cats && cats.length > 0) {
        setCategoriesList(cats);
        setNewServiceCategory(cats[0].name);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
    if (currentUserName) {
      setProfessional(currentUserName);
    }
  }, [currentUserName]);

  // Preencher data e hora atual
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

  // Multi-seleção de serviços
  const handleToggleService = (service: ServiceItem) => {
    let nextIds: string[];
    if (selectedServiceIds.includes(service.id)) {
      nextIds = selectedServiceIds.filter((id) => id !== service.id);
    } else {
      nextIds = [...selectedServiceIds, service.id];
    }
    setSelectedServiceIds(nextIds);

    // Recalcular soma dos preços dos serviços selecionados
    const selectedItems = servicesList.filter((s) => nextIds.includes(s.id));
    const totalPrice = selectedItems.reduce((sum, s) => sum + Number(s.price), 0);
    setServicePrice(totalPrice);
  };

  const getCombinedServiceName = () => {
    const selectedItems = servicesList.filter((s) => selectedServiceIds.includes(s.id));
    if (selectedItems.length > 0) {
      return selectedItems.map((s) => s.name).join(' + ');
    }
    return customServiceName.trim() || 'Procedimento Estético';
  };

  const commission = servicePrice * 0.40;
  const salonShare = servicePrice * 0.60;
  const isEmployee = userRole === 'employee';

  const handleCreateQuickCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const created = await createCategory(newCatName.trim());
      setCategoriesList((prev) => [...prev, created]);
      setNewServiceCategory(created.name);
      setNewCatName('');
      setFeedbackMsg(`Categoria "${created.name}" criada com sucesso!`);
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (err: any) {
      const localCat = { id: 'cat-' + Date.now(), name: newCatName.trim() };
      setCategoriesList((prev) => [...prev, localCat]);
      setNewServiceCategory(localCat.name);
      setNewCatName('');
    }
  };

  const handleCreateQuickService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;
    try {
      const created = await createService({
        name: newServiceName.trim(),
        price: parseFloat(newServicePrice) || 0,
        category: newServiceCategory || 'Cabelo',
      });
      setServicesList((prev) => [created, ...prev]);
      setSelectedServiceIds((prev) => [...prev, created.id]);
      setServicePrice((prev) => prev + Number(created.price));
      setNewServiceName('');
      setNewServicePrice('');
      setShowNewCategoryModal(false);
      setFeedbackMsg(`Serviço "${created.name}" adicionado ao catálogo!`);
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (err: any) {
      const local = {
        id: 'srv-' + Date.now(),
        name: newServiceName.trim(),
        price: parseFloat(newServicePrice) || 0,
        category: newServiceCategory || 'Cabelo',
        active: true,
      };
      setServicesList((prev) => [local, ...prev]);
      setSelectedServiceIds((prev) => [...prev, local.id]);
      setServicePrice((prev) => prev + Number(local.price));
      setNewServiceName('');
      setNewServicePrice('');
      setShowNewCategoryModal(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalClient = clientName.trim() || 'Cliente Avulso';
    const finalPrice = servicePrice > 0 ? servicePrice : 150;
    const finalCommission = isEmployee ? 0 : finalPrice * 0.40;
    const finalServiceName = getCombinedServiceName();

    const newAppointment: Appointment = {
      id: 'apt-' + Date.now(),
      userId: currentUserId,
      professionalName: professional,
      clientName: finalClient,
      serviceName: finalServiceName,
      price: finalPrice,
      commissionRate: isEmployee ? 0 : 0.40,
      commissionAmount: finalCommission,
      date: date || 'Hoje',
      time: time || '12:00',
      notes: notes || undefined,
      confirmed: true,
      paymentMethod,
      createdAt: new Date().toISOString(),
    };

    const newRecord: TodayRecord = {
      id: 'rec-' + Date.now(),
      clientName: finalClient,
      serviceName: finalServiceName,
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
                {isEmployee
                  ? 'Cadastre os serviços realizados no salão'
                  : 'Selecione múltiplos procedimentos e acompanhe seu repasse'}
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
                  className="w-full bg-transparent text-[13px] font-semibold text-[#191c1c] focus:outline-none cursor-pointer"
                >
                  {staffList && staffList.length > 0 ? (
                    staffList
                      .filter((s) => s.active)
                      .map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.name} {s.name === currentUserName ? '(Você)' : ''} • {s.role === 'admin' ? 'Administradora' : s.role === 'employee' ? 'Colaboradora CLT' : 'Prestadora'}
                        </option>
                      ))
                  ) : (
                    <>
                      <option value="Dorinha Ferreira">Dorinha Ferreira (Você)</option>
                      <option value="Camila Santos">Camila Santos</option>
                      <option value="Beatriz Lima">Beatriz Lima</option>
                      <option value="Fernanda Costa">Fernanda Costa</option>
                      <option value="Juliana Rocha">Juliana Rocha</option>
                    </>
                  )}
                </select>
                <span className="block text-[11px] text-[#526259] truncate">
                  {isEmployee ? 'Colaboradora CLT (Sem repasse de 40%)' : 'Prestadora Parceira (Repasse de 40%)'}
                </span>
              </div>
            </div>
          </div>

          {/* Data & Horário */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-1">
              <label className="text-[11px] text-[#526259] font-semibold uppercase tracking-wider">
                Data &amp; Horário do Registro
              </label>
              <button
                type="button"
                onClick={fillNow}
                className="inline-flex items-center gap-1 text-[11px] text-[#4c6358] font-bold hover:underline cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">bolt</span>
                Preencher Agora
              </button>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1 bg-white rounded-xl px-3 py-2 flex items-center shadow-xs border border-[#e1e3e2]/70">
                <span className="material-symbols-outlined text-[#526259] text-[18px] mr-2">
                  calendar_today
                </span>
                <input
                  type="date"
                  required
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
                  required
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
              <span className="text-[11px] text-[#526259]">Digite ou selecione</span>
            </div>
            <div className="relative">
              <div className="flex items-center bg-white rounded-xl px-3 h-12 shadow-xs border border-[#e1e3e2]/70">
                <span className="material-symbols-outlined text-[#526259] text-[20px] mr-2">
                  search
                </span>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Nome da cliente"
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
                    onClick={() => setClientName(qc.name)}
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

          {/* Serviços Prestados (Múltipla Seleção) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-1">
              <label className="text-[11px] text-[#526259] font-semibold uppercase tracking-wider">
                Serviços Prestados (Permite Múltiplos)
              </label>
              <button
                type="button"
                onClick={() => setShowNewCategoryModal(true)}
                className="text-[11px] font-bold text-[#4c6358] flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">add_circle</span>
                + Nova Categoria / Serviço
              </button>
            </div>

            {/* Lista com múltiplos serviços selecionáveis */}
            <div className="grid grid-cols-2 gap-2">
              {servicesList.map((tpl) => {
                const isSelected = selectedServiceIds.includes(tpl.id);
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleToggleService(tpl)}
                    className={`flex flex-col p-3 rounded-xl shadow-xs text-left transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-[#cfe5d7] text-[#273d33] border-[#4c6358] shadow-sm'
                        : 'bg-white text-[#191c1c] border-[#e1e3e2]/70 hover:border-[#8fa89b]/50'
                    }`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <span className="text-[12px] font-bold leading-snug">{tpl.name}</span>
                      <span
                        className={`material-symbols-outlined text-[18px] transition-opacity ${
                          isSelected ? 'text-[#4c6358] opacity-100 font-bold' : 'text-[#8fa89b] opacity-40'
                        }`}
                      >
                        {isSelected ? 'check_box' : 'check_box_outline_blank'}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#526259] mt-1 font-semibold">
                      R$ {Number(tpl.price).toFixed(2).replace('.', ',')}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Chips dos serviços selecionados */}
            {selectedServiceIds.length > 0 && (
              <div className="p-3 bg-[#cfe5d7]/40 rounded-xl border border-[#b6ccbe]/60 flex flex-col gap-1.5 mt-1 animate-in">
                <span className="text-[11px] font-bold text-[#273d33] uppercase">
                  {selectedServiceIds.length} {selectedServiceIds.length === 1 ? 'Serviço Selecionado' : 'Serviços Combinados'}:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {servicesList
                    .filter((s) => selectedServiceIds.includes(s.id))
                    .map((s) => (
                      <span
                        key={s.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-[#273d33] text-[11px] font-semibold border border-[#b6ccbe] shadow-xs"
                      >
                        <span>{s.name}</span>
                        <span className="text-[#526259] font-normal">R$ {s.price}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleService(s);
                          }}
                          className="hover:text-[#ba1a1a] ml-0.5 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Valor Total do Serviço */}
          <div className="flex flex-col gap-2.5 bg-white rounded-xl p-4 shadow-xs border border-[#e1e3e2]/70">
            <div className="flex items-center justify-between">
              <label className="text-[11px] text-[#526259] font-semibold uppercase tracking-wider">
                Valor Total Cobrado (R$)
              </label>
              {!isEmployee && (
                <span className="text-[11px] text-[#4c6358] font-bold">Repasse 40%</span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-serif-display text-[22px] font-bold text-[#4c6358]">R$</span>
              <input
                type="number"
                step="5"
                min="0"
                required
                value={servicePrice || ''}
                onChange={(e) => setServicePrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-transparent text-[28px] font-bold text-[#191c1c] tracking-tight focus:outline-none"
              />
            </div>

            {/* Split de comissão: exibido para prestadora, oculto/ajustado para colaboradora CLT */}
            {!isEmployee ? (
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
            ) : (
              <div className="p-2.5 rounded-lg bg-[#cfe5d7]/50 border border-[#b6ccbe]/60 text-[11px] text-[#273d33] flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-[#4c6358]">badge</span>
                <span>Registro para Colaboradora CLT (Receita integral do salão).</span>
              </div>
            )}
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
              Observações &amp; Pós-Atendimento
            </label>
            <div className="bg-white rounded-xl p-3 shadow-xs border border-[#e1e3e2]/70">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Ex: Cliente alérgica a esmaltes com tolueno, agendou retorno para 15 dias..."
                className="w-full bg-transparent text-[13px] text-[#191c1c] placeholder:text-[#727974] focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            className="w-full h-14 rounded-full bg-[#4c6358] hover:bg-[#354c41] text-white text-[15px] font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all mt-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[22px]">check</span>
            Salvar Registro no Banco de Dados
          </button>
        </form>

        {/* Atendimentos de Hoje Section */}
        <div className="flex flex-col gap-3 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif-display text-[18px] font-semibold text-[#191c1c]">
                Atendimentos Registrados Hoje
              </h2>
              <p className="text-[11px] text-[#526259]">
                {todayRecords.length} lançamentos nesta data
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#cfe5d7] text-[#273d33] text-[11px] font-bold">
              {fmtCurrency(totalToday)} total
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {todayRecords.length === 0 ? (
              <div className="p-4 bg-white rounded-xl text-center text-[12px] text-[#526259] border border-[#e1e3e2]">
                Nenhum atendimento lançado hoje ainda.
              </div>
            ) : (
              todayRecords.map((rec) => (
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
                    {!isEmployee && (
                      <span className="inline-flex items-center text-[10px] font-bold text-[#4c6358]">
                        + {fmtCurrency(rec.commission)} comissão
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal Rápido: Nova Categoria & Novo Procedimento */}
        {showNewCategoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#191c1c]/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl p-5 w-full max-w-[420px] shadow-2xl border border-[#e1e3e2] flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#e1e3e2]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#4c6358] text-[22px]">category</span>
                  <h3 className="font-serif-display text-[17px] font-bold text-[#191c1c]">
                    Adicionar Categoria ou Serviço
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewCategoryModal(false)}
                  className="w-8 h-8 rounded-full bg-[#f3f4f3] flex items-center justify-center text-[#526259]"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {/* 1. Criar Categoria */}
              <form onSubmit={handleCreateQuickCategory} className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-[#526259] uppercase">
                  1. Criar Nova Categoria
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Ex: Barba, Depilação, Podologia..."
                    className="flex-1 h-10 px-3 bg-[#f3f4f3] rounded-xl text-[12px] border border-[#e1e3e2] outline-none focus:border-[#4c6358]"
                  />
                  <button
                    type="submit"
                    className="px-4 h-10 bg-[#4c6358] text-white rounded-xl text-[12px] font-bold hover:bg-[#354c41]"
                  >
                    Salvar
                  </button>
                </div>
              </form>

              {/* 2. Criar Procedimento */}
              <form onSubmit={handleCreateQuickService} className="flex flex-col gap-2 pt-2 border-t border-[#e1e3e2]">
                <label className="text-[11px] font-bold text-[#526259] uppercase">
                  2. Cadastrar Procedimento Rápido
                </label>
                <input
                  type="text"
                  required
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  placeholder="Nome do Procedimento"
                  className="h-10 px-3 bg-[#f3f4f3] rounded-xl text-[12px] border border-[#e1e3e2] outline-none focus:border-[#4c6358]"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    required
                    step="5"
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(e.target.value)}
                    placeholder="Preço R$"
                    className="h-10 px-3 bg-[#f3f4f3] rounded-xl text-[12px] border border-[#e1e3e2] outline-none focus:border-[#4c6358]"
                  />
                  <select
                    value={newServiceCategory}
                    onChange={(e) => setNewServiceCategory(e.target.value)}
                    className="h-10 px-2 bg-[#f3f4f3] rounded-xl text-[12px] font-semibold border border-[#e1e3e2] outline-none focus:border-[#4c6358]"
                  >
                    {categoriesList.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full h-11 bg-[#4c6358] hover:bg-[#354c41] text-white rounded-xl text-[13px] font-bold mt-1"
                >
                  Salvar Procedimento no Supabase
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {showToast && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-sm p-3.5 rounded-xl bg-[#4c6358] text-white shadow-2xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5">
            <span className="material-symbols-outlined text-[24px]">task_alt</span>
            <div className="flex flex-col">
              <span className="text-[13px] font-bold">Atendimento Gravado no Banco!</span>
              <span className="text-[11px] text-[#cee9da]">
                {isEmployee ? 'Lançamento registrado com sucesso.' : 'Sua comissão já foi atualizada no painel.'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
