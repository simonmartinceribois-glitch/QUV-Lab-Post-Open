/**
 * QUV-Lab — Paillasse : formulaire Brillance 60° par séries (refactor/split-bench-forms).
 * JSX déplacé à l'identique depuis Tab06MeasurementsBench.tsx.
 * État au parent : valeurs + setter reçus en props.
 */

import type { Dispatch, SetStateAction } from 'react';

export interface GlossSeriesInput {
  orientation: string;
  values: string[];
}

interface Props {
  glossSeriesData: GlossSeriesInput[];
  onGlossSeriesChange: Dispatch<SetStateAction<GlossSeriesInput[]>>;
}

export function BenchGlossForm({ glossSeriesData, onGlossSeriesChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Saisie Brillance 60° par Séries & Orientations
        </span>
        <span className="text-xs text-slate-500 font-mono">NF EN 927-6 Clause 6.3.3</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {glossSeriesData.map((series, sIdx) => (
          <div key={sIdx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 font-mono">
                Série #{sIdx + 1} : {series.orientation}
              </span>
            </div>

            <div className="space-y-2">
              {series.values.map((val, rIdx) => (
                <div key={rIdx} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-mono">Relevé #{rIdx + 1} :</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="0.1"
                      value={val}
                      onChange={(e) => {
                        const newVal = e.target.value;
                        onGlossSeriesChange(
                          glossSeriesData.map((s, i) =>
                            i === sIdx
                              ? { ...s, values: s.values.map((v, j) => (j === rIdx ? newVal : v)) }
                              : s
                          )
                        );
                      }}
                      placeholder="ex: 45.0"
                      className="w-24 px-2 py-1.5 text-center font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-[11px] font-bold text-slate-400">GU</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
