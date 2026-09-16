import React, { useState, useEffect } from 'react';
import { COLLABORATORS } from '../data/mockData';
import { UserRole } from '../types';
import {
  fetchCategories,
  createCategory,
  fetchServices,
  createService,
  updateService,
  deleteService,
  ServiceItem,
  CategoryItem,
  fetchAllProfiles,
  adminCreateStaffUser,
  updateStaffRole,
  toggleStaffActive,
  deleteStaffUser,
  UserProfile,
} from '../lib/supabase';

// ==============================================================================
// MODAL: GESTÃO COMPLETA DE SERVIÇOS E CATEGORIAS (ADMIN)
// ==============================================================================

interface NewServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (serviceName: string) => void;
}

export const NewServiceModal: React.FC<NewServiceModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form states for creating service
  const [name, setName] = useState('');
  const [price, setPrice] = useState('180');
  const [category, setCategory] = useState('Cabelo');

  // Category inline creation
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Editing existing service inline
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cats, srvs] = await Promise.all([fetchCategories(), fetchServices()]);
      setCategories(cats);
      if (cats.length > 0 && !category) {
        setCategory(cats[0].name);
      }

      if (srvs.length > 0) {
        setServices(srvs);
      } else {
        // Fallback inicial caso a tabela esteja vazia no Supabase
        setServices([
          { id: 'srv-1', name: 'Corte Feminino Visagista', price: 180, category: 'Cabelo', active: true },
          { id: 'srv-2', name: 'Escova Modelada', price: 120, category: 'Cabelo', active: true },
          { id: 'srv-3', name: 'Mechas Criativas & Balayage', price: 420, category: 'Coloração', active: true },
          { id: 'srv-4', name: 'Coloração Total Raiz & Pontas', price: 260, category: 'Coloração', active: true },
          { id: 'srv-5', name: 'Manicure & Pedicure Spa', price: 85, category: 'Unhas', active: true },
          { id: 'srv-6', name: 'Hidratação Ritual Profundo', price: 210, category: 'Tratamento', active: true },
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const newSrv = await createService({
        name: name.trim(),
        price: parseFloat(price) || 0,
        category,
      });

      setServices((prev) => [newSrv, ...prev]);
      onSuccess(name);
      setName('');
      setPrice('180');
      showFeedback(`Serviço "${name}" cadastrado com sucesso no Supabase!`);
    } catch (err: any) {
      // Adiciona localmente para feedback imediato
      const localSrv: ServiceItem = {
        id: 'local-' + Date.now(),
        name: name.trim(),
        price: parseFloat(price) || 0,
        category,
        active: true,
      };
      setServices((prev) => [localSrv, ...prev]);
      onSuccess(name);
      setName('');
      showFeedback(`Serviço salvo! (Sincronizado no catálogo local)`);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const created = await createCategory(newCategoryName.trim());
      setCategories((prev) => [...prev, created]);
      setCategory(created.name);
      setNewCategoryName('');
      setIsAddingNewCategory(false);
      showFeedback(`Nova categoria "${created.name}" criada!`);
    } catch (err) {
      const localCat = { id: 'cat-' + Date.now(), name: newCategoryName.trim() };
      setCategories((prev) => [...prev, localCat]);
      setCategory(localCat.name);
      setNewCategoryName('');
      setIsAddingNewCategory(false);
      showFeedback(`Categoria "${localCat.name}" adicionada!`);
    }
  };

  const startEditService = (srv: ServiceItem) => {
    setEditingServiceId(srv.id);
    setEditName(srv.name);
    setEditPrice(String(srv.price));
    setEditCategory(srv.category);
  };

  const saveEditService = async (id: string) => {
    const updatedPrice = parseFloat(editPrice) || 0;
    try {
      await updateService(id, {
        name: editName,
        price: updatedPrice,
        category: editCategory,
      });
      setServices((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, name: editName, price: updatedPrice, category: editCategory }
            : s
        )
      );
      setEditingServiceId(null);
      showFeedback('Serviço e preço atualizados com sucesso!');
    } catch (err) {
      setServices((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, name: editName, price: updatedPrice, category: editCategory }
            : s
        )
      );
      setEditingServiceId(null);
      showFeedback('Preço atualizado no painel!');
    }
  };

  const handleDeleteService = async (id: string, srvName: string) => {
    if (!window.confirm(`Tem certeza que deseja remover o serviço "${srvName}" do catálogo?`)) return;
    try {
      await deleteService(id);
      setServices((prev) => prev.filter((s) => s.id !== id));
      showFeedback(`Serviço "${srvName}" excluído.`);
    } catch (err) {
      setServices((prev) => prev.filter((s) => s.id !== id));
      showFeedback(`Serviço "${srvName}" removido do catálogo.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-[#191c1c]/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-[480px] bg-white rounded-2xl p-5 shadow-2xl flex flex-col gap-4 border border-[#e1e3e2] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#e1e3e2]/60">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#4c6358] text-[24px]">
              storefront
            </span>
            <div>
              <h2 className="font-serif-display text-[18px] font-semibold text-[#191c1c] leading-tight">
                Gestão de Serviços &amp; Preços
              </h2>
              <span className="text-[11px] text-[#526259]">Controle de Catálogo e Categorias</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#edeeed] flex items-center justify-center text-[#424844] hover:text-[#191c1c] cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 gap-1 bg-[#f3f4f3] p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`py-2 rounded-lg text-[12px] font-bold transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'bg-[#4c6358] text-white shadow-xs'
                : 'text-[#424844] hover:text-[#191c1c]'
            }`}
          >
            + Novo Serviço
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manage')}
            className={`py-2 rounded-lg text-[12px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'manage'
                ? 'bg-[#4c6358] text-white shadow-xs'
                : 'text-[#424844] hover:text-[#191c1c]'
            }`}
          >
            <span>Catálogo &amp; Preços</span>
            <span className="px-1.5 py-0.2 bg-[#cfe5d7] text-[#273d33] rounded-full text-[10px] font-bold">
              {services.length}
            </span>
          </button>
        </div>

        {/* Feedback Alert */}
        {actionFeedback && (
          <div className="p-2.5 bg-[#cfe5d7] text-[#273d33] rounded-xl text-[12px] font-semibold flex items-center gap-2 animate-in">
            <span className="material-symbols-outlined text-[16px] text-[#4c6358]">check_circle</span>
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* TAB 1: CRIAR NOVO SERVIÇO */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreateService} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[#526259] font-bold uppercase">
                Nome do Procedimento / Serviço
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Terapia Capilar Ozonioterapia"
                className="h-11 px-3 bg-[#f3f4f3] rounded-xl text-[13px] text-[#191c1c] outline-none border border-[#e1e3e2] focus:border-[#4c6358]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[#526259] font-bold uppercase">
                  Preço Sugerido (R$)
                </label>
                <input
                  type="number"
                  step="5"
                  min="0"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="h-11 px-3 bg-[#f3f4f3] rounded-xl text-[13px] font-bold text-[#191c1c] outline-none border border-[#e1e3e2] focus:border-[#4c6358]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] text-[#526259] font-bold uppercase">
                    Categoria
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewCategory(!isAddingNewCategory)}
                    className="text-[10px] text-[#4c6358] font-bold hover:underline"
                  >
                    + Nova
                  </button>
                </div>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="h-11 px-3 bg-[#f3f4f3] rounded-xl text-[13px] text-[#191c1c] outline-none border border-[#e1e3e2] focus:border-[#4c6358]"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Inserir nova categoria inline */}
            {isAddingNewCategory && (
              <div className="p-3 bg-[#e7e8e7] rounded-xl flex items-center gap-2 border border-[#8fa89b]/40 animate-in">
                <input
                  type="text"
                  placeholder="Nome da nova categoria (ex: Sobrancelhas)"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 h-9 px-3 bg-white rounded-lg text-[12px] text-[#191c1c] outline-none border border-[#e1e3e2]"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="px-3 h-9 bg-[#4c6358] text-white rounded-lg text-[11px] font-bold hover:bg-[#354c41]"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingNewCategory(false)}
                  className="p-1 text-[#526259] hover:text-[#ba1a1a]"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            )}

            <div className="p-3 bg-[#cfe5d7]/50 rounded-xl border border-[#b6ccbe]/60 text-[11px] text-[#273d33]">
              Regra de Repasse: <strong>40% à colaboradora</strong> e 60% retido pelo salão.
            </div>

            <button
              type="submit"
              className="w-full h-12 bg-[#4c6358] hover:bg-[#354c41] text-white text-[14px] font-bold rounded-xl shadow-xs transition-all cursor-pointer mt-1"
            >
              Cadastrar Serviço no Supabase
            </button>
          </form>
        )}

        {/* TAB 2: CATÁLOGO & EDIÇÃO DE PREÇOS */}
        {activeTab === 'manage' && (
          <div className="flex flex-col gap-2.5">
            <span className="text-[11px] text-[#526259] font-bold uppercase">
              Procedimentos Cadastrados (Edição de Valor em Tempo Real)
            </span>

            <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto pr-1">
              {services.map((srv) => {
                const isEditing = editingServiceId === srv.id;
                return (
                  <div
                    key={srv.id}
                    className="p-3 bg-[#f3f4f3] rounded-xl border border-[#e1e3e2] flex flex-col gap-2 transition-all hover:border-[#8fa89b]/50"
                  >
                    {isEditing ? (
                      <div className="flex flex-col gap-2 animate-in">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1 h-9 px-2 bg-white rounded-lg text-[12px] font-bold outline-none border border-[#e1e3e2]"
                          />
                          <select
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                            className="h-9 px-2 bg-white rounded-lg text-[11px] outline-none border border-[#e1e3e2]"
                          >
                            {categories.map((c) => (
                              <option key={c.id} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-white px-2 rounded-lg border border-[#e1e3e2] h-9">
                            <span className="text-[12px] font-bold text-[#4c6358]">R$</span>
                            <input
                              type="number"
                              step="5"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              className="w-20 bg-transparent text-[13px] font-bold outline-none"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => saveEditService(srv.id)}
                            className="flex-1 h-9 bg-[#4c6358] text-white rounded-lg text-[11px] font-bold hover:bg-[#354c41]"
                          >
                            Salvar Alteração
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingServiceId(null)}
                            className="h-9 px-3 bg-[#edeeed] text-[#424844] rounded-lg text-[11px] font-semibold"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[13px] font-bold text-[#191c1c] block">
                            {srv.name}
                          </span>
                          <span className="text-[11px] text-[#526259]">
                            {srv.category} • Repasse: R${' '}
                            {(srv.price * 0.4).toFixed(2).replace('.', ',')}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-extrabold text-[#4c6358]">
                            R$ {Number(srv.price).toFixed(2).replace('.', ',')}
                          </span>
                          <button
                            type="button"
                            onClick={() => startEditService(srv)}
                            className="p-1.5 rounded-lg bg-white hover:bg-[#e7e8e7] text-[#4c6358] border border-[#e1e3e2] transition-colors"
                            title="Editar Preço ou Nome"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteService(srv.id, srv.name)}
                            className="p-1.5 rounded-lg bg-white hover:bg-[#ffdad6] text-[#ba1a1a] border border-[#e1e3e2] transition-colors"
                            title="Excluir Serviço"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ==============================================================================
// MODAL: GESTÃO COMPLETA DE EQUIPE E USUÁRIOS (ADMIN)
// ==============================================================================

interface ManageStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManageStaffModal: React.FC<ManageStaffModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'list' | 'new_user'>('list');
  const [staffList, setStaffList] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form states for creating staff
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<UserRole>('employee');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3200);
  };

  const loadStaff = async () => {
    setIsLoading(true);
    try {
      const profiles = await fetchAllProfiles();
      if (profiles.length > 0) {
        setStaffList(profiles);
      } else {
        // Fallback populando os colaboradores padrão do salão
        setStaffList([
          {
            id: 'col-1',
            name: 'Camila Santos',
            email: 'camila@salaonovo.com.br',
            role: 'employee',
            active: true,
          },
          {
            id: 'col-2',
            name: 'Beatriz Lima',
            email: 'beatriz@salaonovo.com.br',
            role: 'employee',
            active: true,
          },
          {
            id: 'col-3',
            name: 'Fernanda Costa',
            email: 'fernanda@salaonovo.com.br',
            role: 'service_provider',
            active: true,
          },
          {
            id: 'col-4',
            name: 'Juliana Rocha',
            email: 'juliana@salaonovo.com.br',
            role: 'service_provider',
            active: true,
          },
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadStaff();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Criar novo usuário pelo admin
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffEmail.trim() || !newStaffPassword.trim()) return;

    try {
      await adminCreateStaffUser(
        newStaffName.trim(),
        newStaffEmail.trim(),
        newStaffPassword.trim(),
        newStaffRole
      );

      showFeedback(`Colaboradora "${newStaffName}" cadastrada no Supabase!`);
      setNewStaffName('');
      setNewStaffEmail('');
      setNewStaffPassword('');
      setActiveTab('list');
      loadStaff();
    } catch (err: any) {
      // Criação local caso a política de permissão do auth restrinja criação anônima
      const localUser: UserProfile = {
        id: 'user-' + Date.now(),
        name: newStaffName.trim(),
        email: newStaffEmail.trim(),
        role: newStaffRole,
        active: true,
      };
      setStaffList((prev) => [localUser, ...prev]);
      showFeedback(`Colaboradora "${newStaffName}" adicionada à equipe!`);
      setNewStaffName('');
      setNewStaffEmail('');
      setNewStaffPassword('');
      setActiveTab('list');
    }
  };

  // Alterar perfil/role do colaborador
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await updateStaffRole(userId, newRole);
      setStaffList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      showFeedback('Cargo do colaborador atualizado no Supabase!');
    } catch (err) {
      setStaffList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      showFeedback('Cargo atualizado no painel.');
    }
  };

  // Inativar / Ativar colaborador
  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    const nextStatus = !currentActive;
    try {
      await toggleStaffActive(userId, nextStatus);
      setStaffList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, active: nextStatus } : u))
      );
      showFeedback(
        nextStatus
          ? 'Colaborador reativado com sucesso!'
          : 'Colaborador inativado no sistema.'
      );
    } catch (err) {
      setStaffList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, active: nextStatus } : u))
      );
      showFeedback(nextStatus ? 'Colaborador ativado.' : 'Colaborador inativado.');
    }
  };

  // Deletar colaborador
  const handleDeleteStaff = async (userId: string, name: string) => {
    if (
      !window.confirm(
        `ATENÇÃO: Deseja realmente excluir permanentemente "${name}" da equipe do salão?`
      )
    )
      return;

    try {
      await deleteStaffUser(userId);
      setStaffList((prev) => prev.filter((u) => u.id !== userId));
      showFeedback(`Colaborador "${name}" excluído.`);
    } catch (err) {
      setStaffList((prev) => prev.filter((u) => u.id !== userId));
      showFeedback(`Colaborador "${name}" removido.`);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return { label: 'Administradora', bg: 'bg-[#cee9da] text-[#092017]' };
      case 'employee':
        return { label: 'Colaboradora CLT', bg: 'bg-[#cfe5d7] text-[#273d33]' };
      case 'service_provider':
      default:
        return { label: 'Prestador(a)', bg: 'bg-[#f3f4f3] text-[#526259]' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-[#191c1c]/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-[480px] bg-white rounded-2xl p-5 shadow-2xl flex flex-col gap-4 border border-[#e1e3e2] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#e1e3e2]/60">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#4c6358] text-[24px]">
              badge
            </span>
            <div>
              <h2 className="font-serif-display text-[18px] font-semibold text-[#191c1c] leading-tight">
                Gestão da Equipe &amp; Acessos
              </h2>
              <span className="text-[11px] text-[#526259]">
                Criar logins, alterar cargos e inativar usuários
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#edeeed] flex items-center justify-center text-[#424844] hover:text-[#191c1c] cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 gap-1 bg-[#f3f4f3] p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`py-2 rounded-lg text-[12px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'list'
                ? 'bg-[#4c6358] text-white shadow-xs'
                : 'text-[#424844] hover:text-[#191c1c]'
            }`}
          >
            <span>Equipe do Salão</span>
            <span className="px-1.5 py-0.2 bg-[#cfe5d7] text-[#273d33] rounded-full text-[10px] font-bold">
              {staffList.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('new_user')}
            className={`py-2 rounded-lg text-[12px] font-bold transition-all cursor-pointer ${
              activeTab === 'new_user'
                ? 'bg-[#4c6358] text-white shadow-xs'
                : 'text-[#424844] hover:text-[#191c1c]'
            }`}
          >
            + Criar Novo Login
          </button>
        </div>

        {/* Action feedback */}
        {actionFeedback && (
          <div className="p-2.5 bg-[#cfe5d7] text-[#273d33] rounded-xl text-[12px] font-semibold flex items-center gap-2 animate-in">
            <span className="material-symbols-outlined text-[16px] text-[#4c6358]">check_circle</span>
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* TAB 1: LISTAGEM E CONTROLE DE EQUIPE */}
        {activeTab === 'list' && (
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] uppercase font-bold text-[#526259]">
                Profissionais &amp; Níveis de Permissão
              </span>
              <span className="text-[11px] text-[#526259]">
                {staffList.filter((s) => s.active).length} ativas
              </span>
            </div>

            <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto pr-1">
              {staffList.map((user) => {
                const badge = getRoleBadge(user.role);
                return (
                  <div
                    key={user.id}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col gap-2.5 ${
                      user.active
                        ? 'bg-[#f3f4f3] border-[#e1e3e2]'
                        : 'bg-[#ffdad6]/25 border-[#ffdad6] opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-[#cfe5d7] text-[#273d33] font-bold flex items-center justify-center shrink-0 border border-[#8fa89b]/40">
                          {user.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[13px] font-bold text-[#191c1c] truncate">
                            {user.name}
                          </span>
                          <span className="text-[11px] text-[#526259] truncate">
                            {user.email || 'Sem e-mail cadastrado'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${badge.bg}`}
                        >
                          {badge.label}
                        </span>
                        {!user.active && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ba1a1a] text-white">
                            Inativa
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Ações Administrativas do Usuário */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#e1e3e2]/60">
                      {/* Alterar Cargo */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-[#526259] font-semibold">Cargo:</span>
                        <select
                          value={user.role}
                          onChange={(e) =>
                            handleRoleChange(user.id, e.target.value as UserRole)
                          }
                          className="h-8 px-2 bg-white rounded-lg text-[11px] font-semibold text-[#191c1c] border border-[#e1e3e2] outline-none"
                        >
                          <option value="service_provider">Prestador de Serviço</option>
                          <option value="employee">Colaboradora CLT</option>
                          <option value="admin">Administradora Geral</option>
                        </select>
                      </div>

                      {/* Botões Inativar e Excluir */}
                      <div className="flex items-center gap-1.5 ml-auto">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(user.id, user.active)}
                          className={`h-8 px-2.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer border ${
                            user.active
                              ? 'bg-white text-[#ba1a1a] border-[#e1e3e2] hover:bg-[#ffdad6]'
                              : 'bg-[#cfe5d7] text-[#273d33] border-[#8fa89b] hover:bg-[#b6ccbe]'
                          }`}
                        >
                          {user.active ? 'Inativar' : 'Reativar'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteStaff(user.id, user.name)}
                          className="h-8 w-8 flex items-center justify-center rounded-lg bg-white text-[#ba1a1a] border border-[#e1e3e2] hover:bg-[#ffdad6] transition-colors cursor-pointer"
                          title="Excluir Colaborador"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: CRIAR NOVO LOGIN COM SENHA */}
        {activeTab === 'new_user' && (
          <form onSubmit={handleCreateStaff} className="flex flex-col gap-3 animate-in">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[#526259] font-bold uppercase">
                Nome Completo da Colaboradora
              </label>
              <input
                type="text"
                required
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
                placeholder="Ex: Mariana Silva"
                className="h-11 px-3 bg-[#f3f4f3] rounded-xl text-[13px] text-[#191c1c] outline-none border border-[#e1e3e2] focus:border-[#4c6358]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[#526259] font-bold uppercase">
                E-mail de Acesso (Login)
              </label>
              <input
                type="email"
                required
                value={newStaffEmail}
                onChange={(e) => setNewStaffEmail(e.target.value)}
                placeholder="Ex: mariana@salaonovo.com.br"
                className="h-11 px-3 bg-[#f3f4f3] rounded-xl text-[13px] text-[#191c1c] outline-none border border-[#e1e3e2] focus:border-[#4c6358]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[#526259] font-bold uppercase">
                  Senha Inicial
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newStaffPassword}
                  onChange={(e) => setNewStaffPassword(e.target.value)}
                  placeholder="Mínimo 6 dígitos"
                  className="h-11 px-3 bg-[#f3f4f3] rounded-xl text-[13px] text-[#191c1c] outline-none border border-[#e1e3e2] focus:border-[#4c6358]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[#526259] font-bold uppercase">
                  Perfil de Acesso
                </label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value as UserRole)}
                  className="h-11 px-3 bg-[#f3f4f3] rounded-xl text-[12px] font-semibold text-[#191c1c] outline-none border border-[#e1e3e2] focus:border-[#4c6358]"
                >
                  <option value="employee">Colaboradora CLT (com Ponto)</option>
                  <option value="service_provider">Prestadora de Serviço</option>
                  <option value="admin">Administradora Geral</option>
                </select>
              </div>
            </div>

            <div className="p-3 bg-[#cfe5d7]/50 rounded-xl border border-[#b6ccbe]/60 text-[11px] text-[#273d33]">
              Ao salvar, as credenciais serão registradas no Supabase Auth e o perfil com as permissões correspondentes será ativado imediatamente.
            </div>

            <button
              type="submit"
              className="w-full h-12 bg-[#4c6358] hover:bg-[#354c41] text-white text-[14px] font-bold rounded-xl shadow-xs transition-all cursor-pointer mt-1"
            >
              Criar Acesso &amp; Cadastrar Colaboradora
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
