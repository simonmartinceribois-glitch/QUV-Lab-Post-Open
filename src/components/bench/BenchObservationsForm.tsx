/**
 * QUV-Lab — Paillasse : formulaire Observations visuelles ISO (refactor/split-bench-forms).
 * JSX déplacé à l'identique depuis Tab06MeasurementsBench.tsx.
 * État au parent : observations + setter reçus en props.
 */

import type { Dispatch, SetStateAction } from 'react';
import type { VisualObservationItem } from '../../types/scientific';

interface Props {
  observations: VisualObservationItem[];
  onObservationsChange: Dispatch<SetStateAction<VisualObservationItem[]>>;
}

export function BenchObservationsForm({ observations, onObservationsChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Cotations des Défauts d'Aspect (ISO 4628 / ISO 2409)
        </span>
        <span className="text-xs text-slate-500 font-mono">0 = Intact, 5 = Altération Sévère</span>
      </div>

      <div className="space-y-2.5">
        {observations.map((obs, idx) => (
          <div
            key={obs.category}
            className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          >
            <div className="sm:w-1/3">
              <span className="font-bold text-slate-900">{obs.categoryLabel}</span>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-slate-500 font-semibold">Note :</label>
              <select
                value={obs.rating}
                onChange={(e) => {
                  const rVal = parseInt(e.target.value, 10);
                  onObservationsChange(
                    observations.map((o, i) =>
                      i === idx
                        ? {
                            ...o,
                            rating: rVal,
                            status: rVal === 0 ? 'CONFORME' : 'OBSERVE',
                            comment: rVal === 0 ? 'Aucun' : `Défaut note ${rVal}`
                          }
                        : o
                    )
                  );
                }}
                className="px-2 py-1 font-bold bg-white border border-slate-300 rounded-lg"
              >
                <option value={0}>0 — Aucun défaut</option>
                <option value={1}>1 — Très léger</option>
                <option value={2}>2 — Modéré</option>
                <option value={3}>3 — Prononcé (Alerte)</option>
                <option value={4}>4 — Très prononcé</option>
                <option value={5}>5 — Rupture / Destruction</option>
              </select>
            </div>

            <div className="flex-1">
              <input
                type="text"
                value={obs.comment || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  onObservationsChange(observations.map((o, i) => (i === idx ? { ...o, comment: val } : o)));
                }}
                placeholder="Remarques éventuelles..."
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
