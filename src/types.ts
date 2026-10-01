export type ScreenType = 'login' | 'ganhos' | 'novo' | 'ponto' | 'painel' | 'extrato' | 'perfil';

export type UserRole = 'admin' | 'service_provider' | 'employee';

export interface Appointment {
  id: string;
  userId?: string;
  professionalName?: string;
  clientName: string;
  clientAvatar?: string;
  serviceName: string;
  price: number;
  commissionRate: number; // e.g. 0.40
  commissionAmount: number;
  date: string; // e.g. "Hoje · 14:30" or "2026-09-28"
  time: string;
  notes?: string;
  confirmed: boolean;
  paymentMethod?: 'PIX' | 'Crédito' | 'Débito' | 'Dinheiro';
  createdAt?: string;
}

export interface TodayRecord {
  id: string;
  clientName: string;
  serviceName: string;
  time: string;
  price: number;
  commission: number;
  icon?: string;
}

export interface Collaborator {
  id: string;
  name: string;
  role: string;
  avatar: string;
  servicesCount: number;
  grossRevenue: number;
  commission: number;
  salonShare: number;
}

export interface BankTransaction {
  id: string;
  title: string;
  subtitle: string;
  amount: number;
  type: 'credit' | 'debit';
  category: 'pix' | 'card' | 'supply' | 'commission';
}

export interface TimeRecordJustification {
  id: string;
  reason: string;
  type: 'entry' | 'exit' | 'both';
  requestedEntry?: string;
  requestedExit?: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  evaluatedAt?: string;
}

export interface TimeRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string;
  date: string; // e.g. "2026-09-08"
  dateFormatted: string; // e.g. "Hoje · Terça, 08/09"
  entryTime?: string; // e.g. "08:30"
  exitTime?: string; // e.g. "17:45"
  status: 'completed' | 'in_progress' | 'pending_justification' | 'missing' | 'adjusted_by_admin';
  justification?: TimeRecordJustification;
  adminAdjustment?: {
    adjustedBy: string;
    adjustedAt: string;
    reason: string;
    originalEntry?: string;
    originalExit?: string;
  };
}
