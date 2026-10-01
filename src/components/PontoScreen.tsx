import React, { useState, useEffect } from 'react';
import { TimeRecord, UserRole, TimeRecordJustification } from '../types';
import { COLLABORATORS, IMAGES } from '../data/mockData';

interface PontoScreenProps {
  currentRole: UserRole;
  timeRecords: TimeRecord[];
  onRegisterEntry: (employeeId: string, employeeName: string, time: string) => void;
  onRegisterExit: (recordId: string, time: string) => void;
  onSubmitJustification: (
    employeeId: string,
    employeeName: string,
    date: string,
    type: 'entry' | 'exit' | 'both',
    reason: string,
    requestedEntry?: string,
    requestedExit?: string
  ) => void;
  onAdminAdjust: (
    recordId: string | null,
    employeeId: string,
    employeeName: string,
    date: string,
    entryTime: string,
    exitTime: string,
    reason: string
  ) => void;
  onAdminEvaluateJustification: (
    recordId: string,
    status: 'approved' | 'rejected',
    adminNotes?: string
  ) => void;
}

export const PontoScreen: React.FC<PontoScreenProps> = ({
  currentRole,
  timeRecords,
  onRegisterEntry,
  onRegisterExit,
  onSubmitJustification,
  onAdminAdjust,
  onAdminEvaluateJustification
}) => {
  // Live clock
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDateFormatted, setCurrentDateFormatted] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState<'meu_ponto' | 'gestao_equipe' | 'justificativas'>(
    currentRole === 'admin' ? 'gestao_equipe' : 'meu_ponto'
  );

  // Modals state
  const [isJustificationModalOpen, setIsJustificationModalOpen] = useState(false);
  const [isAdminAdjustModalOpen, setIsAdminAdjustModalOpen] = useState(false);
  const [selectedRecordToAdjust, setSelectedRecordToAdjust] = useState<TimeRecord | null>(null);

  // Filter in admin view
  const [adminFilterEmployee, setAdminFilterEmployee] = useState<string>('all');
  const [adminFilterStatus, setAdminFilterStatus] = useState<string>('all');

  // Form states for Justification
  const [justDate, setJustDate] = useState<string>('2026-09-08');
  const [justType, setJustType] = useState<'entry' | 'exit' | 'both'>('both');
  const [justEntryTime, setJustEntryTime] = useState<string>('08:30');
  const [justExitTime, setJustExitTime] = useState<string>('18:00');
  const [justReason, setJustReason] = useState<string>('');

  // Form states for Admin Adjust
  const [adjEmployeeId, setAdjEmployeeId] = useState<string>('col-1');
  const [adjDate, setAdjDate] = useState<string>('2026-09-08');
  const [adjEntryTime, setAdjEntryTime] = useState<string>('08:30');
  const [adjExitTime, setAdjExitTime] = useState<string>('17:45');
  const [adjReason, setAdjReason] = useState<string>('');

  // Confirmation state
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setCurrentDateFormatted(
        now.toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Current logged in user is Dorinha Ferreira
  const currentEmployeeId = 'emp-dorinha';
  const currentEmployeeName = 'Dorinha Ferreira';

  // Find today's record for Dorinha
  const todayRecord = timeRecords.find(
    (r) => r.employeeId === currentEmployeeId && r.date === '2026-09-08'
  );

  // My records (for employee view)
  const myRecords = timeRecords.filter((r) => r.employeeId === currentEmployeeId);

  // Pending justifications for admin
  const pendingJustifications = timeRecords.filter(
    (r) => r.status === 'pending_justification' || (r.justification && r.justification.status === 'pending')
  );

  // Handle Mark Entry
  const handleMarkEntry = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    onRegisterEntry(currentEmployeeId, currentEmployeeName, timeStr);
    showSuccess(`Entrada registrada com sucesso às ${timeStr}!`);
  };

  // Handle Mark Exit
  const handleMarkExit = () => {
    if (!todayRecord) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    onRegisterExit(todayRecord.id, timeStr);
    showSuccess(`Saída registrada com sucesso às ${timeStr}! Bom descanso!`);
  };

  // Submit Justification
  const handleJustificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!justReason.trim()) return;
    onSubmitJustification(
      currentEmployeeId,
      currentEmployeeName,
      justDate,
      justType,
      justReason,
      justType === 'exit' ? undefined : justEntryTime,
      justType === 'entry' ? undefined : justExitTime
    );
    setIsJustificationModalOpen(false);
    setJustReason('');
    showSuccess('Justificativa enviada à Administração para análise e registro.');
  };

  // Open Admin Adjust Modal
  const handleOpenAdminAdjust = (record?: TimeRecord) => {
    if (record) {
      setSelectedRecordToAdjust(record);
      setAdjEmployeeId(record.employeeId);
      setAdjDate(record.date);
      setAdjEntryTime(record.entryTime || '08:30');
      setAdjExitTime(record.exitTime || '17:45');
      setAdjReason(record.adminAdjustment?.reason || '');
    } else {
      setSelectedRecordToAdjust(null);
      setAdjEmployeeId('col-1');
      setAdjDate('2026-09-08');
      setAdjEntryTime('08:30');
      setAdjExitTime('17:45');
      setAdjReason('');
    }
    setIsAdminAdjustModalOpen(true);
  };

  // Submit Admin Adjust
  const handleAdminAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjReason.trim()) return;

    let targetEmpName = 'Camila Santos';
    if (adjEmployeeId === 'emp-dorinha') targetEmpName = 'Dorinha Ferreira';
    else {
      const col = COLLABORATORS.find((c) => c.id === adjEmployeeId);
      if (col) targetEmpName = col.name;
    }

    onAdminAdjust(
      selectedRecordToAdjust ? selectedRecordToAdjust.id : null,
      adjEmployeeId,
      targetEmpName,
      adjDate,
      adjEntryTime,
      adjExitTime,
      adjReason
    );

    setIsAdminAdjustModalOpen(false);
    showSuccess('Apontamento de ponto registrado com justificativa administrativa!');
  };

  // Calculate duration between entry and exit or current time
  const getDuration = (entry?: string, exit?: string) => {
    if (!entry) return '--';
    const [h1, m1] = entry.split(':').map(Number);
    let h2: number, m2: number;
    if (exit) {
      [h2, m2] = exit.split(':').map(Number);
    } else {
      const now = new Date();
      h2 = now.getHours();
      m2 = now.getMinutes();
    }
    let totalMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours}h ${mins.toString().padStart(2, '0')}m`;
  };

  // Filtered records for Admin
  const filteredAdminRecords = timeRecords.filter((rec) => {
    if (adminFilterEmployee !== 'all' && rec.employeeId !== adminFilterEmployee) return false;
    if (adminFilterStatus !== 'all') {
      if (adminFilterStatus === 'adjusted' && rec.status !== 'adjusted_by_admin') return false;
      if (adminFilterStatus === 'pending' && rec.status !== 'pending_justification') return false;
      if (adminFilterStatus === 'completed' && rec.status !== 'completed') return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col w-full max-w-[480px] mx-auto px-5 pt-20 pb-28 min-h-screen">
      <div className="flex flex-col w-full gap-4">
        {/* Header Title & Context Badge */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-semibold text-[#526259] uppercase tracking-wider">
              Controle de Jornada Diária
            </span>
            <h1 className="font-serif-display text-[24px] font-semibold text-[#191c1c] tracking-tight leading-tight">
              Registro de Ponto
            </h1>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#cfe5d7] text-[#273d33] shadow-xs">
            <span className="material-symbols-outlined text-[16px] text-[#4c6358]">fingerprint</span>
            <span className="text-[11px] font-bold uppercase tracking-wide">
              {currentRole === 'admin' ? 'Gestão de Ponto' : 'Colaboradora'}
            </span>
          </div>
        </div>

        {/* Tab switch if Admin */}
        {currentRole === 'admin' && (
          <div className="grid grid-cols-3 gap-1 bg-[#f3f4f3] p-1 rounded-xl border border-[#e1e3e2]/60">
            <button
              type="button"
              onClick={() => setSelectedTab('gestao_equipe')}
              className={`py-2 rounded-lg text-[12px] font-bold transition-all cursor-pointer ${
                selectedTab === 'gestao_equipe'
                  ? 'bg-[#4c6358] text-white shadow-xs'
                  : 'text-[#424844] hover:text-[#191c1c]'
              }`}
            >
              Equipe ({timeRecords.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab('justificativas')}
              className={`py-2 rounded-lg text-[12px] font-bold transition-all cursor-pointer relative ${
                selectedTab === 'justificativas'
                  ? 'bg-[#4c6358] text-white shadow-xs'
                  : 'text-[#424844] hover:text-[#191c1c]'
              }`}
            >
              Justificativas
              {pendingJustifications.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-[#ba1a1a] text-white text-[10px] rounded-full">
                  {pendingJustifications.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab('meu_ponto')}
              className={`py-2 rounded-lg text-[12px] font-bold transition-all cursor-pointer ${
                selectedTab === 'meu_ponto'
                  ? 'bg-[#4c6358] text-white shadow-xs'
                  : 'text-[#424844] hover:text-[#191c1c]'
              }`}
            >
              Meu Ponto
            </button>
          </div>
        )}

        {/* =========================================================================
            VIEW 1: MEU PONTO (Colaboradora ou Admin visualizando o próprio ponto)
           ========================================================================= */}
        {(currentRole === 'employee' || selectedTab === 'meu_ponto') && (
          <div className="flex flex-col gap-4 animate-in fade-in">
            {/* Live Clock Digital Card */}
            <div className="bg-gradient-to-br from-[#4c6358] to-[#354c41] text-white p-5 rounded-2xl shadow-md flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="absolute top-2 right-3 flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-full text-[10px] font-medium text-[#cee9da]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#cee9da] animate-ping" />
                <span>Horário Oficial (Brasília)</span>
              </div>

              <span className="text-[12px] text-[#cee9da] font-medium capitalize mt-3">
                {currentDateFormatted || 'Terça-feira, 08 de setembro de 2026'}
              </span>

              {/* Large Clock */}
              <div className="text-[44px] font-extrabold tracking-tight my-1 font-mono">
                {currentTime || '08:32:00'}
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-[#cee9da] bg-black/15 px-3 py-1 rounded-full mt-1">
                <span className="material-symbols-outlined text-[15px]">location_on</span>
                <span>Presencial · Salão Novo Renascer Matriz</span>
              </div>
            </div>

            {/* Today's Punch Action Card */}
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-[#e1e3e2]/70 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-[#e1e3e2]/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-[#cfe5d7] flex items-center justify-center text-[#4c6358]">
                    <span className="material-symbols-outlined text-[22px]">schedule</span>
                  </div>
                  <div>
                    <span className="text-[14px] font-bold text-[#191c1c] block leading-tight">
                      Jornada de Hoje
                    </span>
                    <span className="text-[11px] text-[#526259]">
                      Apenas Entrada e Saída Diariamente
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                {!todayRecord ? (
                  <span className="px-2.5 py-1 rounded-full bg-[#f3f4f3] text-[#526259] text-[11px] font-bold">
                    Não iniciado
                  </span>
                ) : todayRecord.status === 'in_progress' ? (
                  <span className="px-2.5 py-1 rounded-full bg-[#cfe5d7] text-[#273d33] text-[11px] font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#4c6358] animate-pulse" />
                    Em Aberto
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-[#cfe5d7] text-[#273d33] text-[11px] font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">check</span>
                    Concluído
                  </span>
                )}
              </div>

              {/* Time Slots Preview */}
              <div className="grid grid-cols-2 gap-3">
                {/* Entrada */}
                <div className="p-3.5 rounded-xl bg-[#f3f4f3] border border-[#e1e3e2]/60 flex flex-col">
                  <div className="flex items-center justify-between text-[#526259] text-[11px] font-semibold mb-1">
                    <span>1º Registro</span>
                    <span className="material-symbols-outlined text-[16px] text-[#4c6358]">login</span>
                  </div>
                  <span className="text-[11px] text-[#526259] uppercase">Entrada</span>
                  <span className="text-[20px] font-extrabold text-[#191c1c] mt-0.5">
                    {todayRecord?.entryTime || '--:--'}
                  </span>
                </div>

                {/* Saída */}
                <div className="p-3.5 rounded-xl bg-[#f3f4f3] border border-[#e1e3e2]/60 flex flex-col">
                  <div className="flex items-center justify-between text-[#526259] text-[11px] font-semibold mb-1">
                    <span>2º Registro</span>
                    <span className="material-symbols-outlined text-[16px] text-[#ba1a1a]">logout</span>
                  </div>
                  <span className="text-[11px] text-[#526259] uppercase">Saída</span>
                  <span className="text-[20px] font-extrabold text-[#191c1c] mt-0.5">
                    {todayRecord?.exitTime || '--:--'}
                  </span>
                </div>
              </div>

              {/* Action Button depending on current status */}
              {!todayRecord ? (
                <button
                  type="button"
                  onClick={handleMarkEntry}
                  className="w-full h-14 bg-[#4c6358] hover:bg-[#354c41] text-white rounded-xl font-bold text-[15px] shadow-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[24px]">login</span>
                  <span>Bater Ponto: REGISTRAR ENTRADA</span>
                </button>
              ) : todayRecord.status === 'in_progress' ? (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleMarkExit}
                    className="w-full h-14 bg-[#ba1a1a] hover:bg-[#93000a] text-white rounded-xl font-bold text-[15px] shadow-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[24px]">logout</span>
                    <span>Bater Ponto: REGISTRAR SAÍDA</span>
                  </button>
                  <span className="text-center text-[11px] text-[#526259]">
                    Tempo trabalhado até o momento: <strong>{getDuration(todayRecord.entryTime)}</strong>
                  </span>
                </div>
              ) : (
                <div className="p-3.5 bg-[#cfe5d7]/50 rounded-xl border border-[#b6ccbe]/60 text-center flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1.5 text-[#273d33] font-bold text-[13px]">
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    <span>Jornada de hoje finalizada com sucesso!</span>
                  </div>
                  <span className="text-[11px] text-[#424844]">
                    Total apurado hoje: <strong>{getDuration(todayRecord.entryTime, todayRecord.exitTime)}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Banner: Esqueceu de marcar o ponto? */}
            <div className="bg-[#fff8f6] border border-[#ffdad6] p-4 rounded-2xl flex items-start gap-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[22px]">pending_actions</span>
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[13px] font-bold text-[#191c1c]">
                  Esqueceu de marcar a entrada ou saída?
                </span>
                <p className="text-[11px] text-[#424844] mt-0.5 leading-relaxed">
                  Envie uma justificativa detalhada com os horários reais para que a administração valide e faça a inserção manual por você.
                </p>
                <button
                  type="button"
                  onClick={() => setIsJustificationModalOpen(true)}
                  className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#ba1a1a] text-white text-[12px] font-bold shadow-xs hover:bg-[#93000a] transition-all self-start cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">edit_calendar</span>
                  <span>Enviar Justificativa de Ponto</span>
                </button>
              </div>
            </div>

            {/* Meus Registros Recentes */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="font-serif-display text-[17px] font-semibold text-[#191c1c]">
                  Meus Registros Recentes
                </span>
                <span className="text-[11px] text-[#526259]">Últimos dias</span>
              </div>

              <div className="flex flex-col gap-2">
                {myRecords.map((rec) => (
                  <div
                    key={rec.id}
                    className="bg-white p-3.5 rounded-xl shadow-xs border border-[#e1e3e2]/60 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-bold text-[#191c1c]">
                        {rec.dateFormatted}
                      </span>
                      {rec.status === 'completed' && (
                        <span className="px-2 py-0.5 rounded-full bg-[#cfe5d7] text-[#273d33] text-[10px] font-bold">
                          Concluído
                        </span>
                      )}
                      {rec.status === 'in_progress' && (
                        <span className="px-2 py-0.5 rounded-full bg-[#cfe5d7] text-[#273d33] text-[10px] font-bold">
                          Em Aberto
                        </span>
                      )}
                      {rec.status === 'adjusted_by_admin' && (
                        <span className="px-2 py-0.5 rounded-full bg-[#e7e8e7] text-[#4c6358] border border-[#8fa89b]/50 text-[10px] font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">admin_panel_settings</span>
                          Ajustado pela Gestão
                        </span>
                      )}
                      {rec.status === 'pending_justification' && (
                        <span className="px-2 py-0.5 rounded-full bg-[#ffdad6] text-[#ba1a1a] text-[10px] font-bold">
                          Justificativa em Análise
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-[#f3f4f3] p-2.5 rounded-lg text-center">
                      <div>
                        <span className="text-[10px] text-[#526259] block">Entrada</span>
                        <span className="text-[13px] font-bold text-[#191c1c]">
                          {rec.entryTime || '--:--'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#526259] block">Saída</span>
                        <span className="text-[13px] font-bold text-[#191c1c]">
                          {rec.exitTime || '--:--'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#526259] block">Total</span>
                        <span className="text-[13px] font-bold text-[#4c6358]">
                          {getDuration(rec.entryTime, rec.exitTime)}
                        </span>
                      </div>
                    </div>

                    {/* Admin Adjustment Note if any */}
                    {rec.adminAdjustment && (
                      <div className="p-2 bg-[#cfe5d7]/30 rounded-lg border border-[#b6ccbe]/50 text-[11px] text-[#273d33] flex items-start gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-[#4c6358] shrink-0 mt-0.5">
                          verified_user
                        </span>
                        <div>
                          <strong>Apontamento Administrativo:</strong> {rec.adminAdjustment.reason}{' '}
                          <span className="text-[10px] text-[#526259] block mt-0.5">
                            Realizado por {rec.adminAdjustment.adjustedBy} em {rec.adminAdjustment.adjustedAt}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Pending justification if any */}
                    {rec.justification && rec.justification.status === 'pending' && (
                      <div className="p-2 bg-[#fff8f6] rounded-lg border border-[#ffdad6] text-[11px] text-[#ba1a1a] flex items-start gap-1.5">
                        <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">
                          pending_actions
                        </span>
                        <div>
                          <strong>Justificativa enviada:</strong> "{rec.justification.reason}" ({rec.justification.createdAt})
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 2: GESTÃO DE EQUIPE (ADMINISTRADOR)
           ========================================================================= */}
        {currentRole === 'admin' && selectedTab === 'gestao_equipe' && (
          <div className="flex flex-col gap-4 animate-in fade-in">
            {/* Action Bar: Inserir / Ajustar Manualmente */}
            <div className="bg-white p-4 rounded-2xl shadow-xs border border-[#e1e3e2]/60 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[13px] font-bold text-[#191c1c] block">
                    Gestão Completa de Ponto
                  </span>
                  <span className="text-[11px] text-[#526259]">
                    Inserção manual, ajustes de horário e auditoria
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenAdminAdjust()}
                  className="px-3.5 py-2 bg-[#4c6358] hover:bg-[#354c41] text-white rounded-xl text-[12px] font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">add_circle</span>
                  <span>Inserir / Ajustar Ponto</span>
                </button>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="flex flex-col">
                  <label className="text-[10px] text-[#526259] font-semibold uppercase mb-1">
                    Profissional
                  </label>
                  <select
                    value={adminFilterEmployee}
                    onChange={(e) => setAdminFilterEmployee(e.target.value)}
                    className="h-10 px-2 bg-[#f3f4f3] rounded-lg text-[12px] text-[#191c1c] outline-none border border-[#e1e3e2]"
                  >
                    <option value="all">Todas as Colaboradoras</option>
                    <option value="emp-dorinha">Dorinha Ferreira</option>
                    {COLLABORATORS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-[10px] text-[#526259] font-semibold uppercase mb-1">
                    Status do Ponto
                  </label>
                  <select
                    value={adminFilterStatus}
                    onChange={(e) => setAdminFilterStatus(e.target.value)}
                    className="h-10 px-2 bg-[#f3f4f3] rounded-lg text-[12px] text-[#191c1c] outline-none border border-[#e1e3e2]"
                  >
                    <option value="all">Todos os Status</option>
                    <option value="completed">Concluídos</option>
                    <option value="pending">Justificativas Pendentes</option>
                    <option value="adjusted">Ajustados pela Gestão</option>
                  </select>
                </div>
              </div>
            </div>

            {/* List of All Records for Admin */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="font-serif-display text-[17px] font-semibold text-[#191c1c]">
                  Registros de Ponto da Equipe
                </span>
                <span className="text-[11px] text-[#526259]">
                  {filteredAdminRecords.length} lançamentos
                </span>
              </div>

              {filteredAdminRecords.map((rec) => (
                <div
                  key={rec.id}
                  className="bg-white p-3.5 rounded-xl shadow-xs border border-[#e1e3e2]/60 flex flex-col gap-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={rec.employeeAvatar || IMAGES.DORINHA_AVATAR}
                        alt={rec.employeeName}
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-full object-cover border border-[#cee9da]"
                      />
                      <div>
                        <span className="text-[13px] font-bold text-[#191c1c] block leading-tight">
                          {rec.employeeName}
                        </span>
                        <span className="text-[10px] text-[#526259]">{rec.dateFormatted}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {rec.status === 'adjusted_by_admin' && (
                        <span className="px-2 py-0.5 rounded-full bg-[#cfe5d7] text-[#273d33] text-[10px] font-bold flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[12px]">verified</span>
                          Ajustado
                        </span>
                      )}
                      {rec.status === 'pending_justification' && (
                        <span className="px-2 py-0.5 rounded-full bg-[#ffdad6] text-[#ba1a1a] text-[10px] font-bold">
                          Pendente
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenAdminAdjust(rec)}
                        className="p-1.5 rounded-lg bg-[#f3f4f3] hover:bg-[#e7e8e7] text-[#4c6358] transition-colors"
                        title="Ajustar ou Adicionar Nota"
                      >
                        <span className="material-symbols-outlined text-[17px]">edit</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-[#f3f4f3] p-2 rounded-lg text-center">
                    <div>
                      <span className="text-[10px] text-[#526259] block">Entrada</span>
                      <span className="text-[12px] font-bold text-[#191c1c]">
                        {rec.entryTime || '--:--'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#526259] block">Saída</span>
                      <span className="text-[12px] font-bold text-[#191c1c]">
                        {rec.exitTime || '--:--'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#526259] block">Total</span>
                      <span className="text-[12px] font-bold text-[#4c6358]">
                        {getDuration(rec.entryTime, rec.exitTime)}
                      </span>
                    </div>
                  </div>

                  {/* Audit details */}
                  {rec.adminAdjustment && (
                    <div className="p-2 bg-[#cfe5d7]/30 rounded-lg border border-[#b6ccbe]/40 text-[11px] text-[#273d33]">
                      <span className="font-bold">Apontamento da Administração:</span>{' '}
                      {rec.adminAdjustment.reason}
                      <span className="block text-[10px] text-[#526259] mt-0.5">
                        Por {rec.adminAdjustment.adjustedBy} em {rec.adminAdjustment.adjustedAt}
                      </span>
                    </div>
                  )}

                  {rec.justification && (
                    <div className="p-2 bg-[#fff8f6] rounded-lg border border-[#ffdad6] text-[11px] text-[#ba1a1a]">
                      <span className="font-bold">Justificativa da Colaboradora:</span> "
                      {rec.justification.reason}" ({rec.justification.createdAt})
                      {rec.justification.status === 'pending' && (
                        <div className="flex gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => onAdminEvaluateJustification(rec.id, 'approved')}
                            className="px-2.5 py-1 bg-[#4c6358] text-white rounded-md text-[10px] font-bold"
                          >
                            Aprovar &amp; Registrar
                          </button>
                          <button
                            type="button"
                            onClick={() => onAdminEvaluateJustification(rec.id, 'rejected')}
                            className="px-2.5 py-1 bg-[#ffdad6] text-[#ba1a1a] rounded-md text-[10px] font-bold"
                          >
                            Recusar
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 3: JUSTIFICATIVAS PENDENTES (ADMINISTRADOR)
           ========================================================================= */}
        {currentRole === 'admin' && selectedTab === 'justificativas' && (
          <div className="flex flex-col gap-3 animate-in fade-in">
            <div className="bg-white p-4 rounded-2xl shadow-xs border border-[#e1e3e2]/60">
              <span className="text-[13px] font-bold text-[#191c1c] block">
                Solicitações de Justificativa de Ponto
              </span>
              <p className="text-[11px] text-[#526259] mt-0.5">
                Colaboradoras que esqueceram de marcar a entrada ou saída e solicitaram apontamento manual.
              </p>
            </div>

            {pendingJustifications.length === 0 ? (
              <div className="p-8 bg-white rounded-2xl border border-[#e1e3e2]/60 text-center flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-[32px] text-[#4c6358]">
                  check_circle
                </span>
                <span className="text-[13px] font-bold text-[#191c1c]">
                  Nenhuma justificativa pendente no momento!
                </span>
                <span className="text-[11px] text-[#526259]">
                  Todos os registros de ponto estão em dia e auditados.
                </span>
              </div>
            ) : (
              pendingJustifications.map((rec) => (
                <div
                  key={rec.id}
                  className="bg-white p-4 rounded-xl shadow-xs border border-[#ffdad6] flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={rec.employeeAvatar || IMAGES.STAFF_BEATRIZ}
                        alt={rec.employeeName}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-full object-cover border border-[#cee9da]"
                      />
                      <div>
                        <span className="text-[13px] font-bold text-[#191c1c] block">
                          {rec.employeeName}
                        </span>
                        <span className="text-[11px] text-[#526259]">{rec.dateFormatted}</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#ffdad6] text-[#ba1a1a] text-[10px] font-bold">
                      Aguardando Gestão
                    </span>
                  </div>

                  <div className="p-3 bg-[#fff8f6] rounded-xl border border-[#ffdad6]/60 text-[12px] text-[#191c1c]">
                    <span className="text-[10px] font-bold text-[#ba1a1a] uppercase block mb-0.5">
                      Motivo Declarado pela Colaboradora:
                    </span>
                    "{rec.justification?.reason}"
                    {rec.justification?.requestedExit && (
                      <span className="block text-[11px] text-[#526259] mt-1 font-medium">
                        Horário de saída solicitado: <strong>{rec.justification.requestedExit}</strong>
                      </span>
                    )}
                    {rec.justification?.requestedEntry && (
                      <span className="block text-[11px] text-[#526259] mt-0.5 font-medium">
                        Horário de entrada solicitado: <strong>{rec.justification.requestedEntry}</strong>
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onAdminEvaluateJustification(rec.id, 'approved', 'Aprovado pela administração.')}
                      className="h-11 bg-[#4c6358] hover:bg-[#354c41] text-white rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">check</span>
                      <span>Aprovar &amp; Inserir</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onAdminEvaluateJustification(rec.id, 'rejected', 'Recusado - Horário incompatível.')}
                      className="h-11 bg-[#f3f4f3] hover:bg-[#ffdad6] text-[#ba1a1a] rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-[#e1e3e2]"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                      <span>Recusar</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Global Toast */}
        {actionSuccessMsg && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#191c1c] text-white px-4 py-2.5 rounded-full text-[12px] font-semibold shadow-2xl z-50 flex items-center gap-2 animate-in fade-in">
            <span className="material-symbols-outlined text-[#cee9da] text-[18px]">
              check_circle
            </span>
            <span>{actionSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL: ENVIAR JUSTIFICATIVA (Colaboradora)
         ========================================================================= */}
      {isJustificationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-[#191c1c]/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-[420px] bg-white rounded-2xl p-5 shadow-2xl flex flex-col gap-4 border border-[#e1e3e2] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#e1e3e2]/60">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ba1a1a] text-[22px]">
                  edit_calendar
                </span>
                <h2 className="font-serif-display text-[18px] font-semibold text-[#191c1c]">
                  Justificativa de Ponto
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsJustificationModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#edeeed] flex items-center justify-center text-[#424844] hover:text-[#191c1c]"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleJustificationSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[#526259] font-bold uppercase">
                  Data do Esquecimento
                </label>
                <input
                  type="date"
                  required
                  value={justDate}
                  onChange={(e) => setJustDate(e.target.value)}
                  className="h-11 px-3 bg-[#f3f4f3] rounded-xl text-[13px] text-[#191c1c] outline-none border border-[#e1e3e2]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[#526259] font-bold uppercase">
                  O que você esqueceu de marcar?
                </label>
                <div className="grid grid-cols-3 gap-1 bg-[#f3f4f3] p-1 rounded-xl">
                  {(['both', 'entry', 'exit'] as const).map((t) => {
                    const labels = { both: 'Ambos', entry: 'Entrada', exit: 'Saída' };
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setJustType(t)}
                        className={`py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          justType === t
                            ? 'bg-[#4c6358] text-white shadow-xs'
                            : 'text-[#424844] hover:text-[#191c1c]'
                        }`}
                      >
                        {labels[t]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {(justType === 'both' || justType === 'entry') && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-[#526259] font-bold uppercase">
                      Horário Entrada Real
                    </label>
                    <input
                      type="time"
                      required
                      value={justEntryTime}
                      onChange={(e) => setJustEntryTime(e.target.value)}
                      className="h-11 px-3 bg-[#f3f4f3] rounded-xl text-[13px] text-[#191c1c] outline-none border border-[#e1e3e2]"
                    />
                  </div>
                )}
                {(justType === 'both' || justType === 'exit') && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-[#526259] font-bold uppercase">
                      Horário Saída Real
                    </label>
                    <input
                      type="time"
                      required
                      value={justExitTime}
                      onChange={(e) => setJustExitTime(e.target.value)}
                      className="h-11 px-3 bg-[#f3f4f3] rounded-xl text-[13px] text-[#191c1c] outline-none border border-[#e1e3e2]"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[#526259] font-bold uppercase">
                  Motivo da Justificativa *
                </label>
                <textarea
                  required
                  rows={3}
                  value={justReason}
                  onChange={(e) => setJustReason(e.target.value)}
                  placeholder="Ex: Esqueci o aparelho celular na recepção / Atendimento emergencial de noiva logo na abertura do salão."
                  className="p-3 bg-[#f3f4f3] rounded-xl text-[12px] text-[#191c1c] outline-none border border-[#e1e3e2] resize-none"
                />
              </div>

              <div className="p-3 bg-[#f3f4f3] rounded-xl border border-[#e1e3e2] text-[11px] text-[#526259]">
                Ao enviar, a administração receberá seu pedido de ajuste e efetuará a marcação com o carimbo oficial de justificativa.
              </div>

              <button
                type="submit"
                className="w-full h-12 bg-[#4c6358] hover:bg-[#354c41] text-white text-[13px] font-bold rounded-xl shadow-xs transition-colors cursor-pointer mt-1"
              >
                Enviar Justificativa para o Administrador
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: INSERIR OU AJUSTAR PONTO MANUALMENTE (Administrador)
         ========================================================================= */}
      {isAdminAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-[#191c1c]/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-[420px] bg-white rounded-2xl p-5 shadow-2xl flex flex-col gap-4 border border-[#e1e3e2] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#e1e3e2]/60">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#4c6358] text-[22px]">
                  admin_panel_settings
                </span>
                <h2 className="font-serif-display text-[18px] font-semibold text-[#191c1c]">
                  Apontamento Manual da Gestão
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsAdminAdjustModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#edeeed] flex items-center justify-center text-[#424844] hover:text-[#191c1c]"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleAdminAdjustSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[#526259] font-bold uppercase">
                  Colaboradora
                </label>
                <select
                  value={adjEmployeeId}
                  onChange={(e) => setAdjEmployeeId(e.target.value)}
                  className="h-11 px-3 bg-[#f3f4f3] rounded-xl text-[13px] text-[#191c1c] outline-none border border-[#e1e3e2]"
                >
                  <option value="emp-dorinha">Dorinha Ferreira</option>
                  {COLLABORATORS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[#526259] font-bold uppercase">
                  Data do Registro
                </label>
                <input
                  type="date"
                  required
                  value={adjDate}
                  onChange={(e) => setAdjDate(e.target.value)}
                  className="h-11 px-3 bg-[#f3f4f3] rounded-xl text-[13px] text-[#191c1c] outline-none border border-[#e1e3e2]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#526259] font-bold uppercase">
                    Horário de Entrada
                  </label>
                  <input
                    type="time"
                    required
                    value={adjEntryTime}
                    onChange={(e) => setAdjEntryTime(e.target.value)}
                    className="h-11 px-3 bg-[#f3f4f3] rounded-xl text-[13px] text-[#191c1c] outline-none border border-[#e1e3e2]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#526259] font-bold uppercase">
                    Horário de Saída
                  </label>
                  <input
                    type="time"
                    required
                    value={adjExitTime}
                    onChange={(e) => setAdjExitTime(e.target.value)}
                    className="h-11 px-3 bg-[#f3f4f3] rounded-xl text-[13px] text-[#191c1c] outline-none border border-[#e1e3e2]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[#526259] font-bold uppercase">
                  Justificativa / Motivo Administrativo *
                </label>
                <textarea
                  required
                  rows={3}
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  placeholder="Ex: Lançamento retroativo autorizado pela diretoria após apresentação de justificativa de procedimento externo."
                  className="p-3 bg-[#f3f4f3] rounded-xl text-[12px] text-[#191c1c] outline-none border border-[#e1e3e2] resize-none"
                />
              </div>

              <div className="p-3 bg-[#cfe5d7]/50 rounded-xl border border-[#b6ccbe]/60 text-[11px] text-[#273d33]">
                Ficará gravado no histórico que este registro foi inserido/ajustado pela Administração, garantindo total transparência e conformidade.
              </div>

              <button
                type="submit"
                className="w-full h-12 bg-[#4c6358] hover:bg-[#354c41] text-white text-[13px] font-bold rounded-xl shadow-xs transition-colors cursor-pointer mt-1"
              >
                Gravar Apontamento com Justificativa
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
