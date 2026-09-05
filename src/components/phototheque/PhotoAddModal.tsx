/**
 * QUV-Lab — Photothèque : modal d'ajout / remplacement de cliché (refactor/split-photographs).
 * JSX déplacé à l'identique depuis TabPhotographs.tsx (modal GATE 2.2).
 * Aucun état ni handler ici : tout est reçu en props depuis le parent.
 */

import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { useMemo } from 'react';
import { Camera, X, AlertCircle, AlertTriangle } from 'lucide-react';
import { getActiveStages } from '../../scientific/panelUtils';
import type { MediaReference, PanelDefinition, Trial } from '../../types/trial';

interface Props {
  trial: Trial;
  existingActivePhotoInModal: MediaReference | null;
  uploadError: string | null;
  newPhotoBatchId: string;
  onBatchIdChange: Dispatch<SetStateAction<string>>;
  newPhotoPanelId: string;
  onPanelIdChange: Dispatch<SetStateAction<string>>;
  newPhotoStageId: string;
  onStageIdChange: Dispatch<SetStateAction<string>>;
  newPhotoFace: string;
  onFaceChange: Dispatch<SetStateAction<string>>;
  newPhotoCaption: string;
  onCaptionChange: Dispatch<SetStateAction<string>>;
  newPhotoOperator: string;
  onOperatorChange: Dispatch<SetStateAction<string>>;
  newPhotoDataUrl: string;
  modalBatchPanels: PanelDefinition[];
  onFileSelected: (e: ChangeEvent<HTMLInputElement>) => void;
  onSavePhoto: () => void;
  onCloseModal: () => void;
}

export function PhotoAddModal({
  trial,
  existingActivePhotoInModal,
  uploadError,
  newPhotoBatchId,
  onBatchIdChange,
  newPhotoPanelId,
  onPanelIdChange,
  newPhotoStageId,
  onStageIdChange,
  newPhotoFace,
  onFaceChange,
  newPhotoCaption,
  onCaptionChange,
  newPhotoOperator,
  onOperatorChange,
  newPhotoDataUrl,
  modalBatchPanels,
  onFileSelected,
  onSavePhoto,
  onCloseModal
}: Props) {
  // Plan de mesurage : seuls les jalons actifs sont proposés (fix/photo-active-stages).
  const activeStages = useMemo(() => getActiveStages(trial.stages), [trial.stages]);
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600" />
            {existingActivePhotoInModal ? 'Remplacer le Cliché Photographique' : 'Nouveau Cliché Photographique'}
          </h3>
          <button onClick={onCloseModal} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {uploadError && (
          <div className="p-3 bg-rose-50 text-rose-900 rounded-xl border border-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Avertissement de remplacement si photo existante */}
        {existingActivePhotoInModal && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Unicité active & Remplacement contrôlé :</strong> Un cliché actif existe déjà pour cette éprouvette à ce jalon (<em>{existingActivePhotoInModal.filename}</em>). L'enregistrement de ce nouveau cliché archivera l'ancien dans l'historique sans le détruire.
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              1. Lot expérimental *
            </label>
            <select
              value={newPhotoBatchId}
              onChange={(e) => {
                onBatchIdChange(e.target.value);
                const b = trial.batches.find((batch) => batch.id === e.target.value);
                if (b && b.panels[0]) onPanelIdChange(b.panels[0].id);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
            >
              {trial.batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.reference} ({b.woodSpecies})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              2. Éprouvette ciblée *
            </label>
            <select
              value={newPhotoPanelId}
              onChange={(e) => onPanelIdChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
            >
              {modalBatchPanels.map((p) => (
                <option key={p.id} value={p.id}>
                  Éprouvette {p.label} ({p.label === 'T' ? 'Témoin' : 'Exposé'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              3. Jalon d'exposition *
            </label>
            <select
              value={newPhotoStageId}
              onChange={(e) => onStageIdChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
            >
              {activeStages.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.scheduledExposureHours}h)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              4. Face photographiée
            </label>
            <select
              value={newPhotoFace}
              onChange={(e) => onFaceChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
            >
              <option value="Face externe">Face externe (exposée UV)</option>
              <option value="Face interne">Face interne (non exposée)</option>
              <option value="Tranche / Rive">Tranche / Rive</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              5. Fichier Image (Téléversement ou Glisser-Déposer)
            </label>
            <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-4 text-center cursor-pointer bg-slate-50 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={onFileSelected}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {newPhotoDataUrl && (
                <div className="mt-3 aspect-16/9 max-h-36 rounded-lg overflow-hidden border border-slate-200 mx-auto">
                  <img
                    src={newPhotoDataUrl}
                    alt="Aperçu"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="col-span-2">
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              6. Observations / Légende du cliché
            </label>
            <textarea
              rows={2}
              value={newPhotoCaption}
              onChange={(e) => onCaptionChange(e.target.value)}
              placeholder="Ex : Fissuration locale en zone centrale, début de farinage, décollement en tranche..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Opérateur de prise de vue
            </label>
            <input
              type="text"
              value={newPhotoOperator}
              onChange={(e) => onOperatorChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onCloseModal}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onSavePhoto}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Camera className="w-4 h-4" />
            {existingActivePhotoInModal ? "Remplacer et Archiver l'Ancien" : 'Enregistrer la Photo'}
          </button>
        </div>
      </div>
    </div>
  );
}
