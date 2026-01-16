/**
 * Medical History Hooks - Enterprise Grade
 * React Query hooks for antecedents, lifestyle, devices, family history
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as medicalHistoryService from '@/services/supabase/medicalHistoryService';
import type {
  MedicalTerminology,
  PatientLifestyle,
  PatientDevice,
  PatientFamilyHistory,
  PatientPerinatal,
  PatientGynecoObstetric,
} from '@/services/supabase/medicalHistoryService';

// Re-export types
export type {
  MedicalTerminology,
  PatientLifestyle,
  PatientDevice,
  PatientFamilyHistory,
  PatientPerinatal,
  PatientGynecoObstetric,
};

// Query keys
export const medicalHistoryKeys = {
  all: ['medicalHistory'] as const,
  terminology: (query: string, category?: string) => 
    [...medicalHistoryKeys.all, 'terminology', query, category] as const,
  lifestyle: (patientId: string) => 
    [...medicalHistoryKeys.all, 'lifestyle', patientId] as const,
  devices: (patientId: string) => 
    [...medicalHistoryKeys.all, 'devices', patientId] as const,
  familyHistory: (patientId: string) => 
    [...medicalHistoryKeys.all, 'familyHistory', patientId] as const,
  perinatal: (patientId: string) => 
    [...medicalHistoryKeys.all, 'perinatal', patientId] as const,
  gynecoObstetric: (patientId: string) => 
    [...medicalHistoryKeys.all, 'gynecoObstetric', patientId] as const,
};

// ==================== TERMINOLOGY ====================

export function useSearchMedicalTerminology(
  query: string,
  options?: { category?: string; enabled?: boolean }
) {
  return useQuery({
    queryKey: medicalHistoryKeys.terminology(query, options?.category),
    queryFn: () => medicalHistoryService.searchMedicalTerminology(query, {
      category: options?.category,
      limit: 10,
    }),
    enabled: (options?.enabled ?? true) && query.length >= 2,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

// ==================== LIFESTYLE ====================

export function usePatientLifestyle(patientId: string) {
  return useQuery({
    queryKey: medicalHistoryKeys.lifestyle(patientId),
    queryFn: () => medicalHistoryService.fetchPatientLifestyle(patientId),
    enabled: !!patientId,
  });
}

export function useCreatePatientLifestyle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ patientId, input }: { patientId: string; input: Partial<PatientLifestyle> }) =>
      medicalHistoryService.createPatientLifestyle(patientId, input),
    onSuccess: (_, { patientId }) => {
      queryClient.invalidateQueries({ queryKey: medicalHistoryKeys.lifestyle(patientId) });
      toast.success('Mode de vie ajouté');
    },
    onError: (error) => {
      console.error('Error creating lifestyle:', error);
      toast.error("Erreur lors de l'ajout");
    },
  });
}

export function useUpdatePatientLifestyle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, patientId, updates }: { id: string; patientId: string; updates: Partial<PatientLifestyle> }) =>
      medicalHistoryService.updatePatientLifestyle(id, updates),
    onSuccess: (_, { patientId }) => {
      queryClient.invalidateQueries({ queryKey: medicalHistoryKeys.lifestyle(patientId) });
      toast.success('Mode de vie mis à jour');
    },
    onError: (error) => {
      console.error('Error updating lifestyle:', error);
      toast.error('Erreur lors de la mise à jour');
    },
  });
}

export function useDeletePatientLifestyle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, patientId }: { id: string; patientId: string }) =>
      medicalHistoryService.deletePatientLifestyle(id),
    onSuccess: (_, { patientId }) => {
      queryClient.invalidateQueries({ queryKey: medicalHistoryKeys.lifestyle(patientId) });
      toast.success('Mode de vie supprimé');
    },
    onError: (error) => {
      console.error('Error deleting lifestyle:', error);
      toast.error('Erreur lors de la suppression');
    },
  });
}

// ==================== DEVICES ====================

export function usePatientDevices(patientId: string) {
  return useQuery({
    queryKey: medicalHistoryKeys.devices(patientId),
    queryFn: () => medicalHistoryService.fetchPatientDevices(patientId),
    enabled: !!patientId,
  });
}

export function useCreatePatientDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ patientId, input }: { patientId: string; input: Partial<PatientDevice> }) =>
      medicalHistoryService.createPatientDevice(patientId, input),
    onSuccess: (_, { patientId }) => {
      queryClient.invalidateQueries({ queryKey: medicalHistoryKeys.devices(patientId) });
      toast.success('Dispositif ajouté');
    },
    onError: (error) => {
      console.error('Error creating device:', error);
      toast.error("Erreur lors de l'ajout");
    },
  });
}

export function useUpdatePatientDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, patientId, updates }: { id: string; patientId: string; updates: Partial<PatientDevice> }) =>
      medicalHistoryService.updatePatientDevice(id, updates),
    onSuccess: (_, { patientId }) => {
      queryClient.invalidateQueries({ queryKey: medicalHistoryKeys.devices(patientId) });
      toast.success('Dispositif mis à jour');
    },
    onError: (error) => {
      console.error('Error updating device:', error);
      toast.error('Erreur lors de la mise à jour');
    },
  });
}

export function useDeletePatientDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, patientId }: { id: string; patientId: string }) =>
      medicalHistoryService.deletePatientDevice(id),
    onSuccess: (_, { patientId }) => {
      queryClient.invalidateQueries({ queryKey: medicalHistoryKeys.devices(patientId) });
      toast.success('Dispositif supprimé');
    },
    onError: (error) => {
      console.error('Error deleting device:', error);
      toast.error('Erreur lors de la suppression');
    },
  });
}

// ==================== FAMILY HISTORY ====================

export function usePatientFamilyHistory(patientId: string) {
  return useQuery({
    queryKey: medicalHistoryKeys.familyHistory(patientId),
    queryFn: () => medicalHistoryService.fetchPatientFamilyHistory(patientId),
    enabled: !!patientId,
  });
}

export function useCreatePatientFamilyHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ patientId, input }: { patientId: string; input: Partial<PatientFamilyHistory> }) =>
      medicalHistoryService.createPatientFamilyHistory(patientId, input),
    onSuccess: (_, { patientId }) => {
      queryClient.invalidateQueries({ queryKey: medicalHistoryKeys.familyHistory(patientId) });
      toast.success('Antécédent familial ajouté');
    },
    onError: (error) => {
      console.error('Error creating family history:', error);
      toast.error("Erreur lors de l'ajout");
    },
  });
}

export function useDeletePatientFamilyHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, patientId }: { id: string; patientId: string }) =>
      medicalHistoryService.deletePatientFamilyHistory(id),
    onSuccess: (_, { patientId }) => {
      queryClient.invalidateQueries({ queryKey: medicalHistoryKeys.familyHistory(patientId) });
      toast.success('Antécédent familial supprimé');
    },
    onError: (error) => {
      console.error('Error deleting family history:', error);
      toast.error('Erreur lors de la suppression');
    },
  });
}

// ==================== PERINATAL ====================

export function usePatientPerinatal(patientId: string) {
  return useQuery({
    queryKey: medicalHistoryKeys.perinatal(patientId),
    queryFn: () => medicalHistoryService.fetchPatientPerinatal(patientId),
    enabled: !!patientId,
  });
}

export function useUpsertPatientPerinatal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ patientId, input }: { patientId: string; input: Partial<PatientPerinatal> }) =>
      medicalHistoryService.upsertPatientPerinatal(patientId, input),
    onSuccess: (_, { patientId }) => {
      queryClient.invalidateQueries({ queryKey: medicalHistoryKeys.perinatal(patientId) });
      toast.success('Informations périnatales enregistrées');
    },
    onError: (error) => {
      console.error('Error upserting perinatal:', error);
      toast.error('Erreur lors de la sauvegarde');
    },
  });
}

// ==================== GYNECO-OBSTETRIC ====================

export function usePatientGynecoObstetric(patientId: string) {
  return useQuery({
    queryKey: medicalHistoryKeys.gynecoObstetric(patientId),
    queryFn: () => medicalHistoryService.fetchPatientGynecoObstetric(patientId),
    enabled: !!patientId,
  });
}

export function useUpsertPatientGynecoObstetric() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ patientId, input }: { patientId: string; input: Partial<PatientGynecoObstetric> }) =>
      medicalHistoryService.upsertPatientGynecoObstetric(patientId, input),
    onSuccess: (_, { patientId }) => {
      queryClient.invalidateQueries({ queryKey: medicalHistoryKeys.gynecoObstetric(patientId) });
      toast.success('Informations gynécologiques enregistrées');
    },
    onError: (error) => {
      console.error('Error upserting gyneco:', error);
      toast.error('Erreur lors de la sauvegarde');
    },
  });
}
