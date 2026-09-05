/**
 * QUV-Lab — Comparateur Temporel T0 / Intermédiaires / 2016 h (PROMPT 7 - Sections 6, 7, 8, 9)
 * Consomme EXCLUSIVEMENT les grandeurs calculées par le moteur scientifique (PROMPT 5).
 * Ne recalcule AUCUNE formule dans l'interface.
 */

import React, { useState } from 'react';
import { Trial, ExposureStage } from '../../types/trial';
import { ScientificRuleSet, MeasurementFamilyId } from '../../types/scientific';
import {
  GitCompare,
  Layers,
  Sparkles,
  Info,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ChevronRight,
  Code
} from 'lucide-react';

interface Props {
  trial: Trial;
  ruleSet: ScientificRuleSet;
}

export function ResultsTemporalComparisonView({ trial, ruleSet }: Props) {
  const stageT0 = trial.stages.find((s) => s.stageType === 'INITIAL_PRE_EXPOSURE' || s.cycleIndex === 0) || trial.stages[0];
  
  // Par défaut, sélectionner la dernière étape mesurée ou en cours
  const evaluatedStages = trial.stages.filter((s) => s.status === 'VALIDATED' || s.status === 'IN_PROGRESS');
  const defaultTarget = evaluatedStages.length > 1 ? evaluatedStages[evaluatedStages.length - 1].id : trial.stages[1]?.id || trial.stages[0]?.id;

  const [selectedReferenceStageId, setSelectedReferenceStageId] = useState<string>(stageT0?.id || '');
  const [selectedTargetStageId, setSelectedTargetStageId] = useState<string>(defaultTarget);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('ALL');
  const [selectedFamily, setSelectedFamily] = useState<MeasurementFamilyId>('COLOR');
  const [showCalculationDetailsModal, setShowCalculationDetailsModal] = useState<boolean>(false);
  const [calculationModalData, setCalculationModalData] = useState<any>(null);

  const refStage = trial.stages.find((s) => s.id === selectedReferenceStageId) || stageT0;
  const targetStage = trial.stages.find((s) => s.id === selectedTargetStageId) || trial.stages[1];

  const filteredBatches = selectedBatchId === 'ALL'
    ? trial.batches
    : trial.batches.filter((b) => b.id === selectedBatchId);

  const handleOpenCalcDetails = (computedData: any, familyId: string, panelLabel: string) => {
    setCalculationModalData({
      computed: computedData,
      familyId,
      panelLabel,
      ruleSet
    });
    setShowCalculationDetailsModal(true);
  };

  return (
    <div className="space-y-6">
      {/* 1. SÉLECTEURS DE COMPARAISON */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-blue-600" />
              Comparaison Temporelle Scientifique : T0 vs Étapes d'Exposition
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Valeurs différentielles directement issues du moteur de calcul QUV-Lab (v{ruleSet.version})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Famille :</span>
            <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
              {(['COLOR', 'GLOSS', 'PERSOZ'] as MeasurementFamilyId[]).map((fam) => (
                <button
                  key={fam}
                  type="button"
                  onClick={() => setSelectedFamily(fam)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    selectedFamily === fam
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Étape de Référence */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              1. Étape de Référence (T0 obligatoire)
            </label>
            <select
              value={selectedReferenceStageId}
              onChange={(e) => setSelectedReferenceStageId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {trial.stages.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.scheduledExposureHours} h)
                </option>
              ))}
            </select>
          </div>

          {/* Étape Cible d'Exposition */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              2. Étape Comparée (En cours / Finale 2016 h)
            </label>
            <select
              value={selectedTargetStageId}
              onChange={(e) => setSelectedTargetStageId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {trial.stages
                .filter((st) => st.id !== selectedReferenceStageId)
                .map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.scheduledExposureHours} h) — {st.status}
                  </option>
                ))}
            </select>
          </div>

          {/* Filtre Lot */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              3. Filtrer par Lot
            </label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Tous les lots ({trial.batches.length})</option>
              {trial.batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.reference} — {b.coatingSystem || 'Système'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. BANNIÈRE D'INFORMATION SCIENTIFIQUE */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-900">
        <div className="flex items-center gap-2.5">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            Comparaison entre <strong className="font-bold text-blue-950">{refStage.name}</strong> et{' '}
            <strong className="font-bold text-blue-950">{targetStage.name}</strong>.
            {selectedFamily === 'PERSOZ' && (
              <span className="ml-2 font-bold px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md border border-amber-300">
                LAB_RECOMMENDATION (Dureté hors NF EN 927-6 strict)
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-blue-800 shrink-0">
          <span>Engine v{ruleSet.version}</span>
          <span>•</span>
          <span>Diff : {ruleSet.colorimetry.differenceFormula}</span>
        </div>
      </div>

      {/* 3. TABLEAUX SCIENTIFIQUES PAR FAMILLE */}
      {selectedFamily === 'COLOR' && (
        <div className="space-y-4">
          {filteredBatches.map((batch) => (
            <div key={batch.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">{batch.reference}</span>
                  <span className="text-xs text-slate-500">— {batch.coatingSystem || 'Système non renseigné'} ({batch.woodSpecies || 'Bois'})</span>
                </div>
                <span className="text-xs font-semibold text-slate-500 font-mono">
                  {batch.panels.length} éprouvettes
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
                      <th className="p-2.5">Éprouvette</th>
                      <th className="p-2.5 bg-indigo-50/60 text-indigo-950">L* réf (T0)</th>
                      <th className="p-2.5 bg-indigo-50/60 text-indigo-950">a* réf (T0)</th>
                      <th className="p-2.5 bg-indigo-50/60 text-indigo-950">b* réf (T0)</th>
                      <th className="p-2.5 bg-blue-50/60 text-blue-950">L* mesuré</th>
                      <th className="p-2.5 bg-blue-50/60 text-blue-950">a* mesuré</th>
                      <th className="p-2.5 bg-blue-50/60 text-blue-950">b* mesuré</th>
                      <th className="p-2.5 bg-amber-50/70 text-amber-950 font-black">ΔL*</th>
                      <th className="p-2.5 bg-amber-50/70 text-amber-950 font-black">Δa*</th>
                      <th className="p-2.5 bg-amber-50/70 text-amber-950 font-black">Δb*</th>
                      <th className="p-2.5 bg-purple-100 text-purple-950 font-black text-right min-w-[90px]">ΔE*ab</th>
                      <th className="p-2.5 text-center">Qualité</th>
                      <th className="p-2.5 text-center">Version</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {batch.panels.map((panel) => {
                      const refKey = `${refStage.id}__${panel.id}__COLOR`;
                      const targetKey = `${targetStage.id}__${panel.id}__COLOR`;
                      const refAcq = trial.acquisitions[refKey];
                      const targetAcq = trial.acquisitions[targetKey];

                      const refComp = refAcq?.computed as any;
                      const targetComp = targetAcq?.computed as any;

                      if (!targetAcq || !targetAcq.raw) {
                        return (
                          <tr key={panel.id} className="text-slate-400">
                            <td className="p-2.5 font-bold font-mono text-slate-600">{panel.label}</td>
                            <td colSpan={12} className="p-2.5 text-slate-400 italic">
                              Mesure non réalisée à l'étape {targetStage.scheduledExposureHours} h.
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={panel.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold font-mono text-slate-900">{panel.label}</td>
                          <td className="p-2.5 font-mono text-slate-700 bg-indigo-50/30">{refComp?.meanL?.toFixed(2) ?? '—'}</td>
                          <td className="p-2.5 font-mono text-slate-700 bg-indigo-50/30">{refComp?.meanA?.toFixed(2) ?? '—'}</td>
                          <td className="p-2.5 font-mono text-slate-700 bg-indigo-50/30">{refComp?.meanB?.toFixed(2) ?? '—'}</td>
                          <td className="p-2.5 font-mono text-slate-900 bg-blue-50/30 font-bold">{targetComp?.meanL?.toFixed(2) ?? '—'}</td>
                          <td className="p-2.5 font-mono text-slate-900 bg-blue-50/30 font-bold">{targetComp?.meanA?.toFixed(2) ?? '—'}</td>
                          <td className="p-2.5 font-mono text-slate-900 bg-blue-50/30 font-bold">{targetComp?.meanB?.toFixed(2) ?? '—'}</td>
                          <td className="p-2.5 font-mono text-slate-900 bg-amber-50/40 font-bold">
                            {targetComp?.deltaL !== null && targetComp?.deltaL !== undefined
                              ? (targetComp.deltaL > 0 ? `+${targetComp.deltaL.toFixed(2)}` : targetComp.deltaL.toFixed(2))
                              : '—'}
                          </td>
                          <td className="p-2.5 font-mono text-slate-900 bg-amber-50/40 font-bold">
                            {targetComp?.deltaA !== null && targetComp?.deltaA !== undefined
                              ? (targetComp.deltaA > 0 ? `+${targetComp.deltaA.toFixed(2)}` : targetComp.deltaA.toFixed(2))
                              : '—'}
                          </td>
                          <td className="p-2.5 font-mono text-slate-900 bg-amber-50/40 font-bold">
                            {targetComp?.deltaB !== null && targetComp?.deltaB !== undefined
                              ? (targetComp.deltaB > 0 ? `+${targetComp.deltaB.toFixed(2)}` : targetComp.deltaB.toFixed(2))
                              : '—'}
                          </td>
                          <td className="p-2.5 font-mono bg-purple-50 text-purple-900 font-black text-right text-sm">
                            {targetComp?.deltaE !== null && targetComp?.deltaE !== undefined
                              ? targetComp.deltaE.toFixed(2)
                              : 'RÉF'}
                          </td>
                          <td className="p-2.5 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {targetComp?.qualityAssessment?.status || 'GOOD'}
                            </span>
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleOpenCalcDetails(targetComp, 'COLOR', panel.label)}
                              className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center justify-center gap-1 mx-auto"
                            >
                              <Code className="w-3 h-3" />
                              v{targetComp?.computation?.calculationVersion || ruleSet.version}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. TABLEAUX BRILLANCE */}
      {selectedFamily === 'GLOSS' && (
        <div className="space-y-4">
          {filteredBatches.map((batch) => (
            <div key={batch.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">{batch.reference}</span>
                  <span className="text-xs text-slate-500">— {batch.coatingSystem || 'Système'} (Géométrie 60°)</span>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
                      <th className="p-2.5">Éprouvette</th>
                      <th className="p-2.5 bg-indigo-50/60 text-indigo-950">Brillance T0 (GU)</th>
                      <th className="p-2.5 bg-blue-50/60 text-blue-950">Brillance Mesurée (GU)</th>
                      <th className="p-2.5 bg-blue-50/60 text-blue-950">Écart-Type intra (s)</th>
                      <th className="p-2.5 bg-amber-50/70 text-amber-950 font-black">ΔGloss (GU)</th>
                      <th className="p-2.5 bg-emerald-100 text-emerald-950 font-black text-right min-w-[110px]">
                        Taux Rétention %
                      </th>
                      <th className="p-2.5 text-center">Qualité</th>
                      <th className="p-2.5 text-center">Version</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {batch.panels.map((panel) => {
                      const refKey = `${refStage.id}__${panel.id}__GLOSS`;
                      const targetKey = `${targetStage.id}__${panel.id}__GLOSS`;
                      const refAcq = trial.acquisitions[refKey];
                      const targetAcq = trial.acquisitions[targetKey];

                      const refComp = refAcq?.computed as any;
                      const targetComp = targetAcq?.computed as any;

                      if (!targetAcq || !targetAcq.raw) {
                        return (
                          <tr key={panel.id} className="text-slate-400">
                            <td className="p-2.5 font-bold font-mono text-slate-600">{panel.label}</td>
                            <td colSpan={7} className="p-2.5 text-slate-400 italic">
                              Mesure non réalisée à l'étape {targetStage.scheduledExposureHours} h.
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={panel.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold font-mono text-slate-900">{panel.label}</td>
                          <td className="p-2.5 font-mono text-slate-700 bg-indigo-50/30 font-bold">
                            {refComp?.meanGloss?.toFixed(1) ?? '—'} GU
                          </td>
                          <td className="p-2.5 font-mono text-slate-900 bg-blue-50/30 font-black">
                            {targetComp?.meanGloss?.toFixed(1) ?? '—'} GU
                          </td>
                          <td className="p-2.5 font-mono text-slate-600 bg-blue-50/30">
                            {targetComp?.stdDevGloss?.toFixed(2) ?? '—'}
                          </td>
                          <td className="p-2.5 font-mono text-slate-900 bg-amber-50/40 font-bold">
                            {targetComp?.deltaGloss !== null && targetComp?.deltaGloss !== undefined
                              ? `${targetComp.deltaGloss > 0 ? '+' : ''}${targetComp.deltaGloss.toFixed(1)} GU`
                              : 'RÉF'}
                          </td>
                          <td className="p-2.5 font-mono bg-emerald-50 text-emerald-950 font-black text-right text-sm">
                            {targetComp?.retentionRatePercent !== null && targetComp?.retentionRatePercent !== undefined
                              ? `${targetComp.retentionRatePercent.toFixed(1)} %`
                              : '100.0 % (RÉF)'}
                          </td>
                          <td className="p-2.5 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {targetComp?.qualityAssessment?.status || 'GOOD'}
                            </span>
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleOpenCalcDetails(targetComp, 'GLOSS', panel.label)}
                              className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center justify-center gap-1 mx-auto"
                            >
                              <Code className="w-3 h-3" />
                              v{targetComp?.computation?.calculationVersion || ruleSet.version}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. TABLEAUX PERSOZ */}
      {selectedFamily === 'PERSOZ' && (
        <div className="space-y-4">
          {filteredBatches.map((batch) => (
            <div key={batch.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">{batch.reference}</span>
                  <span className="text-xs text-slate-500">— Dureté Persoz (Temps d'amortissement en secondes)</span>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
                      <th className="p-2.5">Éprouvette</th>
                      <th className="p-2.5 bg-indigo-50/60 text-indigo-950">Dureté T0 (s)</th>
                      <th className="p-2.5 bg-blue-50/60 text-blue-950">Dureté Mesurée (s)</th>
                      <th className="p-2.5 bg-blue-50/60 text-blue-950">Écart-Type (s)</th>
                      <th className="p-2.5 bg-blue-50/60 text-blue-950">CV (%)</th>
                      <th className="p-2.5 bg-amber-50/70 text-amber-950 font-black">ΔDureté (s)</th>
                      <th className="p-2.5 text-center">Qualité</th>
                      <th className="p-2.5 text-center">Version</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {batch.panels.map((panel) => {
                      const refKey = `${refStage.id}__${panel.id}__PERSOZ`;
                      const targetKey = `${targetStage.id}__${panel.id}__PERSOZ`;
                      const refAcq = trial.acquisitions[refKey];
                      const targetAcq = trial.acquisitions[targetKey];

                      const refComp = refAcq?.computed as any;
                      const targetComp = targetAcq?.computed as any;

                      if (!targetAcq || !targetAcq.raw) {
                        return (
                          <tr key={panel.id} className="text-slate-400">
                            <td className="p-2.5 font-bold font-mono text-slate-600">{panel.label}</td>
                            <td colSpan={7} className="p-2.5 text-slate-400 italic">
                              Mesure non réalisée à l'étape {targetStage.scheduledExposureHours} h.
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={panel.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold font-mono text-slate-900">{panel.label}</td>
                          <td className="p-2.5 font-mono text-slate-700 bg-indigo-50/30 font-bold">
                            {refComp?.meanDampingTime?.toFixed(1) ?? '—'} s
                          </td>
                          <td className="p-2.5 font-mono text-slate-900 bg-blue-50/30 font-black">
                            {targetComp?.meanDampingTime?.toFixed(1) ?? '—'} s
                          </td>
                          <td className="p-2.5 font-mono text-slate-600 bg-blue-50/30">
                            {targetComp?.stdDevDampingTime?.toFixed(2) ?? '—'} s
                          </td>
                          <td className="p-2.5 font-mono text-slate-600 bg-blue-50/30">
                            {targetComp?.coefficientOfVariationPercent?.toFixed(1) ?? '—'} %
                          </td>
                          <td className="p-2.5 font-mono text-slate-900 bg-amber-50/40 font-bold">
                            {targetComp?.deltaDampingTime !== null && targetComp?.deltaDampingTime !== undefined
                              ? `${targetComp.deltaDampingTime > 0 ? '+' : ''}${targetComp.deltaDampingTime.toFixed(1)} s`
                              : 'RÉF'}
                          </td>
                          <td className="p-2.5 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {targetComp?.qualityAssessment?.status || 'GOOD'}
                            </span>
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleOpenCalcDetails(targetComp, 'PERSOZ', panel.label)}
                              className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center justify-center gap-1 mx-auto"
                            >
                              <Code className="w-3 h-3" />
                              v{targetComp?.computation?.calculationVersion || ruleSet.version}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 6. MODAL DE DÉTAIL DE VERSION DE CALCUL SCIENTIFIQUE (Section 17) */}
      {showCalculationDetailsModal && calculationModalData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Traçabilité du Calcul — {calculationModalData.panelLabel} ({calculationModalData.familyId})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCalculationDetailsModal(false)}
                className="text-slate-400 hover:text-slate-600 font-black text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Moteur Scientifique :</span>
                <span className="font-bold text-slate-800">QUV-Lab Engine v{calculationModalData.computed?.computation?.calculationVersion || ruleSet.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Horodatage du calcul :</span>
                <span className="font-mono text-slate-700">{calculationModalData.computed?.computation?.calculatedAt || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Référentiel RuleSet :</span>
                <span className="font-mono text-slate-700">{ruleSet.id} ({ruleSet.standardReference})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Méthode Écart-type :</span>
                <span className="font-semibold text-slate-700">Échantillon (n - 1)</span>
              </div>
              {calculationModalData.familyId === 'COLOR' && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Formule Colorimétrique :</span>
                  <span className="font-semibold text-slate-700">CIE L*a*b* ΔE*ab (ISO 7724)</span>
                </div>
              )}
            </div>

            <div className="space-y-1 text-xs">
              <span className="font-bold text-slate-700 block">Objet COMPUTED sérialisé :</span>
              <pre className="bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-[10px] overflow-x-auto max-h-48">
                {JSON.stringify(calculationModalData.computed, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowCalculationDetailsModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
