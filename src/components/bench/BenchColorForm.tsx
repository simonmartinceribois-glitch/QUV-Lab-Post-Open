/**
 * QUV-Lab — Paillasse : formulaire Couleur CIE L*a*b* (refactor/split-bench-forms).
 * JSX déplacé à l'identique depuis Tab06MeasurementsBench.tsx.
 * État au parent : valeurs + setter reçus en props.
 */

import type { Dispatch, SetStateAction } from 'react';

export interface ColorReading {
  L: string;
  a: string;
  b: string;
}

interface Props {
  colorCount: number;
  colorReadings: ColorReading[];
  onColorReadingsChange: Dispatch<SetStateAction<ColorReading[]>>;
}

export function BenchColorForm({ colorCount, colorReadings, onColorReadingsChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Saisie des {colorCount} coordonnées colorimétriques (CIE L*a*b*)
        </span>
        <span className="text-xs text-slate-500 font-mono">D65 / 10°</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
              <th className="py-2 px-3 text-left">Point</th>
              <th className="py-2 px-3 text-center">L* (Clarté)</th>
              <th className="py-2 px-3 text-center">a* (Axe Vert-Rouge)</th>
              <th className="py-2 px-3 text-center">b* (Axe Bleu-Jaune)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {colorReadings.map((reading, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50">
                <td className="py-2.5 px-3 font-bold text-slate-800">Pt #{idx + 1}</td>
                <td className="py-2.5 px-3 text-center">
                  <input
                    type="number"
                    step="0.01"
                    value={reading.L}
                    onChange={(e) => {
                      const val = e.target.value;
                      onColorReadingsChange(colorReadings.map((r, i) => (i === idx ? { ...r, L: val } : r)));
                    }}
                    placeholder="ex: 62.4"
                    className="w-24 px-2 py-1.5 text-center font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </td>
                <td className="py-2.5 px-3 text-center">
                  <input
                    type="number"
                    step="0.01"
                    value={reading.a}
                    onChange={(e) => {
                      const val = e.target.value;
                      onColorReadingsChange(colorReadings.map((r, i) => (i === idx ? { ...r, a: val } : r)));
                    }}
                    placeholder="ex: 8.2"
                    className="w-24 px-2 py-1.5 text-center font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </td>
                <td className="py-2.5 px-3 text-center">
                  <input
                    type="number"
                    step="0.01"
                    value={reading.b}
                    onChange={(e) => {
                      const val = e.target.value;
                      onColorReadingsChange(colorReadings.map((r, i) => (i === idx ? { ...r, b: val } : r)));
                    }}
                    placeholder="ex: 24.1"
                    className="w-24 px-2 py-1.5 text-center font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
