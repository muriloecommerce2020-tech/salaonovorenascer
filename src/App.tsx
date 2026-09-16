import React, { useState, useEffect } from 'react';
import { ScreenType, UserRole, Appointment, TodayRecord, TimeRecord } from './types';
import {
  INITIAL_APPOINTMENTS,
  INITIAL_TODAY_RECORDS,
  INITIAL_TIME_RECORDS,
  IMAGES
} from './data/mockData';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { LoginScreen } from './components/LoginScreen';
import { MeusGanhosScreen } from './components/MeusGanhosScreen';
import { NovoAtendimentoScreen } from './components/NovoAtendimentoScreen';
import { PontoScreen } from './components/PontoScreen';
import { PainelGeralScreen } from './components/PainelGeralScreen';
import { ExtratoPdfScreen } from './components/ExtratoPdfScreen';
import { PerfilScreen } from './components/PerfilScreen';
import { NotificationsModal } from './components/NotificationsModal';
import { NewServiceModal, ManageStaffModal } from './components/ActionModals';
import {
  supabase,
  signOut,
  getCurrentUserProfile,
  fetchAllProfiles,
  fetchAppointmentsFromDb,
  saveAppointmentToDb,
  fetchTimeRecordsFromDb,
  saveTimeRecordToDb,
  UserProfile
} from './lib/supabase';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('ganhos');
  const [currentRole, setCurrentRole] = useState<UserRole>('employee');
  const [currentUserName, setCurrentUserName] = useState<string>('Dorinha Ferreira');
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  const [staffList, setStaffList] = useState<UserProfile[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [todayRecords, setTodayRecords] = useState<TodayRecord[]>(INITIAL_TODAY_RECORDS);
  const [timeRecords, setTimeRecords] = useState<TimeRecord[]>(INITIAL_TIME_RECORDS);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isNewServiceOpen, setIsNewServiceOpen] = useState(false);
  const [isManageStaffOpen, setIsManageStaffOpen] = useState(false);
  const [globalToast, setGlobalToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setGlobalToast(msg);
    setTimeout(() => setGlobalToast(null), 3200);
  };

  // Carregar dados e sessão do Supabase ao inicializar
  useEffect(() => {
    // 1. Carregar perfil da sessão ativa
    getCurrentUserProfile().then((profile) => {
      if (profile) {
        setCurrentRole(profile.role);
        setCurrentUserName(profile.name);
        setCurrentUserId(profile.id);
        if (profile.role === 'admin') {
          setCurrentScreen('painel');
        } else if (profile.role === 'employee') {
          setCurrentScreen('ponto');
        } else {
          setCurrentScreen('ganhos');
        }
        showToast(`Sessão ativa: Bem-vinda, ${profile.name}!`);
      }
    }).catch(() => {});

    // 2. Carregar equipe / profiles
    fetchAllProfiles().then((profiles) => {
      if (profiles && profiles.length > 0) {
        setStaffList(profiles);
      }
    }).catch(() => {});

    // 3. Carregar atendimentos do Supabase
    fetchAppointmentsFromDb().then((remoteApts) => {
      if (remoteApts && remoteApts.length > 0) {
        setAppointments((prev) => {
          const remoteIds = new Set(remoteApts.map((a) => a.id));
          const uniqueLocal = prev.filter((p) => !remoteIds.has(p.id));
          return [...remoteApts, ...uniqueLocal];
        });
      }
    }).catch(() => {});

    // 4. Carregar registros de ponto do Supabase
    fetchTimeRecordsFromDb().then((remotePonto) => {
      if (remotePonto && remotePonto.length > 0) {
        setTimeRecords((prev) => {
          const remoteIds = new Set(remotePonto.map((r) => r.id));
          const uniqueLocal = prev.filter((p) => !remoteIds.has(p.id));
          return [...remotePonto, ...uniqueLocal];
        });
      }
    }).catch(() => {});

    // 5. Canal Realtime para atualizações automáticas
    const channel = supabase
      .channel('db-sync-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        () => {
          fetchAppointmentsFromDb().then((remoteApts) => {
            if (remoteApts && remoteApts.length > 0) {
              setAppointments(remoteApts);
            }
          }).catch(() => {});
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'time_records' },
        () => {
          fetchTimeRecordsFromDb().then((remotePonto) => {
            if (remotePonto && remotePonto.length > 0) {
              setTimeRecords(remotePonto);
            }
          }).catch(() => {});
        }
      )
      .subscribe();

    // 6. Escuta de eventos de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setCurrentScreen('login');
      }
    });

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAddAppointment = (newApt: Appointment, newRecord: TodayRecord) => {
    setAppointments((prev) => [newApt, ...prev]);
    setTodayRecords((prev) => [newRecord, ...prev]);
    showToast(`Atendimento para ${newApt.clientName} registrado com sucesso!`);
    saveAppointmentToDb(newApt, currentUserId);
  };

  const handleLoginSuccess = (role: UserRole, userName?: string) => {
    setCurrentRole(role);
    if (userName) setCurrentUserName(userName);
    if (role === 'admin') {
      setCurrentScreen('painel');
      showToast(`Bem-vinda, ${userName || 'Administradora'}! Painel Executivo liberado.`);
    } else if (role === 'employee') {
      setCurrentScreen('ponto');
      showToast(`Bem-vinda, ${userName || 'Colaboradora'}! Acesso ao Ponto e Ganhos liberados.`);
    } else {
      setCurrentScreen('ganhos');
      showToast(`Bem-vinda, ${userName || 'Prestadora de Serviço'}! Meus Ganhos liberados.`);
    }
  };

  const handleSwitchRole = (newRole: UserRole) => {
    setCurrentRole(newRole);
    if (newRole === 'service_provider') {
      if (currentScreen !== 'novo' && currentScreen !== 'ganhos') {
        setCurrentScreen('ganhos');
      }
      showToast('Modo Prestador de Serviço ativado: visualização restrita a Novo e Ganhos.');
    } else if (newRole === 'employee') {
      if (currentScreen === 'painel' || currentScreen === 'extrato' || currentScreen === 'perfil') {
        setCurrentScreen('ponto');
      }
      showToast('Modo Colaboradora CLT ativado: Novo, Ganhos e Registro de Ponto liberados.');
    } else {
      showToast('Modo Administradora ativado: Acesso total a todas as telas do sistema.');
    }
  };

  const handleNavigate = (screen: ScreenType) => {
    // 1. Prestador de Serviço: apenas 'novo' e 'ganhos'
    if (currentRole === 'service_provider' && screen !== 'novo' && screen !== 'ganhos') {
      showToast('Acesso Restrito: Prestadores de serviço acessam apenas Novo e Ganhos.');
      return;
    }

    // 2. Colaborador(a): 'novo', 'ganhos' e 'ponto'
    if (
      currentRole === 'employee' &&
      screen !== 'novo' &&
      screen !== 'ganhos' &&
      screen !== 'ponto'
    ) {
      showToast('Acesso Restrito: Painel Geral e Extratos são exclusivos da Administração.');
      return;
    }

    setCurrentScreen(screen);
  };

  // Time Tracking Handlers com Sincronização Supabase
  const handleRegisterEntry = (employeeId: string, employeeName: string, time: string) => {
    const existingIndex = timeRecords.findIndex(
      (r) => r.employeeId === employeeId && r.date === '2026-09-08'
    );

    let recToSave: TimeRecord;
    if (existingIndex >= 0) {
      const updated = [...timeRecords];
      recToSave = {
        ...updated[existingIndex],
        entryTime: time,
        status: 'in_progress'
      };
      updated[existingIndex] = recToSave;
      setTimeRecords(updated);
    } else {
      recToSave = {
        id: `tr-${Date.now()}`,
        employeeId,
        employeeName,
        employeeAvatar: employeeId === 'emp-dorinha' ? IMAGES.DORINHA_AVATAR : undefined,
        date: '2026-09-08',
        dateFormatted: 'Hoje · Terça-feira, 08/09',
        entryTime: time,
        status: 'in_progress'
      };
      setTimeRecords([recToSave, ...timeRecords]);
    }
    saveTimeRecordToDb(recToSave);
  };

  const handleRegisterExit = (recordId: string, time: string) => {
    let recToSave: TimeRecord | undefined;
    setTimeRecords((prev) =>
      prev.map((r) => {
        if (r.id === recordId) {
          recToSave = {
            ...r,
            exitTime: time,
            status: 'completed'
          };
          return recToSave;
        }
        return r;
      })
    );
    if (recToSave) {
      saveTimeRecordToDb(recToSave);
    }
  };

  const handleSubmitJustification = (
    employeeId: string,
    employeeName: string,
    date: string,
    type: 'entry' | 'exit' | 'both',
    reason: string,
    requestedEntry?: string,
    requestedExit?: string
  ) => {
    const nowTimeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const formattedDate = date === '2026-09-08' ? 'Hoje · Terça-feira, 08/09' : `Data: ${date}`;

    const newRec: TimeRecord = {
      id: `tr-just-${Date.now()}`,
      employeeId,
      employeeName,
      employeeAvatar: employeeId === 'emp-dorinha' ? IMAGES.DORINHA_AVATAR : undefined,
      date,
      dateFormatted: formattedDate,
      entryTime: requestedEntry,
      exitTime: requestedExit,
      status: 'pending_justification',
      justification: {
        id: `just-${Date.now()}`,
        reason,
        type,
        requestedEntry,
        requestedExit,
        createdAt: `Hoje às ${nowTimeStr}`,
        status: 'pending'
      }
    };

    setTimeRecords([newRec, ...timeRecords]);
    saveTimeRecordToDb(newRec);
  };

  const handleAdminAdjust = (
    recordId: string | null,
    employeeId: string,
    employeeName: string,
    date: string,
    entryTime: string,
    exitTime: string,
    reason: string
  ) => {
    const nowTimeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    let updatedOrNewRec: TimeRecord;

    if (recordId) {
      setTimeRecords((prev) =>
        prev.map((r) => {
          if (r.id !== recordId) return r;
          updatedOrNewRec = {
            ...r,
            entryTime,
            exitTime,
            status: 'adjusted_by_admin',
            adminAdjustment: {
              adjustedBy: 'Administração Renascer',
              adjustedAt: `Hoje às ${nowTimeStr}`,
              reason,
              originalEntry: r.entryTime,
              originalExit: r.exitTime
            }
          };
          return updatedOrNewRec;
        })
      );
    } else {
      updatedOrNewRec = {
        id: `tr-admin-${Date.now()}`,
        employeeId,
        employeeName,
        employeeAvatar: employeeId === 'emp-dorinha' ? IMAGES.DORINHA_AVATAR : undefined,
        date,
        dateFormatted: date === '2026-09-08' ? 'Hoje · Terça-feira, 08/09' : `Data: ${date}`,
        entryTime,
        exitTime,
        status: 'adjusted_by_admin',
        adminAdjustment: {
          adjustedBy: 'Administração Renascer',
          adjustedAt: `Hoje às ${nowTimeStr}`,
          reason
        }
      };
      setTimeRecords([updatedOrNewRec, ...timeRecords]);
    }

    if (updatedOrNewRec!) {
      saveTimeRecordToDb(updatedOrNewRec);
    }
  };

  const handleAdminEvaluateJustification = (
    recordId: string,
    evaluation: 'approved' | 'rejected',
    adminNotes?: string
  ) => {
    const nowTimeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    let evaluatedRec: TimeRecord | undefined;

    setTimeRecords((prev) =>
      prev.map((r) => {
        if (r.id !== recordId) return r;
        if (evaluation === 'approved') {
          evaluatedRec = {
            ...r,
            entryTime: r.justification?.requestedEntry || r.entryTime || '08:30',
            exitTime: r.justification?.requestedExit || r.exitTime || '18:00',
            status: 'adjusted_by_admin',
            justification: r.justification
              ? {
                  ...r.justification,
                  status: 'approved',
                  adminNotes: adminNotes || 'Aprovado e homologado pela administração.',
                  evaluatedAt: `Hoje às ${nowTimeStr}`
                }
              : undefined,
            adminAdjustment: {
              adjustedBy: 'Administração Renascer',
              adjustedAt: `Hoje às ${nowTimeStr}`,
              reason: `Justificativa aprovada: "${r.justification?.reason || 'Sem descrição'}"`
            }
          };
          return evaluatedRec;
        } else {
          evaluatedRec = {
            ...r,
            status: 'completed',
            justification: r.justification
              ? {
                  ...r.justification,
                  status: 'rejected',
                  adminNotes: adminNotes || 'Recusado pela administração.',
                  evaluatedAt: `Hoje às ${nowTimeStr}`
                }
              : undefined
          };
          return evaluatedRec;
        }
      })
    );

    if (evaluatedRec) {
      saveTimeRecordToDb(evaluatedRec);
    }

    showToast(
      evaluation === 'approved'
        ? 'Justificativa aprovada! Ponto homologado com carimbo oficial no Supabase.'
        : 'Justificativa recusada pela administração.'
    );
  };

  // Pending justifications count for admin badge
  const pendingJustificationsCount = timeRecords.filter(
    (r) => r.status === 'pending_justification' || (r.justification && r.justification.status === 'pending')
  ).length;

  // Access checks
  const isServiceProviderRestricted =
    currentRole === 'service_provider' &&
    currentScreen !== 'novo' &&
    currentScreen !== 'ganhos' &&
    currentScreen !== 'login';

  const isEmployeeRestricted =
    currentRole === 'employee' &&
    (currentScreen === 'painel' || currentScreen === 'extrato' || currentScreen === 'perfil');

  return (
    <div className="min-h-screen bg-[#f9f9f8] text-[#191c1c] font-sans-body relative flex flex-col selection:bg-[#cfe5d7] selection:text-[#273d33]">
      {/* Persistent Header */}
      {currentScreen !== 'login' && (
        <Header
          currentScreen={currentScreen}
          currentRole={currentRole}
          userName={currentUserName}
          onNavigate={handleNavigate}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onSwitchRole={handleSwitchRole}
          onLogout={async () => {
            await signOut();
            setCurrentScreen('login');
            showToast('Sessão encerrada.');
          }}
          unreadCount={pendingJustificationsCount > 0 && currentRole === 'admin' ? pendingJustificationsCount : 2}
        />
      )}

      {/* Main Content View */}
      <main className="flex-1 w-full flex flex-col">
        {currentScreen === 'login' && (
          <LoginScreen
            onLoginSuccess={handleLoginSuccess}
            onNavigateDirect={handleNavigate}
          />
        )}

        {/* Meus Ganhos */}
        {currentScreen === 'ganhos' && (
          <MeusGanhosScreen
            appointments={appointments}
            onNavigate={handleNavigate}
            userName={currentUserName}
          />
        )}

        {/* Novo Atendimento */}
        {currentScreen === 'novo' && (
          <NovoAtendimentoScreen
            onAddAppointment={handleAddAppointment}
            todayRecords={todayRecords}
          />
        )}

        {/* Ponto Eletrônico */}
        {currentScreen === 'ponto' && (
          isServiceProviderRestricted ? (
            <RestrictedAccessView
              userRole={currentRole}
              onSwitchToAdmin={() => handleSwitchRole('admin')}
              onSwitchToEmployee={() => handleSwitchRole('employee')}
              onGoBack={() => setCurrentScreen('ganhos')}
            />
          ) : (
            <PontoScreen
              currentRole={currentRole}
              timeRecords={timeRecords}
              onRegisterEntry={handleRegisterEntry}
              onRegisterExit={handleRegisterExit}
              onSubmitJustification={handleSubmitJustification}
              onAdminAdjust={handleAdminAdjust}
              onAdminEvaluateJustification={handleAdminEvaluateJustification}
            />
          )
        )}

        {/* Painel Geral Executivo (Admin-only) */}
        {currentScreen === 'painel' && (
          isServiceProviderRestricted || isEmployeeRestricted ? (
            <RestrictedAccessView
              userRole={currentRole}
              onSwitchToAdmin={() => handleSwitchRole('admin')}
              onSwitchToEmployee={() => handleSwitchRole('employee')}
              onGoBack={() => setCurrentScreen(currentRole === 'employee' ? 'ponto' : 'ganhos')}
            />
          ) : (
            <PainelGeralScreen
              onOpenNewServiceModal={() => setIsNewServiceOpen(true)}
              onOpenManageStaffModal={() => setIsManageStaffOpen(true)}
              onNavigate={handleNavigate}
              pendingPontoCount={pendingJustificationsCount}
              appointments={appointments}
              staffList={staffList}
            />
          )
        )}

        {/* Extrato PDF (Admin-only) */}
        {currentScreen === 'extrato' && (
          isServiceProviderRestricted || isEmployeeRestricted ? (
            <RestrictedAccessView
              userRole={currentRole}
              onSwitchToAdmin={() => handleSwitchRole('admin')}
              onSwitchToEmployee={() => handleSwitchRole('employee')}
              onGoBack={() => setCurrentScreen(currentRole === 'employee' ? 'ponto' : 'ganhos')}
            />
          ) : (
            <ExtratoPdfScreen />
          )
        )}

        {/* Perfil */}
        {currentScreen === 'perfil' && (
          <PerfilScreen
            currentRole={currentRole}
            onSwitchRole={handleSwitchRole}
            onLogout={async () => {
              await signOut();
              setCurrentScreen('login');
              showToast('Sessão encerrada.');
            }}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      {currentScreen !== 'login' && (
        <BottomNav
          currentScreen={currentScreen}
          currentRole={currentRole}
          onNavigate={handleNavigate}
        />
      )}

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      {/* Administrative Modals */}
      <NewServiceModal
        isOpen={isNewServiceOpen}
        onClose={() => setIsNewServiceOpen(false)}
        onSuccess={(name) => showToast(`Serviço "${name}" cadastrado com sucesso!`)}
      />

      <ManageStaffModal
        isOpen={isManageStaffOpen}
        onClose={() => setIsManageStaffOpen(false)}
      />

      {/* Global Toast Notification */}
      {globalToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#191c1c] text-white px-4 py-2.5 rounded-full text-[12px] font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3 max-w-[90%] text-center">
          <span className="material-symbols-outlined text-[#cee9da] text-[18px] shrink-0">
            info
          </span>
          <span>{globalToast}</span>
        </div>
      )}
    </div>
  );
}

