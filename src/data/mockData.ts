import { Appointment, Collaborator, BankTransaction, TodayRecord } from '../types';

// Exact image links from the user's HTML and attachments
export const IMAGES = {
  SALON_LOGO: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDlCojiBU3XN7BYYds4BE8hIe5_RrufJaMDBTFEW9JzZ9puSy_Ms2t9vIAqZTQwgQrOMPPbXTSJS6CP7yYPJ7wu3rT6_F1iS0W-Y4nqGIL2H9PM-Qa1gLKRKl5qJG-DYiUH1thZVFMfOY7aYG93bLqrMjn3YtU8b6f9HwFd2hE7h8kD_HlP3fek70qmZ8apYjB-wjB1qE-S52ZqIqimHmH7wTULYn9_XCqZxOtspxNZVPiVHqiRVQ6Q8VAP5CpWO6oV',
  DORINHA_AVATAR: 'https://lh3.googleusercontent.com/aida/AEtjO1UhoRARWoejg0tBfcf43qA2yn7hFdfHrxf9BG6XmYLkuk42L_XY-MAl8nLShrsbcYsiZH-elFhjHQ4vS5dfD0gSSAkw0M0dKhCvT9SoL-Ua5kkYsD4t9B0eIepkcBZd2QkAHVBfawFUxH7XVZ8BRqchQ90IujtPvx_ILGVXsNJIRtmbjVLKYlf3-WcGgDGU3U5PxOD-6bfe-Mio8rlftcmSEh5mvV8kIbGOK3x78SKnGtZAGyqkHwRlaaeawI4SIF20RAS4_Azy',
  CLIENT_CAMILA: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8s2lveqtdp0PsVKpAURGcZhoxArERptdT0wL5PkHiEC8dj-EjjSipmEs_KJx-0YwdK4kpTOfRrN_RQgDKCf3A4ITXrb69xrxgguk45oMa1iKjvhOetzaXS_MA7GzkrNrBqnX0MOa-UriKuXf8bNJaIp2fFhXnV74JAE1Zxe70LYOldcajpF7mk7XEKVSld3lLgSU8RDxoXVWzX6yUEVA4fV_9JU4UZAGv0tYXaoKp9qMgNTj7I4I',
  CLIENT_HELENA: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBMeTcJy5lx193937VYgvPRnPZZQvyKahjKYL068TFnJk5fZ1g9DzmfrcZt-U_FK09ruN6g2HzsQCr0TCsi9klDiQ46oPePkmew817UF7zOucfDNk8sGUKcve8ktvU0OJjUuw66XWDrI2ISDtd4bKjAPHOLFIRXXkUXQq3Z3tImVO2Kz7HwkVd-N4E7RlW7KN1-BQcJvJxm5acuj3Zyb3FQUZWm93L8jbDWiUWp92t3jkRUmKPPpBg',
  CLIENT_MARIANA: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCMrZcmxkQg9mEjN1TNOoLP5kPPsSLhb447l4bHRQJt4vo2CVoeSq7WHzWaZ2l2DF3l9YPFbbPyUU85YHmsGNhSASU3Xyilbfg6ahVZYnIJhF03TMp1j4OKDd0Z-eqPDG2T98eE3kZSIlU3-Izmw9N_e4OGPJICjJDFDevOfewnNRzmWw73ZxT73Im9yWGn_JCpjDl9lkb1Ffjkm4zJFNb_v9Z6BRrhpYZfyIILtsSRZsTK8aBpmt0',
  STAFF_CAMILA: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBnnj9HonpEvqomKqbp9AlljbKjAWwhlrr8wSHPi5huAGkK9CaP3yQnjd2e8f_jr7rF6jftdQnhMXbhts6YyOlvjwZJAJcOrvPManIcTcbVIv8QhCYf4vWvfifM9KIarSaFoNEyyRZ8wbN6cS6ZF3qZw4-Yb_9nA_qI_aX_X_noUjzWxOIyER-j5ymQKhHOLmdOrQKHtOAMVWXIRf5IBXFl2HI0wbIT6Qe2km8hQYwQLwDDVpMqLY0',
  STAFF_BEATRIZ: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDyqBJMLGASmfrgY4i_Z-XkMpcAuCer060ft0VTyepY_LS6q0g1EFMHbczc_ek-zPGmKGHg4FH_QNxErYQbdMDawYjnJ3LENUMOLPldrujdCf6EYrk7LR0P3gXMjUIDQbGr2b7-JHzjH-v_hWWxEMIyRFQ0lx5MFnio86s31IwHXG3O7BTkW3Sm69BwmDE6pMPQ2OpmEbNZ6gAgoU5yzVWuY20qEtY80KKv8KFhs2R1oJ3rX5MeQKw',
  STAFF_FERNANDA: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDfNBoSIhzIG-B-uh74SHmwlOyWgGxB0jZZNNriRX8aD3PzYD5biGJCdhxYUmWDUzSxM1Z78zR3hA_3qVStVpPUjbF6YB4ueUHcTeLFSDdXWUomQZGP2T7LazdsanhBu9QVhyn_JOi8O8CpxSA96x9KuJjw1jXF3fSMKirA2xEHSaGYs_KKoHYjURu7P-5p-HTUqTX_SGc47RRh8PSN1XDQTNMtU4Bg-HHrwhXFKrS9YQO0V_idxzU',
  STAFF_JULIANA: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCocjB-OqQyRAMKfvYtLe7EvudlL5Enmay4xDNXKJzsjvnwoWH45sIUODq5csASQTQr4rHvHdaqjYGmishUePCMfYmpvMfSPODCjeunuKaiEySBznVNWetqwHDcXooWuqsFIbffoJPti00BmlAyf1oCDMfwKzLYx-9m92Pm-ZR0W8I0X9Mt-O8-Vf7OlMclziJ7zOSgKHyldrQ82_8yoBO8J-T6JgQFzHYtYIjvFYz5yAKj44syPtw'
};

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-1',
    clientName: 'Camila Albuquerque',
    clientAvatar: IMAGES.CLIENT_CAMILA,
    serviceName: 'Mechas Balayage + Hidratação',
    price: 450.0,
    commissionRate: 0.40,
    commissionAmount: 180.0,
    date: 'Hoje · 14:30',
    time: '14:30',
    notes: 'Cliente solicitou tom perolado com raiz esfumada suave.',
    confirmed: true,
    paymentMethod: 'PIX'
  },
  {
    id: 'apt-2',
    clientName: 'Helena Vasconcelos',
    clientAvatar: IMAGES.CLIENT_HELENA,
    serviceName: 'Corte Visagista & Escova Modelada',
    price: 180.0,
    commissionRate: 0.40,
    commissionAmount: 72.0,
    date: 'Hoje · 11:15',
    time: '11:15',
    notes: 'Finalizado com óleo de argan e textura leve nas pontas.',
    confirmed: true,
    paymentMethod: 'Crédito'
  },
  {
    id: 'apt-3',
    clientName: 'Mariana Prado',
    clientAvatar: IMAGES.CLIENT_MARIANA,
    serviceName: 'Spa de Pés e Mãos Completo',
    price: 120.0,
    commissionRate: 0.40,
    commissionAmount: 48.0,
    date: 'Ontem · 16:00',
    time: '16:00',
    notes: 'Esmalte nude terracota orgânico, cuticulagem suave.',
    confirmed: true,
    paymentMethod: 'Débito'
  }
];

