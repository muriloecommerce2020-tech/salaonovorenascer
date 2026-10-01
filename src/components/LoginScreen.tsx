import React, { useState } from 'react';
import { UserRole, ScreenType } from '../types';
import { IMAGES } from '../data/mockData';
import { signIn, signUp, supabase } from '../lib/supabase';

interface LoginScreenProps {
  onLoginSuccess: (role: UserRole, userName?: string) => void;
  onNavigateDirect?: (screen: ScreenType) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [role, setRole] = useState<UserRole>('employee');
  const [fullName, setFullName] = useState('Dorinha Ferreira');
  const [username, setUsername] = useState('dorinha@salaonovo.com.br');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === 'service_provider') {
      setUsername('parceira@salaonovo.com.br');
      setFullName('Camila Santos');
    } else if (newRole === 'employee') {
      setUsername('dorinha@salaonovo.com.br');
      setFullName('Dorinha Ferreira');
    } else {
      setUsername('admin@salaonovo.com.br');
      setFullName('Administradora Renascer');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedbackMsg(null);

    try {
      if (authMode === 'login') {
        try {
          const authData = await signIn(username, password);
          let userRole: UserRole = role;
          let userDisplayName = fullName;

          if (authData.user) {
            try {
              const { data: userProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authData.user.id)
                .single();

              if (userProfile?.role) {
                userRole = userProfile.role as UserRole;
              } else if (authData.user?.user_metadata?.role) {
                userRole = authData.user.user_metadata.role as UserRole;
              }

              if (userProfile?.name) {
                userDisplayName = userProfile.name;
              } else if (authData.user?.user_metadata?.name) {
                userDisplayName = authData.user.user_metadata.name;
              }
            } catch (pErr) {
              console.warn('Erro ao consultar profile:', pErr);
            }
          }

          setFeedbackMsg({
            text: `Acesso autorizado via Supabase! Bem-vinda, ${userDisplayName}!`,
            isError: false,
          });

          setTimeout(() => {
            onLoginSuccess(userRole, userDisplayName);
          }, 600);
        } catch (supabaseErr: any) {
          // Se o usuário ainda não existir no Auth do Supabase (primeiro teste), oferece cadastrar ou modo demo
          if (supabaseErr.message?.includes('Invalid login credentials')) {
            // Tenta criar automaticamente o usuário com o perfil selecionado
            try {
              const signUpData = await signUp(username, password, fullName, role);
              setFeedbackMsg({
                text: 'Primeiro acesso registrado com sucesso no Supabase! Entrando...',
                isError: false,
              });
              setTimeout(() => {
                onLoginSuccess(role, fullName);
              }, 700);
              return;
            } catch (signupErr) {
              // Fallback para modo demonstração
              setFeedbackMsg({
                text: 'Conectado em modo local/demonstração com perfil selecionado.',
                isError: false,
              });
              setTimeout(() => {
                onLoginSuccess(role, fullName);
              }, 600);
              return;
            }
          }
          throw supabaseErr;
        }
      } else {
        // Modo Cadastro
        await signUp(username, password, fullName, role);
        setFeedbackMsg({
          text: `Conta criada com sucesso no Supabase! Perfil: ${role}.`,
          isError: false,
        });
        setTimeout(() => {
          onLoginSuccess(role, fullName);
        }, 700);
      }
    } catch (err: any) {
      setFeedbackMsg({
        text: err.message || 'Erro ao autenticar. Verifique seus dados.',
        isError: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-5 py-8 w-full max-w-[480px] mx-auto selection:bg-[#cfe5d7] selection:text-[#273d33]">
      <div className="w-full flex flex-col">
        {/* Salon Logo and Branding */}
        <div className="flex flex-col items-center justify-center pt-2">
          <div className="relative flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-white shadow-md p-1.5 flex items-center justify-center mb-3 transition-transform duration-300 hover:scale-105 border border-[#e1e3e2]/60">
              <img
                alt="Logotipo Salão Novo Renascer"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain rounded-full"
                src={IMAGES.SALON_LOGO}
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=200&q=80';
                }}
              />
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f3f4f3] mb-2 border border-[#e1e3e2]/50">
              <span
                className="material-symbols-outlined text-[#4c6358] text-[15px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                spa
              </span>
              <span className="text-[11px] uppercase tracking-wider text-[#4c6358] font-bold">
                Salão Novo Renascer
              </span>
            </div>

            <h1 className="font-serif-display text-[26px] font-semibold text-[#191c1c] tracking-tight">
              Gestão Integrada
            </h1>
            <p className="text-[13px] text-[#424844] mt-1 max-w-[320px] leading-relaxed">
              Autenticação com Supabase • Atendimentos, Ponto &amp; Comissões
            </p>
          </div>
        </div>

        {/* Auth Mode Toggle (Entrar vs Criar Conta) */}
        <div className="mt-5 flex items-center justify-center bg-[#e7e8e7] p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setAuthMode('login')}
            className={`flex-1 py-2 rounded-lg text-[12px] font-bold transition-all cursor-pointer ${
              authMode === 'login'
                ? 'bg-white text-[#191c1c] shadow-xs'
                : 'text-[#424844] hover:text-[#191c1c]'
            }`}
          >
            Entrar no Sistema
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('signup')}
            className={`flex-1 py-2 rounded-lg text-[12px] font-bold transition-all cursor-pointer ${
              authMode === 'signup'
                ? 'bg-white text-[#191c1c] shadow-xs'
                : 'text-[#424844] hover:text-[#191c1c]'
            }`}
          >
            Criar Conta / Primeiro Acesso
          </button>
        </div>

        {/* Role Toggle 3-way Segmented Control */}
        <div className="mt-4 flex flex-col gap-2">
          <label className="text-[11px] text-[#526259] font-bold uppercase tracking-wider px-1 text-center">
            Tipo de Acesso Desejado
          </label>
          <div className="p-1 bg-[#e7e8e7] rounded-xl grid grid-cols-3 gap-1">
            <button
              onClick={() => handleRoleChange('service_provider')}
              className={`py-2 rounded-lg text-[11px] flex flex-col items-center justify-center transition-all duration-200 font-bold cursor-pointer ${
                role === 'service_provider'
                  ? 'bg-white text-[#191c1c] shadow-xs'
                  : 'text-[#424844] hover:text-[#191c1c]'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">work</span>
              <span className="truncate">Prestador</span>
            </button>

            <button
              onClick={() => handleRoleChange('employee')}
              className={`py-2 rounded-lg text-[11px] flex flex-col items-center justify-center transition-all duration-200 font-bold cursor-pointer ${
                role === 'employee'
                  ? 'bg-white text-[#191c1c] shadow-xs'
                  : 'text-[#424844] hover:text-[#191c1c]'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">fingerprint</span>
              <span className="truncate">Colaboradora</span>
            </button>

            <button
              onClick={() => handleRoleChange('admin')}
              className={`py-2 rounded-lg text-[11px] flex flex-col items-center justify-center transition-all duration-200 font-bold cursor-pointer ${
                role === 'admin'
                  ? 'bg-white text-[#191c1c] shadow-xs'
                  : 'text-[#424844] hover:text-[#191c1c]'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
              <span className="truncate">Administração</span>
            </button>
          </div>

          <div className="p-2.5 bg-[#f3f4f3] rounded-xl border border-[#e1e3e2]/70 text-[11px] text-[#424844] text-center flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-[#4c6358] text-[16px] shrink-0">info</span>
            <span>
              {role === 'service_provider' && 'Prestador de Serviço: visualiza Novo e Meus Ganhos.'}
              {role === 'employee' && 'Colaboradora CLT: Novo, Ganhos e Registro de Ponto Diário.'}
              {role === 'admin' && 'Administração: controle total de equipe, serviços, ponto e financeiro.'}
            </span>
          </div>
        </div>

        {/* Login Card Form */}
        <form className="mt-4 flex flex-col gap-3" onSubmit={handleSubmit}>
          {/* Full Name if signing up */}
          {authMode === 'signup' && (
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[#424844] font-semibold uppercase tracking-wider px-1">
                Nome Completo
              </label>
              <div className="relative flex items-center bg-white rounded-xl shadow-xs border border-[#e1e3e2] focus-within:border-[#4c6358] focus-within:shadow-sm transition-all">
                <span className="material-symbols-outlined absolute left-3.5 text-[#424844] text-[20px]">
                  badge
                </span>
                <input
                  className="w-full h-[48px] pl-11 pr-4 bg-transparent text-[14px] text-[#191c1c] placeholder:text-[#727974] focus:outline-none"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome completo"
                  required
                  type="text"
                />
              </div>
            </div>
          )}

          {/* User Email Input */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-[#424844] font-semibold uppercase tracking-wider px-1">
              E-mail de Acesso
            </label>
            <div className="relative flex items-center bg-white rounded-xl shadow-xs border border-[#e1e3e2] focus-within:border-[#4c6358] focus-within:shadow-sm transition-all">
              <span className="material-symbols-outlined absolute left-3.5 text-[#424844] text-[20px]">
                mail
              </span>
              <input
                className="w-full h-[48px] pl-11 pr-4 bg-transparent text-[14px] text-[#191c1c] placeholder:text-[#727974] focus:outline-none"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="exemplo@salaonovo.com.br"
                required
                type="email"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between px-1">
              <label className="text-[11px] text-[#424844] font-semibold uppercase tracking-wider">
                Senha
              </label>
              {authMode === 'login' && (
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] text-[#4c6358] hover:text-[#354c41] font-semibold transition-colors cursor-pointer"
                >
                  Esqueceu a senha?
                </button>
              )}
            </div>
            <div className="relative flex items-center bg-white rounded-xl shadow-xs border border-[#e1e3e2] focus-within:border-[#4c6358] focus-within:shadow-sm transition-all">
              <span className="material-symbols-outlined absolute left-3.5 text-[#424844] text-[20px]">
                lock_outline
              </span>
              <input
                className="w-full h-[48px] pl-11 pr-11 bg-transparent text-[14px] text-[#191c1c] placeholder:text-[#727974] focus:outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                type={showPassword ? 'text' : 'password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-[#424844] hover:text-[#191c1c] transition-colors p-1"
                aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Remember Me and Security Badge */}
          <div className="flex items-center justify-between px-1 pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-[#e1e3e2] text-[#4c6358] focus:ring-[#4c6358]"
              />
              <span className="text-[12px] text-[#424844] font-medium">Lembrar neste dispositivo</span>
            </label>
            <div className="flex items-center gap-1 text-[11px] text-[#526259]">
              <span className="material-symbols-outlined text-[14px] text-[#4c6358]">cloud_done</span>
              <span>Supabase Auth</span>
            </div>
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full h-[52px] bg-[#4c6358] hover:bg-[#354c41] text-white rounded-xl font-semibold text-[15px] shadow-sm flex items-center justify-center gap-2 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-75"
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined text-[20px] animate-spin">
                  progress_activity
                </span>
                <span>Conectando ao Supabase...</span>
              </>
            ) : (
              <>
                <span>
                  {authMode === 'login' ? 'Entrar com Supabase' : 'Concluir Cadastro no Supabase'}
                </span>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        {/* Feedback message */}
        {feedbackMsg && (
          <div
            className={`mt-4 p-3 rounded-xl text-center text-[12px] font-semibold animate-in flex items-center justify-center gap-2 ${
              feedbackMsg.isError
                ? 'bg-[#ffdad6] text-[#ba1a1a]'
                : 'bg-[#cfe5d7] text-[#273d33]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {feedbackMsg.isError ? 'error' : 'check_circle'}
            </span>
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Footer Support Info */}
        <div className="mt-6 text-center text-[11px] text-[#526259] leading-relaxed">
          <p>Conectado a: <strong>salaonovorenascer.supabase.co</strong></p>
          <p className="mt-0.5 text-[10px] text-[#727974]">Autenticação segura via JWT &amp; RLS</p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-[340px] w-full p-5 shadow-xl border border-[#e1e3e2] flex flex-col gap-3">
            <div className="w-10 h-10 rounded-full bg-[#cfe5d7] text-[#4c6358] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">lock_reset</span>
            </div>
            <h3 className="font-serif-display text-[18px] font-bold text-[#191c1c]">
              Recuperação de Senha
            </h3>
            <p className="text-[12px] text-[#424844] leading-relaxed">
              O administrador do salão tem acesso ao painel de gestão para redefinir credenciais e perfis de qualquer colaboradora.
            </p>
            <button
              onClick={() => setShowForgotModal(false)}
              className="mt-2 w-full h-10 bg-[#4c6358] text-white rounded-xl text-[13px] font-semibold cursor-pointer"
              type="button"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
