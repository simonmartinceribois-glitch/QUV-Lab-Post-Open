/**
 * QUV-Lab — Assistant : étape 4 Panneaux / Référentiel Permanent (refactor/split-wizard).
 * JSX déplacé à l'identique depuis CreateTrialWizardModal.tsx (step === 4).
 * Aucun état ici : lots + total reçus en props depuis le parent.
 */

import { ShieldAlert } from 'lucide-react';
import type { LotFormItem } from './wizardTypes';

interface Props {
  batches: LotFormItem[];
  totalPanelsCount: number;
}

export function WizardStep4Panels({ batches, totalPanelsCount }: Props) {
  return (
    <div className="space-y-4">
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Référentiel Permanent des Éprouvettes ({totalPanelsCount} panneaux)</p>
          <p>
            Chaque éprouvette est identifiée de manière stable et pérenne. Ces identifiants restent constants tout au long des 13 étapes d'exposition.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {batches.map((batch, bIdx) => (
          <div key={batch.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-blue-900">{batch.reference}</span>
                <span className="text-xs text-slate-500">• {batch.coatingSystem}</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                {batch.panelCount} éprouvettes
              </span>
            </div>

            {/* Grille des panneaux générés */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
              {Array.from({ length: batch.panelCount }).map((_, pIdx) => {
                const pNum = pIdx + 1;
                const label = `P0${pNum}`.slice(-3);
                return (
                  <div
                    key={pIdx}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-center hover:bg-blue-50/50 hover:border-blue-300 transition-colors"
                  >
                    <span className="text-xs font-mono font-bold text-slate-900">
                      {batch.reference}-{label}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Éprouvette #{pNum}</span>
                    <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-700 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> ACTIVE
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
