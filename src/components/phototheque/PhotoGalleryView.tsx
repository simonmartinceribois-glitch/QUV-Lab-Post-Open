/**
 * QUV-Lab — Photothèque : galerie globale avec filtrage (refactor/split-photographs).
 * JSX déplacé à l'identique depuis TabPhotographs.tsx (vue GALLERY).
 * Aucun état ni handler ici : tout est reçu en props depuis le parent.
 */

import type { Dispatch, SetStateAction } from 'react';
import { Filter, Camera, Archive, Maximize2, Trash2, Clock } from 'lucide-react';
import type { MediaReference, Trial } from '../../types/trial';
import type { PanelMap, StageMap } from './photoTypes';

interface Props {
  trial: Trial;
  showArchived: boolean;
  onShowArchivedChange: Dispatch<SetStateAction<boolean>>;
  selectedGalleryBatchId: string;
  onBatchFilterChange: Dispatch<SetStateAction<string>>;
  selectedGalleryStageId: string;
  onStageFilterChange: Dispatch<SetStateAction<string>>;
  selectedGallerySpecimenRole: string;
  onRoleFilterChange: Dispatch<SetStateAction<string>>;
  searchQuery: string;
  onSearchChange: Dispatch<SetStateAction<string>>;
  filteredGalleryPhotos: MediaReference[];
  panelMap: PanelMap;
  stageMap: StageMap;
  onPreviewPhoto: (photo: MediaReference) => void;
  onDeletePhoto: (mediaId: string) => void;
}

export function PhotoGalleryView({
  trial,
  showArchived,
  onShowArchivedChange,
  selectedGalleryBatchId,
  onBatchFilterChange,
  selectedGalleryStageId,
  onStageFilterChange,
  selectedGallerySpecimenRole,
  onRoleFilterChange,
  searchQuery,
  onSearchChange,
  filteredGalleryPhotos,
  panelMap,
  stageMap,
  onPreviewPhoto,
  onDeletePhoto
}: Props) {
  return (
    <div className="space-y-4">
      {/* Barre de Filtres */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            Filtres de consultation
          </div>
          <label className="flex items-center gap-2 cursor-pointer lowercase font-medium text-slate-600">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => onShowArchivedChange(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs">Afficher les clichés archivés / remplacés</span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Filtrer par Lot</label>
            <select
              value={selectedGalleryBatchId}
              onChange={(e) => onBatchFilterChange(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
            >
              <option value="ALL">Tous les lots ({trial.batches.length})</option>
              {trial.batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.reference} — {b.productReference || b.woodSpecies}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Filtrer par Jalon / Cycle</label>
            <select
              value={selectedGalleryStageId}
              onChange={(e) => onStageFilterChange(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
            >
              <option value="ALL">Toutes les étapes ({trial.stages.length})</option>
              {trial.stages.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.scheduledExposureHours}h)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Rôle d'Éprouvette</label>
            <select
              value={selectedGallerySpecimenRole}
              onChange={(e) => onRoleFilterChange(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
            >
              <option value="ALL">Tous les rôles (T + Exposés)</option>
              <option value="WITNESS">Témoins seuls (T)</option>
              <option value="EXPOSED">Exposés seuls (1, 2, 3)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Recherche (légende, auteur...)</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Ex: farinage, T0, Simon..."
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Grille de Photos */}
      {filteredGalleryPhotos.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-3">
          <Camera className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700">Aucun cliché photographique trouvé</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Aucune photo ne correspond aux filtres sélectionnés. Cliquez sur "Nouveau Cliché" pour attacher une image à une éprouvette et un jalon.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredGalleryPhotos.map((media) => {
            const info = media.panelId ? panelMap.get(media.panelId) : null;
            const stage = media.stageId ? stageMap.get(media.stageId) : null;
            const isWitness = info?.panel.label === 'T';
            const specimenLabel = info ? `${info.batch.reference}-${info.panel.label}` : 'Éprouvette';
            const isArchived = media.status === 'ARCHIVED';

            return (
              <div
                key={media.id}
                className={`bg-white border rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group ${
                  isArchived ? 'border-amber-200 opacity-70 bg-amber-50/20' : 'border-slate-200'
                }`}
              >
                {/* Thumbnail */}
                <div className="relative aspect-4/3 bg-slate-100 overflow-hidden border-b border-slate-100 flex items-center justify-center">
                  <img
                    src={media.storageKey}
                    alt={media.caption || 'Photographie éprouvette'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />

                  {/* Badges Overlay */}
                  <div className="absolute top-2 left-2 flex flex-wrap items-center gap-1">
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-slate-900/80 text-white backdrop-blur-xs">
                      {specimenLabel}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 text-[9px] font-bold rounded backdrop-blur-xs ${
                        isWitness ? 'bg-purple-600/90 text-white' : 'bg-blue-600/90 text-white'
                      }`}
                    >
                      {isWitness ? 'Témoin' : 'Exposé'}
                    </span>
                    {isArchived && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-600 text-white flex items-center gap-0.5">
                        <Archive className="w-3 h-3" />
                        Archivé
                      </span>
                    )}
                  </div>

                  {/* Hover Actions */}
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => onPreviewPhoto(media)}
                      className="p-2 rounded-full bg-white/90 text-slate-800 hover:bg-white hover:scale-110 transition-transform shadow-md"
                      title="Agrandir et inspecter"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeletePhoto(media.id)}
                      className="p-2 rounded-full bg-rose-600/90 text-white hover:bg-rose-700 hover:scale-110 transition-transform shadow-md"
                      title="Supprimer ce cliché"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Metadata Content */}
                <div className="p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <Clock className="w-3 h-3 text-blue-600" />
                      {stage ? stage.name : 'Jalon N/A'}
                    </span>
                    <span className="font-mono text-[10px] font-bold text-slate-800">
                      {stage?.scheduledExposureHours ?? 0} h
                    </span>
                  </div>

                  <p className="text-slate-800 font-medium text-xs line-clamp-2" title={media.caption}>
                    {media.caption || 'Aucune observation'}
                  </p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{media.capturedBy}</span>
                    <span>{new Date(media.capturedAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
