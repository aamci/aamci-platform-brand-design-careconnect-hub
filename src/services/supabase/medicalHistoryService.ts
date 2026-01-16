/**
 * Medical History Service - Enterprise Grade
 * Handles all antecedents, lifestyle, devices, family history data
 * Source of truth: patient_antecedents, patient_lifestyle, patient_devices, patient_family_history tables
 */

import { supabase } from '@/integrations/supabase/client';

// ==================== TYPES ====================

export interface MedicalTerminology {
  id: string;
  system: string;
  code: string;
  display: string;
  displayNormalized: string | null;
  synonyms: string[];
  category: string | null;
  isFrv: boolean;
}

export interface PatientLifestyle {
  id: string;
  patientId: string;
  category: 'tobacco' | 'alcohol' | 'addiction' | 'physical_activity' | 'diet' | 'sleep' | 'stress' | 'other';
  status: 'never' | 'former' | 'current' | 'occasional' | null;
  level: string | null;
  // Tobacco
  tobaccoType: string | null;
  tobaccoQuantityPerDay: number | null;
  tobaccoPackYears: number | null;
  tobaccoStartAge: number | null;
  tobaccoStopDate: Date | null;
  tobaccoQuitAttempts: number | null;
  // Alcohol
  alcoholGlassesPerWeek: number | null;
  alcoholType: string | null;
  alcoholBingeDrinking: boolean | null;
  // Physical activity
  activityFrequencyPerWeek: number | null;
  activityDurationMinutes: number | null;
  activityTypes: string[];
  activityIntensity: string | null;
  isSedentary: boolean | null;
  // Diet
  dietType: string | null;
  dietRestrictions: string[];
  // Common
  description: string | null;
  comment: string | null;
  recordedDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PatientDevice {
  id: string;
  patientId: string;
  deviceType: string;
  deviceName: string;
  deviceModel: string | null;
  deviceSerialNumber: string | null;
  implantDate: Date | null;
  manufacturer: string | null;
  bodyLocation: string | null;
  followUpFrequency: string | null;
  nextFollowUpDate: Date | null;
  isActive: boolean;
  removalDate: Date | null;
  removalReason: string | null;
  notes: string | null;
  mriCompatible: boolean | null;
  alerts: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PatientFamilyHistory {
  id: string;
  patientId: string;
  relativeType: string;
  relativeGender: string | null;
  conditionTitle: string;
  terminologyCode: string | null;
  terminologySystem: string | null;
  ageAtDiagnosis: number | null;
  yearOfDiagnosis: number | null;
  isCauseOfDeath: boolean;
  ageAtDeath: number | null;
  isActive: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PatientPerinatal {
  id: string;
  patientId: string;
  gestationalAgeWeeks: number | null;
  gestationalAgeDays: number | null;
  isPremature: boolean | null;
  birthWeightGrams: number | null;
  apgar1min: number | null;
  apgar5min: number | null;
  apgar10min: number | null;
  complications: string[];
  deliveryType: string | null;
  birthContext: string | null;
  neonatalHospitalization: boolean;
  neonatalHospitalizationDays: number | null;
  breastfeedingDurationMonths: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PatientGynecoObstetric {
  id: string;
  patientId: string;
  menarcheAge: number | null;
  menopauseAge: number | null;
  isMenopausal: boolean | null;
  cycleRegularity: string | null;
  cycleDurationDays: number | null;
  gravidity: number;
  parity: number;
  livingChildren: number;
  miscarriages: number;
  voluntaryTerminations: number;
  medicalTerminations: number;
  ectopicPregnancies: number;
  cesareanCount: number;
  lastPeriodDate: Date | null;
  lastPapSmearDate: Date | null;
  lastMammogramDate: Date | null;
  contraceptionMethod: string | null;
  hrtUse: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== TERMINOLOGY SEARCH ====================

/**
 * Search medical terminology with abbreviation support
 */
export async function searchMedicalTerminology(
  query: string,
  options?: {
    category?: string;
    limit?: number;
  }
): Promise<MedicalTerminology[]> {
  const limit = options?.limit || 10;
  const normalizedQuery = query.toLowerCase().trim();
  
  // Build query - use ilike for flexible matching including synonyms
  let dbQuery = supabase
    .from('medical_terminology')
    .select('*')
    .or(`display.ilike.%${normalizedQuery}%,display_normalized.ilike.%${normalizedQuery}%,code.ilike.%${normalizedQuery}%,synonyms.cs.{${normalizedQuery}}`)
    .limit(limit);

  if (options?.category) {
    dbQuery = dbQuery.eq('category', options.category);
  }

  const { data, error } = await dbQuery;

  if (error) {
    console.error('[MedicalHistory] Error searching terminology:', error);
    throw error;
  }

  return (data || []).map((item: any) => ({
    id: item.id,
    system: item.system,
    code: item.code,
    display: item.display,
    displayNormalized: item.display_normalized,
    synonyms: item.synonyms || [],
    category: item.category,
    isFrv: item.is_frv || false,
  }));
}

// ==================== LIFESTYLE ====================

export async function fetchPatientLifestyle(patientId: string): Promise<PatientLifestyle[]> {
  const { data, error } = await supabase
    .from('patient_lifestyle')
    .select('*')
    .eq('patient_id', patientId)
    .order('category')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[MedicalHistory] Error fetching lifestyle:', error);
    throw error;
  }

  return (data || []).map(mapDbToLifestyle);
}

export async function createPatientLifestyle(
  patientId: string,
  input: Partial<PatientLifestyle>
): Promise<PatientLifestyle> {
  const { data, error } = await supabase
    .from('patient_lifestyle')
    .insert({
      patient_id: patientId,
      category: input.category,
      status: input.status,
      level: input.level,
      tobacco_type: input.tobaccoType,
      tobacco_quantity_per_day: input.tobaccoQuantityPerDay,
      tobacco_pack_years: input.tobaccoPackYears,
      tobacco_start_age: input.tobaccoStartAge,
      tobacco_stop_date: input.tobaccoStopDate?.toISOString().split('T')[0],
      tobacco_quit_attempts: input.tobaccoQuitAttempts,
      alcohol_glasses_per_week: input.alcoholGlassesPerWeek,
      alcohol_type: input.alcoholType,
      alcohol_binge_drinking: input.alcoholBingeDrinking,
      activity_frequency_per_week: input.activityFrequencyPerWeek,
      activity_duration_minutes: input.activityDurationMinutes,
      activity_types: input.activityTypes,
      activity_intensity: input.activityIntensity,
      is_sedentary: input.isSedentary,
      diet_type: input.dietType,
      diet_restrictions: input.dietRestrictions,
      description: input.description,
      comment: input.comment,
    })
    .select()
    .single();

  if (error) {
    console.error('[MedicalHistory] Error creating lifestyle:', error);
    throw error;
  }

  return mapDbToLifestyle(data);
}

export async function updatePatientLifestyle(
  id: string,
  updates: Partial<PatientLifestyle>
): Promise<void> {
  const { error } = await supabase
    .from('patient_lifestyle')
    .update({
      status: updates.status,
      level: updates.level,
      tobacco_type: updates.tobaccoType,
      tobacco_quantity_per_day: updates.tobaccoQuantityPerDay,
      tobacco_pack_years: updates.tobaccoPackYears,
      tobacco_start_age: updates.tobaccoStartAge,
      tobacco_stop_date: updates.tobaccoStopDate?.toISOString().split('T')[0],
      tobacco_quit_attempts: updates.tobaccoQuitAttempts,
      alcohol_glasses_per_week: updates.alcoholGlassesPerWeek,
      alcohol_type: updates.alcoholType,
      alcohol_binge_drinking: updates.alcoholBingeDrinking,
      activity_frequency_per_week: updates.activityFrequencyPerWeek,
      activity_duration_minutes: updates.activityDurationMinutes,
      activity_types: updates.activityTypes,
      activity_intensity: updates.activityIntensity,
      is_sedentary: updates.isSedentary,
      diet_type: updates.dietType,
      diet_restrictions: updates.dietRestrictions,
      description: updates.description,
      comment: updates.comment,
    })
    .eq('id', id);

  if (error) {
    console.error('[MedicalHistory] Error updating lifestyle:', error);
    throw error;
  }
}

export async function deletePatientLifestyle(id: string): Promise<void> {
  const { error } = await supabase
    .from('patient_lifestyle')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[MedicalHistory] Error deleting lifestyle:', error);
    throw error;
  }
}

// ==================== DEVICES ====================

export async function fetchPatientDevices(patientId: string): Promise<PatientDevice[]> {
  const { data, error } = await supabase
    .from('patient_devices')
    .select('*')
    .eq('patient_id', patientId)
    .order('is_active', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[MedicalHistory] Error fetching devices:', error);
    throw error;
  }

  return (data || []).map(mapDbToDevice);
}

export async function createPatientDevice(
  patientId: string,
  input: Partial<PatientDevice>
): Promise<PatientDevice> {
  const { data, error } = await supabase
    .from('patient_devices')
    .insert({
      patient_id: patientId,
      device_type: input.deviceType,
      device_name: input.deviceName,
      device_model: input.deviceModel,
      device_serial_number: input.deviceSerialNumber,
      implant_date: input.implantDate?.toISOString().split('T')[0],
      manufacturer: input.manufacturer,
      body_location: input.bodyLocation,
      follow_up_frequency: input.followUpFrequency,
      next_follow_up_date: input.nextFollowUpDate?.toISOString().split('T')[0],
      notes: input.notes,
      mri_compatible: input.mriCompatible,
      alerts: input.alerts,
    })
    .select()
    .single();

  if (error) {
    console.error('[MedicalHistory] Error creating device:', error);
    throw error;
  }

  return mapDbToDevice(data);
}

export async function updatePatientDevice(id: string, updates: Partial<PatientDevice>): Promise<void> {
  const { error } = await supabase
    .from('patient_devices')
    .update({
      device_type: updates.deviceType,
      device_name: updates.deviceName,
      device_model: updates.deviceModel,
      device_serial_number: updates.deviceSerialNumber,
      implant_date: updates.implantDate?.toISOString().split('T')[0],
      manufacturer: updates.manufacturer,
      body_location: updates.bodyLocation,
      follow_up_frequency: updates.followUpFrequency,
      next_follow_up_date: updates.nextFollowUpDate?.toISOString().split('T')[0],
      is_active: updates.isActive,
      removal_date: updates.removalDate?.toISOString().split('T')[0],
      removal_reason: updates.removalReason,
      notes: updates.notes,
      mri_compatible: updates.mriCompatible,
      alerts: updates.alerts,
    })
    .eq('id', id);

  if (error) {
    console.error('[MedicalHistory] Error updating device:', error);
    throw error;
  }
}

export async function deletePatientDevice(id: string): Promise<void> {
  const { error } = await supabase
    .from('patient_devices')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[MedicalHistory] Error deleting device:', error);
    throw error;
  }
}

// ==================== FAMILY HISTORY ====================

export async function fetchPatientFamilyHistory(patientId: string): Promise<PatientFamilyHistory[]> {
  const { data, error } = await supabase
    .from('patient_family_history')
    .select('*')
    .eq('patient_id', patientId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[MedicalHistory] Error fetching family history:', error);
    throw error;
  }

  return (data || []).map(mapDbToFamilyHistory);
}

export async function createPatientFamilyHistory(
  patientId: string,
  input: Partial<PatientFamilyHistory>
): Promise<PatientFamilyHistory> {
  const { data, error } = await supabase
    .from('patient_family_history')
    .insert({
      patient_id: patientId,
      relative_type: input.relativeType,
      relative_gender: input.relativeGender,
      condition_title: input.conditionTitle,
      terminology_code: input.terminologyCode,
      terminology_system: input.terminologySystem,
      age_at_diagnosis: input.ageAtDiagnosis,
      year_of_diagnosis: input.yearOfDiagnosis,
      is_cause_of_death: input.isCauseOfDeath,
      age_at_death: input.ageAtDeath,
      notes: input.notes,
    })
    .select()
    .single();

  if (error) {
    console.error('[MedicalHistory] Error creating family history:', error);
    throw error;
  }

  return mapDbToFamilyHistory(data);
}

export async function deletePatientFamilyHistory(id: string): Promise<void> {
  const { error } = await supabase
    .from('patient_family_history')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error('[MedicalHistory] Error deleting family history:', error);
    throw error;
  }
}

// ==================== PERINATAL ====================

export async function fetchPatientPerinatal(patientId: string): Promise<PatientPerinatal | null> {
  const { data, error } = await supabase
    .from('patient_perinatal')
    .select('*')
    .eq('patient_id', patientId)
    .maybeSingle();

  if (error) {
    console.error('[MedicalHistory] Error fetching perinatal:', error);
    throw error;
  }

  return data ? mapDbToPerinatal(data) : null;
}

export async function upsertPatientPerinatal(
  patientId: string,
  input: Partial<PatientPerinatal>
): Promise<PatientPerinatal> {
  const isPremature = input.gestationalAgeWeeks != null && input.gestationalAgeWeeks <= 36;
  
  const { data, error } = await supabase
    .from('patient_perinatal')
    .upsert({
      patient_id: patientId,
      gestational_age_weeks: input.gestationalAgeWeeks,
      gestational_age_days: input.gestationalAgeDays,
      is_premature: isPremature,
      birth_weight_grams: input.birthWeightGrams,
      apgar_1min: input.apgar1min,
      apgar_5min: input.apgar5min,
      apgar_10min: input.apgar10min,
      complications: input.complications,
      delivery_type: input.deliveryType,
      birth_context: input.birthContext,
      neonatal_hospitalization: input.neonatalHospitalization,
      neonatal_hospitalization_days: input.neonatalHospitalizationDays,
      breastfeeding_duration_months: input.breastfeedingDurationMonths,
      notes: input.notes,
    }, { onConflict: 'patient_id' })
    .select()
    .single();

  if (error) {
    console.error('[MedicalHistory] Error upserting perinatal:', error);
    throw error;
  }

  return mapDbToPerinatal(data);
}

// ==================== GYNECO-OBSTETRIC ====================

export async function fetchPatientGynecoObstetric(patientId: string): Promise<PatientGynecoObstetric | null> {
  const { data, error } = await supabase
    .from('patient_gyneco_obstetric')
    .select('*')
    .eq('patient_id', patientId)
    .maybeSingle();

  if (error) {
    console.error('[MedicalHistory] Error fetching gyneco:', error);
    throw error;
  }

  return data ? mapDbToGynecoObstetric(data) : null;
}

export async function upsertPatientGynecoObstetric(
  patientId: string,
  input: Partial<PatientGynecoObstetric>
): Promise<PatientGynecoObstetric> {
  const { data, error } = await supabase
    .from('patient_gyneco_obstetric')
    .upsert({
      patient_id: patientId,
      menarche_age: input.menarcheAge,
      menopause_age: input.menopauseAge,
      is_menopausal: input.isMenopausal,
      cycle_regularity: input.cycleRegularity,
      cycle_duration_days: input.cycleDurationDays,
      gravidity: input.gravidity,
      parity: input.parity,
      living_children: input.livingChildren,
      miscarriages: input.miscarriages,
      voluntary_terminations: input.voluntaryTerminations,
      medical_terminations: input.medicalTerminations,
      ectopic_pregnancies: input.ectopicPregnancies,
      cesarean_count: input.cesareanCount,
      last_period_date: input.lastPeriodDate?.toISOString().split('T')[0],
      last_pap_smear_date: input.lastPapSmearDate?.toISOString().split('T')[0],
      last_mammogram_date: input.lastMammogramDate?.toISOString().split('T')[0],
      contraception_method: input.contraceptionMethod,
      hrt_use: input.hrtUse,
      notes: input.notes,
    }, { onConflict: 'patient_id' })
    .select()
    .single();

  if (error) {
    console.error('[MedicalHistory] Error upserting gyneco:', error);
    throw error;
  }

  return mapDbToGynecoObstetric(data);
}

// ==================== MAPPERS ====================

function mapDbToLifestyle(db: any): PatientLifestyle {
  return {
    id: db.id,
    patientId: db.patient_id,
    category: db.category,
    status: db.status,
    level: db.level,
    tobaccoType: db.tobacco_type,
    tobaccoQuantityPerDay: db.tobacco_quantity_per_day,
    tobaccoPackYears: db.tobacco_pack_years ? Number(db.tobacco_pack_years) : null,
    tobaccoStartAge: db.tobacco_start_age,
    tobaccoStopDate: db.tobacco_stop_date ? new Date(db.tobacco_stop_date) : null,
    tobaccoQuitAttempts: db.tobacco_quit_attempts,
    alcoholGlassesPerWeek: db.alcohol_glasses_per_week,
    alcoholType: db.alcohol_type,
    alcoholBingeDrinking: db.alcohol_binge_drinking,
    activityFrequencyPerWeek: db.activity_frequency_per_week,
    activityDurationMinutes: db.activity_duration_minutes,
    activityTypes: db.activity_types || [],
    activityIntensity: db.activity_intensity,
    isSedentary: db.is_sedentary,
    dietType: db.diet_type,
    dietRestrictions: db.diet_restrictions || [],
    description: db.description,
    comment: db.comment,
    recordedDate: db.recorded_date ? new Date(db.recorded_date) : null,
    createdAt: new Date(db.created_at),
    updatedAt: new Date(db.updated_at),
  };
}

function mapDbToDevice(db: any): PatientDevice {
  return {
    id: db.id,
    patientId: db.patient_id,
    deviceType: db.device_type,
    deviceName: db.device_name,
    deviceModel: db.device_model,
    deviceSerialNumber: db.device_serial_number,
    implantDate: db.implant_date ? new Date(db.implant_date) : null,
    manufacturer: db.manufacturer,
    bodyLocation: db.body_location,
    followUpFrequency: db.follow_up_frequency,
    nextFollowUpDate: db.next_follow_up_date ? new Date(db.next_follow_up_date) : null,
    isActive: db.is_active ?? true,
    removalDate: db.removal_date ? new Date(db.removal_date) : null,
    removalReason: db.removal_reason,
    notes: db.notes,
    mriCompatible: db.mri_compatible,
    alerts: db.alerts || [],
    createdAt: new Date(db.created_at),
    updatedAt: new Date(db.updated_at),
  };
}

function mapDbToFamilyHistory(db: any): PatientFamilyHistory {
  return {
    id: db.id,
    patientId: db.patient_id,
    relativeType: db.relative_type,
    relativeGender: db.relative_gender,
    conditionTitle: db.condition_title,
    terminologyCode: db.terminology_code,
    terminologySystem: db.terminology_system,
    ageAtDiagnosis: db.age_at_diagnosis,
    yearOfDiagnosis: db.year_of_diagnosis,
    isCauseOfDeath: db.is_cause_of_death ?? false,
    ageAtDeath: db.age_at_death,
    isActive: db.is_active ?? true,
    notes: db.notes,
    createdAt: new Date(db.created_at),
    updatedAt: new Date(db.updated_at),
  };
}

function mapDbToPerinatal(db: any): PatientPerinatal {
  return {
    id: db.id,
    patientId: db.patient_id,
    gestationalAgeWeeks: db.gestational_age_weeks,
    gestationalAgeDays: db.gestational_age_days,
    isPremature: db.is_premature,
    birthWeightGrams: db.birth_weight_grams,
    apgar1min: db.apgar_1min,
    apgar5min: db.apgar_5min,
    apgar10min: db.apgar_10min,
    complications: db.complications || [],
    deliveryType: db.delivery_type,
    birthContext: db.birth_context,
    neonatalHospitalization: db.neonatal_hospitalization ?? false,
    neonatalHospitalizationDays: db.neonatal_hospitalization_days,
    breastfeedingDurationMonths: db.breastfeeding_duration_months,
    notes: db.notes,
    createdAt: new Date(db.created_at),
    updatedAt: new Date(db.updated_at),
  };
}

function mapDbToGynecoObstetric(db: any): PatientGynecoObstetric {
  return {
    id: db.id,
    patientId: db.patient_id,
    menarcheAge: db.menarche_age,
    menopauseAge: db.menopause_age,
    isMenopausal: db.is_menopausal,
    cycleRegularity: db.cycle_regularity,
    cycleDurationDays: db.cycle_duration_days,
    gravidity: db.gravidity ?? 0,
    parity: db.parity ?? 0,
    livingChildren: db.living_children ?? 0,
    miscarriages: db.miscarriages ?? 0,
    voluntaryTerminations: db.voluntary_terminations ?? 0,
    medicalTerminations: db.medical_terminations ?? 0,
    ectopicPregnancies: db.ectopic_pregnancies ?? 0,
    cesareanCount: db.cesarean_count ?? 0,
    lastPeriodDate: db.last_period_date ? new Date(db.last_period_date) : null,
    lastPapSmearDate: db.last_pap_smear_date ? new Date(db.last_pap_smear_date) : null,
    lastMammogramDate: db.last_mammogram_date ? new Date(db.last_mammogram_date) : null,
    contraceptionMethod: db.contraception_method,
    hrtUse: db.hrt_use ?? false,
    notes: db.notes,
    createdAt: new Date(db.created_at),
    updatedAt: new Date(db.updated_at),
  };
}
