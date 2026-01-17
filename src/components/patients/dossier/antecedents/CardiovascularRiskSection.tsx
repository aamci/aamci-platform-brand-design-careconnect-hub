/**
 * CardiovascularRiskSection - Facteurs de risque cardiovasculaire (FRV)
 * Auto-alimenté depuis les antécédents codés
 */

import React from 'react';
import { 
  Heart, 
  Cigarette, 
  Activity,
  AlertTriangle,
  Check,
  Minus,
  Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { usePatientLifestyle, type PatientLifestyle } from '@/hooks/data/useMedicalHistory';
import { usePatientFamilyHistory } from '@/hooks/data/useMedicalHistory';

interface CardiovascularRiskSectionProps {
  patientId: string;
}

interface RiskFactor {
  id: string;
  label: string;
  status: 'present' | 'absent' | 'unknown';
  details?: string;
  icon: React.ElementType;
  severity?: 'low' | 'medium' | 'high';
}

const CardiovascularRiskSection: React.FC<CardiovascularRiskSectionProps> = ({ patientId }) => {
  const { data: lifestyle, isLoading: loadingLifestyle } = usePatientLifestyle(patientId);
  const { data: familyHistory, isLoading: loadingFamily } = usePatientFamilyHistory(patientId);

  if (loadingLifestyle || loadingFamily) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Facteurs de risque cardiovasculaire</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Calculate risk factors from lifestyle data
  const tobaccoData = lifestyle?.find(l => l.category === 'tobacco');
  const alcoholData = lifestyle?.find(l => l.category === 'alcohol');
  const activityData = lifestyle?.find(l => l.category === 'physical_activity');

  // Check family history for CV risks
  const cvFamilyHistory = familyHistory?.filter(f => {
    const condition = f.conditionTitle.toLowerCase();
    return (
      condition.includes('infarctus') ||
      condition.includes('avc') ||
      condition.includes('cardiaque') ||
      condition.includes('coronar') ||
      condition.includes('artér')
    );
  }) || [];

  const riskFactors: RiskFactor[] = [
    {
      id: 'tobacco',
      label: 'Tabagisme',
      status: tobaccoData?.status === 'current' ? 'present' : 
              tobaccoData?.status === 'former' ? 'present' :
              tobaccoData?.status === 'never' ? 'absent' : 'unknown',
      details: tobaccoData?.status === 'current' 
        ? `Actif${tobaccoData.tobaccoPackYears ? ` - ${tobaccoData.tobaccoPackYears} PA` : ''}`
        : tobaccoData?.status === 'former' ? 'Ancien fumeur' : undefined,
      icon: Cigarette,
      severity: tobaccoData?.status === 'current' ? 'high' : tobaccoData?.status === 'former' ? 'medium' : undefined,
    },
    {
      id: 'sedentary',
      label: 'Sédentarité',
      status: activityData?.status === 'never' || activityData?.isSedentary 
        ? 'present' 
        : activityData?.status === 'current' ? 'absent' : 'unknown',
      details: activityData?.activityFrequencyPerWeek 
        ? `${activityData.activityFrequencyPerWeek}x/sem` 
        : undefined,
      icon: Activity,
      severity: activityData?.status === 'never' ? 'medium' : undefined,
    },
    {
      id: 'family',
      label: 'ATCD familiaux CV',
      status: cvFamilyHistory.length > 0 ? 'present' : 
              familyHistory && familyHistory.length > 0 ? 'absent' : 'unknown',
      details: cvFamilyHistory.length > 0 
        ? cvFamilyHistory.map(f => f.conditionTitle).join(', ').substring(0, 50) 
        : undefined,
      icon: Users,
      severity: cvFamilyHistory.length > 0 ? 'medium' : undefined,
    },
    {
      id: 'alcohol',
      label: 'Consommation alcool',
      status: alcoholData?.status === 'current' && (alcoholData.alcoholGlassesPerWeek || 0) > 14
        ? 'present'
        : alcoholData?.status === 'never' ? 'absent' 
        : alcoholData?.status ? 'absent' : 'unknown',
      details: alcoholData?.alcoholGlassesPerWeek 
        ? `${alcoholData.alcoholGlassesPerWeek} verres/sem` 
        : undefined,
      icon: AlertTriangle,
      severity: alcoholData?.alcoholGlassesPerWeek && alcoholData.alcoholGlassesPerWeek > 21 ? 'high' : undefined,
    },
  ];

  const presentRisks = riskFactors.filter(r => r.status === 'present');
  const totalKnown = riskFactors.filter(r => r.status !== 'unknown').length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="h-4 w-4 text-red-500" />
            Facteurs de risque CV
            {presentRisks.length > 0 && (
              <Badge 
                variant="destructive" 
                className={cn(
                  "text-xs",
                  presentRisks.length >= 3 ? "bg-red-600" : "bg-orange-500"
                )}
              >
                {presentRisks.length} FRV
              </Badge>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {riskFactors.map((factor) => {
            const Icon = factor.icon;
            return (
              <div
                key={factor.id}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg border transition-colors",
                  factor.status === 'present' && "bg-red-50 border-red-200",
                  factor.status === 'absent' && "bg-green-50 border-green-200",
                  factor.status === 'unknown' && "bg-muted/30 border-muted"
                )}
              >
                <div className={cn(
                  "h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0",
                  factor.status === 'present' && "bg-red-100",
                  factor.status === 'absent' && "bg-green-100",
                  factor.status === 'unknown' && "bg-muted"
                )}>
                  {factor.status === 'present' ? (
                    <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                  ) : factor.status === 'absent' ? (
                    <Check className="h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">
                    {factor.label}
                  </div>
                  {factor.details && (
                    <div className="text-[10px] text-muted-foreground truncate">
                      {factor.details}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
          {presentRisks.length === 0 && totalKnown > 0 ? (
            <span className="text-green-600 font-medium">✓ Pas de FRV identifié</span>
          ) : presentRisks.length > 0 ? (
            <span className="text-orange-600">
              {presentRisks.length} facteur{presentRisks.length > 1 ? 's' : ''} de risque identifié{presentRisks.length > 1 ? 's' : ''}
            </span>
          ) : (
            <span className="italic">Données incomplètes - renseigner le mode de vie</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CardiovascularRiskSection;
