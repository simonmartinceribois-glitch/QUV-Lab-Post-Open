/**
 * QUV-Lab — Photothèque : comparateur temporel N-jalons (refactor/split-photographs).
 * JSX déplacé à l'identique depuis TabPhotographs.tsx (vue TEMPORAL_COMPARE).
 * Aucun état ni handler ici : tout est reçu en props depuis le parent.
 */

import { Split, AlertTriangle, Camera, Maximize2, FileImage } from 'lucide-react';
import type { MediaReference, PanelDefinition, Trial } from '../../types/trial';
import type { PanelMap, StageMap } from './photoTypes';

interface Props {
  trial: Trial;
  activeBatchId: string;
  activePanelId: string;
  activePanel: PanelDefinition | null;
  activePanelPhotos: MediaReference[];
  comparedPhotos: MediaReference[];
  compareIntegrityCheck: { isSamePanel: boolean; panelIds: (string | undefined)[] };
  selectedPhotoIdsForCompare: string[];
  stageMap: StageMap;
  panelMap: PanelMap;
  onSelectSpecimen: (batchId: string, panelId: string) => void;
  onSetCompareIds: (ids: string[]) => void;
  onToggleComparePhoto: (photoId: string) => void;
  onPreviewPhoto: (photo: MediaReference) => void;
}

