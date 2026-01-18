/**
 * FamilyHistorySection - Antécédents familiaux détaillés
 * Multi-proches, codage, âge de survenue
 */

import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Trash2,
  AlertTriangle,
  Skull,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import {
  usePatientFamilyHistory,
  useCreatePatientFamilyHistory,
  useDeletePatientFamilyHistory,
  type PatientFamilyHistory,
} from '@/hooks/data/useMedicalHistory';
import SmartSearchInput from './SmartSearchInput';

interface FamilyHistorySectionProps {
  patientId: string;
}

const relativeTypes = [
  { value: 'father', label: 'Père' },
  { value: 'mother', label: 'Mère' },
  { value: 'brother', label: 'Frère' },
  { value: 'sister', label: 'Sœur' },
  { value: 'paternal_grandfather', label: 'Grand-père paternel' },
  { value: 'paternal_grandmother', label: 'Grand-mère paternelle' },
  { value: 'maternal_grandfather', label: 'Grand-père maternel' },
  { value: 'maternal_grandmother', label: 'Grand-mère maternelle' },
  { value: 'paternal_uncle', label: 'Oncle paternel' },
  { value: 'paternal_aunt', label: 'Tante paternelle' },
  { value: 'maternal_uncle', label: 'Oncle maternel' },
  { value: 'maternal_aunt', label: 'Tante maternelle' },
  { value: 'son', label: 'Fils' },
  { value: 'daughter', label: 'Fille' },
  { value: 'other', label: 'Autre' },
];

const getRelativeLabel = (value: string) => 
  relativeTypes.find(r => r.value === value)?.label || value;

const FamilyHistorySection: React.FC<FamilyHistorySectionProps> = ({ patientId }) => {
  const { data: familyHistory, isLoading } = usePatientFamilyHistory(patientId);
  const createFamilyHistory = useCreatePatientFamilyHistory();
  const deleteFamilyHistory = useDeletePatientFamilyHistory();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PatientFamilyHistory | null>(null);
  const [formData, setFormData] = useState<Partial<PatientFamilyHistory>>({});

  const handleOpenCreate = () => {
    setFormData({});
    setAddModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.relativeType || !formData.conditionTitle) return;
    
    await createFamilyHistory.mutateAsync({
      patientId,
      input: formData,
    });
    setAddModalOpen(false);
  };

  const handleDelete = async () => {
    if (selectedItem) {
      await deleteFamilyHistory.mutateAsync({ id: selectedItem.id, patientId });
      setDeleteDialogOpen(false);
      setSelectedItem(null);
    }
  };

  const openDeleteDialog = (item: PatientFamilyHistory) => {
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  };

  const handleTerminologySelect = (term: { code: string; display: string; system: string }) => {
    setFormData({
      ...formData,
      conditionTitle: term.display,
      terminologyCode: term.code,
      terminologySystem: term.system,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Antécédents familiaux</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Group by relative type
  const groupedHistory = (familyHistory || []).reduce((acc, item) => {
    const key = item.relativeType;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, PatientFamilyHistory[]>);

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Antécédents familiaux
              {familyHistory && familyHistory.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {familyHistory.length}
                </Badge>
              )}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleOpenCreate} className="gap-1">
              <Plus className="h-4 w-4" />
              Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {familyHistory && familyHistory.length > 0 ? (
            <div className="space-y-4">
              {Object.entries(groupedHistory).map(([relativeType, items]) => (
                <div key={relativeType} className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    {getRelativeLabel(relativeType)}
                  </h4>
                  <div className="space-y-2 pl-3 border-l-2 border-muted">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 group"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{item.conditionTitle}</span>
                          {item.terminologyCode && (
                            <Badge variant="outline" className="text-xs font-mono">
                              {item.terminologyCode}
                            </Badge>
                          )}
                          {item.ageAtDiagnosis && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              à {item.ageAtDiagnosis} ans
                            </span>
                          )}
                          {item.isCauseOfDeath && (
                            <Badge variant="destructive" className="text-xs gap-1">
                              <Skull className="h-3 w-3" />
                              Décès
                              {item.ageAtDeath && ` (${item.ageAtDeath} ans)`}
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                          onClick={() => openDeleteDialog(item)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic text-center py-4">
              Aucun antécédent familial enregistré
            </p>
          )}
        </CardContent>
      </Card>

      {/* Add Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Ajouter un antécédent familial
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Relative type */}
            <div className="space-y-2">
              <Label>Membre de la famille *</Label>
              <Select
                value={formData.relativeType || ''}
                onValueChange={(value) => setFormData({ ...formData, relativeType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {relativeTypes.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Condition with smart search */}
            <div className="space-y-2">
              <Label>Pathologie / Condition *</Label>
              <SmartSearchInput
                category="condition"
                placeholder="Rechercher une pathologie..."
                onSelect={(term, freeText) => {
                  if (term) {
                    setFormData({
                      ...formData,
                      conditionTitle: term.display,
                      terminologyCode: term.code,
                      terminologySystem: term.system,
                    });
                  } else if (freeText) {
                    setFormData({
                      ...formData,
                      conditionTitle: freeText,
                      terminologyCode: undefined,
                      terminologySystem: undefined,
                    });
                  }
                }}
              />
              {formData.terminologyCode && (
                <p className="text-xs text-muted-foreground">
                  Code: {formData.terminologyCode} ({formData.terminologySystem})
                </p>
              )}
            </div>

            {/* Age at diagnosis */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Âge au diagnostic</Label>
                <Input
                  type="number"
                  min={0}
                  max={120}
                  value={formData.ageAtDiagnosis || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    ageAtDiagnosis: parseInt(e.target.value) || undefined,
                  })}
                  placeholder="ans"
                />
              </div>
              <div className="space-y-2">
                <Label>Année du diagnostic</Label>
                <Input
                  type="number"
                  min={1900}
                  max={new Date().getFullYear()}
                  value={formData.yearOfDiagnosis || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    yearOfDiagnosis: parseInt(e.target.value) || undefined,
                  })}
                />
              </div>
            </div>

            {/* Cause of death */}
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <Label>Cause de décès</Label>
                <p className="text-xs text-muted-foreground">Cette pathologie a causé le décès</p>
              </div>
              <Switch
                checked={formData.isCauseOfDeath || false}
                onCheckedChange={(checked) => setFormData({
                  ...formData,
                  isCauseOfDeath: checked,
                })}
              />
            </div>

            {formData.isCauseOfDeath && (
              <div className="space-y-2">
                <Label>Âge au décès</Label>
                <Input
                  type="number"
                  min={0}
                  max={120}
                  value={formData.ageAtDeath || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    ageAtDeath: parseInt(e.target.value) || undefined,
                  })}
                  placeholder="ans"
                />
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Informations complémentaires..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!formData.relativeType || !formData.conditionTitle || createFamilyHistory.isPending}
            >
              {createFamilyHistory.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet antécédent ?</AlertDialogTitle>
            <AlertDialogDescription>
              L'antécédent "{selectedItem?.conditionTitle}" ({getRelativeLabel(selectedItem?.relativeType || '')}) 
              sera supprimé du dossier patient.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default FamilyHistorySection;
