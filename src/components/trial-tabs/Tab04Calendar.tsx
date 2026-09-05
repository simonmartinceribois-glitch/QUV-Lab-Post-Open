/**
 * QUV-Lab — 04 Calendrier d'Exposition & Plan de Mesurage (NF EN 927-6)
 * Distinction claire entre Cycles Physiques d'Exposition (C1-C12) et Jalons de Mesurage.
 */

import React, { useState } from 'react';
import { Trial, ExposureStage } from '../../types/trial';
import { globalTrialStore } from '../../services/trialStore';
import { isMandatoryStage, getActiveFamiliesForStage } from '../../scientific/panelUtils';
import {
  Calendar,
  Clock,
  CheckCircle2,
  PlayCircle,
  Circle,
  AlertCircle,
  Info,
  Lock,
  Unlock,
  CheckSquare,
  Square,
  Sparkles,
  Layers
} from 'lucide-react';

interface Props {
  trial: Trial;
  onSelectStage?: (stageId: string) => void;
  onTrialUpdated?: () => void;
}

export function Tab04Calendar({ trial, onSelectStage, onTrialUpdated }: Props) {
  const validatedCount = trial.stages.filter((s) => s.status === 'VALIDATED').length;
  const inProgressStage = trial.stages.find((s) => s.status === 'IN_PROGRESS');
  const measuredStages = trial.stages.filter((s) => s.status !== 'INACTIVE');
  const totalPhysicalHours = 2016;

  // Calcul du statut de verrouillage du plan
  const hasAcquisitions = Object.keys(trial.acquisitions || {}).length > 0;
  const isPlanLocked = trial.configurationStatus === 'LOCKED' || hasAcquisitions;

  const [operatorId, setOperatorId] = useState<string>('Simon Martin (Technicien)');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePresetChange = (preset: 'FULL' | 'QUARTERLY' | 'LIGHT') => {
    if (isPlanLocked) return;
    let cycles: number[] = [];
    if (preset === 'FULL') {
      cycles = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    } else if (preset === 'QUARTERLY') {
      cycles = [0, 3, 6, 9, 12];
    } else if (preset === 'LIGHT') {
      cycles = [0, 6, 12];
    }

    try {
      globalTrialStore.updateMeasurementPlan(trial.id, cycles, operatorId);
      setErrorMessage(null);
      if (onTrialUpdated) onTrialUpdated();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur lors de la mise à jour du plan de mesurage');
    }
  };

  const handleToggleStageMeasurement = (stage: ExposureStage) => {
    if (isPlanLocked) return;
    if (isMandatoryStage(stage)) return;

    try {
      globalTrialStore.toggleStageStatus(
        trial.id,
        stage.id,
        operatorId,
        stage.status === 'INACTIVE' ? 'Activation jalon plan' : 'Désactivation jalon plan'
      );
      setErrorMessage(null);
      if (onTrialUpdated) onTrialUpdated();
    } catch (err: any) {
      setErrorMessage(err.message || 'Action non autorisée');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Calendrier d'Exposition & Plan de Mesurage</h3>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-800">
              12 Cycles Physiques (2016 h) • {measuredStages.length} Jalons de Mesures
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cycles hebdomadaires de 168 h (NF EN 927-6) • {validatedCount} validée(s) •{' '}
            {inProgressStage ? `Étape active : ${inProgressStage.name}` : 'Toutes étapes terminées'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
            isPlanLocked
              ? 'bg-amber-50 text-amber-900 border-amber-200'
              : 'bg-emerald-50 text-emerald-900 border-emerald-200'
          }`}>
            {isPlanLocked ? <Lock className="w-3.5 h-3.5 text-amber-700" /> : <Unlock className="w-3.5 h-3.5 text-emerald-700" />}
            <span>{isPlanLocked ? 'Plan Verrouillé (Acquisitions en cours)' : 'Plan Modifiable (Avant 1ère acquisition)'}</span>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span>{errorMessage}</span>
          <button type="button" onClick={() => setErrorMessage(null)} className="text-rose-600 hover:text-rose-900 font-bold">×</button>
        </div>
      )}

      {/* Règle Architecturale & Préréglages */}
      <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                Principe Métrologique : Cycles d'Exposition ≠ Jalons de Mesurage
              </h4>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl">
              Le protocole physique comprend obligatoirement 12 cycles d'exposition (2016 h). Les jalons de mesurage définissent les moments clés où les éprouvettes sont mesurées sur paillasse.
            </p>
          </div>

          {!isPlanLocked && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 font-bold">Préréglages :</span>
              <button
                type="button"
                onClick={() => handlePresetChange('FULL')}
                className="px-2.5 py-1 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
              >
                Complet (13 jalons)
              </button>
              <button
                type="button"
                onClick={() => handlePresetChange('QUARTERLY')}
                className="px-2.5 py-1 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
              >
                Trimestriel (5 jalons)
              </button>
              <button
                type="button"
                onClick={() => handlePresetChange('LIGHT')}
                className="px-2.5 py-1 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
              >
                Allégé (3 jalons)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Timeline List / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {trial.stages.map((stage) => {
          const isValidated = stage.status === 'VALIDATED';
          const isInProgress = stage.status === 'IN_PROGRESS';
          const isInactive = stage.status === 'INACTIVE';
          const isInitial = stage.cycleIndex === 0;
          const isFinal = stage.cycleIndex === 12;
          const isMandatory = isMandatoryStage(stage);

          return (
            <div
              key={stage.id}
              className={`p-4 rounded-2xl border transition-all ${
                isInProgress
                  ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20 shadow-xs'
                  : isInactive
                  ? 'border-dashed border-slate-300 bg-slate-50/70 opacity-70'
                  : isValidated
                  ? 'border-emerald-200 bg-white shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className="flex items-center gap-2 cursor-pointer flex-1"
                  onClick={() => onSelectStage && onSelectStage(stage.id)}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                      isInProgress
                        ? 'bg-blue-600 text-white'
                        : isInactive
                        ? 'bg-slate-200 text-slate-500 line-through'
                        : isValidated
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isInitial ? 'T0' : `C${stage.cycleIndex}`}
                  </div>
                  <div>
                    <h4 className={`text-xs font-bold ${isInactive ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                      {stage.name}
                    </h4>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {stage.scheduledExposureHours} h d'exposition physique
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {isInactive ? (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-200 text-slate-600">
                      Exposition seule
                    </span>
                  ) : isValidated ? (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Validée
                    </span>
                  ) : isInProgress ? (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-800 flex items-center gap-1 animate-pulse">
                      <PlayCircle className="w-3 h-3" />
                      En cours
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                      <Circle className="w-2 h-2 fill-blue-500" />
                      Jalon Planifié
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1 text-[11px] text-slate-600 border-t border-slate-100 pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span>Campagne scientifique :</span>
                  <span className={`font-bold ${isInactive ? 'text-slate-400' : 'text-blue-700'}`}>
                    {isInactive
                      ? 'Non mesuré'
                      : `${getActiveFamiliesForStage(trial.config.activeFamilies, stage).length} famille(s)`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Heures réelles d'exposition :</span>
                  <strong className="text-slate-900 font-mono">
                    {stage.actualExposureHours !== undefined ? `${stage.actualExposureHours} h` : '—'}
                  </strong>
                </div>

                {/* Bouton de bascule de jalon si le plan est modifiable */}
                {!isPlanLocked && !isMandatory && (
                  <div className="pt-2 border-t border-slate-100 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleToggleStageMeasurement(stage)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                        isInactive
                          ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                      }`}
                    >
                      {isInactive ? 'Activer les mesures' : 'Désactiver du plan'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
