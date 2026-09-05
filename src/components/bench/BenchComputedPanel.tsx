/**
 * QUV-Lab — Paillasse : colonne calculs instantanés & qualité (refactor/split-bench).
 * JSX déplacé à l'identique depuis Tab06MeasurementsBench.tsx (colonne droite).
 * Aucun état ni handler ici : tout est reçu en props depuis le parent.
 * Note : `computed` reste typé `any` comme à l'origine (retypage = ticket dédié).
 */

import { AlertTriangle } from 'lucide-react';
import type { MeasurementFamilyId } from '../../types/scientific';
import type { PanelAcquisitionRecord } from '../../types/trial';

interface Props {
  computed: any;
  currentRecord: PanelAcquisitionRecord | undefined;
  selectedFamilyId: MeasurementFamilyId;
  isInitialStage: boolean;
}

export function BenchComputedPanel({ computed, currentRecord, selectedFamilyId, isInitialStage }: Props) {
  return (
    <div className="lg:col-span-4 space-y-4">
      {/* Card Qualité du relevé */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Contrôle Qualité Temps-Réel
          </h5>
          <span
            className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
              computed?.qualityAssessment?.status === 'GOOD'
                ? 'bg-emerald-100 text-emerald-800'
                : computed?.qualityAssessment?.status === 'WARNING'
                ? 'bg-amber-100 text-amber-800'
                : computed?.qualityAssessment?.status === 'INVALID'
                ? 'bg-rose-100 text-rose-800'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {computed?.qualityAssessment?.status || 'EN_ATTENTE'}
          </span>
        </div>

        {computed?.qualityAssessment ? (
          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Points valides :</span>
              <strong className="text-slate-900">
                {computed.qualityAssessment.validCount} / {computed.qualityAssessment.totalCount}
              </strong>
            </div>
            <div className="flex justify-between">
              <span>Complétude :</span>
              <strong className="text-emerald-700">
                {computed.qualityAssessment.completionRatePercent}%
              </strong>
            </div>

            {/* Alertes éventuelles */}
            {currentRecord?.alerts && currentRecord.alerts.length > 0 && (
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <span className="font-bold text-[11px] text-slate-700 uppercase tracking-wider">
                  Alertes Métrologiques :
                </span>
                {currentRecord.alerts.map((al, aIdx) => (
                  <div
                    key={aIdx}
                    className={`p-2 rounded-lg text-[11px] font-medium flex items-start gap-1.5 ${
                      al.severity === 'BLOCKING'
                        ? 'bg-rose-50 border border-rose-200 text-rose-800'
                        : 'bg-amber-50 border border-amber-200 text-amber-900'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{al.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-slate-400 italic">
            Saisissez les points et enregistrez pour déclencher l'évaluation.
          </div>
        )}
      </div>

      {/* Card Grandeurs Calculées Instantanées */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100">
          Grandeurs Dérivées (Moteur PROMPT 5)
        </h5>

        {computed ? (
          <div className="space-y-2.5 text-xs text-slate-700 font-mono">
            {/* COULEUR */}
            {selectedFamilyId === 'COLOR' && (
              <>
                <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
                  <span>Moyenne L* :</span>
                  <strong>{computed.meanL !== null ? computed.meanL.toFixed(2) : '—'}</strong>
                </div>
                <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
                  <span>Moyenne a* :</span>
                  <strong>{computed.meanA !== null ? computed.meanA.toFixed(2) : '—'}</strong>
                </div>
                <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
                  <span>Moyenne b* :</span>
                  <strong>{computed.meanB !== null ? computed.meanB.toFixed(2) : '—'}</strong>
                </div>
                {!isInitialStage && (
                  <div className="flex justify-between p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 font-bold">
                    <span>Écart Total ΔE*ab :</span>
                    <span>{computed.deltaE !== null ? computed.deltaE.toFixed(2) : '—'}</span>
                  </div>
                )}
              </>
            )}

            {/* BRILLANCE */}
            {selectedFamilyId === 'GLOSS' && (
              <>
                <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
                  <span>Moyenne Brillance :</span>
                  <strong>{computed.meanGloss !== null ? `${computed.meanGloss.toFixed(1)} GU` : '—'}</strong>
                </div>
                <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
                  <span>Écart-type s :</span>
                  <strong>{computed.stdDevGloss !== null ? computed.stdDevGloss.toFixed(2) : '—'}</strong>
                </div>
                {!isInitialStage && (
                  <div className="flex justify-between p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 font-bold">
                    <span>Taux de Rétention :</span>
                    <span>
                      {computed.retentionRatePercent !== null
                        ? `${computed.retentionRatePercent.toFixed(1)} %`
                        : '—'}
                    </span>
                  </div>
                )}
              </>
            )}

            {/* PERSOZ */}
            {selectedFamilyId === 'PERSOZ' && (
              <>
                <div className="flex justify-between p-2 bg-purple-50 rounded-lg text-purple-950">
                  <span>Moyenne Amortissement :</span>
                  <strong>
                    {computed.meanDampingTime !== null ? `${computed.meanDampingTime.toFixed(1)} s` : '—'}
                  </strong>
                </div>
                <div className="flex justify-between p-2 bg-purple-50 rounded-lg text-purple-950">
                  <span>Coeff. Variation CV% :</span>
                  <strong>
                    {computed.coefficientOfVariationPercent !== null
                      ? `${computed.coefficientOfVariationPercent.toFixed(1)} %`
                      : '—'}
                  </strong>
                </div>
              </>
            )}

            {/* ADHESION */}
            {selectedFamilyId === 'ADHESION' && (
              <>
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider">Classe d'Adhérence :</span>
                    <span className="px-2.5 py-0.5 bg-indigo-600 text-white font-bold rounded-lg text-sm">
                      Classe {computed.adhesionClass ?? '—'}
                    </span>
                  </div>
                  <p className="text-xs text-indigo-900 italic leading-relaxed">{computed.classDescription}</p>
                </div>

                <div className="flex justify-between p-2 bg-slate-50 rounded-lg text-xs">
                  <span className="text-slate-600">Peigne de quadrillage :</span>
                  <strong>{computed.gridSpacingUsedMm ? `${computed.gridSpacingUsedMm} mm (6×6)` : '—'}</strong>
                </div>

                <div className="flex justify-between p-2 bg-slate-50 rounded-lg text-xs">
                  <span className="text-slate-600">Délai d'application :</span>
                  <strong>{computed.elapsedTimeHours !== undefined && computed.elapsedTimeHours !== null ? `${computed.elapsedTimeHours} h` : '—'}</strong>
                </div>

                {!isInitialStage && computed.witnessT0AdhesionClass !== undefined && (
                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-950 space-y-1">
                    <div className="flex justify-between font-bold">
                      <span>Évolution vs T0 :</span>
                      <span>
                        {computed.deltaAdhesionClass !== null && computed.deltaAdhesionClass !== undefined
                          ? (computed.deltaAdhesionClass >= 0 ? `+${computed.deltaAdhesionClass}` : `${computed.deltaAdhesionClass}`)
                          : '—'}
                      </span>
                    </div>
                    <div className="text-[11px] text-blue-700">
                      (Classe {computed.adhesionClass} actuelle vs Classe {computed.witnessT0AdhesionClass} à T0 sur témoin)
                    </div>
                  </div>
                )}

                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 leading-relaxed">
                  <strong>Rappel normatif NF EN ISO 2409:2020 :</strong>
                  <p className="mt-0.5">
                    L'essai au quadrillage est une méthode empirique d'évaluation de la résistance à la séparation. Ne jamais convertir en contrainte d'adhérence en MPa ni en conformité automatique.
                  </p>
                </div>
              </>
            )}

            {/* OBSERVATIONS */}
            {selectedFamilyId === 'OBSERVATIONS' && (
              <>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-slate-500">Synthèse :</span>
                  <div className="font-sans font-bold text-slate-900 mt-1">{computed.summary}</div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="text-xs text-slate-400 italic">Aucun calcul disponible.</div>
        )}
      </div>
    </div>
  );
}
