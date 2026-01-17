/**
 * DevicesSection - Dispositifs médicaux implantables
 * Pacemaker, prothèses, stents, pompes, etc.
 */

import React, { useState } from 'react';
import { 
  Heart, 
  Plus, 
  Pencil, 
  Trash2, 
  AlertTriangle,
  Zap,
  Calendar,
  MapPin
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
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  usePatientDevices,
  useCreatePatientDevice,
  useUpdatePatientDevice,
  useDeletePatientDevice,
  type PatientDevice,
} from '@/hooks/data/useMedicalHistory';

interface DevicesSectionProps {
  patientId: string;
}

const deviceTypeOptions = [
  { value: 'pacemaker', label: 'Pacemaker' },
  { value: 'defibrillator', label: 'Défibrillateur (DAI)' },
  { value: 'crt', label: 'Resynchronisateur (CRT)' },
  { value: 'valve', label: 'Valve cardiaque' },
  { value: 'stent', label: 'Stent' },
  { value: 'hip_prosthesis', label: 'Prothèse de hanche' },
  { value: 'knee_prosthesis', label: 'Prothèse de genou' },
  { value: 'shoulder_prosthesis', label: 'Prothèse d\'épaule' },
  { value: 'cochlear_implant', label: 'Implant cochléaire' },
  { value: 'insulin_pump', label: 'Pompe à insuline' },
  { value: 'neurostimulator', label: 'Neurostimulateur' },
  { value: 'port', label: 'Chambre implantable (PAC)' },
  { value: 'other', label: 'Autre' },
];

