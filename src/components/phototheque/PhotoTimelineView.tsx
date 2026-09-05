/**
 * QUV-Lab — Photothèque : vue chronologie par échantillon (refactor/split-photographs).
 * JSX déplacé à l'identique depuis TabPhotographs.tsx (vue SPECIMEN_TIMELINE).
 * Aucun état ni handler ici : tout est reçu en props depuis le parent.
 */

import {
  Folder,
  Camera,
  Split,
  Clock,
  Maximize2,
  Eye,
  RefreshCw,
  Trash2,
  Info
} from 'lucide-react';
import { useMemo } from 'react';
import { getActiveStages } from '../../scientific/panelUtils';
import type { BatchDefinition, MediaReference, PanelDefinition, Trial } from '../../types/trial';

interface Props {
  trial: Trial;
  activeBatch: BatchDefinition | undefined;
  activePanel: PanelDefinition | null;
  activeBatchId: string;
  activePanelId: string;
  activePanelPhotos: MediaReference[];
  selectedPhotoIdsForCompare: string[];
  onSelectSpecimen: (batchId: string, panelId: string) => void;
  onLaunchCompareForSpecimen: (panelId: string) => void;
  onToggleComparePhoto: (photoId: string) => void;
  onOpenAddModalForStage: (batchId: string, panelId: string, stageId: string) => void;
  onDeletePhoto: (mediaId: string) => void;
  onPreviewPhoto: (photo: MediaReference) => void;
}

