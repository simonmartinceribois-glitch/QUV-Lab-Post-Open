/**
 * QUV-Lab — Paillasse : formulaire Adhérence au quadrillage ISO 2409 (refactor/split-bench-forms).
 * JSX déplacé à l'identique depuis Tab06MeasurementsBench.tsx (bloc IIFE inclus :
 * les dérivés thickness / spacing / délai sont recalculés ici depuis les mêmes props).
 * État de saisie au parent : classe + observation reçues en props.
 */

import type { Dispatch, SetStateAction } from 'react';
import { AlertTriangle, Info, Sliders } from 'lucide-react';
import {
  ISO2409_CLASSES,
  getApplicableGridSpacing,
  calculateDelayCompliance
} from '../../scientific/adhesionEngine';
import type { BatchDefinition, ExposureStage, PanelDefinition } from '../../types/trial';

interface Props {
  currentBatch: BatchDefinition | undefined;
  currentPanel: PanelDefinition | undefined;
  currentStage: ExposureStage;
  isInitialStage: boolean;
  adhesionClass: number | null;
  onAdhesionClassChange: Dispatch<SetStateAction<number | null>>;
  adhesionObservation: string;
  onAdhesionObservationChange: Dispatch<SetStateAction<string>>;
}

export function BenchAdhesionForm({
  currentBatch,
  currentPanel,
  currentStage,
  isInitialStage,
  adhesionClass,
  onAdhesionClassChange,
  adhesionObservation,
  onAdhesionObservationChange
}: Props) {
  const thickness = currentBatch?.dryFilmThicknessMicrons ?? undefined;
  const spacingResult = getApplicableGridSpacing(thickness);
  const delayResult = calculateDelayCompliance(currentBatch?.applicationDate, new Date().toISOString(), 168);
  const isWitness = currentPanel?.role === 'WITNESS' || currentPanel?.index === 1;

  return (
    <div className="space-y-4">
      {/* 1. Cadre de préparation et traçabilité ISO 2409 (Section 7) */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <span className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-indigo-600" />
            Paramètres Préparatoires du Quadrillage — NF EN ISO 2409:2020
          </span>
          <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold rounded-md">
            Évaluation qualitative de séparation
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
            <div className="text-slate-500 text-[11px]">Lot & Subjectile :</div>
            <div className="font-bold text-slate-900 mt-0.5">
              {currentBatch?.reference} ({currentBatch?.woodSpecies || 'Bois'})
            </div>
          </div>
          <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
            <div className="text-slate-500 text-[11px]">Épaisseur sèche (ISO 2808) :</div>
            <div className={`font-bold mt-0.5 ${thickness !== undefined && thickness <= 250 ? 'text-indigo-900' : 'text-rose-600'}`}>
              {thickness !== undefined ? `${thickness} µm` : '⚠️ Non renseignée'}
            </div>
          </div>
          <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
            <div className="text-slate-500 text-[11px]">Espacement requis du peigne :</div>
            <div className={`font-bold mt-0.5 ${thickness !== undefined && thickness <= 250 ? 'text-emerald-700' : 'text-rose-600'}`}>
              {thickness !== undefined && thickness <= 250 ? `${spacingResult.gridSpacingMm} mm (6×6 incisions)` : '🔴 Bloqué'}
            </div>
          </div>
          <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
            <div className="text-slate-500 text-[11px]">Conditionnement avant essai :</div>
            <div className="font-bold text-slate-800 mt-0.5">23 ± 2 °C / 50 ± 5 % HR (≥ 16 h)</div>
          </div>
        </div>

        {/* Traçabilité du délai d'application */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg gap-2">
          <div>
            <span className="text-slate-500 font-medium">Application finition : </span>
            <span className="font-mono font-bold text-slate-800">{currentBatch?.applicationDate || 'Non renseignée'}</span>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Délai écoulé : </span>
            {delayResult.elapsedTimeHours !== null ? (
              <span className={`font-bold ${delayResult.status === 'CONFORME' ? 'text-emerald-700' : 'text-amber-700'}`}>
                {Math.floor(delayResult.elapsedTimeHours / 24)} j {Math.round(delayResult.elapsedTimeHours % 24)} h ({delayResult.status === 'CONFORME' ? '✅ Conforme ≥ 168 h' : '⚠️ < 168 h'})
              </span>
            ) : (
              <span className="text-slate-400 italic">Date d'application manquante</span>
            )}
          </div>
        </div>

        {/* Ségrégation T0 / Exposition */}
        {isInitialStage ? (
          <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong>Étape T0 (Initial) :</strong> Mesure de référence réalisée sur l'éprouvette Témoin <strong>{currentBatch?.reference}-T</strong>. Cette donnée brute initiale est sanctuarisée et ne sera jamais écrasée par les mesures d'exposition.
            </div>
          </div>
        ) : (
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Étape d'Exposition ({currentStage.name}) :</strong> Évaluation de la résistance à la séparation après vieillissement accéléré sur éprouvette exposée <strong>{currentBatch?.reference}-{currentPanel?.label}</strong>.
            </div>
          </div>
        )}
      </div>

      {/* 2. Garde-fous normatifs */}
      {thickness === undefined && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-900 space-y-2">
          <div className="font-bold flex items-center gap-2 text-sm text-rose-800">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            Donnée manquante — Épaisseur sèche du revêtement requise
          </div>
          <p>
            Conformément à la NF EN ISO 2409:2020, l'espacement du peigne de quadrillage dépend strictement de l'épaisseur du film sec (≤ 60 µm : 1 mm sur subjectile dur ou 2 mm sur bois ; 61–120 µm : 2 mm ; 121–250 µm : 3 mm).
          </p>
          <p className="font-bold">
            La saisie du résultat d'adhérence est bloquée tant que l'épaisseur sèche du lot n'est pas renseignée dans l'onglet Lots & Éprouvettes.
          </p>
        </div>
      )}

      {thickness !== undefined && thickness > 250 && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-900 space-y-2">
          <div className="font-bold flex items-center gap-2 text-sm text-rose-800">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            🔴 Méthode non appropriée (Épaisseur {thickness} µm &gt; 250 µm)
          </div>
          <p>
            La NF EN ISO 2409:2020 spécifie formellement que l'essai de quadrillage ne s'applique pas aux revêtements dont l'épaisseur totale est supérieure à 250 µm.
          </p>
          <p className="font-bold">
            La saisie est bloquée conformément au domaine d'application de la norme.
          </p>
        </div>
      )}

      {/* 3. Sélecteur interactif des Classes de Quadrillage ISO 2409 */}
      {thickness !== undefined && thickness <= 250 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Classification visuelle du quadrillage (ISO 2409:2020)
            </span>
            <span className="text-xs text-slate-500">
              Espacement retenu : <strong>{spacingResult.gridSpacingMm} mm</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {Object.values(ISO2409_CLASSES).map((cls) => {
              const isSelected = adhesionClass === cls.rating;
              return (
                <button
                  key={cls.rating}
                  type="button"
                  onClick={() => onAdhesionClassChange(cls.rating)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                        ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-400 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${
                      cls.rating === 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : cls.rating === 1
                        ? 'bg-blue-100 text-blue-800'
                        : cls.rating === 2
                        ? 'bg-amber-100 text-amber-800'
                        : cls.rating === 3
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      Classe {cls.rating}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      Détachement : {cls.affectedAreaPercent}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-800 mb-1">{cls.shortLabel}</div>
                  <p className="text-[11px] text-slate-600 line-clamp-3 leading-relaxed">{cls.description}</p>
                </button>
              );
            })}
          </div>

          {/* Observations de l'opérateur */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Observations spécifiques sur le quadrillage (facultatif) :
            </label>
            <input
              type="text"
              value={adhesionObservation}
              onChange={(e) => onAdhesionObservationChange(e.target.value)}
              placeholder="Ex : Rupture cohésive dans le bois, détachement net sur fil du bois, petits éclats aux croisillons..."
              className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}
