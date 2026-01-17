/**
 * PerinatalSection - Informations périnatales (0-3 ans)
 * Visible pour enfants < 3 ans ou si déjà renseigné
 */

import React, { useState, useEffect } from 'react';
import { Baby, Pencil, Check, X, AlertTriangle } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import {
  usePatientPerinatal,
  useUpsertPatientPerinatal,
  type PatientPerinatal,
} from '@/hooks/data/useMedicalHistory';
import { differenceInYears } from 'date-fns';

interface PerinatalSectionProps {
  patientId: string;
  dateOfBirth: string;
}

const PerinatalSection: React.FC<PerinatalSectionProps> = ({ patientId, dateOfBirth }) => {
  const { data: perinatal, isLoading } = usePatientPerinatal(patientId);
  const upsertPerinatal = useUpsertPatientPerinatal();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<PatientPerinatal>>({});

  // Calculate age
  const age = differenceInYears(new Date(), new Date(dateOfBirth));
  
  // Show section if age < 3 OR if data already exists
  const shouldShow = age < 3 || perinatal !== null;

  useEffect(() => {
    if (perinatal) {
      setFormData(perinatal);
    }
  }, [perinatal]);

  const handleOpenEdit = () => {
    setFormData(perinatal || {});
    setEditModalOpen(true);
  };

  const handleSave = async () => {
    await upsertPerinatal.mutateAsync({
      patientId,
      input: formData,
    });
    setEditModalOpen(false);
  };

  if (!shouldShow) return null;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations périnatales</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const hasData = perinatal !== null;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Baby className="h-4 w-4 text-primary" />
              Informations périnatales
              {perinatal?.isPremature && (
                <Badge className="bg-orange-100 text-orange-800 text-xs">
                  Prématuré
                </Badge>
              )}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={handleOpenEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {hasData ? (
            <div className="grid grid-cols-2 gap-4 text-sm">
              {perinatal.gestationalAgeWeeks && (
                <div>
                  <span className="text-muted-foreground">Âge gestationnel:</span>
                  <span className="ml-2 font-medium">
                    {perinatal.gestationalAgeWeeks} SA
                    {perinatal.gestationalAgeDays ? ` + ${perinatal.gestationalAgeDays}j` : ''}
                  </span>
                </div>
              )}
              {perinatal.birthWeightGrams && (
                <div>
                  <span className="text-muted-foreground">Poids naissance:</span>
                  <span className="ml-2 font-medium">{perinatal.birthWeightGrams}g</span>
                </div>
              )}
              {(perinatal.apgar1min || perinatal.apgar5min) && (
                <div>
                  <span className="text-muted-foreground">APGAR:</span>
                  <span className="ml-2 font-medium">
                    {perinatal.apgar1min ?? '-'}/{perinatal.apgar5min ?? '-'}
                    {perinatal.apgar10min ? `/${perinatal.apgar10min}` : ''}
                  </span>
                </div>
              )}
              {perinatal.deliveryType && (
                <div>
                  <span className="text-muted-foreground">Accouchement:</span>
                  <span className="ml-2 font-medium capitalize">{perinatal.deliveryType}</span>
                </div>
              )}
              {perinatal.neonatalHospitalization && (
                <div className="col-span-2 flex items-center gap-1 text-orange-600">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Hospitalisation néonatale
                  {perinatal.neonatalHospitalizationDays && (
                    <span>({perinatal.neonatalHospitalizationDays} jours)</span>
                  )}
                </div>
              )}
              {perinatal.complications && perinatal.complications.length > 0 && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Complications:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {perinatal.complications.map((c, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {perinatal.notes && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Notes:</span>
                  <p className="mt-1 text-foreground">{perinatal.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-3">
                Aucune information périnatale renseignée
              </p>
              <Button variant="outline" size="sm" onClick={handleOpenEdit}>
                Renseigner
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Baby className="h-5 w-5" />
              Informations périnatales
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Gestational age */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Âge gestationnel (SA)</Label>
                <Input
                  type="number"
                  min={24}
                  max={42}
                  value={formData.gestationalAgeWeeks || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    gestationalAgeWeeks: parseInt(e.target.value) || undefined,
                  })}
                  placeholder="37"
                />
              </div>
              <div className="space-y-2">
                <Label>Jours supplémentaires</Label>
                <Input
                  type="number"
                  min={0}
                  max={6}
                  value={formData.gestationalAgeDays || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    gestationalAgeDays: parseInt(e.target.value) || undefined,
                  })}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Birth weight */}
            <div className="space-y-2">
              <Label>Poids de naissance (g)</Label>
              <Input
                type="number"
                min={500}
                max={6000}
                value={formData.birthWeightGrams || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  birthWeightGrams: parseInt(e.target.value) || undefined,
                })}
                placeholder="3200"
              />
            </div>

            {/* APGAR scores */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>APGAR 1 min</Label>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  value={formData.apgar1min ?? ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    apgar1min: e.target.value ? parseInt(e.target.value) : undefined,
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>APGAR 5 min</Label>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  value={formData.apgar5min ?? ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    apgar5min: e.target.value ? parseInt(e.target.value) : undefined,
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>APGAR 10 min</Label>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  value={formData.apgar10min ?? ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    apgar10min: e.target.value ? parseInt(e.target.value) : undefined,
                  })}
                />
              </div>
            </div>

            {/* Delivery type */}
            <div className="space-y-2">
              <Label>Type d'accouchement</Label>
              <Select
                value={formData.deliveryType || ''}
                onValueChange={(value) => setFormData({ ...formData, deliveryType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vaginal">Voie basse</SelectItem>
                  <SelectItem value="vaginal_instrumental">Voie basse instrumentale</SelectItem>
                  <SelectItem value="cesarean_planned">Césarienne programmée</SelectItem>
                  <SelectItem value="cesarean_emergency">Césarienne en urgence</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Neonatal hospitalization */}
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <Label>Hospitalisation néonatale</Label>
                <p className="text-xs text-muted-foreground">Néonatologie ou réanimation</p>
              </div>
              <Switch
                checked={formData.neonatalHospitalization || false}
                onCheckedChange={(checked) => setFormData({
                  ...formData,
                  neonatalHospitalization: checked,
                })}
              />
            </div>

            {formData.neonatalHospitalization && (
              <div className="space-y-2">
                <Label>Durée (jours)</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.neonatalHospitalizationDays || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    neonatalHospitalizationDays: parseInt(e.target.value) || undefined,
                  })}
                />
              </div>
            )}

            {/* Breastfeeding */}
            <div className="space-y-2">
              <Label>Durée allaitement (mois)</Label>
              <Input
                type="number"
                min={0}
                value={formData.breastfeedingDurationMonths || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  breastfeedingDurationMonths: parseInt(e.target.value) || undefined,
                })}
              />
            </div>

            {/* Birth context */}
            <div className="space-y-2">
              <Label>Contexte de naissance</Label>
              <Textarea
                value={formData.birthContext || ''}
                onChange={(e) => setFormData({ ...formData, birthContext: e.target.value })}
                placeholder="Contexte particulier (grossesse, accouchement)..."
                rows={2}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observations complémentaires..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={upsertPerinatal.isPending}>
              {upsertPerinatal.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PerinatalSection;