export function PhotoTimelineView({
  trial,
  activeBatch,
  activePanel,
  activeBatchId,
  activePanelId,
  activePanelPhotos,
  selectedPhotoIdsForCompare,
  onSelectSpecimen,
  onLaunchCompareForSpecimen,
  onToggleComparePhoto,
  onOpenAddModalForStage,
  onDeletePhoto,
  onPreviewPhoto
}: Props) {
  // Plan de mesurage : seuls les jalons actifs (non INACTIVE) sont affichés (fix/photo-active-stages).
  const activeStages = useMemo(() => getActiveStages(trial.stages), [trial.stages]);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* A. Arborescence Hiérarchique (Lot & Échantillon) */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Folder className="w-4 h-4 text-blue-600" />
              Navigation Éprouvettes
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              {trial.batches.reduce((sum, b) => sum + b.panels.length, 0)} éprouvettes
            </span>
          </div>

          {/* Liste des Lots et de leurs Éprouvettes */}
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {trial.batches.map((batch) => {
              const isBatchSelected = batch.id === activeBatchId;

              return (
                <div
                  key={batch.id}
                  className={`border rounded-xl p-2.5 transition-all ${
                    isBatchSelected ? 'bg-blue-50/40 border-blue-300 shadow-2xs' : 'bg-slate-50/60 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-900 font-mono">{batch.reference}</span>
                      <span className="text-[11px] text-slate-500">
                        • {batch.woodSpecies || 'Bois'}
                      </span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white font-mono text-slate-600 border border-slate-200">
                      {batch.productReference || 'Finition'}
                    </span>
                  </div>

                  {/* Éprouvettes T, 1, 2, 3 */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {batch.panels.map((panel) => {
                      const isPanelActive = isBatchSelected && panel.id === activePanelId;
                      const isWitness = panel.label === 'T';
                      const photoCount = trial.mediaReferences.filter(
                        (m) => m.type === 'PHOTO' && m.panelId === panel.id && m.status !== 'ARCHIVED'
                      ).length;

                      return (
                        <button
                          key={panel.id}
                          type="button"
                          onClick={() => onSelectSpecimen(batch.id, panel.id)}
                          className={`p-2 rounded-lg border text-left transition-all flex flex-col justify-between ${
                            isPanelActive
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-300'
                              : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`font-mono font-bold text-xs ${isPanelActive ? 'text-white' : isWitness ? 'text-purple-700' : 'text-slate-900'}`}>
                              {batch.reference}-{panel.label}
                            </span>
                            {isWitness && (
                              <span
                                className={`text-[9px] font-bold px-1 rounded ${
                                  isPanelActive ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'
                                }`}
                              >
                                T
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center justify-between text-[10px]">
                            <span className={`flex items-center gap-0.5 ${isPanelActive ? 'text-blue-100' : 'text-slate-500'}`}>
                              <Camera className="w-3 h-3" />
                              {photoCount}
                            </span>
                            <span className={isPanelActive ? 'text-blue-200' : 'text-slate-400'}>
                              {photoCount > 0 ? 'Documenté' : '0 photo'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* B. Chronologie Photographique de l'Échantillon Sélectionné */}
      <div className="lg:col-span-8 space-y-4">
        {activePanel && activeBatch ? (
          <div className="space-y-4">
            {/* Fiche d'identification de l'échantillon sélectionné */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-mono font-bold text-slate-900">
                      {activeBatch.reference} — Éprouvette {activePanel.label}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-xs font-bold rounded-md ${
                        activePanel.label === 'T'
                          ? 'bg-purple-100 text-purple-900 border border-purple-200'
                          : 'bg-blue-100 text-blue-900 border border-blue-200'
                      }`}
                    >
                      {activePanel.label === 'T' ? 'Témoin (Chambre Obscure)' : 'Exposé QUV'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeBatch.woodSpecies || 'Pin sylvestre'} • {activeBatch.productReference || 'Lasure / Finition'} • Épaisseur film sec :{' '}
                    <strong>{activeBatch.dryFilmThicknessMicrons ? `${activeBatch.dryFilmThicknessMicrons} µm` : 'Non renseignée'}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onLaunchCompareForSpecimen(activePanel.id)}
                    disabled={activePanelPhotos.length < 2}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
                    title={activePanelPhotos.length < 2 ? 'Au moins 2 clichés requis pour comparer' : 'Ouvrir la comparaison temporelle'}
                  >
                    <Split className="w-3.5 h-3.5" />
                    Comparer les photographies ({activePanelPhotos.length})
                  </button>
                </div>
              </div>

              {/* Ligne chronologique des Jalons d'exposition */}
              <div className="pt-3">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    Chronologie d'Exposition (NF EN 927-6)
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    {activePanelPhotos.length} cliché(s) documenté(s) sur {activeStages.length} jalons
                  </span>
                </div>

                {/* Timeline des Jalons */}
                <div className="space-y-3">
                  {activeStages.map((stage) => {
                    const photo = trial.mediaReferences.find(
                      (m) =>
                        m.type === 'PHOTO' &&
                        m.panelId === activePanel.id &&
                        m.stageId === stage.id &&
                        m.status !== 'ARCHIVED'
                    );
                    const isSelectedForCompare = photo ? selectedPhotoIdsForCompare.includes(photo.id) : false;

                    return (
                      <div
                        key={stage.id}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                          photo
                            ? 'bg-white border-slate-200 hover:border-blue-300 shadow-2xs'
                            : 'bg-slate-50/70 border-slate-200/80 border-dashed'
                        }`}
                      >
                        {/* Colonne Jalon */}
                        <div className="flex items-center gap-3 min-w-[200px]">
                          {photo && (
                            <input
                              type="checkbox"
                              checked={isSelectedForCompare}
                              onChange={() => onToggleComparePhoto(photo.id)}
                              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              title="Cocher pour inclure dans le comparateur temporel"
                            />
                          )}
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-slate-900">
                                {stage.name}
                              </span>
                              <span className="px-1.5 py-0.2 text-[10px] font-mono font-semibold rounded bg-slate-100 text-slate-700">
                                {stage.scheduledExposureHours} h
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {stage.cycleIndex === 0
                                ? 'Initial (T0 avant exposition)'
                                : stage.cycleIndex === 12
                                ? 'Final (2016 h terme essai)'
                                : `Cycle ${stage.cycleIndex} intermédiaire`}
                            </div>
                          </div>
                        </div>

                        {/* Colonne Photo / Statut */}
                        <div className="grow flex items-center gap-3">
                          {photo ? (
                            <div className="flex items-center gap-3 grow">
                              <button
                                type="button"
                                onClick={() => onPreviewPhoto(photo)}
                                className="relative group shrink-0 aspect-4/3 w-20 bg-slate-900 rounded-lg overflow-hidden border border-slate-200"
                              >
                                <img
                                  src={photo.storageKey}
                                  alt={photo.caption || 'Cliché'}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Maximize2 className="w-3.5 h-3.5 text-white" />
                                </div>
                              </button>

                              <div className="text-xs space-y-1 grow">
                                <p className="font-medium text-slate-800 line-clamp-1">{photo.caption}</p>
                                <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 font-mono">
                                  <span>{new Date(photo.capturedAt).toLocaleDateString('fr-FR')}</span>
                                  <span>•</span>
                                  <span>{photo.capturedBy}</span>
                                  <span>•</span>
                                  <span className="text-slate-500">{photo.filename}</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-slate-400 italic flex items-center gap-1.5">
                              <span>Aucun cliché sur ce jalon (documentation facultative)</span>
                            </div>
                          )}
                        </div>

                        {/* Colonne Actions */}
                        <div className="shrink-0 flex items-center gap-2">
                          {photo ? (
                            <>
                              <button
                                type="button"
                                onClick={() => onPreviewPhoto(photo)}
                                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Agrandir le cliché"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onOpenAddModalForStage(activeBatch.id, activePanel.id, stage.id)
                                }
                                className="px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 flex items-center gap-1"
                                title="Remplacer le cliché (archivera l'actuel)"
                              >
                                <RefreshCw className="w-3 h-3" />
                                Remplacer
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeletePhoto(photo.id)}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Supprimer ce cliché"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                onOpenAddModalForStage(activeBatch.id, activePanel.id, stage.id)
                              }
                              className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 flex items-center gap-1.5 transition-all"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              Prendre un Cliché
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl text-slate-500">
            <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            Veuillez sélectionner une éprouvette dans l'arborescence.
          </div>
        )}
      </div>
    </div>
  );
}
