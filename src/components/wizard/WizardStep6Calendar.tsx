/**
 * QUV-Lab — Assistant : étape 6 Calendrier & Plan de mesurage (refactor/split-wizard).
 * JSX déplacé à l'identique depuis CreateTrialWizardModal.tsx (step === 6).
 * Aucun état ici : plan + préréglages reçus en props depuis le parent.
 */

import { Calendar, ShieldAlert, Lock, CheckSquare, Square } from 'lucide-react';
import type { MeasurementFamilyId } from '../../types/scientific';

interface Props {
  activeFamilies: MeasurementFamilyId[];
  selectedMeasurementCycles: number[];
  onPreset: (preset: 'FULL' | 'QUARTERLY' | 'LIGHT') => void;
  onToggleCycle: (cycleIndex: number) => void;
}

export function WizardStep6Calendar({
  activeFamilies,
  selectedMeasurementCycles,
  onPreset,
  onToggleCycle
}: Props) {
  return (
    <div className="space-y-4">
      {/* En-tête explicatif & Statut du plan */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-slate-900">Calendrier d'Exposition UV & Plan de Mesurage (NF EN 927-6)</p>
              <p className="mt-0.5 text-slate-700 leading-relaxed">
                Définissez les moments où les mesures seront réellement réalisées. Les 12 cycles physiques d'exposition de 168 h (2016 h cumulées) restent présents indépendamment du plan de mesurage.
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[11px] font-bold shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            PLAN MODIFIABLE
          </div>
        </div>
        <p className="text-[11px] text-slate-500 pl-8 italic">
          Le plan sera automatiquement verrouillé (LOCKED) après la première acquisition scientifique saisie sur paillasse.
        </p>
      </div>

      {/* Règle spécifique ADHESION (si la famille est sélectionnée) */}
      {activeFamilies.includes('ADHESION') && (
        <div className="bg-amber-50/90 border border-amber-300 rounded-xl p-3.5 text-xs text-amber-950 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-900 flex items-center gap-2">
              <span>RÈGLE SPÉCIFIQUE — ADHÉRENCE AU QUADRILLAGE (NF EN ISO 2409)</span>
              <span className="bg-amber-200/80 text-amber-900 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">T0 + C12 uniquement</span>
            </p>
            <p className="mt-1 text-amber-900/90 text-[11px] leading-relaxed">
              L'adhérence est un essai mécanique destructif réalisé exclusivement <strong>avant exposition (T0, 0 h)</strong> et au terme des 2016 h <strong>(C12, 2016 h)</strong>. Elle n'est jamais mesurée aux jalons intermédiaires C1 à C11, quel que soit le plan de mesurage sélectionné ci-dessous.
            </p>
          </div>
        </div>
      )}

      {/* Présélections rapides & Compteur */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-700 mr-1">Préréglages :</span>
            <button
              type="button"
              onClick={() => onPreset('FULL')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                selectedMeasurementCycles.length === 13
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              Standard Complet (13 jalons)
            </button>
            <button
              type="button"
              onClick={() => onPreset('QUARTERLY')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                selectedMeasurementCycles.length === 5 && selectedMeasurementCycles.includes(3) && selectedMeasurementCycles.includes(6)
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              Jalons Clés / Trimestriels (5 jalons)
            </button>
            <button
              type="button"
              onClick={() => onPreset('LIGHT')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                selectedMeasurementCycles.length === 3 && selectedMeasurementCycles.includes(6)
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              Protocole Allégé (3 jalons)
            </button>
            {selectedMeasurementCycles.length !== 13 &&
              !(selectedMeasurementCycles.length === 5 && selectedMeasurementCycles.includes(3) && selectedMeasurementCycles.includes(6)) &&
              !(selectedMeasurementCycles.length === 3 && selectedMeasurementCycles.includes(6)) && (
                <span className="px-2 py-1 text-[11px] font-bold rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700">
                  Plan Personnalisé
                </span>
              )}
          </div>

          {/* Compteur de mesurage */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Jalons de mesurage :</span>
            <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
              <strong className="text-blue-700">{selectedMeasurementCycles.length}</strong> / 13
            </span>
          </div>
        </div>

        {/* Résumé des mesures prévues */}
        <div className="pt-2.5 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-600">Mesures prévues :</span>
            <div className="flex flex-wrap gap-1 font-mono font-bold text-xs">
              {selectedMeasurementCycles.map((c) => (
                <span
                  key={c}
                  className={`px-2 py-0.5 rounded border text-[11px] ${
                    c === 0
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : c === 12
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                  }`}
                >
                  {c === 0 ? 'T0' : `C${c}`}
                </span>
              ))}
            </div>
          </div>
          <div className="text-[11px] text-slate-500">
            {13 - selectedMeasurementCycles.length > 0 ? (
              <span>
                <strong>{13 - selectedMeasurementCycles.length}</strong> cycle(s) en <em>exposition continue seule</em> sans arrêt paillasse
              </span>
            ) : (
              <span>Campagne de mesurage prévue à chaque cycle</span>
            )}
          </div>
        </div>
      </div>

      {/* Grille des 13 cycles physiques d'exposition (sans scroll interne artificiel) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {[
          { cycle: 0, hours: 0, label: 'T0 — MESURES INITIALES AVANT EXPOSITION', type: 'INITIAL' },
          ...Array.from({ length: 11 }, (_, i) => ({
            cycle: i + 1,
            hours: (i + 1) * 168,
            label: `C${i + 1} (${(i + 1) * 168} h) — MESURES EN COURS D'EXPOSITION`,
            type: 'INTERMEDIATE'
          })),
          { cycle: 12, hours: 2016, label: 'C12 (2016 h) — MESURES FINALES APRÈS EXPOSITION', type: 'FINAL' }
        ].map((st) => {
          const isMandatory = st.cycle === 0 || st.cycle === 12;
          const isSelected = selectedMeasurementCycles.includes(st.cycle);

          return (
            <div
              key={st.cycle}
              onClick={() => !isMandatory && onToggleCycle(st.cycle)}
              className={`p-3 rounded-xl border flex flex-col justify-between gap-2.5 transition-all ${
                isMandatory
                  ? st.cycle === 0
                    ? 'border-blue-300 bg-blue-50/70 ring-1 ring-blue-400/30 cursor-default'
                    : 'border-emerald-300 bg-emerald-50/70 ring-1 ring-emerald-400/30 cursor-default'
                  : isSelected
                  ? 'border-blue-400 bg-blue-50/40 shadow-xs ring-1 ring-blue-400/20 cursor-pointer hover:border-blue-500'
                  : 'border-slate-200 bg-slate-50/90 hover:bg-slate-100/70 cursor-pointer hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
                    st.cycle === 0
                      ? 'bg-blue-600 text-white'
                      : st.cycle === 12
                      ? 'bg-emerald-600 text-white'
                      : isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  <span>{st.cycle === 0 ? 'T0' : `C${st.cycle}`}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {st.cycle === 0 ? 'T0 (0 h)' : `C${st.cycle} — ${st.hours} h`}
                    </p>
                    {isMandatory && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold rounded bg-slate-200 text-slate-800">
                        <Lock className="w-2.5 h-2.5" />
                        Obligatoire
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">
                    {st.cycle === 0 ? 'Mesures initiales' : st.cycle === 12 ? 'Mesures finales' : 'Étape intermédiaire'}
                  </p>
                </div>
              </div>

              {/* Indicateur d'état mesurage vs exposition */}
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                {isMandatory ? (
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-500" />
                    Mesure obligatoire
                  </span>
                ) : isSelected ? (
                  <span className="font-bold text-blue-700 flex items-center gap-1">
                    <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                    Mesuré
                  </span>
                ) : (
                  <span className="font-medium text-slate-500 flex items-center gap-1">
                    <Square className="w-3.5 h-3.5 text-slate-400" />
                    Exposition seule
                  </span>
                )}

                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    isMandatory
                      ? 'bg-slate-200 text-slate-800'
                      : isSelected
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isMandatory ? 'Inviolable' : isSelected ? 'Campagne active' : 'Sans arrêt'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