interface RestrictedAccessViewProps {
  userRole: UserRole;
  onSwitchToAdmin: () => void;
  onSwitchToEmployee: () => void;
  onGoBack: () => void;
}

const RestrictedAccessView: React.FC<RestrictedAccessViewProps> = ({
  userRole,
  onSwitchToAdmin,
  onSwitchToEmployee,
  onGoBack
}) => {
  const isPrestador = userRole === 'service_provider';

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center max-w-[420px] mx-auto pt-16">
      <div className="w-16 h-16 rounded-2xl bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center shadow-xs mb-4">
        <span className="material-symbols-outlined text-[32px]">lock</span>
      </div>
      <span className="text-[11px] uppercase font-bold text-[#526259] tracking-wider mb-1">
        Acesso Restrito
      </span>
      <h2 className="font-serif-display text-[22px] font-bold text-[#191c1c] leading-tight">
        {isPrestador
          ? 'Tela Restrita a Colaboradores e Administração'
          : 'Tela Exclusiva para a Administradora'}
      </h2>
      <p className="text-[13px] text-[#424844] mt-2.5 leading-relaxed">
        {isPrestador
          ? 'Como Prestador(a) de Serviço parceiro(a), seu perfil possui acesso focado aos módulos de Novo Atendimento e Meus Ganhos.'
          : 'Como colaboradora, seu perfil está configurado para registrar atendimentos, consultar comissões e marcar o ponto diário.'}
      </p>

      <div className="flex flex-col w-full gap-2.5 mt-6">
        <button
          type="button"
          onClick={onGoBack}
          className="w-full h-12 rounded-xl bg-[#4c6358] text-white text-[13px] font-semibold flex items-center justify-center gap-2 shadow-xs hover:bg-[#354c41] transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Voltar para Meus Ganhos
        </button>

        {isPrestador && (
          <button
            type="button"
            onClick={onSwitchToEmployee}
            className="w-full h-12 rounded-xl bg-[#cfe5d7] text-[#273d33] text-[13px] font-semibold flex items-center justify-center gap-2 border border-[#8fa89b]/50 hover:bg-[#b6ccbe] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-[#4c6358]">fingerprint</span>
            Entrar como Colaborador(a) CLT (com Ponto)
          </button>
        )}

        <button
          type="button"
          onClick={onSwitchToAdmin}
          className="w-full h-12 rounded-xl bg-[#f3f4f3] text-[#191c1c] text-[13px] font-semibold flex items-center justify-center gap-2 border border-[#e1e3e2] hover:bg-[#e7e8e7] transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px] text-[#4c6358]">
            admin_panel_settings
          </span>
          Entrar como Administradora Geral
        </button>
      </div>
    </div>
  );
};
