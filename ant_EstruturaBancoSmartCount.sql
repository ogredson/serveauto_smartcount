-- Criação das tabelas para ServeAuto SmartCount 1.0
-- Execute este script no SQL Editor do Supabase

-- 1. Extensão da tabela de usuários (auth.users já existe)
-- Criamos uma tabela de perfis para dados adicionais
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    authorized BOOLEAN DEFAULT FALSE,
    import_limit INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de sessões de contagem
CREATE TABLE IF NOT EXISTS public.counting_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    session_name TEXT NOT NULL,
    count_type TEXT CHECK (count_type IN ('normal', 'avulsa')) NOT NULL,
    status TEXT CHECK (status IN ('active', 'completed', 'cancelled')) DEFAULT 'active',
    total_items INTEGER DEFAULT 0,
    counted_items INTEGER DEFAULT 0,
    scanned_items INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de produtos
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.counting_sessions(id) ON DELETE CASCADE NOT NULL,
    codigo TEXT NOT NULL,
    descricao TEXT NOT NULL,
    quantidade_atual INTEGER DEFAULT 0,
    quantidade_contada INTEGER DEFAULT 0,
    is_counted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, codigo)
);

-- 4. Tabela de scans/bipagens
CREATE TABLE IF NOT EXISTS public.scans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.counting_sessions(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    codigo TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    scan_type TEXT CHECK (scan_type IN ('barcode', 'manual')) DEFAULT 'barcode',
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela de logs de sessão (login/logout)
CREATE TABLE IF NOT EXISTS public.session_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    action TEXT CHECK (action IN ('login', 'logout')) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_authorized ON public.user_profiles(authorized);
CREATE INDEX IF NOT EXISTS idx_counting_sessions_user_id ON public.counting_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_counting_sessions_status ON public.counting_sessions(status);
CREATE INDEX IF NOT EXISTS idx_products_session_id ON public.products(session_id);
CREATE INDEX IF NOT EXISTS idx_products_codigo ON public.products(codigo);
CREATE INDEX IF NOT EXISTS idx_scans_session_id ON public.scans(session_id);
CREATE INDEX IF NOT EXISTS idx_scans_product_id ON public.scans(product_id);
CREATE INDEX IF NOT EXISTS idx_session_logs_user_id ON public.session_logs(user_id);

-- Triggers para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_counting_sessions_updated_at BEFORE UPDATE ON public.counting_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) Policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para user_profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas para counting_sessions
CREATE POLICY "Users can view own sessions" ON public.counting_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.counting_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.counting_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON public.counting_sessions FOR DELETE USING (auth.uid() = user_id);

-- Políticas para products
CREATE POLICY "Users can view products from own sessions" ON public.products FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.counting_sessions cs 
        WHERE cs.id = products.session_id AND cs.user_id = auth.uid()
    )
);
CREATE POLICY "Users can insert products in own sessions" ON public.products FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.counting_sessions cs 
        WHERE cs.id = products.session_id AND cs.user_id = auth.uid()
    )
);
CREATE POLICY "Users can update products in own sessions" ON public.products FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.counting_sessions cs 
        WHERE cs.id = products.session_id AND cs.user_id = auth.uid()
    )
);
CREATE POLICY "Users can delete products from own sessions" ON public.products FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.counting_sessions cs 
        WHERE cs.id = products.session_id AND cs.user_id = auth.uid()
    )
);

-- Políticas para scans
CREATE POLICY "Users can view scans from own sessions" ON public.scans FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.counting_sessions cs 
        WHERE cs.id = scans.session_id AND cs.user_id = auth.uid()
    )
);
CREATE POLICY "Users can insert scans in own sessions" ON public.scans FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.counting_sessions cs 
        WHERE cs.id = scans.session_id AND cs.user_id = auth.uid()
    )
);

-- Políticas para session_logs
CREATE POLICY "Users can view own logs" ON public.session_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own logs" ON public.session_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

