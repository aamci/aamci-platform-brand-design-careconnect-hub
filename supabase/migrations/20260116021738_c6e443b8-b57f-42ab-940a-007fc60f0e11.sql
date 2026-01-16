
-- =====================================================
-- ANTÉCÉDENTS ET MODE DE VIE - Enterprise Grade v2
-- Tables canoniques + référentiels + traçabilité
-- =====================================================

-- 1. Référentiel de terminologie médicale (CIM-10, CISP-2, CCAM)
CREATE TABLE IF NOT EXISTS public.medical_terminology (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  system TEXT NOT NULL, -- 'CIM10', 'CISP2', 'CCAM', 'ATC', 'CUSTOM'
  code TEXT NOT NULL,
  display TEXT NOT NULL,
  display_normalized TEXT, -- lowercase, accent-stripped for search
  synonyms TEXT[], -- array of aliases and abbreviations
  category TEXT, -- 'condition', 'procedure', 'medication', 'allergen'
  specialty_tags TEXT[], -- specialties for filtering
  is_frv BOOLEAN DEFAULT false, -- is cardiovascular risk factor
  parent_code TEXT, -- for hierarchy
  metadata JSONB DEFAULT '{}',
  search_vector tsvector, -- pre-computed search vector
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(system, code)
);

-- Insert common medical abbreviations and their mappings
INSERT INTO public.medical_terminology (system, code, display, display_normalized, synonyms, category, is_frv)
VALUES
  ('CISP2', 'K86', 'Hypertension artérielle non compliquée', 'hypertension arterielle non compliquee', ARRAY['HTA', 'hypertension', 'tension'], 'condition', true),
  ('CISP2', 'K87', 'Hypertension artérielle compliquée', 'hypertension arterielle compliquee', ARRAY['HTA maligne', 'HTA compliquee'], 'condition', true),
  ('CIM10', 'I10', 'Hypertension artérielle essentielle', 'hypertension arterielle essentielle', ARRAY['HTA essentielle', 'hypertension essentielle'], 'condition', true),
  ('CISP2', 'T90', 'Diabète insulino-dépendant', 'diabete insulino-dependant', ARRAY['DID', 'diabete type 1', 'D1T', 'DT1'], 'condition', true),
  ('CISP2', 'T89', 'Diabète non insulino-dépendant', 'diabete non insulino-dependant', ARRAY['DNID', 'diabete type 2', 'D2T', 'DT2'], 'condition', true),
  ('CIM10', 'E11', 'Diabète sucré de type 2', 'diabete sucre de type 2', ARRAY['diabete type 2', 'DNID'], 'condition', true),
  ('CISP2', 'P76', 'Dépression', 'depression', ARRAY['SD D', 'SD DEPR', 'depression anxieuse', 'EDM'], 'condition', false),
  ('CIM10', 'F32', 'Épisode dépressif', 'episode depressif', ARRAY['depression', 'EDM'], 'condition', false),
  ('CIM10', 'F33', 'Trouble dépressif récurrent', 'trouble depressif recurrent', ARRAY['depression recurrente'], 'condition', false),
  ('CIM10', 'C34', 'Cancer du poumon', 'cancer du poumon', ARRAY['K PO', 'K poumon', 'carcinome bronchique'], 'condition', false),
  ('CIM10', 'C50', 'Tumeur maligne du sein', 'tumeur maligne du sein', ARRAY['cancer du sein', 'K sein'], 'condition', false),
  ('CISP2', 'X76', 'Cancer du sein chez la femme', 'cancer du sein chez la femme', ARRAY['K sein femme'], 'condition', false),
  ('CISP2', 'Y78', 'Cancer du sein chez l''homme', 'cancer du sein chez l homme', ARRAY['K sein homme'], 'condition', false),
  ('CIM10', 'C61', 'Cancer de la prostate', 'cancer de la prostate', ARRAY['K prostate', 'K P'], 'condition', false),
  ('CIM10', 'C25', 'Cancer du pancréas', 'cancer du pancreas', ARRAY['K pancreas'], 'condition', false),
  ('CIM10', 'C44', 'Cancer de la peau', 'cancer de la peau', ARRAY['K peau', 'melanome'], 'condition', false),
  ('CIM10', 'C10', 'Cancer du pharynx', 'cancer du pharynx', ARRAY['K pharynx'], 'condition', false),
  ('CIM10', 'C38', 'Cancer de la plèvre', 'cancer de la plevre', ARRAY['K plevre', 'mesotheliome'], 'condition', false),
  ('CISP2', 'U75', 'Cancer du rein', 'cancer du rein', ARRAY['K rein'], 'condition', false),
  ('CISP2', 'D75', 'Cancer du côlon', 'cancer du colon', ARRAY['K colon', 'CCR'], 'condition', false),
  ('CISP2', 'R84', 'Cancer du poumon', 'cancer du poumon', ARRAY['K poumon'], 'condition', false),
  ('CISP2', 'R85', 'Cancer du larynx', 'cancer du larynx', ARRAY['K larynx'], 'condition', false),
  ('CCAM', 'HBGA003', 'Extraction dents de sagesse', 'extraction dents de sagesse', ARRAY['extraction dentaire', 'avulsion'], 'procedure', false),
  ('CCAM', 'BFGA003', 'Extraction extracapsulaire manuelle du cristallin', 'extraction extracapsulaire manuelle du cristallin', ARRAY['extraction cristallin', 'cataracte'], 'procedure', false),
  ('CCAM', 'BFGA008', 'Extraction extracapsulaire par phakoémulsification', 'extraction extracapsulaire par phakoemulsification', ARRAY['phaco', 'cataracte'], 'procedure', false),
  ('CCAM', 'BFGA002', 'Extraction manuelle avec implant', 'extraction manuelle avec implant', ARRAY['implant cristallin'], 'procedure', false),
  ('CUSTOM', 'AVB', 'Accouchement unique et spontané', 'accouchement unique et spontane', ARRAY['accouchement voie basse', 'AVB'], 'procedure', false),
  ('CUSTOM', 'POIL_CHAT', 'Allergie aux poils de chat', 'allergie aux poils de chat', ARRAY['POIL', 'poils chat'], 'allergen', false),
  ('CUSTOM', 'POIL_CHIEN', 'Allergie aux poils de chien', 'allergie aux poils de chien', ARRAY['POIL', 'poils chien'], 'allergen', false),
  ('CUSTOM', 'POIL_LAPIN', 'Allergie aux poils de lapin', 'allergie aux poils de lapin', ARRAY['POIL', 'poils lapin'], 'allergen', false)