export function PhotoCompareView({
  trial,
  activeBatchId,
  activePanelId,
  activePanel,
  activePanelPhotos,
  comparedPhotos,
  compareIntegrityCheck,
  selectedPhotoIdsForCompare,
  stageMap,
  panelMap,
  onSelectSpecimen,
  onSetCompareIds,
  onToggleComparePhoto,
  onPreviewPhoto
}: Props) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
      {/* Header Comparateur */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Split className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">
              Comparaison Photographique Temporelle (NF EN 927-6)
            </h3>
            <span className="px-2.5 py-0.5 text-xs font-bold font-mono rounded-full bg-blue-100 text-blue-900 border border-blue-200">
              {comparedPhotos.length} jalon(s) comparé(s)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Visualisation côte à côte de la cinétique visuelle dans l'ordre chronologique strict
          </p>
        </div>

        {/* Sélecteur rapide d'échantillon pour la comparaison */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-700 shrink-0">Échantillon analysé :</label>
          <select
            value={`${activeBatchId}__${activePanelId}`}
            onChange={(e) => {
              const [bId, pId] = e.target.value.split('__');
              onSelectSpecimen(bId, pId);
            }}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
          >
            {trial.batches.flatMap((b) =>
              b.panels.map((p) => (
                <option key={`${b.id}__${p.id}`} value={`${b.id}__${p.id}`}>
                  {b.reference} — Éprouvette {p.label} ({p.label === 'T' ? 'Témoin' : 'Exposé'})
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Garde-fou normatif de comparaison : Alerte si comparaison inter-échantillons (Point 6) */}
      {!compareIntegrityCheck.isSamePanel && (
        <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl text-xs text-amber-950 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="text-sm font-bold text-amber-900 block mb-1">
              ⚠️ Avertissement Méthodologique — Comparaison Inter-Échantillons
            </strong>
            <p className="leading-relaxed">
              Vous comparez actuellement des clichés appartenant à des éprouvettes <strong>différentes</strong>. Pour une analyse de cinétique de vieillissement rigoureuse et représentative selon la norme <strong>NF EN 927-6</strong>, la comparaison temporelle doit porter exclusivement sur le <strong>même échantillon</strong> au fil de ses jalons d'exposition.
            </p>
          </div>
        </div>
      )}

      {/* Grille de sélection des jalons disponibles pour cet échantillon */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
          <span>Sélectionner les jalons à comparer pour cet échantillon :</span>
          <button
            type="button"
            onClick={() => {
              if (activePanel) {
                const allOfPanel = trial.mediaReferences
                  .filter((m) => m.type === 'PHOTO' && m.panelId === activePanel.id && m.status !== 'ARCHIVED')
                  .map((m) => m.id);
                onSetCompareIds(allOfPanel);
              }
            }}
            className="text-[11px] text-blue-600 hover:text-blue-800 font-bold normal-case"
          >
            Tout cocher ({activePanelPhotos.length})
          </button>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {activePanelPhotos.map((photo) => {
            const stage = photo.stageId ? stageMap.get(photo.stageId) : null;
            const isSelected = selectedPhotoIdsForCompare.includes(photo.id);

            return (
              <button
                key={photo.id}
                type="button"
                onClick={() => onToggleComparePhoto(photo.id)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <span>{isSelected ? '☑' : '☐'}</span>
                <span className="font-mono font-bold">{stage?.name || 'Jalon'}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${isSelected ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {stage?.scheduledExposureHours ?? 0} h
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Affichage Côte-à-Côte des Photographies dans l'ordre chronologique strict */}
      {comparedPhotos.length === 0 ? (
        <div className="p-12 text-center bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 space-y-2">
          <Camera className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700">Aucun cliché sélectionné pour la comparaison</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Cochez au moins 2 jalons photographiés ci-dessus pour observer l'évolution visuelle temporelle de l'échantillon.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div
            className={`grid gap-4 ${
              comparedPhotos.length === 1
                ? 'grid-cols-1 max-w-xl mx-auto'
                : comparedPhotos.length === 2
                ? 'grid-cols-1 md:grid-cols-2'
                : comparedPhotos.length === 3
                ? 'grid-cols-1 md:grid-cols-3'
                : comparedPhotos.length === 4
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
                : 'grid-cols-1 md:grid-cols-3 lg:grid-cols-5'
            }`}
          >
            {comparedPhotos.map((photo, idx) => {
              const stage = photo.stageId ? stageMap.get(photo.stageId) : null;
              const info = photo.panelId ? panelMap.get(photo.panelId) : null;
              const specimenLabel = info ? `${info.batch.reference}-${info.panel.label}` : 'Éprouvette';

              return (
                <div
                  key={photo.id}
                  className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between"
                >
                  {/* En-tête jalon normalisé */}
                  <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500 text-white font-bold">
                        #{idx + 1}
                      </span>
                      <span className="font-bold font-mono text-xs text-slate-100">
                        {stage ? stage.name : 'Jalon'}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {stage?.scheduledExposureHours ?? 0} h
                    </span>
                  </div>

                  {/* Image Thumbnail */}
                  <div className="relative aspect-4/3 bg-slate-950 overflow-hidden group">
                    <img
                      src={photo.storageKey}
                      alt={photo.caption || 'Cliché chronologique'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={() => onPreviewPhoto(photo)}
                      className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                      title="Agrandir et inspecter"
                    >
                      <div className="p-2 rounded-full bg-white/90 text-slate-900 shadow-md">
                        <Maximize2 className="w-4 h-4" />
                      </div>
                    </button>
                  </div>

                  {/* Métadonnées de Traçabilité */}
                  <div className="p-3.5 space-y-2 text-xs bg-white">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                      <span className="font-mono">{specimenLabel}</span>
                      <span className="text-slate-500 font-normal">
                        {new Date(photo.capturedAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>

                    <p className="text-slate-700 text-xs font-medium line-clamp-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      {photo.caption || 'Aucune observation enregistrée.'}
                    </p>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>Op : {photo.capturedBy}</span>
                      <button
                        type="button"
                        onClick={() => onToggleComparePhoto(photo.id)}
                        className="text-rose-600 hover:underline font-bold"
                      >
                        Retirer
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Planche de Rapport / Résumé de l'Évolution Photographique */}
          <div className="p-4 bg-blue-50/40 border border-blue-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-950 flex items-center gap-1.5">
                <FileImage className="w-4 h-4 text-blue-700" />
                Planche d'Évolution Photographique Normalisée (Pour Rapport NF EN 927-6)
              </h4>
              <span className="text-[11px] font-mono text-blue-800">
                Légende : Lot — Échantillon — Jalon — Heures cumulées
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse bg-white rounded-xl overflow-hidden border border-blue-200">
                <thead>
                  <tr className="bg-blue-100/70 border-b border-blue-200 text-blue-950">
                    <th className="p-2.5 font-bold">Jalon & Heures</th>
                    <th className="p-2.5 font-bold">Échantillon</th>
                    <th className="p-2.5 font-bold">Date de prise</th>
                    <th className="p-2.5 font-bold">Opérateur</th>
                    <th className="p-2.5 font-bold">Observations Documentaires</th>
                    <th className="p-2.5 font-bold text-right">Fichier Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {comparedPhotos.map((photo) => {
                    const stage = photo.stageId ? stageMap.get(photo.stageId) : null;
                    const info = photo.panelId ? panelMap.get(photo.panelId) : null;

                    return (
                      <tr key={photo.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                          {stage?.name || 'Jalon'} ({stage?.scheduledExposureHours ?? 0} h)
                        </td>
                        <td className="p-2.5 font-mono text-blue-700 whitespace-nowrap">
                          {info ? `${info.batch.reference} - ${info.panel.label}` : '—'}
                        </td>
                        <td className="p-2.5 text-slate-600 whitespace-nowrap">
                          {new Date(photo.capturedAt).toLocaleString('fr-FR')}
                        </td>
                        <td className="p-2.5 text-slate-600 whitespace-nowrap">{photo.capturedBy}</td>
                        <td className="p-2.5 text-slate-800">{photo.caption}</td>
                        <td className="p-2.5 font-mono text-[11px] text-slate-400 text-right">
                          {photo.filename}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
