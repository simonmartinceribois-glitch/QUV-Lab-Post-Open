/**
 * QUV-Lab — Paillasse : barre supérieure (refactor/split-bench).
 * JSX déplacé à l'identique depuis Tab06MeasurementsBench.tsx (topbar + bandeau jalons + alerte).
 * Aucun état ni handler ici : tout est reçu en props depuis le parent.
 */

import { Ban } from 'lucide-react';
import { isFamilyScheduledForStage } from '../../scientific/panelUtils';
import type { MeasurementFamilyId } from '../../types/scientific';
import type { ExposureStage, Trial } from '../../types/trial';
import type { PanelListItem } from './benchTypes';

interface Props {
  stageStepNumber: number;
  totalStagesCount: number;
  stageHoursDisplay: string;
  stageActionLabel: string;
  currentStage: ExposureStage;
  activeFamilies: MeasurementFamilyId[];
  selectedFamilyId: MeasurementFamilyId;
  measuredStages: ExposureStage[];
  activePanelsList: PanelListItem[];
  acquisitions: Trial['acquisitions'];
  onFamilyChange: (fam: MeasurementFamilyId) => void;
  onStageChange?: (stageId: string) => void;
  isStageInactive: boolean;
}

export function BenchTopBar({
  stageStepNumber,
  totalStagesCount,
  stageHoursDisplay,
  stageActionLabel,
  currentStage,
  activeFamilies,
  selectedFamilyId,
  measuredStages,
  activePanelsList,
  acquisitions,
  onFamilyChange,
  onStageChange,
  isStageInactive
}: Props) {
  return (
    <>
      {/* 1. TOP BAR : Sélecteur de Famille de Mesure & Étape Active Normative */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[11px] font-mono font-bold tracking-wider uppercase">
              JALON {stageStepNumber} / {totalStagesCount}
            </span>
            <span className="text-sm font-bold text-white font-mono">{stageHoursDisplay}</span>
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">
              {stageActionLabel}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Poste de Mesure de Paillasse par Famille • {currentStage.name}
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {(['COLOR', 'GLOSS', 'PERSOZ', 'ADHESION', 'OBSERVATIONS'] as MeasurementFamilyId[]).map((fam) => {
            const isSelected = selectedFamilyId === fam;
            const isEnabled = activeFamilies.includes(fam);
            if (!isEnabled) return null;
            // Règle canonique : ADHESION = T0 et C12 uniquement. À C1..C11, le bouton ne doit simplement pas être rendu.
            if (!isFamilyScheduledForStage(fam, currentStage)) return null;

            return (
              <button
                key={fam}
                onClick={() => onFamilyChange(fam)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white ring-2 ring-blue-400 shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>
                  {fam === 'COLOR'
                    ? '🎨 Couleur'
                    : fam === 'GLOSS'
                    ? '✨ Brillance'
                    : fam === 'PERSOZ'
                    ? '⏱️ Persoz'
                    : fam === 'ADHESION'
                    ? '✂️ Adhérence'
                    : '🔍 Observations'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1b. BANDEAU DE SÉLECTION DU JALON DE MESURAGE DU PLAN */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 overflow-x-auto w-full">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
            Jalons planifiés :
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {measuredStages.map((st) => {
              const isSelected = st.id === currentStage.id;
              const label = st.cycleIndex === 0 ? 'T0' : `C${st.cycleIndex}`;
              const hoursLabel = st.cycleIndex === 0 ? '0 h' : `${st.scheduledExposureHours} h`;

              // Complétude de ce jalon pour la famille active
              const isCompleted = activePanelsList.length > 0 && activePanelsList.every((item) => {
                const k = `${st.id}__${item.panel.id}__${selectedFamilyId}`;
                return acquisitions[k]?.computed !== null && acquisitions[k]?.computed !== undefined;
              });

              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => onStageChange && onStageChange(st.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-400'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{label}</span>
                  <span className={`text-[10px] font-mono ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                    ({hoursLabel})
                  </span>
                  {isCompleted && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" title="Saisie complète" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Alerte jalon inactif (Gate 54 D-1 / D-2 UI) */}
      {isStageInactive && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs font-bold shadow-xs">
          <Ban className="w-5 h-5 text-rose-600 shrink-0" />
          <span>Ce jalon n'est pas actif dans le plan de mesurage. La saisie et l'enregistrement de mesures y sont strictement interdits.</span>
        </div>
      )}
    </>
  );
}
