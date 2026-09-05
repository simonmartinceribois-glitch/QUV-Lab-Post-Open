/**
 * QUV-Lab — Photothèque : lightbox d'inspection plein écran (refactor/split-photographs).
 * JSX déplacé à l'identique depuis TabPhotographs.tsx (lightbox).
 * Aucun état ni handler ici : tout est reçu en props depuis le parent.
 */

import { Camera, X, Trash2 } from 'lucide-react';
import type { MediaReference } from '../../types/trial';
import type { PanelMap, StageMap } from './photoTypes';

interface Props {
  media: MediaReference;
  panelMap: PanelMap;
  stageMap: StageMap;
  onClose: () => void;
  onDeletePhoto: (mediaId: string) => void;
}

export function PhotoLightbox({ media, panelMap, stageMap, onClose, onDeletePhoto }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header Lightbox */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600" />
            <div>
              <h4 className="text-sm font-bold text-slate-900 font-mono flex items-center gap-2">
                {media.filename}
                {media.status === 'ARCHIVED' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    ARCHIVÉ
                  </span>
                )}
              </h4>
              <p className="text-[11px] text-slate-500">
                Capturé le {new Date(media.capturedAt).toLocaleString('fr-FR')} par {media.capturedBy}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Metadata */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto">
          <div className="md:col-span-2 aspect-4/3 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center">
            <img
              src={media.storageKey}
              alt={media.caption}
              className="max-w-full max-h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Sidebar Metadata */}
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <span className="font-bold text-slate-800 uppercase tracking-wider block text-[10px]">
                Identifiants de Traçabilité
              </span>
              {media.panelId && panelMap.get(media.panelId) && (
                <div>
                  <span className="text-slate-400 block text-[10px]">Éprouvette & Lot :</span>
                  <span className="font-bold text-slate-900 font-mono text-sm">
                    {panelMap.get(media.panelId)?.batch.reference} —{' '}
                    {panelMap.get(media.panelId)?.panel.label}
                  </span>
                </div>
              )}

              {media.stageId && stageMap.get(media.stageId) && (
                <div>
                  <span className="text-slate-400 block text-[10px]">Jalon d'Exposition :</span>
                  <span className="font-semibold text-slate-900">
                    {stageMap.get(media.stageId)?.name} (
                    {stageMap.get(media.stageId)?.scheduledExposureHours} h)
                  </span>
                </div>
              )}

              <div>
                <span className="text-slate-400 block text-[10px]">Statut Photothèque :</span>
                <span className="font-bold text-slate-800">
                  {media.status === 'ARCHIVED' ? 'Archivé (remplacé par un cliché plus récent)' : 'Actif'}
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 space-y-1.5">
              <span className="font-bold text-blue-950 uppercase tracking-wider block text-[10px]">
                Légende & Observation
              </span>
              <p className="text-slate-800 leading-relaxed font-medium">
                {media.caption || 'Aucune observation enregistrée.'}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => onDeletePhoto(media.id)}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors border border-rose-200"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Supprimer
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-900"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
