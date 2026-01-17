/**
 * GynecoObstetricSection - Antécédents gynécologiques et obstétricaux
 * Visible uniquement pour patientes de sexe féminin
 */

import React, { useState, useEffect } from 'react';
import { Heart, Pencil, Baby, Calendar } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  usePatientGynecoObstetric,
  useUpsertPatientGynecoObstetric,
  type PatientGynecoObstetric,
} from '@/hooks/data/useMedicalHistory';

interface GynecoObstetricSectionProps {
  patientId: string;
  gender: string;
}

const GynecoObstetricSection: React.FC<GynecoObstetricSectionProps> = ({ patientId, gender }) => {
  const { data: gyneco, isLoading } = usePatientGynecoObstetric(patientId);
  const upsertGyneco = useUpsertPatientGynecoObstetric();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<PatientGynecoObstetric>>({});

  // Only show for female patients
  if (gender.toLowerCase() !== 'female' && gender.toLowerCase() !== 'f' && gender.toLowerCase() !== 'femme') {
    return null;
  }

  useEffect(() => {
    if (gyneco) {
      setFormData(gyneco);
    }
  }, [gyneco]);

  const handleOpenEdit = () => {
    setFormData(gyneco || {
      gravidity: 0,
      parity: 0,
      livingChildren: 0,
      miscarriages: 0,
      voluntaryTerminations: 0,
      medicalTerminations: 0,
      ectopicPregnancies: 0,
      cesareanCount: 0,
    });
    setEditModalOpen(true);
  };

  const handleSave = async () => {
    await upsertGyneco.mutateAsync({
      patientId,
      input: formData,
    });
    setEditModalOpen(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gynécologie / Obstétrique</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const hasData = gyneco !== null;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="h-4 w-4 text-pink-500" />
              Gynécologie / Obstétrique
              {gyneco?.isMenopausal && (
                <Badge variant="secondary" className="text-xs">
                  Ménopausée
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
            <div className="space-y-4">
              {/* Cycle info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {gyneco.menarcheAge && (
                  <div>
                    <span className="text-muted-foreground">Ménarche:</span>
                    <span className="ml-2 font-medium">{gyneco.menarcheAge} ans</span>
                  </div>
                )}
                {gyneco.cycleRegularity && (
                  <div>
                    <span className="text-muted-foreground">Cycles:</span>
                    <span className="ml-2 font-medium capitalize">{gyneco.cycleRegularity}</span>
                  </div>
                )}
                {gyneco.isMenopausal && gyneco.menopauseAge && (
                  <div>
                    <span className="text-muted-foreground">Ménopause:</span>
                    <span className="ml-2 font-medium">{gyneco.menopauseAge} ans</span>
                  </div>
                )}
                {gyneco.contraceptionMethod && (
                  <div>
                    <span className="text-muted-foreground">Contraception:</span>
                    <span className="ml-2 font-medium">{gyneco.contraceptionMethod}</span>
                  </div>
                )}
              </div>

              {/* Obstetric formula */}
              <div className="p-3 rounded-lg bg-muted/30 border">
                <div className="flex items-center gap-2 mb-2">
                  <Baby className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">Formule obstétricale</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-sm">
                  <div className="p-2 rounded bg-background">
                    <div className="text-lg font-bold text-primary">{gyneco.gravidity}</div>
                    <div className="text-xs text-muted-foreground">Grossesses</div>
                  </div>
                  <div className="p-2 rounded bg-background">
                    <div className="text-lg font-bold text-primary">{gyneco.parity}</div>
                    <div className="text-xs text-muted-foreground">Parité</div>
                  </div>
                  <div className="p-2 rounded bg-background">
                    <div className="text-lg font-bold text-primary">{gyneco.livingChildren}</div>
                    <div className="text-xs text-muted-foreground">Enfants</div>
                  </div>
                  <div className="p-2 rounded bg-background">
                    <div className="text-lg font-bold text-primary">{gyneco.cesareanCount}</div>
                    <div className="text-xs text-muted-foreground">Césariennes</div>
                  </div>
                </div>
              </div>

              {/* Screening dates */}
              {(gyneco.lastPapSmearDate || gyneco.lastMammogramDate) && (
                <div className="flex flex-wrap gap-4 text-sm">
                  {gyneco.lastPapSmearDate && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">Frottis:</span>
                      <span className="font-medium">
                        {format(gyneco.lastPapSmearDate, 'dd/MM/yyyy', { locale: fr })}
                      </span>
                    </div>
                  )}
                  {gyneco.lastMammogramDate && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">Mammographie:</span>
                      <span className="font-medium">
                        {format(gyneco.lastMammogramDate, 'dd/MM/yyyy', { locale: fr })}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-3">
                Aucune information gynécologique renseignée
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
              <Heart className="h-5 w-5 text-pink-500" />
              Gynécologie / Obstétrique
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Menstrual cycle */}
            <div>
              <h4 className="text-sm font-medium mb-3">Cycle menstruel</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Âge des premières règles</Label>
                  <Input
                    type="number"
                    min={8}
                    max={20}
                    value={formData.menarcheAge || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      menarcheAge: parseInt(e.target.value) || undefined,
                    })}
                    placeholder="ans"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Durée du cycle (jours)</Label>
                  <Input
                    type="number"
                    min={21}
                    max={45}
                    value={formData.cycleDurationDays || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      cycleDurationDays: parseInt(e.target.value) || undefined,
                    })}
                    placeholder="28"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Régularité</Label>
                  <Select
                    value={formData.cycleRegularity || ''}
                    onValueChange={(value) => setFormData({ ...formData, cycleRegularity: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Régulier</SelectItem>
                      <SelectItem value="irregular">Irrégulier</SelectItem>
                      <SelectItem value="amenorrhea">Aménorrhée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date dernières règles</Label>
                  <Input
                    type="date"
                    value={formData.lastPeriodDate ? format(formData.lastPeriodDate, 'yyyy-MM-dd') : ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      lastPeriodDate: e.target.value ? new Date(e.target.value) : undefined,
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Menopause */}
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <Label>Ménopause</Label>
              </div>
              <Switch
                checked={formData.isMenopausal || false}
                onCheckedChange={(checked) => setFormData({
                  ...formData,
                  isMenopausal: checked,
                })}
              />
            </div>

            {formData.isMenopausal && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Âge à la ménopause</Label>
                  <Input
                    type="number"
                    min={35}
                    max={60}
                    value={formData.menopauseAge || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      menopauseAge: parseInt(e.target.value) || undefined,
                    })}
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <Label>THS (traitement hormonal)</Label>
                  <Switch
                    checked={formData.hrtUse || false}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      hrtUse: checked,
                    })}
                  />
                </div>
              </div>
            )}

            <Separator />

            {/* Obstetric history */}
            <div>
              <h4 className="text-sm font-medium mb-3">Antécédents obstétricaux</h4>
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-2">
                  <Label>Grossesses (G)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.gravidity ?? ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      gravidity: parseInt(e.target.value) || 0,
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Parité (P)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.parity ?? ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      parity: parseInt(e.target.value) || 0,
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Enfants vivants</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.livingChildren ?? ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      livingChildren: parseInt(e.target.value) || 0,
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Césariennes</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.cesareanCount ?? ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      cesareanCount: parseInt(e.target.value) || 0,
                    })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 mt-3">
                <div className="space-y-2">
                  <Label className="text-xs">Fausses couches</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.miscarriages ?? ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      miscarriages: parseInt(e.target.value) || 0,
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">IVG</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.voluntaryTerminations ?? ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      voluntaryTerminations: parseInt(e.target.value) || 0,
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">IMG</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.medicalTerminations ?? ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      medicalTerminations: parseInt(e.target.value) || 0,
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">GEU</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.ectopicPregnancies ?? ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      ectopicPregnancies: parseInt(e.target.value) || 0,
                    })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Contraception */}
            <div className="space-y-2">
              <Label>Contraception actuelle</Label>
              <Select
                value={formData.contraceptionMethod || ''}
                onValueChange={(value) => setFormData({ ...formData, contraceptionMethod: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune</SelectItem>
                  <SelectItem value="pill">Pilule</SelectItem>
                  <SelectItem value="iud_copper">DIU cuivre</SelectItem>
                  <SelectItem value="iud_hormonal">DIU hormonal</SelectItem>
                  <SelectItem value="implant">Implant</SelectItem>
                  <SelectItem value="patch">Patch</SelectItem>
                  <SelectItem value="ring">Anneau</SelectItem>
                  <SelectItem value="injection">Injection</SelectItem>
                  <SelectItem value="condom">Préservatif</SelectItem>
                  <SelectItem value="sterilization">Stérilisation</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Screening */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dernier frottis</Label>
                <Input
                  type="date"
                  value={formData.lastPapSmearDate ? format(formData.lastPapSmearDate, 'yyyy-MM-dd') : ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    lastPapSmearDate: e.target.value ? new Date(e.target.value) : undefined,
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>Dernière mammographie</Label>
                <Input
                  type="date"
                  value={formData.lastMammogramDate ? format(formData.lastMammogramDate, 'yyyy-MM-dd') : ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    lastMammogramDate: e.target.value ? new Date(e.target.value) : undefined,
                  })}
                />
              </div>
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
            <Button onClick={handleSave} disabled={upsertGyneco.isPending}>
              {upsertGyneco.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GynecoObstetricSection;