ON CONFLICT (system, code) DO NOTHING;

-- Update search vector after insert
UPDATE public.medical_terminology 
SET search_vector = to_tsvector('simple', 
  coalesce(display, '') || ' ' || 
  coalesce(display_normalized, '') || ' ' || 
  coalesce(code, '') || ' ' ||
  coalesce(array_to_string(synonyms, ' '), '')
);

-- Create index on pre-computed search vector
CREATE INDEX IF NOT EXISTS idx_terminology_search 
ON public.medical_terminology USING gin(search_vector);

CREATE INDEX IF NOT EXISTS idx_terminology_category 
ON public.medical_terminology(category);

CREATE INDEX IF NOT EXISTS idx_terminology_system 
ON public.medical_terminology(system);

-- Trigger to update search_vector on insert/update
CREATE OR REPLACE FUNCTION update_terminology_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('simple', 
    coalesce(NEW.display, '') || ' ' || 
    coalesce(NEW.display_normalized, '') || ' ' || 
    coalesce(NEW.code, '') || ' ' ||
    coalesce(array_to_string(NEW.synonyms, ' '), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_terminology_search_vector
BEFORE INSERT OR UPDATE ON public.medical_terminology
FOR EACH ROW EXECUTE FUNCTION update_terminology_search_vector();

-- 2. Extended patient antecedents with coding support
ALTER TABLE public.patient_antecedents 
ADD COLUMN IF NOT EXISTS terminology_code TEXT,
ADD COLUMN IF NOT EXISTS terminology_system TEXT,
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pin_order INTEGER,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS is_ald BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ald_start_date DATE,
ADD COLUMN IF NOT EXISTS ald_end_date DATE,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS updated_by UUID,
ADD COLUMN IF NOT EXISTS related_family_member TEXT,
ADD COLUMN IF NOT EXISTS family_member_age_at_diagnosis INTEGER;

-- 3. Perinatal information table
CREATE TABLE IF NOT EXISTS public.patient_perinatal (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id TEXT NOT NULL,
  gestational_age_weeks INTEGER,
  gestational_age_days INTEGER,
  is_premature BOOLEAN,
  birth_weight_grams INTEGER,
  apgar_1min INTEGER,
  apgar_5min INTEGER,
  apgar_10min INTEGER,
  complications TEXT[],
  delivery_type TEXT,
  birth_context TEXT,
  neonatal_hospitalization BOOLEAN DEFAULT false,
  neonatal_hospitalization_days INTEGER,
  breastfeeding_duration_months INTEGER,
  notes TEXT,
  source TEXT DEFAULT 'manual',
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(patient_id)
);

-- 4. Medical devices table
CREATE TABLE IF NOT EXISTS public.patient_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id TEXT NOT NULL,
  device_type TEXT NOT NULL,
  device_name TEXT NOT NULL,
  device_model TEXT,
  device_serial_number TEXT,
  implant_date DATE,
  manufacturer TEXT,
  body_location TEXT,
  follow_up_frequency TEXT,
  next_follow_up_date DATE,
  is_active BOOLEAN DEFAULT true,
  removal_date DATE,
  removal_reason TEXT,
  notes TEXT,
  mri_compatible BOOLEAN,
  alerts TEXT[],
  source TEXT DEFAULT 'manual',
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Family history detailed table
CREATE TABLE IF NOT EXISTS public.patient_family_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id TEXT NOT NULL,
  relative_type TEXT NOT NULL,
  relative_gender TEXT,
  condition_title TEXT NOT NULL,
  terminology_code TEXT,
  terminology_system TEXT,
  age_at_diagnosis INTEGER,
  year_of_diagnosis INTEGER,
  is_cause_of_death BOOLEAN DEFAULT false,
  age_at_death INTEGER,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  source TEXT DEFAULT 'manual',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Gynecological/Obstetric history
CREATE TABLE IF NOT EXISTS public.patient_gyneco_obstetric (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id TEXT NOT NULL,
  menarche_age INTEGER,
  menopause_age INTEGER,
  is_menopausal BOOLEAN,
  cycle_regularity TEXT,
  cycle_duration_days INTEGER,
  gravidity INTEGER DEFAULT 0,
  parity INTEGER DEFAULT 0,
  living_children INTEGER DEFAULT 0,
  miscarriages INTEGER DEFAULT 0,
  voluntary_terminations INTEGER DEFAULT 0,
  medical_terminations INTEGER DEFAULT 0,
  ectopic_pregnancies INTEGER DEFAULT 0,
  cesarean_count INTEGER DEFAULT 0,
  last_period_date DATE,
  last_pap_smear_date DATE,
  last_mammogram_date DATE,
  contraception_method TEXT,
  contraception_start_date DATE,
  hrt_use BOOLEAN DEFAULT false,
  hrt_start_date DATE,
  hrt_type TEXT,
  breast_pathology_history TEXT,
  uterine_pathology_history TEXT,
  ovarian_pathology_history TEXT,
  notes TEXT,
  source TEXT DEFAULT 'manual',
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(patient_id)
);

-- 7. Lifestyle observations (extended)
CREATE TABLE IF NOT EXISTS public.patient_lifestyle (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT,
  level TEXT,
  tobacco_type TEXT,
  tobacco_quantity_per_day INTEGER,
  tobacco_pack_years NUMERIC(5,1),
  tobacco_start_age INTEGER,
  tobacco_stop_date DATE,
  tobacco_quit_attempts INTEGER,
  alcohol_glasses_per_week INTEGER,
  alcohol_type TEXT,
  alcohol_binge_drinking BOOLEAN,
  addiction_substance TEXT,
  addiction_method TEXT,
  addiction_substitution BOOLEAN,
  addiction_substitution_type TEXT,
  activity_frequency_per_week INTEGER,
  activity_duration_minutes INTEGER,
  activity_types TEXT[],
  activity_intensity TEXT,
  is_sedentary BOOLEAN,
  diet_type TEXT,
  diet_restrictions TEXT[],
  sleep_hours_per_night NUMERIC(3,1),
  sleep_quality TEXT,
  sleep_disorders TEXT[],
  description TEXT,
  comment TEXT,
  recorded_date DATE DEFAULT CURRENT_DATE,
  source TEXT DEFAULT 'manual',
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for lifestyle queries
CREATE INDEX IF NOT EXISTS idx_lifestyle_patient_category 
ON public.patient_lifestyle(patient_id, category);

-- 8. Enhanced allergies - add test/desensitization fields
ALTER TABLE public.patient_allergies
ADD COLUMN IF NOT EXISTS allergy_test_type TEXT,
ADD COLUMN IF NOT EXISTS allergy_test_date DATE,
ADD COLUMN IF NOT EXISTS allergy_test_result TEXT,
ADD COLUMN IF NOT EXISTS is_desensitization_ongoing BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS desensitization_start_date DATE,
ADD COLUMN IF NOT EXISTS desensitization_protocol TEXT,
ADD COLUMN IF NOT EXISTS desensitization_end_date DATE,
ADD COLUMN IF NOT EXISTS is_cross_reactive BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cross_reactive_allergens TEXT[],
ADD COLUMN IF NOT EXISTS updated_by UUID;

-- Enable RLS on new tables
ALTER TABLE public.medical_terminology ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_perinatal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_family_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_gyneco_obstetric ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_lifestyle ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can read terminology" 
ON public.medical_terminology FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can manage perinatal data" 
ON public.patient_perinatal FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Users can manage device data" 
ON public.patient_devices FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Users can manage family history" 
ON public.patient_family_history FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Users can manage gyneco data" 
ON public.patient_gyneco_obstetric FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Users can manage lifestyle data" 
ON public.patient_lifestyle FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Create updated_at triggers for new tables
CREATE TRIGGER update_patient_perinatal_updated_at
BEFORE UPDATE ON public.patient_perinatal
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patient_devices_updated_at
BEFORE UPDATE ON public.patient_devices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patient_family_history_updated_at
BEFORE UPDATE ON public.patient_family_history
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patient_gyneco_obstetric_updated_at
BEFORE UPDATE ON public.patient_gyneco_obstetric
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patient_lifestyle_updated_at
BEFORE UPDATE ON public.patient_lifestyle
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
