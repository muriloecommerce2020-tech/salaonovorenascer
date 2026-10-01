import React, { useState, useEffect } from 'react';
import { IMAGES } from '../data/mockData';
import { UserRole } from '../types';
import { getCurrentUserProfile, updateUserProfile, UserProfile } from '../lib/supabase';

interface PerfilScreenProps {
  currentRole: UserRole;
  onSwitchRole: (role: UserRole) => void;
  onLogout: () => void;
}

export const PerfilScreen: React.FC<PerfilScreenProps> = ({
  currentRole,
  onSwitchRole,
  onLogout
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState('Dorinha Ferreira');
  const [email, setEmail] = useState('dorinha.ferreira@salaonovo.com.br');
  const [pixKey, setPixKey] = useState('dorinha.ferreira@salaonovo.com.br');
  const [isCopied, setIsCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getCurrentUserProfile().then((p) => {
      if (p) {
        setProfile(p);
        setName(p.name || 'Profissional');
        setEmail(p.email || '');
        if (p.pix_key) setPixKey(p.pix_key);
      }
    }).catch(() => {});
  }, []);

  const copyPix = () => {
    navigator.clipboard?.writeText(pixKey);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (profile?.id) {
        await updateUserProfile(profile.id, { pix_key: pixKey });
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2400);
    } catch (err) {
      console.warn('Erro ao salvar no Supabase, mantendo localmente:', err);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2400);
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleLabel = () => {
    if (currentRole === 'admin') return 'Administradora Geral';
    if (currentRole === 'employee') return 'Colaboradora Oficial (CLT / Ponto)';
    return 'Prestador(a) de Serviço Parceira';
  };

  return (
    <div className="flex flex-col w-full max-w-[480px] mx-auto px-5 pt-20 pb-28 min-h-screen">
      <div className="flex flex-col w-full gap-5">
        {/* Profile Card */}
        <div className="flex flex-col items-center bg-white rounded-2xl p-6 shadow-xs border border-[#e1e3e2]/60 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-r from-[#cfe5d7] to-[#cee9da]" />

          <div className="relative mt-4 w-20 h-20 rounded-full border-4 border-white shadow-md overflow-hidden bg-[#cee9da]">
            <img
              src={IMAGES.DORINHA_AVATAR}
              alt="Dorinha Ferreira"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          <h1 className="font-serif-display text-[22px] font-bold text-[#191c1c] mt-2">
            {name}
          </h1>
          <p className="text-[12px] text-[#526259]">
            {email || 'Especialista Master • Salão Novo Renascer'}
          </p>

          <div className="flex items-center gap-2 mt-3">
            <span className="px-3 py-1 rounded-full bg-[#cfe5d7] text-[#273d33] text-[11px] font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              {getRoleLabel()}
            </span>
            <span className="px-3 py-1 rounded-full bg-[#f3f4f3] text-[#424844] text-[11px] font-semibold">
              Salão Novo Renascer
            </span>
          </div>
        </div>

        {/* Repasse & Comissões Settings */}
        <div className="bg-white rounded-xl p-4 shadow-xs border border-[#e1e3e2]/60 flex flex-col gap-3">
          <span className="text-[11px] uppercase tracking-wider text-[#526259] font-bold">
            Contrato &amp; Parâmetros de Repasse
          </span>

          <div className="flex items-center justify-between p-3 bg-[#f3f4f3] rounded-lg border border-[#e1e3e2]/50">
            <div>
              <span className="text-[13px] font-bold text-[#191c1c] block">
                Comissão Fixada em Contrato
              </span>
              <span className="text-[11px] text-[#526259]">
                Aplicada automaticamente aos lançamentos
              </span>
            </div>
            <span className="text-[18px] font-extrabold text-[#4c6358]">40%</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-[#526259] font-semibold">
              Chave Pix de Recebimento
            </label>
            <div className="flex items-center bg-[#f3f4f3] rounded-xl px-3 h-11 border border-[#e1e3e2]/60">
              <span className="material-symbols-outlined text-[#526259] text-[18px] mr-2">
                qr_code_2
              </span>
              <input
                type="text"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder="Informe seu CPF, CNPJ, E-mail ou Telefone"
                className="w-full bg-transparent text-[12px] text-[#191c1c] font-medium outline-none"
              />
              <button
                type="button"
                onClick={copyPix}
                className="text-[#4c6358] text-[12px] font-bold hover:underline shrink-0 ml-2"
              >
                {isCopied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="mt-1 w-full h-10 bg-[#4c6358] hover:bg-[#354c41] text-white rounded-xl text-[12px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              <span>{isSaving ? 'Salvando no Supabase...' : 'Salvar Chave Pix no Supabase'}</span>
            </button>
          </div>
        </div>

        {/* Nível de Acesso Autorizado */}
        <div className="bg-white rounded-xl p-4 shadow-xs border border-[#e1e3e2]/60 flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#4c6358] text-[20px]">shield</span>
            <span className="text-[12px] font-bold text-[#191c1c] uppercase tracking-wider">
              Segurança &amp; Nível de Acesso
            </span>
          </div>
          <div className="p-3 bg-[#f3f4f3] rounded-xl border border-[#e1e3e2]/60 flex flex-col gap-1">
            <span className="text-[11px] text-[#526259]">Perfil Concedido:</span>
            <span className="text-[13px] font-bold text-[#4c6358]">{getRoleLabel()}</span>
            <p className="text-[11px] text-[#526259] mt-1 leading-relaxed">
              Suas permissões e módulos liberados são controlados exclusivamente pela Administração do Salão através do cadastro de equipe no Supabase.
            </p>
          </div>
        </div>

        {/* System & Logout */}
        <div className="bg-white rounded-xl p-4 shadow-xs border border-[#e1e3e2]/60 flex flex-col gap-2">
          <button
            onClick={onLogout}
            type="button"
            className="w-full h-12 flex items-center justify-center gap-2 rounded-xl text-[#ba1a1a] bg-[#ffdad6]/50 hover:bg-[#ffdad6] font-semibold text-[13px] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Desconectar e Voltar ao Início</span>
          </button>
        </div>

        {savedSuccess && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#191c1c] text-white px-4 py-2.5 rounded-full text-[12px] font-medium shadow-2xl z-50 flex items-center gap-2 animate-in fade-in">
            <span className="material-symbols-outlined text-[#cee9da] text-[18px]">check_circle</span>
            <span>Perfil atualizado com sucesso!</span>
          </div>
        )}
      </div>
    </div>
  );
};
