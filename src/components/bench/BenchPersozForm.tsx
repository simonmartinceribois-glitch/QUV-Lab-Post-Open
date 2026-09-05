/**
 * QUV-Lab — Paillasse : formulaire Dureté Persoz (refactor/split-bench-forms).
 * JSX déplacé à l'identique depuis Tab06MeasurementsBench.tsx.
 * État au parent : valeurs + setter reçus en props.
 */

import type { Dispatch, SetStateAction } from 'react';

interface Props {
  persozValues: string[];
  onPersozValuesChange: Dispatch<SetStateAction<string[]>>;
}

export function BenchPersozForm({ persozValues, onPersozValuesChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-purple-950 uppercase tracking-wider">
          Saisie du Temps d'Amortissement Persoz (Secondes)
        </span>
        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-purple-100 text-purple-800">
          Recommandation Labo
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {persozValues.map((val, idx) => (
          <div key={idx} className="p-3 bg-purple-50/50 border border-purple-200 rounded-xl space-y-1.5">
            <span className="text-xs font-bold text-purple-900">Répétition #{idx + 1}</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.1"
                value={val}
                onChange={(e) => {
                  const newVal = e.target.value;
                  onPersozValuesChange(persozValues.map((v, i) => (i === idx ? newVal : v)));
                }}
                placeholder="ex: 85.0"
                className="w-full px-2 py-1.5 text-center font-bold bg-white border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              <span className="text-xs font-bold text-purple-700">s</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
