/**
 * QUV-Lab — Photothèque : matrice synoptique globale (refactor/split-photographs).
 * JSX déplacé à l'identique depuis TabPhotographs.tsx (vue MATRIX).
 * Aucun état ni handler ici : tout est reçu en props depuis le parent.
 */

import { useMemo } from 'react';
import { getActiveStages } from '../../scientific/panelUtils';
import type { Trial } from '../../types/trial';
import type { MediaReference } from '../../types/trial';

interface Props {
  trial: Trial;
  onSelectSpecimen: (batchId: string, panelId: string) => void;
  onGoTimeline: () => void;
  onPreviewPhoto: (photo: MediaReference) => void;
  onOpenAddModalForStage: (batchId: string, panelId: string, stageId: string) => void;
}

export function PhotoMatrixView({
  trial,
  onSelectSpecimen,
  onGoTimeline,
  onPreviewPhoto,
  onOpenAddModalForStage
}: Props) {
  // Plan de mesurage : seuls les jalons actifs (non INACTIVE) sont affichés (fix/photo-active-stages).
  const activeStages = useMemo(() => getActiveStages(trial.stages), [trial.stages]);
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 overflow-x-auto">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Matrice Synoptique Photographique</h4>
          <p className="text-xs text-slate-500">
            Cartographie globale de la couverture photographique par éprouvette et par jalon (NF EN 927-6)
          </p>
        </div>
      </div>

      <table className="w-full text-left text-xs border-collapse min-w-[750px]">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80">
            <th className="p-2.5 font-bold text-slate-700">Éprouvette</th>
            <th className="p-2.5 font-bold text-slate-700">Lot & Essence</th>
            {activeStages.map((st) => (
              <th key={st.id} className="p-2.5 font-bold text-slate-700 text-center font-mono">
                {st.name}
                <span className="block text-[10px] text-slate-400 font-normal">({st.scheduledExposureHours}h)</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {trial.batches.flatMap((b) =>
            b.panels.map((p) => {
              const isWitness = p.label === 'T';
              const code = `${b.reference}-${p.label}`;

              return (
                <tr key={p.id} className="hover:bg-slate-50/50">
                  <td className="p-2.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectSpecimen(b.id, p.id);
                        onGoTimeline();
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] hover:underline ${
                        isWitness ? 'bg-purple-100 text-purple-900' : 'bg-blue-100 text-blue-900'
                      }`}
                    >
                      {code}
                    </button>
                  </td>
                  <td className="p-2.5 text-slate-600 whitespace-nowrap">
                    {b.woodSpecies || 'Bois'} ({b.productReference || '—'})
                  </td>
                  {activeStages.map((st) => {
                    const photo = trial.mediaReferences.find(
                      (m) =>
                        m.type === 'PHOTO' &&
                        m.panelId === p.id &&
                        m.stageId === st.id &&
                        m.status !== 'ARCHIVED'
                    );

                    return (
                      <td key={st.id} className="p-2 text-center">
                        {photo ? (
                          <button
                            type="button"
                            onClick={() => onPreviewPhoto(photo)}
                            className="inline-block relative group"
                            title={`${code} - ${st.name} : ${photo.caption}`}
                          >
                            <img
                              src={photo.storageKey}
                              alt="Cliché"
                              className="w-12 h-10 object-cover rounded border border-slate-300 group-hover:scale-110 transition-transform shadow-2xs"
                              referrerPolicy="no-referrer"
                            />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onOpenAddModalForStage(b.id, p.id, st.id)}
                            className="w-8 h-8 rounded border border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-300 hover:text-blue-600 inline-flex items-center justify-center transition-colors text-xs"
                            title="Ajouter un cliché pour ce jalon"
                          >
                            +
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
