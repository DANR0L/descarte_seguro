-- Script de Setup do Supabase para o Descarte Seguro
-- Execute isso no SQL Editor do seu projeto Supabase

-- 1. Criar a tabela de Produtos Químicos (Buscados do PubChem)
CREATE TABLE public.produtos_quimicos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    cas_number text NOT NULL,
    common_name text NOT NULL,
    iupac_name text,
    un_number text,
    risk_class text,
    pictograms_json text,
    phrases_json text,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(cas_number, common_name)
);

-- 2. Criar a tabela de Histórico de Descartes
CREATE TABLE public.historico_descartes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    empresa text,
    produto_nome text,
    volume text,
    data_acumulo date,
    created_at timestamp with time zone DEFAULT now()
);

-- 3. Configuração de Segurança (Row Level Security - RLS)
-- Permite que usuários autenticados possam inserir dados, e qualquer um possa ler.

ALTER TABLE public.produtos_quimicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_descartes ENABLE ROW LEVEL SECURITY;

-- Regras para produtos_quimicos:
-- Qualquer usuário anônimo ou logado pode ler (para o buscador funcionar com cache)
CREATE POLICY "Permitir leitura de produtos para todos" ON public.produtos_quimicos FOR SELECT USING (true);
-- Apenas usuários autenticados podem inserir/atualizar
CREATE POLICY "Permitir inserção/atualização de produtos para usuários logados" ON public.produtos_quimicos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Permitir update de produtos" ON public.produtos_quimicos FOR UPDATE USING (auth.role() = 'authenticated');

-- Regras para historico_descartes:
-- Usuários só podem ler e inserir seu próprio histórico
CREATE POLICY "Permitir leitura do próprio histórico" ON public.historico_descartes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Permitir inserção no histórico" ON public.historico_descartes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Adicionado Pol�tica de DELETE para o Hist�rico:
CREATE POLICY "Permitir exclus�o do pr�prio hist�rico" ON public.historico_descartes FOR DELETE USING (auth.uid() = user_id);


-- 4. Criar a tabela de Perfil da Empresa (Vinculada ao Usu�rio)
CREATE TABLE public.perfis_empresa (
    user_id uuid REFERENCES auth.users(id) PRIMARY KEY,
    empresa text,
    endereco text,
    responsavel text,
    telefone text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.perfis_empresa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura do pr�prio perfil" ON public.perfis_empresa FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Permitir inser��o do pr�prio perfil" ON public.perfis_empresa FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Permitir update do pr�prio perfil" ON public.perfis_empresa FOR UPDATE USING (auth.uid() = user_id);


-- 5. Criar a tabela Meu Banco de Produtos
CREATE TABLE public.meus_produtos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    nome text NOT NULL,
    tipo text NOT NULL, -- 'residuo' ou 'mistura'
    ghs_classes jsonb,
    estado_fisico text,
    incompatibilidade text,
    observacoes text,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.meus_produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura dos pr�prios produtos" ON public.meus_produtos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Permitir inser��o dos pr�prios produtos" ON public.meus_produtos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Permitir update dos pr�prios produtos" ON public.meus_produtos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Permitir dele��o dos pr�prios produtos" ON public.meus_produtos FOR DELETE USING (auth.uid() = user_id);
