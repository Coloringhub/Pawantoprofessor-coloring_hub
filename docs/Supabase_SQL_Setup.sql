-- PAWN TO PROFESSOR COLORING STUDIO — DATABASE SETUP V1
-- Run in Supabase Dashboard > SQL Editor > New query > Run.
-- Admin/library metadata only: NO student artwork or student drafts are stored.
-- Data access is intentionally PRIVATE. Vercel backend must authenticate and authorize
-- users before querying through a server-only Supabase secret key.

BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.studio_countries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    slug text NOT NULL UNIQUE,
    country_code text UNIQUE,
    sort_order integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.studio_topics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    parent_id uuid REFERENCES public.studio_topics(id) ON DELETE SET NULL,
    sort_order integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.studio_tags (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    slug text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.studio_design_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    description text,
    settings jsonb NOT NULL DEFAULT '{}'::jsonb,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.studio_settings (
    key text PRIMARY KEY,
    value jsonb NOT NULL DEFAULT '{}'::jsonb,
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.studio_worksheets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    slug text NOT NULL UNIQUE,
    description text,
    country_id uuid REFERENCES public.studio_countries(id) ON DELETE SET NULL,
    design_template_id uuid REFERENCES public.studio_design_templates(id) ON DELETE SET NULL,
    status text NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft','preparing','review','published','archived')),
    -- Coordinates/settings are filled by the Admin Image Preparation UI.
    editable_area jsonb NOT NULL DEFAULT '{}'::jsonb,
    preparation_settings jsonb NOT NULL DEFAULT '{}'::jsonb,
    sort_order integer NOT NULL DEFAULT 0,
    published_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.studio_worksheet_topics (
    worksheet_id uuid NOT NULL REFERENCES public.studio_worksheets(id) ON DELETE CASCADE,
    topic_id uuid NOT NULL REFERENCES public.studio_topics(id) ON DELETE CASCADE,
    PRIMARY KEY (worksheet_id, topic_id)
);

CREATE TABLE IF NOT EXISTS public.studio_worksheet_tags (
    worksheet_id uuid NOT NULL REFERENCES public.studio_worksheets(id) ON DELETE CASCADE,
    tag_id uuid NOT NULL REFERENCES public.studio_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (worksheet_id, tag_id)
);

CREATE TABLE IF NOT EXISTS public.studio_worksheet_assets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    worksheet_id uuid NOT NULL REFERENCES public.studio_worksheets(id) ON DELETE CASCADE,
    asset_kind text NOT NULL CHECK (asset_kind IN (
       'original','enhanced','protected_design','line_art',
       'region_mask','thumbnail','blank_pdf'
    )),
    bucket_name text NOT NULL CHECK (bucket_name IN ('coloring-masters','coloring-published')),
    storage_path text NOT NULL,
    mime_type text,
    width_px integer CHECK (width_px IS NULL OR width_px > 0),
    height_px integer CHECK (height_px IS NULL OR height_px > 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (worksheet_id, asset_kind),
    UNIQUE (bucket_name, storage_path)
);

CREATE TABLE IF NOT EXISTS public.studio_vocabulary (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    worksheet_id uuid NOT NULL REFERENCES public.studio_worksheets(id) ON DELETE CASCADE,
    english_word text NOT NULL,
    meaning text,
    translation_zh_tw text,
    example_sentence text,
    picture_path text,
    audio_path text,
    sort_order integer NOT NULL DEFAULT 0
);

-- Only administrators identified through Supabase Auth belong here.
-- Add the owner AFTER creating their Auth user. Do not guess a user ID.
CREATE TABLE IF NOT EXISTS public.studio_admins (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('owner','admin')),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_studio_worksheets_country_status
    ON public.studio_worksheets(country_id, status);
CREATE INDEX IF NOT EXISTS idx_studio_worksheets_status
    ON public.studio_worksheets(status);
CREATE INDEX IF NOT EXISTS idx_studio_worksheet_topics_topic
    ON public.studio_worksheet_topics(topic_id);
CREATE INDEX IF NOT EXISTS idx_studio_worksheet_tags_tag
    ON public.studio_worksheet_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_studio_assets_worksheet
    ON public.studio_worksheet_assets(worksheet_id);
CREATE INDEX IF NOT EXISTS idx_studio_vocabulary_worksheet
    ON public.studio_vocabulary(worksheet_id, sort_order);

CREATE OR REPLACE FUNCTION public.studio_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS studio_worksheets_updated_at ON public.studio_worksheets;
CREATE TRIGGER studio_worksheets_updated_at
BEFORE UPDATE ON public.studio_worksheets
FOR EACH ROW EXECUTE FUNCTION public.studio_touch_updated_at();
DROP TRIGGER IF EXISTS studio_design_templates_updated_at ON public.studio_design_templates;
CREATE TRIGGER studio_design_templates_updated_at
BEFORE UPDATE ON public.studio_design_templates
FOR EACH ROW EXECUTE FUNCTION public.studio_touch_updated_at();
DROP TRIGGER IF EXISTS studio_settings_updated_at ON public.studio_settings;
CREATE TRIGGER studio_settings_updated_at
BEFORE UPDATE ON public.studio_settings
FOR EACH ROW EXECUTE FUNCTION public.studio_touch_updated_at();

-- No public browser access to the database, even to published worksheet rows.
-- The separate Vercel application will check Pawn to Professor access on the SERVER,
-- then return permitted worksheet data and short-lived signed asset links.
ALTER TABLE public.studio_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_design_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_worksheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_worksheet_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_worksheet_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_worksheet_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_admins ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
    public.studio_countries, public.studio_topics, public.studio_tags,
    public.studio_design_templates, public.studio_settings, public.studio_worksheets,
    public.studio_worksheet_topics, public.studio_worksheet_tags,
    public.studio_worksheet_assets, public.studio_vocabulary, public.studio_admins
FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
    public.studio_countries, public.studio_topics, public.studio_tags,
    public.studio_design_templates, public.studio_settings, public.studio_worksheets,
    public.studio_worksheet_topics, public.studio_worksheet_tags,
    public.studio_worksheet_assets, public.studio_vocabulary, public.studio_admins
TO service_role;

-- Initial sample categories (edit/add freely in the future Admin UI).
INSERT INTO public.studio_countries (name, slug, country_code, sort_order) VALUES
    ('Japan','japan','JP',10),
    ('France','france','FR',20),
    ('Taiwan','taiwan','TW',30)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.studio_topics (name, slug, sort_order) VALUES
    ('Food','food',10),
    ('Culture','culture',20),
    ('Festivals','festivals',30),
    ('Animals','animals',40),
    ('Sports','sports',50)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.studio_tags (name, slug) VALUES
    ('Sushi','sushi'),('Ramen','ramen'),('Croissant','croissant'),
    ('Bakery','bakery'),('Japanese Food','japanese-food')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.studio_design_templates (name, description, settings)
VALUES ('Classic Classroom', 'Pawn to Professor green classroom design',
        '{"primaryColor":"#0d6f4f","accentColor":"#f4c95d","font":"Nunito","paper":"A4"}'::jsonb)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.studio_settings (key, value)
VALUES ('studio', '{"title":"Pawn to Professor Coloring Studio","downloadOnly":true,"onlineStudentArtworkStorage":false}'::jsonb)
ON CONFLICT (key) DO NOTHING;

COMMIT;

-- Verification query (run separately if desired):
-- SELECT 'countries' AS name, count(*) AS rows FROM public.studio_countries
-- UNION ALL SELECT 'topics', count(*) FROM public.studio_topics
-- UNION ALL SELECT 'tags', count(*) FROM public.studio_tags
-- UNION ALL SELECT 'design templates', count(*) FROM public.studio_design_templates
-- UNION ALL SELECT 'worksheets', count(*) FROM public.studio_worksheets;