const DevicesSection: React.FC<DevicesSectionProps> = ({ patientId }) => {
  const { data: devices, isLoading } = usePatientDevices(patientId);
  const createDevice = useCreatePatientDevice();
  const updateDevice = useUpdatePatientDevice();
  const deleteDevice = useDeletePatientDevice();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<PatientDevice | null>(null);
  const [formData, setFormData] = useState<Partial<PatientDevice>>({});

  const handleOpenCreate = () => {
    setSelectedDevice(null);
    setFormData({ isActive: true });
    setEditModalOpen(true);
  };

  const handleOpenEdit = (device: PatientDevice) => {
    setSelectedDevice(device);
    setFormData(device);
    setEditModalOpen(true);
  };

  const handleSave = async () => {
    if (selectedDevice) {
      await updateDevice.mutateAsync({
        id: selectedDevice.id,
        patientId,
        updates: formData,
      });
    } else {
      await createDevice.mutateAsync({
        patientId,
        input: formData,
      });
    }
    setEditModalOpen(false);
  };

  const handleDelete = async () => {
    if (selectedDevice) {
      await deleteDevice.mutateAsync({ id: selectedDevice.id, patientId });
      setDeleteDialogOpen(false);
      setSelectedDevice(null);
    }
  };

  const openDeleteDialog = (device: PatientDevice) => {
    setSelectedDevice(device);
    setDeleteDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dispositifs médicaux</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  const activeDevices = devices?.filter(d => d.isActive) || [];
  const inactiveDevices = devices?.filter(d => !d.isActive) || [];

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Dispositifs médicaux
              {activeDevices.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {activeDevices.length}
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
          {activeDevices.length > 0 ? (
            <div className="space-y-3">
              {activeDevices.map((device) => (
                <div
                  key={device.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:border-primary/30 transition-colors group"
                >
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Heart className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="text-sm font-medium">{device.deviceName}</h4>
                      {device.mriCompatible === false && (
                        <Badge variant="destructive" className="text-xs gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          IRM contre-indiquée
                        </Badge>
                      )}
                      {device.mriCompatible === true && (
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          IRM compatible
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {device.manufacturer && (
                        <span>{device.manufacturer}</span>
                      )}
                      {device.deviceModel && (
                        <span>Modèle: {device.deviceModel}</span>
                      )}
                      {device.implantDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(device.implantDate, 'dd/MM/yyyy', { locale: fr })}
                        </span>
                      )}
                      {device.bodyLocation && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {device.bodyLocation}
                        </span>
                      )}
                    </div>
                    {device.notes && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {device.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleOpenEdit(device)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => openDeleteDialog(device)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic text-center py-4">
              Aucun dispositif médical enregistré
            </p>
          )}
        </CardContent>
      </Card>

      {/* Edit/Create Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              {selectedDevice ? 'Modifier le dispositif' : 'Ajouter un dispositif'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Device type */}
            <div className="space-y-2">
              <Label>Type de dispositif *</Label>
              <Select
                value={formData.deviceType || ''}
                onValueChange={(value) => setFormData({ ...formData, deviceType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {deviceTypeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Device name */}
            <div className="space-y-2">
              <Label>Nom / Description *</Label>
              <Input
                value={formData.deviceName || ''}
                onChange={(e) => setFormData({ ...formData, deviceName: e.target.value })}
                placeholder="Ex: Pacemaker double chambre"
              />
            </div>

            {/* Manufacturer & Model */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fabricant</Label>
                <Input
                  value={formData.manufacturer || ''}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  placeholder="Ex: Medtronic, Abbott..."
                />
              </div>
              <div className="space-y-2">
                <Label>Modèle</Label>
                <Input
                  value={formData.deviceModel || ''}
                  onChange={(e) => setFormData({ ...formData, deviceModel: e.target.value })}
                />
              </div>
            </div>

            {/* Serial number */}
            <div className="space-y-2">
              <Label>Numéro de série</Label>
              <Input
                value={formData.deviceSerialNumber || ''}
                onChange={(e) => setFormData({ ...formData, deviceSerialNumber: e.target.value })}
              />
            </div>

            {/* Implant date & body location */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date d'implantation</Label>
                <Input
                  type="date"
                  value={formData.implantDate ? format(formData.implantDate, 'yyyy-MM-dd') : ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    implantDate: e.target.value ? new Date(e.target.value) : undefined,
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>Localisation</Label>
                <Input
                  value={formData.bodyLocation || ''}
                  onChange={(e) => setFormData({ ...formData, bodyLocation: e.target.value })}
                  placeholder="Ex: Sous-claviculaire gauche"
                />
              </div>
            </div>

            {/* MRI Compatible */}
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <Label>Compatible IRM</Label>
                <p className="text-xs text-muted-foreground">Ce dispositif permet-il une IRM ?</p>
              </div>
              <Select
                value={formData.mriCompatible === true ? 'yes' : formData.mriCompatible === false ? 'no' : 'unknown'}
                onValueChange={(value) => setFormData({
                  ...formData,
                  mriCompatible: value === 'yes' ? true : value === 'no' ? false : null,
                })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Oui</SelectItem>
                  <SelectItem value="no">Non</SelectItem>
                  <SelectItem value="unknown">Inconnu</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Follow-up */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fréquence de suivi</Label>
                <Select
                  value={formData.followUpFrequency || ''}
                  onValueChange={(value) => setFormData({ ...formData, followUpFrequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3_months">Tous les 3 mois</SelectItem>
                    <SelectItem value="6_months">Tous les 6 mois</SelectItem>
                    <SelectItem value="yearly">Annuel</SelectItem>
                    <SelectItem value="as_needed">Selon besoin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prochain contrôle</Label>
                <Input
                  type="date"
                  value={formData.nextFollowUpDate ? format(formData.nextFollowUpDate, 'yyyy-MM-dd') : ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    nextFollowUpDate: e.target.value ? new Date(e.target.value) : undefined,
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
                placeholder="Informations complémentaires..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!formData.deviceType || !formData.deviceName || createDevice.isPending || updateDevice.isPending}
            >
              {(createDevice.isPending || updateDevice.isPending) ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce dispositif ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le dispositif "{selectedDevice?.deviceName}" sera supprimé du dossier patient.
              Cette action est irréversible.
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

export default DevicesSection;
