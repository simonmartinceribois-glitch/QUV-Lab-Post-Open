/**
 * QUV-Lab — Paillasse : grille panoramique des éprouvettes (refactor/split-bench).
 * JSX déplacé à l'identique depuis Tab06MeasurementsBench.tsx (section 2).
 * Aucun état ni handler ici : tout est reçu en props depuis le parent.
 */

import { CheckCircle2 } from 'lucide-react';
import type { MeasurementFamilyId } from '../../types/scientific';
import type { Trial } from '../../types/trial';
import type { PanelListItem } from './benchTypes';

interface Props {
  completedPanelsCount: number;
  totalPanelsCount: number;
  isFamilyCampaignComplete: boolean;
  selectedFamilyId: MeasurementFamilyId;
  activePanelsList: PanelListItem[];
  currentPanelId: string | undefined;
  currentStageId: string;
  acquisitions: Trial['acquisitions'];
  onSelectPanel: (panelId: string) => void;
  onOpenValidationModal: () => void;
}

export function BenchPanelGrid({
  completedPanelsCount,
  totalPanelsCount,
  isFamilyCampaignComplete,
  selectedFamilyId,
  activePanelsList,
  currentPanelId,
  currentStageId,
  acquisitions,
  onSelectPanel,
  onOpenValidationModal
}: Props) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Éprouvettes de la Campagne ({completedPanelsCount}/{totalPanelsCount})
          </span>
          <span className="text-xs text-slate-500 font-mono">
            • {Math.round((completedPanelsCount / (totalPanelsCount || 1)) * 100)}% complété
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenValidationModal}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
            isFamilyCampaignComplete
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Validation Campagne ({selectedFamilyId})
        </button>
      </div>

      {/* Matrice des boutons d'éprouvettes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
        {activePanelsList.map(({ batch, panel }) => {
          const isSelected = panel.id === currentPanelId;
          const rec = acquisitions[`${currentStageId}__${panel.id}__${selectedFamilyId}`];
          const isDone = !!rec && !!rec.computed;
          const hasWarning = rec?.status === 'WARNING';
          const hasError = rec?.status === 'ERROR';

          return (
            <button
              key={panel.id}
              type="button"
              onClick={() => onSelectPanel(panel.id)}
              className={`p-2 rounded-xl text-left border transition-all ${
                isSelected
                  ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-500/20'
                  : isDone
                  ? hasError
                    ? 'border-rose-300 bg-rose-50/50'
                    : hasWarning
                    ? 'border-amber-300 bg-amber-50/50'
                    : 'border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50'
                  : 'border-slate-200 bg-slate-50 hover:bg-white'
              }`}
            >
              <div className="text-[10px] text-slate-500 font-mono truncate">{batch.reference}</div>
              <div className="flex items-center justify-between font-bold text-xs">
                <span className="text-slate-900">{panel.label}</span>
                <span>
                  {isDone ? (
                    hasError ? (
                      '🔴'
                    ) : hasWarning ? (
                      '🟡'
                    ) : (
                      '🟢'
                    )
                  ) : (
                    '⚪'
                  )}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
