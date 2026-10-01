import { createClient } from '@supabase/supabase-js';
import { Appointment, TimeRecord, UserRole } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://izprgvxqekcdvfnmudaz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6cHJndnhxZWtjZHZmbm11ZGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4ODUyNTMsImV4cCI6MjEwNDQ2MTI1M30.4mCHN8MUALKeg1k1p5ZTLoxexZ8OPAfggTCA7pQnnUE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  avatar_url?: string;
  pix_key?: string;
  created_at?: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  price: number;
  category: string;
  active: boolean;
  created_at?: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  created_at?: string;
}

// ==============================================================================
// AUTHENTICATION API
// ==============================================================================

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signUp(email: string, password: string, name: string, role: UserRole) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role,
      },
    },
  });
  if (error) throw error;

  // Garantir que a tabela profiles tenha o registro
  if (data.user) {
    await supabase.from('profiles').upsert({
      id: data.user.id,
      name,
      email,
      role,
      active: true,
    });
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) console.error('Erro ao encerrar sessão no Supabase:', error);
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error || !data) {
    // Fallback: usar metadados da sessão se a tabela ainda não tiver o perfil
    return {
      id: session.user.id,
      name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário',
      email: session.user.email || '',
      role: (session.user.user_metadata?.role as UserRole) || 'service_provider',
      active: true,
    };
  }

  return data as UserProfile;
}

// ==============================================================================
// GESTÃO DE EQUIPE / USUÁRIOS (ADMIN)
// ==============================================================================

export async function fetchAllProfiles(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.warn('Não foi possível carregar profiles do Supabase, usando lista local:', error);
    return [];
  }
  return data || [];
}

export async function adminCreateStaffUser(
  name: string,
  email: string,
  password: string,
  role: UserRole
) {
  // 1. Criar no Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role,
      },
    },
  });

  if (error) throw error;

  // 2. Garantir registro na tabela profiles
  if (data.user) {
    await supabase.from('profiles').upsert({
      id: data.user.id,
      name,
      email,
      role,
      active: true,
    });
  }

  return data;
}

export async function updateStaffRole(userId: string, newRole: UserRole) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function toggleStaffActive(userId: string, active: boolean) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ active, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteStaffUser(userId: string) {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (error) throw error;
  return true;
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as UserProfile;
}

// ==============================================================================
// GESTÃO DE SERVIÇOS & CATEGORIAS (ADMIN)
// ==============================================================================

export async function fetchCategories(): Promise<CategoryItem[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.warn('Erro ao carregar categorias do Supabase:', error);
    return [
      { id: '1', name: 'Cabelo' },
      { id: '2', name: 'Coloração' },
      { id: '3', name: 'Unhas' },
      { id: '4', name: 'Tratamento' },
      { id: '5', name: 'Estética' },
    ];
  }
  return data || [];
}

export async function createCategory(name: string) {
  const { data, error } = await supabase
    .from('categories')
    .insert([{ name }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchServices(): Promise<ServiceItem[]> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.warn('Erro ao carregar serviços do Supabase, usando padrão local:', error);
    return [];
  }
  return data || [];
}

export async function createService(service: { name: string; price: number; category: string }) {
  const { data, error } = await supabase
    .from('services')
    .insert([
      {
        name: service.name,
        price: service.price,
        category: service.category,
        active: true,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateService(
  id: string,
  service: { name: string; price: number; category: string; active?: boolean }
) {
  const { data, error } = await supabase
    .from('services')
    .update({
      name: service.name,
      price: service.price,
      category: service.category,
      ...(service.active !== undefined ? { active: service.active } : {}),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteService(id: string) {
  const { error } = await supabase.from('services').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// ==============================================================================
// ATENDIMENTOS & PONTO ELETRÔNICO
// ==============================================================================

export async function fetchAppointmentsFromDb(): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((d: any) => ({
    id: d.id,
    userId: d.user_id,
    professionalName: d.professional_name || 'Profissional',
    clientName: d.client_name,
    clientAvatar: d.client_avatar,
    serviceName: d.service_name,
    price: Number(d.price),
    commissionRate: Number(d.commission_rate),
    commissionAmount: Number(d.commission_amount),
    date: d.date,
    time: d.time,
    notes: d.notes,
    confirmed: Boolean(d.confirmed),
    paymentMethod: d.payment_method,
    createdAt: d.created_at,
  }));
}

export async function saveAppointmentToDb(
  appointment: Appointment,
  userId?: string,
  professionalName?: string
) {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const dateFormatted = appointment.date || `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const timeFormatted = appointment.time || `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const { data, error } = await supabase
    .from('appointments')
    .upsert(
      [
        {
          id: appointment.id,
          user_id: userId || appointment.userId || null,
          professional_name: professionalName || appointment.professionalName || null,
          client_name: appointment.clientName,
          client_avatar: appointment.clientAvatar,
          service_name: appointment.serviceName,
          price: appointment.price,
          commission_rate: appointment.commissionRate,
          commission_amount: appointment.commissionAmount,
          date: dateFormatted,
          time: timeFormatted,
          notes: appointment.notes,
          confirmed: appointment.confirmed,
          payment_method: appointment.paymentMethod || 'PIX',
          created_at: appointment.createdAt || new Date().toISOString(),
        },
      ],
      { onConflict: 'id' }
    )
    .select()
    .single();

  if (error) console.error('Erro ao salvar atendimento no Supabase:', error);
  return data;
}

export async function updateAppointmentInDb(appointment: Appointment) {
  const { data, error } = await supabase
    .from('appointments')
    .update({
      client_name: appointment.clientName,
      service_name: appointment.serviceName,
      price: appointment.price,
      commission_rate: appointment.commissionRate,
      commission_amount: appointment.commissionAmount,
      date: appointment.date,
      time: appointment.time,
      payment_method: appointment.paymentMethod || 'PIX',
      notes: appointment.notes,
    })
    .eq('id', appointment.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAppointmentFromDb(id: string) {
  const { error } = await supabase.from('appointments').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function fetchTimeRecordsFromDb(): Promise<TimeRecord[]> {
  const { data, error } = await supabase
    .from('time_records')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((d: any) => ({
    id: d.id,
    employeeId: d.employee_id,
    employeeName: d.employee_name,
    employeeAvatar: d.employee_avatar,
    date: d.date,
    dateFormatted: d.date_formatted,
    entryTime: d.entry_time,
    exitTime: d.exit_time,
    status: d.status,
    justification: d.justification,
    adminAdjustment: d.admin_adjustment,
  }));
}

export async function saveTimeRecordToDb(record: TimeRecord) {
  const { data, error } = await supabase
    .from('time_records')
    .upsert(
      {
        id: record.id,
        employee_id: record.employeeId,
        employee_name: record.employeeName,
        employee_avatar: record.employeeAvatar,
        date: record.date,
        date_formatted: record.dateFormatted,
        entry_time: record.entryTime,
        exit_time: record.exitTime,
        status: record.status,
        justification: record.justification || null,
        admin_adjustment: record.adminAdjustment || null,
      },
      { onConflict: 'id' }
    )
    .select();

  if (error) console.error('Erro ao sincronizar ponto no Supabase:', error);
  return data;
}
