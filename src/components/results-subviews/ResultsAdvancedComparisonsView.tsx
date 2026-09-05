/**
 * QUV-Lab — Comparaisons Croisées Inter-Lots (PROMPT 7 - Section 12 & 13)
 * Compare les performances inter-lots à étape constante en garantissant l'exclusion stricte du témoin T.
 */

import React, { useState } from 'react';
import { Trial, BatchDefinition, ExposureStage } from '../../types/trial';
import { ScientificRuleSet, MeasurementFamilyId } from '../../types/scientific';
import { aggregateBatchColor, aggregateBatchGloss } from '../../scientific/aggregations';
import { GitCompare, Layers, TrendingUp, Info, CheckCircle2 } from 'lucide-react';
import { getActiveExposedPanels, getActiveStages } from '../../scientific/panelUtils';

interface Props {
  trial: Trial;
  ruleSet: ScientificRuleSet;
}

export function ResultsAdvancedComparisonsView({ trial, ruleSet }: Props) {
  const activeStages = getActiveStages(trial.stages);
  const [selectedStageId, setSelectedStageId] = useState<string>(
    activeStages.length > 1 ? activeStages[1].id : activeStages[0]?.id || ''
  );
  const [comparisonFamily, setComparisonFamily] = useState<MeasurementFamilyId>('COLOR');

  const activeStage = activeStages.find((s) => s.id === selectedStageId) || activeStages[0];

  return (
    <div className="space-y-6">
      {/* 1. BARRE DE COMMANDE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-blue-600" />
            Comparaisons Croisées Inter-Lots & Étude de Dispersion
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Analyse comparative de performance sur éprouvettes exposées à étape d'exposition constante (Témoins T exclus)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Sélecteur d'étape */}
          <div>
            <select
              value={activeStage?.id}
              onChange={(e) => setSelectedStageId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {activeStages.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.scheduledExposureHours} h)
                </option>
              ))}
            </select>
          </div>

          {/* Sélecteur de famille */}
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            {(['COLOR', 'GLOSS', 'PERSOZ'] as MeasurementFamilyId[]).map((fam) => (
              <button
                key={fam}
                type="button"
                onClick={() => setComparisonFamily(fam)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  comparisonFamily === fam
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {fam === 'COLOR' ? 'Couleur (ΔE*)' : fam === 'GLOSS' ? 'Brillance (60°)' : 'Persoz (Dureté)'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. TABLEAU COMPARATIF INTER-LOTS À L'ÉTAPE SÉLECTIONNÉE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            Performance Comparée des Lots à {activeStage?.scheduledExposureHours} h ({activeStage?.name})
          </h3>
          <span className="text-xs bg-blue-100 text-blue-900 px-2.5 py-1 rounded-lg font-bold">
            {trial.batches.length} lots comparés
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
                <th className="p-2.5">Lot & Référence</th>
                <th className="p-2.5">Système / Formulation</th>
                <th className="p-2.5">Essence Bois</th>
                <th className="p-2.5 text-center">Exposés E1..E3</th>
                {comparisonFamily === 'COLOR' && (
                  <>
                    <th className="p-2.5 bg-indigo-50/60 text-indigo-950 font-black">ΔE* Moyen Exposés</th>
                    <th className="p-2.5 bg-indigo-50/60 text-indigo-950">Dispersion inter (s)</th>
                    <th className="p-2.5">ΔL* Moyen</th>
                    <th className="p-2.5">Δa* Moyen</th>
                    <th className="p-2.5">Δb* Moyen</th>
                  </>
                )}
                {comparisonFamily === 'GLOSS' && (
                  <>
                    <th className="p-2.5 bg-blue-50/60 text-blue-950">Brillance Moy. (GU)</th>
                    <th className="p-2.5 bg-blue-50/60 text-blue-950">Dispersion inter (s)</th>
                    <th className="p-2.5 bg-emerald-100 text-emerald-950 font-black">Rétention Moyenne %</th>
                    <th className="p-2.5">ΔGloss Moyen</th>
                  </>
                )}
                {comparisonFamily === 'PERSOZ' && (
                  <>
                    <th className="p-2.5 bg-amber-50/60 text-amber-950 font-black">Dureté Moyenne (s)</th>
                    <th className="p-2.5">Dispersion inter (s)</th>
                    <th className="p-2.5">ΔDureté vs T0</th>
                  </>
                )}
                <th className="p-2.5 text-center">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {trial.batches.map((batch) => {
                // Exclusion stricte du Témoin T des agrégations
                const activePanels = getActiveExposedPanels(batch.panels);
                const colorComputedList: any[] = [];
                const glossComputedList: any[] = [];
                const persozComputedList: any[] = [];

                if (activeStage) {
                  activePanels.forEach((p) => {
                    const cAcq = trial.acquisitions[`${activeStage.id}__${p.id}__COLOR`];
                    if (cAcq?.computed) colorComputedList.push(cAcq.computed);

                    const gAcq = trial.acquisitions[`${activeStage.id}__${p.id}__GLOSS`];
                    if (gAcq?.computed) glossComputedList.push(gAcq.computed);

                    const pAcq = trial.acquisitions[`${activeStage.id}__${p.id}__PERSOZ`];
                    if (pAcq?.computed) persozComputedList.push(pAcq.computed);
                  });
                }

                const isMissing =
                  comparisonFamily === 'COLOR'
                    ? colorComputedList.length === 0
                    : comparisonFamily === 'GLOSS'
                    ? glossComputedList.length === 0
                    : persozComputedList.length === 0;

                if (isMissing || !activeStage) {
                  return (
                    <tr key={batch.id} className="text-slate-400">
                      <td className="p-2.5 font-bold font-mono text-slate-700">{batch.reference}</td>
                      <td className="p-2.5">{batch.coatingSystem || '—'}</td>
                      <td className="p-2.5">{batch.woodSpecies || '—'}</td>
                      <td className="p-2.5 text-center">0 / {activePanels.length}</td>
                      <td colSpan={6} className="p-2.5 italic text-slate-400">
                        RÉSULTAT PARTIEL / Non mesuré à cette étape
                      </td>
                    </tr>
                  );
                }

                const colorAgg = aggregateBatchColor(batch.id, activeStage.id, colorComputedList);
                const glossAgg = aggregateBatchGloss(batch.id, activeStage.id, glossComputedList);

                const persozValues = persozComputedList
                  .map((p) => p.meanDampingTime)
                  .filter((v): v is number => typeof v === 'number');
                const meanP =
                  persozValues.length > 0
                    ? (persozValues.reduce((a, b) => a + b, 0) / persozValues.length).toFixed(1)
                    : '—';

                return (
                  <tr key={batch.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold font-mono text-slate-900">{batch.reference}</td>
                    <td className="p-2.5 text-slate-800">{batch.coatingSystem || 'Non renseigné'}</td>
                    <td className="p-2.5 text-slate-600">{batch.woodSpecies || 'Bois'}</td>
                    <td className="p-2.5 text-center font-bold text-slate-700">
                      {colorComputedList.length} / {activePanels.length}
                    </td>

                    {comparisonFamily === 'COLOR' && (
                      <>
                        <td className="p-2.5 font-mono text-indigo-950 font-black text-sm bg-indigo-50/40">
                          {activeStage.cycleIndex === 0
                            ? 'RÉF'
                            : colorAgg.meanDeltaE !== null
                            ? colorAgg.meanDeltaE?.toFixed(2)
                            : '—'}
                        </td>
                        <td className="p-2.5 font-mono text-slate-600 bg-indigo-50/40">
                          {colorAgg.interPanelStdDev !== null ? colorAgg.interPanelStdDev?.toFixed(2) : '—'}
                        </td>
                        <td className="p-2.5 font-mono text-slate-700">
                          {(colorComputedList.reduce((acc, curr) => acc + (curr.deltaL || 0), 0) / (colorComputedList.length || 1)).toFixed(2)}
                        </td>
                        <td className="p-2.5 font-mono text-slate-700">
                          {(colorComputedList.reduce((acc, curr) => acc + (curr.deltaA || 0), 0) / (colorComputedList.length || 1)).toFixed(2)}
                        </td>
                        <td className="p-2.5 font-mono text-slate-700">
                          {(colorComputedList.reduce((acc, curr) => acc + (curr.deltaB || 0), 0) / (colorComputedList.length || 1)).toFixed(2)}
                        </td>
                      </>
                    )}

                    {comparisonFamily === 'GLOSS' && (
                      <>
                        <td className="p-2.5 font-mono text-blue-950 font-bold bg-blue-50/40">
                          {glossAgg.interPanelMean !== null ? `${glossAgg.interPanelMean.toFixed(1)} GU` : '—'}
                        </td>
                        <td className="p-2.5 font-mono text-slate-600 bg-blue-50/40">
                          {glossAgg.interPanelStdDev !== null ? glossAgg.interPanelStdDev.toFixed(2) : '—'}
                        </td>
                        <td className="p-2.5 font-mono text-emerald-950 font-black text-sm bg-emerald-50/40">
                          {activeStage.cycleIndex === 0
                            ? '100.0 %'
                            : glossAgg.meanGlossRetentionPercent !== null
                            ? `${glossAgg.meanGlossRetentionPercent?.toFixed(1)} %`
                            : '—'}
                        </td>
                        <td className="p-2.5 font-mono text-slate-700">
                          {glossAgg.meanDeltaGloss !== null && glossAgg.meanDeltaGloss !== undefined ? glossAgg.meanDeltaGloss?.toFixed(1) : '—'}
                        </td>
                      </>
                    )}

                    {comparisonFamily === 'PERSOZ' && (
                      <>
                        <td className="p-2.5 font-mono text-amber-950 font-bold bg-amber-50/40">
                          {meanP !== '—' ? `${meanP} s` : '—'}
                        </td>
                        <td className="p-2.5 font-mono text-slate-600 bg-amber-50/40">
                          {persozComputedList[0]?.interPanelStdDev !== undefined ? persozComputedList[0]?.interPanelStdDev : '—'}
                        </td>
                        <td className="p-2.5 font-mono text-slate-700">
                          {persozComputedList[0]?.relativeHardnessVariationPercent !== undefined
                            ? `${persozComputedList[0]?.relativeHardnessVariationPercent > 0 ? '+' : ''}${persozComputedList[0]?.relativeHardnessVariationPercent?.toFixed(1)} %`
                            : '—'}
                        </td>
                      </>
                    )}

                    <td className="p-2.5 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        VALIDE
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
