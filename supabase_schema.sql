-- ==============================================================================
-- SCHEMA SUPABASE: SALÃO NOVO RENASCER
-- ==============================================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELA DE PERFIS DE USUÁRIO (PROFILES)
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'employee', 'service_provider')),
    active BOOLEAN DEFAULT TRUE NOT NULL,
    avatar_url TEXT,
    pix_key TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. TABELA DE CATEGORIAS DE SERVIÇOS
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. TABELA DE SERVIÇOS DO SALÃO
CREATE TABLE IF NOT EXISTS public.services (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    category TEXT NOT NULL,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. TABELA DE ATENDIMENTOS E COMISSÕES
CREATE TABLE IF NOT EXISTS public.appointments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT,
    client_name TEXT NOT NULL,
    client_avatar TEXT,
    service_name TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    commission_rate NUMERIC(4,2) DEFAULT 0.40 NOT NULL,
    commission_amount NUMERIC(10,2) NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    notes TEXT,
    confirmed BOOLEAN DEFAULT TRUE NOT NULL,
    payment_method TEXT DEFAULT 'PIX',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. TABELA DE REGISTROS DE PONTO ELETRÔNICO
CREATE TABLE IF NOT EXISTS public.time_records (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    employee_id TEXT NOT NULL,
    employee_name TEXT NOT NULL,
    employee_avatar TEXT,
    date TEXT NOT NULL,
    date_formatted TEXT NOT NULL,
    entry_time TEXT,
    exit_time TEXT,
    status TEXT NOT NULL DEFAULT 'in_progress',
    justification JSONB,
    admin_adjustment JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==============================================================================
-- DADOS INICIAIS (SEEDS)
-- ==============================================================================

-- Inserir Categorias Padrão
INSERT INTO public.categories (name) VALUES
    ('Cabelo'),
    ('Coloração'),
    ('Unhas'),
    ('Tratamento'),
    ('Estética')
ON CONFLICT (name) DO NOTHING;

-- Inserir Serviços Iniciais
INSERT INTO public.services (name, price, category, active) VALUES
    ('Corte Feminino Visagista', 180.00, 'Cabelo', true),
    ('Escova Modelada', 120.00, 'Cabelo', true),
    ('Mechas Criativas & Balayage', 420.00, 'Coloração', true),
    ('Coloração Total Raiz & Pontas', 260.00, 'Coloração', true),
    ('Manicure & Pedicure Spa', 85.00, 'Unhas', true),
    ('Hidratação Ritual Profundo', 210.00, 'Tratamento', true)
ON CONFLICT DO NOTHING;

-- Inserir Perfis Iniciais da Equipe
INSERT INTO public.profiles (id, name, email, role, active, pix_key) VALUES
    ('col-dorinha', 'Dorinha Ferreira', 'dorinha@salaonovo.com.br', 'employee', true, 'dorinha.ferreira@salaonovo.com.br'),
    ('col-camila', 'Camila Santos', 'camila@salaonovo.com.br', 'employee', true, 'camila.santos@salaonovo.com.br'),
    ('col-beatriz', 'Beatriz Lima', 'beatriz@salaonovo.com.br', 'employee', true, 'beatriz.lima@salaonovo.com.br'),
    ('col-fernanda', 'Fernanda Costa', 'fernanda@salaonovo.com.br', 'service_provider', true, 'fernanda.costa@salaonovo.com.br'),
    ('col-juliana', 'Juliana Rocha', 'juliana@salaonovo.com.br', 'service_provider', true, 'juliana.rocha@salaonovo.com.br')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- TRIGGER PARA CRIAR PERFIL AUTOMÁTICO AO CADASTRAR NO AUTH
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, role, active, avatar_url)
    VALUES (
        NEW.id::text,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'service_provider'),
        true,
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
    )
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        role = EXCLUDED.role;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir acesso completo a perfis" ON public.profiles;
CREATE POLICY "Permitir acesso completo a perfis" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso completo a categorias" ON public.categories;
CREATE POLICY "Permitir acesso completo a categorias" ON public.categories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso completo a servicos" ON public.services;
CREATE POLICY "Permitir acesso completo a servicos" ON public.services FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso completo a atendimentos" ON public.appointments;
CREATE POLICY "Permitir acesso completo a atendimentos" ON public.appointments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso completo a ponto" ON public.time_records;
CREATE POLICY "Permitir acesso completo a ponto" ON public.time_records FOR ALL USING (true) WITH CHECK (true);
