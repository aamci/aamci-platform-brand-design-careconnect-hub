/**
 * LifestyleSection - Mode de vie avec édition avancée
 * Tabac, alcool, activité physique, alimentation
 */

import React, { useState } from 'react';
import { 
  Cigarette, 
  Wine, 
  Activity, 
  UtensilsCrossed,
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import {
  usePatientLifestyle,
  useCreatePatientLifestyle,
  useUpdatePatientLifestyle,
  useDeletePatientLifestyle,
  type PatientLifestyle,
} from '@/hooks/data/useMedicalHistory';

interface LifestyleSectionProps {
  patientId: string;
}

type LifestyleCategory = 'tobacco' | 'alcohol' | 'physical_activity' | 'diet';

const categoryConfig: Record<LifestyleCategory, {
  label: string;
  icon: React.ElementType;
  statusLabels: Record<string, { label: string; color: string }>;
}> = {
  tobacco: {
    label: 'Tabac',
    icon: Cigarette,
    statusLabels: {
      never: { label: 'Non-fumeur', color: 'bg-green-100 text-green-800' },
      former: { label: 'Ancien fumeur', color: 'bg-blue-100 text-blue-800' },
      current: { label: 'Fumeur actif', color: 'bg-red-100 text-red-800' },
      occasional: { label: 'Occasionnel', color: 'bg-yellow-100 text-yellow-800' },
    },
  },
  alcohol: {
    label: 'Alcool',
    icon: Wine,
    statusLabels: {
      never: { label: 'Abstinent', color: 'bg-green-100 text-green-800' },
      former: { label: 'Ancien consommateur', color: 'bg-blue-100 text-blue-800' },
      current: { label: 'Consommation régulière', color: 'bg-orange-100 text-orange-800' },
      occasional: { label: 'Occasionnel', color: 'bg-yellow-100 text-yellow-800' },
    },
  },
  physical_activity: {
    label: 'Activité physique',
    icon: Activity,
    statusLabels: {
      never: { label: 'Sédentaire', color: 'bg-red-100 text-red-800' },
      occasional: { label: 'Modérée', color: 'bg-blue-100 text-blue-800' },
      current: { label: 'Élevée', color: 'bg-green-100 text-green-800' },
    },
  },
  diet: {
    label: 'Alimentation',
    icon: UtensilsCrossed,
    statusLabels: {},
  },
};

const LifestyleSection: React.FC<LifestyleSectionProps> = ({ patientId }) => {
  const { data: lifestyleData, isLoading } = usePatientLifestyle(patientId);
  const createLifestyle = useCreatePatientLifestyle();
  const updateLifestyle = useUpdatePatientLifestyle();
  const deleteLifestyle = useDeletePatientLifestyle();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<LifestyleCategory>('tobacco');
  const [editingData, setEditingData] = useState<Partial<PatientLifestyle>>({});

  const getLifestyleByCategory = (category: LifestyleCategory) => 
    lifestyleData?.find(l => l.category === category);

  const handleOpenEdit = (category: LifestyleCategory) => {
    const existing = getLifestyleByCategory(category);
    setEditingCategory(category);
    setEditingData(existing || { category });
    setEditModalOpen(true);
  };

  const handleSave = async () => {
    const existing = getLifestyleByCategory(editingCategory);
    
    if (existing) {
      await updateLifestyle.mutateAsync({
        id: existing.id,
        patientId,
        updates: editingData,
      });
    } else {
      await createLifestyle.mutateAsync({
        patientId,
        input: { ...editingData, category: editingCategory },
      });
    }
    setEditModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Supprimer cette information ?')) {
      await deleteLifestyle.mutateAsync({ id, patientId });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mode de vie</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const categories: LifestyleCategory[] = ['tobacco', 'alcohol', 'physical_activity', 'diet'];

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Mode de vie
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {categories.map((category) => {
            const config = categoryConfig[category];
            const data = getLifestyleByCategory(category);
            const Icon = config.icon;
            const statusInfo = data?.status ? config.statusLabels[data.status] : null;

            return (
              <div
                key={category}
                className="flex items-center justify-between p-4 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors group"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-foreground">{config.label}</h4>
                    {data ? (
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {statusInfo && (
                          <Badge className={cn('text-xs', statusInfo.color)}>
                            {statusInfo.label}
                          </Badge>
                        )}
                        {data.comment && (
                          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {data.comment}
                          </span>
                        )}
                        {category === 'tobacco' && data.tobaccoPackYears && (
                          <span className="text-xs text-muted-foreground">
                            {data.tobaccoPackYears} PA
                          </span>
                        )}
                        {category === 'physical_activity' && data.activityIntensity && (
                          <span className="text-xs text-muted-foreground">
                            {data.activityFrequencyPerWeek}x/sem
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground/70 italic">Non renseigné</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleOpenEdit(category)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {data && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(data.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {React.createElement(categoryConfig[editingCategory].icon, { className: 'h-5 w-5' })}
              {categoryConfig[editingCategory].label}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Status selection */}
            {editingCategory !== 'diet' && (
              <div className="space-y-2">
                <Label>Statut</Label>
                <RadioGroup
                  value={editingData.status || ''}
                  onValueChange={(value) => setEditingData({ ...editingData, status: value as any })}
                  className="grid grid-cols-2 gap-2"
                >
                  {Object.entries(categoryConfig[editingCategory].statusLabels).map(([value, { label }]) => (
                    <div key={value} className="flex items-center space-x-2">
                      <RadioGroupItem value={value} id={value} />
                      <Label htmlFor={value} className="text-sm cursor-pointer">{label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Tobacco specific fields */}
            {editingCategory === 'tobacco' && editingData.status === 'current' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cigarettes/jour</Label>
                    <Input
                      type="number"
                      value={editingData.tobaccoQuantityPerDay || ''}
                      onChange={(e) => setEditingData({
                        ...editingData,
                        tobaccoQuantityPerDay: parseInt(e.target.value) || undefined,
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Paquets-années (PA)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={editingData.tobaccoPackYears || ''}
                      onChange={(e) => setEditingData({
                        ...editingData,
                        tobaccoPackYears: parseFloat(e.target.value) || undefined,
                      })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Âge de début</Label>
                  <Input
                    type="number"
                    value={editingData.tobaccoStartAge || ''}
                    onChange={(e) => setEditingData({
                      ...editingData,
                      tobaccoStartAge: parseInt(e.target.value) || undefined,
                    })}
                  />
                </div>
              </>
            )}

            {/* Alcohol specific fields */}
            {editingCategory === 'alcohol' && (editingData.status === 'current' || editingData.status === 'occasional') && (
              <div className="space-y-2">
                <Label>Verres/semaine</Label>
                <Input
                  type="number"
                  value={editingData.alcoholGlassesPerWeek || ''}
                  onChange={(e) => setEditingData({
                    ...editingData,
                    alcoholGlassesPerWeek: parseInt(e.target.value) || undefined,
                  })}
                />
              </div>
            )}

            {/* Physical activity specific fields */}
            {editingCategory === 'physical_activity' && (
              <>
                <div className="space-y-2">
                  <Label>Intensité</Label>
                  <RadioGroup
                    value={editingData.activityIntensity || ''}
                    onValueChange={(value) => setEditingData({ ...editingData, activityIntensity: value })}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="light" id="light" />
                      <Label htmlFor="light" className="text-sm cursor-pointer">Légère</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="moderate" id="moderate" />
                      <Label htmlFor="moderate" className="text-sm cursor-pointer">Modérée</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="vigorous" id="vigorous" />
                      <Label htmlFor="vigorous" className="text-sm cursor-pointer">Intense</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fois/semaine</Label>
                    <Input
                      type="number"
                      value={editingData.activityFrequencyPerWeek || ''}
                      onChange={(e) => setEditingData({
                        ...editingData,
                        activityFrequencyPerWeek: parseInt(e.target.value) || undefined,
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Durée (min)</Label>
                    <Input
                      type="number"
                      value={editingData.activityDurationMinutes || ''}
                      onChange={(e) => setEditingData({
                        ...editingData,
                        activityDurationMinutes: parseInt(e.target.value) || undefined,
                      })}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Diet specific fields */}
            {editingCategory === 'diet' && (
              <div className="space-y-2">
                <Label>Type de régime</Label>
                <Select
                  value={editingData.dietType || ''}
                  onValueChange={(value) => setEditingData({ ...editingData, dietType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal / Omnivore</SelectItem>
                    <SelectItem value="vegetarian">Végétarien</SelectItem>
                    <SelectItem value="vegan">Végétalien</SelectItem>
                    <SelectItem value="halal">Halal</SelectItem>
                    <SelectItem value="kosher">Casher</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Comment field */}
            <div className="space-y-2">
              <Label>Commentaire</Label>
              <Textarea
                value={editingData.comment || ''}
                onChange={(e) => setEditingData({ ...editingData, comment: e.target.value })}
                placeholder="Précisions..."
                rows={2}
              />
            </div>

            {/* Advanced edit toggle */}
            <Button variant="link" size="sm" className="gap-1 p-0 h-auto text-xs text-primary">
              <Eye className="h-3 w-3" />
              Édition avancée
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={createLifestyle.isPending || updateLifestyle.isPending}
            >
              {(createLifestyle.isPending || updateLifestyle.isPending) ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LifestyleSection;
