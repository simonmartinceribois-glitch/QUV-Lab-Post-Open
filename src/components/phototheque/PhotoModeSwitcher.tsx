/**
 * QUV-Lab — Photothèque : bannière méthodologique + sélecteur de mode (refactor/split-photographs).
 * JSX déplacé à l'identique depuis TabPhotographs.tsx (lignes 351-476).
 * Aucun état ni handler ici : tout est reçu en props depuis le parent.
 */

import { Camera, Layers, Split, Clock, Grid, Plus, ShieldCheck, CheckCircle2, Tag } from 'lucide-react';
import type { ActiveSpecimen, PhotothequeViewMode } from './photoTypes';

interface Props {
  viewMode: PhotothequeViewMode;
  onSelectMode: (mode: PhotothequeViewMode) => void;
  compareCount: number;
  activeSpecimen: ActiveSpecimen | null;
  firstStageId: string;
  onOpenAddModalForStage: (batchId: string, panelId: string, stageId: string) => void;
  onOpenBlankModal: () => void;
}

export function PhotoModeSwitcher({
  viewMode,
  onSelectMode,
  compareCount,
  activeSpecimen,
  firstStageId,
  onOpenAddModalForStage,
  onOpenBlankModal
}: Props) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Photothèque & Suivi Visuel Temporel
                <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-blue-100 text-blue-900 border border-blue-300">
                  NF EN 927-6
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Module documentaire transversal • Rattachement strict :{' '}
                <span className="font-semibold text-slate-800">Essai → Lot → Échantillon → Jalon</span>
              </p>
            </div>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => onSelectMode('SPECIMEN_TIMELINE')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === 'SPECIMEN_TIMELINE'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Par Échantillon & Chronologie
            </button>
            <button
              type="button"
              onClick={() => onSelectMode('TEMPORAL_COMPARE')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === 'TEMPORAL_COMPARE'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Split className="w-3.5 h-3.5" />
              Comparer les photographies ({compareCount})
            </button>
            <button
              type="button"
              onClick={() => onSelectMode('MATRIX')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === 'MATRIX'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Matrice Temporelle
            </button>
            <button
              type="button"
              onClick={() => onSelectMode('GALLERY')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === 'GALLERY'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              Galerie Globale
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              if (activeSpecimen) {
                onOpenAddModalForStage(activeSpecimen.batchId, activeSpecimen.panelId, firstStageId);
              } else {
                onOpenBlankModal();
              }
            }}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouveau Cliché
          </button>
        </div>
      </div>

      {/* Rappel des 3 règles d'or de la photothèque */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
          <div className="font-bold text-slate-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            1. Indépendance Métrologique
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            La photo est une donnée documentaire. Aucune mesure (Couleur, Brillance, Persoz, Adhérence) n'est bloquée en l'absence de cliché.
          </p>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
          <div className="font-bold text-slate-800 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            2. Plan Photo Facultatif
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            L'absence de photo sur un jalon intermédiaire est un choix de l'opérateur et n'est jamais considérée comme une anomalie.
          </p>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
          <div className="font-bold text-slate-800 flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-purple-600" />
            3. Traçabilité & Intra-Échantillon
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            La comparaison temporelle valide porte sur le <strong>même échantillon</strong> au fil de ses jalons d'exposition (T0, C3, C12...).
          </p>
        </div>
      </div>
    </div>
  );
}