export const INITIAL_TODAY_RECORDS: TodayRecord[] = [
  {
    id: 'rec-1',
    clientName: 'Beatriz Silveira',
    serviceName: 'Mechas Balayage',
    time: '14:15',
    price: 320.0,
    commission: 128.0,
    icon: 'content_cut'
  },
  {
    id: 'rec-2',
    clientName: 'Larissa Fontes',
    serviceName: 'Hidratação & Escova',
    time: '11:30',
    price: 160.0,
    commission: 64.0,
    icon: 'spa'
  },
  {
    id: 'rec-3',
    clientName: 'Carla Nogueira',
    serviceName: 'Manicure Gel',
    time: '09:45',
    price: 85.0,
    commission: 34.0,
    icon: 'brush'
  }
];

export const COLLABORATORS: Collaborator[] = [
  {
    id: 'col-1',
    name: 'Camila Santos',
    role: 'Cabeleireira & Colorista',
    avatar: IMAGES.STAFF_CAMILA,
    servicesCount: 52,
    grossRevenue: 8420.0,
    commission: 3368.0,
    salonShare: 5052.0
  },
  {
    id: 'col-2',
    name: 'Beatriz Lima',
    role: 'Manicure & Nail Designer',
    avatar: IMAGES.STAFF_BEATRIZ,
    servicesCount: 46,
    grossRevenue: 6150.0,
    commission: 2460.0,
    salonShare: 3690.0
  },
  {
    id: 'col-3',
    name: 'Fernanda Costa',
    role: 'Esteticista Facial',
    avatar: IMAGES.STAFF_FERNANDA,
    servicesCount: 38,
    grossRevenue: 5890.0,
    commission: 2356.0,
    salonShare: 3534.0
  },
  {
    id: 'col-4',
    name: 'Juliana Rocha',
    role: 'Designer de Olhar',
    avatar: IMAGES.STAFF_JULIANA,
    servicesCount: 28,
    grossRevenue: 4220.0,
    commission: 1688.0,
    salonShare: 2532.0
  }
];

export const SERVICE_TEMPLATES = [
  { id: 'srv-1', name: 'Corte Feminino', price: 180, category: 'Cabelo' },
  { id: 'srv-2', name: 'Escova Modelada', price: 120, category: 'Cabelo' },
  { id: 'srv-3', name: 'Mechas Criativas', price: 420, category: 'Coloração' },
  { id: 'srv-4', name: 'Manicure & Pedicure', price: 85, category: 'Unhas' },
  { id: 'srv-5', name: 'Hidratação Ritual', price: 210, category: 'Tratamento' },
  { id: 'srv-6', name: 'Coloração Total', price: 260, category: 'Coloração' }
];

export const BANK_TRANSACTIONS: BankTransaction[] = [
  {
    id: 'tx-1',
    title: 'Lote Pix Recebidos · Balcão',
    subtitle: '30/11 · Conciliado com 42 comandas',
    amount: 3840.0,
    type: 'credit',
    category: 'pix'
  },
  {
    id: 'tx-2',
    title: 'Stone Pagamentos · Crédito/Débito',
    subtitle: '29/11 · Taxa retida de 1.89%',
    amount: 4920.0,
    type: 'credit',
    category: 'card'
  },
  {
    id: 'tx-3',
    title: "Wella & L'Oréal Distribuidora",
    subtitle: '26/11 · Reposição estoque coloração',
    amount: 2450.0,
    type: 'debit',
    category: 'supply'
  },
  {
    id: 'tx-4',
    title: 'Repasse Quinzenal · Dorinha & Equipe',
    subtitle: '15/11 · 11 TEDs emitidas',
    amount: 4890.0,
    type: 'debit',
    category: 'commission'
  },
  {
    id: 'tx-5',
    title: 'Lote Pix Clientes VIP',
    subtitle: '14/11 · Conciliado com 18 serviços',
    amount: 1950.0,
    type: 'credit',
    category: 'pix'
  },
  {
    id: 'tx-6',
    title: 'Cielo Soluções · Cartão Débito',
    subtitle: '10/11 · 35 transações',
    amount: 2780.0,
    type: 'credit',
    category: 'card'
  }
];

export const QUICK_CLIENTS = [
  { name: 'Clara Rezende', initials: 'CR' },
  { name: 'Fernanda Albuquerque', initials: 'FA' },
  { name: 'Mariana Toledo', initials: 'MT' },
  { name: 'Luciana Martins', initials: 'LM' }
];

export const INITIAL_TIME_RECORDS: import('../types').TimeRecord[] = [
  {
    id: 'tr-today-dorinha',
    employeeId: 'emp-dorinha',
    employeeName: 'Dorinha Ferreira',
    employeeAvatar: IMAGES.DORINHA_AVATAR,
    date: '2026-09-08',
    dateFormatted: 'Hoje · Terça-feira, 08/09',
    entryTime: '08:32',
    exitTime: undefined,
    status: 'in_progress'
  },
  {
    id: 'tr-yesterday-dorinha',
    employeeId: 'emp-dorinha',
    employeeName: 'Dorinha Ferreira',
    employeeAvatar: IMAGES.DORINHA_AVATAR,
    date: '2026-09-07',
    dateFormatted: 'Segunda-feira, 07/09',
    entryTime: '08:28',
    exitTime: '17:45',
    status: 'completed'
  },
  {
    id: 'tr-prev-dorinha-adjusted',
    employeeId: 'emp-dorinha',
    employeeName: 'Dorinha Ferreira',
    employeeAvatar: IMAGES.DORINHA_AVATAR,
    date: '2026-09-04',
    dateFormatted: 'Sexta-feira, 04/09',
    entryTime: '08:30',
    exitTime: '18:15',
    status: 'adjusted_by_admin',
    adminAdjustment: {
      adjustedBy: 'Administração Renascer',
      adjustedAt: '05/09 às 09:12',
      reason: 'Ajuste de horário de saída após confirmação de atendimento tardio.',
      originalEntry: '08:30',
      originalExit: '17:00'
    }
  },
  {
    id: 'tr-beatriz-pending',
    employeeId: 'col-2',
    employeeName: 'Beatriz Lima',
    employeeAvatar: IMAGES.STAFF_BEATRIZ,
    date: '2026-09-07',
    dateFormatted: 'Segunda-feira, 07/09',
    entryTime: '08:45',
    exitTime: undefined,
    status: 'pending_justification',
    justification: {
      id: 'just-beatriz-1',
      reason: 'Esqueci de registrar a saída às 18:30 devido a procedimento estendido de noiva.',
      type: 'exit',
      requestedExit: '18:30',
      createdAt: '07/09 às 19:10',
      status: 'pending'
    }
  },
  {
    id: 'tr-camila-today',
    employeeId: 'col-1',
    employeeName: 'Camila Santos',
    employeeAvatar: IMAGES.STAFF_CAMILA,
    date: '2026-09-08',
    dateFormatted: 'Hoje · Terça-feira, 08/09',
    entryTime: '08:15',
    exitTime: undefined,
    status: 'in_progress'
  },
  {
    id: 'tr-fernanda-yesterday',
    employeeId: 'col-3',
    employeeName: 'Fernanda Costa',
    employeeAvatar: IMAGES.STAFF_FERNANDA,
    date: '2026-09-07',
    dateFormatted: 'Segunda-feira, 07/09',
    entryTime: '09:00',
    exitTime: '18:00',
    status: 'completed'
  },
  {
    id: 'tr-juliana-yesterday',
    employeeId: 'col-4',
    employeeName: 'Juliana Rocha',
    employeeAvatar: IMAGES.STAFF_JULIANA,
    date: '2026-09-07',
    dateFormatted: 'Segunda-feira, 07/09',
    entryTime: '08:40',
    exitTime: '17:50',
    status: 'completed'
  }
];

