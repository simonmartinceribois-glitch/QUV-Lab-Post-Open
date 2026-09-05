/**
 * QUV-Lab — Vue Globale de l'Essai & Synthèse Chronologique (PROMPT 7 - Sections 4 & 5)
 */

import React, { useState } from 'react';
import { Trial, ExposureStage } from '../../types/trial';
import { ScientificRuleSet } from '../../types/scientific';
import { getActiveFamiliesForStage, isFamilyScheduledForStage } from '../../scientific/panelUtils';
import {
  Layers,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  BarChart2,
  Calendar,
  Sparkles,
  Info,
  Sliders
} from 'lucide-react';

interface Props {
  trial: Trial;
  ruleSet: ScientificRuleSet;
  onSelectStageForDetail?: (stageId: string) => void;
  onSelectPanelForDetail?: (batchId: string, panelId: string) => void;
}

export function ResultsGlobalView({
  trial,
  ruleSet,
  onSelectStageForDetail,
  onSelectPanelForDetail
}: Props) {
  const [filterFamily, setFilterFamily] = useState<string>('ALL');

  const totalBatches = trial.batches.length;
  const allPanels = trial.batches.flatMap((b) => b.panels);
  const totalPanels = allPanels.length;
  const activePanels = allPanels.filter((p) => p.status === 'ACTIVE').length;
  const excludedPanels = allPanels.filter((p) => p.status === 'EXCLUDED').length;

  const totalStages = trial.stages.length;
  const validatedStages = trial.stages.filter((s) => s.status === 'VALIDATED').length;
  const inProgressStages = trial.stages.filter((s) => s.status === 'IN_PROGRESS').length;
  const notStartedStages = trial.stages.filter((s) => s.status === 'NOT_STARTED').length;

  // Calcul du volume d'acquisitions attendues vs réalisées jalon par jalon
  const expectedAcquisitionsTotal = trial.stages.reduce((acc, stage) => {
    if (stage.status === 'INACTIVE') return acc;
    const applicable = getActiveFamiliesForStage(trial.config.activeFamilies, stage);
    return acc + (activePanels * applicable.length);
  }, 0);

  let realizedCount = 0;
  let invalidCount = 0;
  let warningCount = 0;
  let suspectCount = 0;

  Object.values(trial.acquisitions).forEach((acq) => {
    if (acq.raw) realizedCount++;
    if (acq.status === 'ERROR' || acq.alerts.some((a) => a.severity === 'BLOCKING')) invalidCount++;
    if (acq.status === 'WARNING' || acq.alerts.some((a) => a.severity === 'WARNING')) warningCount++;
    if (acq.alerts.some((a) => a.code.includes('SUSPECT') || a.code.includes('CV'))) suspectCount++;
  });

  const missingCount = Math.max(0, expectedAcquisitionsTotal - realizedCount);

  // Adaptations de protocole
  const adaptedFamilies = Object.entries(trial.config.familyConfigs)
    .filter(([_, cfg]) => cfg?.countConfig?.deviationFromStandard || cfg?.seriesConfig?.deviationFromStandard)
    .map(([fam]) => fam);

  return (
    <div className="space-y-6">
      {/* 1. CARTE RÉSUMÉ DE L'ESSAI */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg text-xs font-mono font-bold">
                {trial.metadata.reference}
              </span>
              <h2 className="text-lg font-bold text-slate-900">{trial.metadata.title || "Essai de vieillissement accéléré"}</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Client / Projet : <span className="font-semibold text-slate-700">{trial.metadata.projectOrClient || 'Standard'}</span> • 
              Opérateur créateur : <span className="font-semibold text-slate-700">{trial.metadata.createdBy}</span> • 
              Créé le : {new Date(trial.createdAt).toLocaleDateString('fr-FR')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              Règle : NF EN 927-6 (v{ruleSet.version})
            </div>

            {adaptedFamilies.length > 0 ? (
              <div className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 flex items-center gap-1.5" title={`Adaptations sur : ${adaptedFamilies.join(', ')}`}>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Protocole Adapté ({adaptedFamilies.length})
              </div>
            ) : (
              <div className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Protocole Standard
              </div>
            )}
          </div>
        </div>

        {/* 2. STATISTIQUES GLOBALES EN CHIFFRES */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-5">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">Lots & Panneaux</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-slate-900">{totalBatches}</span>
              <span className="text-xs text-slate-500 font-medium">lots / {totalPanels} p.</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">{activePanels} actifs • {excludedPanels} exclus</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">Étapes Calendrier</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-slate-900">{validatedStages + inProgressStages}</span>
              <span className="text-xs text-slate-500 font-medium">/ {totalStages} étapes</span>
            </div>
            <span className="text-[10px] text-emerald-600 mt-0.5 block font-medium">{validatedStages} validées • {inProgressStages} en cours</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">Acquisitions Réalisées</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-blue-700">{realizedCount}</span>
              <span className="text-xs text-slate-500 font-medium">/ {expectedAcquisitionsTotal}</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block font-medium">
              {((realizedCount / (expectedAcquisitionsTotal || 1)) * 100).toFixed(0)} % de la campagne
            </span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">Avertissements</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className={`text-xl font-bold ${warningCount > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                {warningCount}
              </span>
              <span className="text-xs text-slate-500 font-medium">alertes</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Dispersion / CV</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">Relevés Invalides</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className={`text-xl font-bold ${invalidCount > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                {invalidCount}
              </span>
              <span className="text-xs text-slate-500 font-medium">bloquants</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">À corriger</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">Moteur Scientifique</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-slate-800">v{ruleSet.version}</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block font-mono">100% computed</span>
          </div>
        </div>
      </div>

      {/* 3. SYNTHÈSE CHRONOLOGIQUE TEMPORELLE (Section 5) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Chronologie des 13 Étapes d'Exposition (T0 → 2016 h)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Terminologie normalisée v6.2 • Mesures initiales, en cours et finales
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {trial.stages.map((stage) => {
            const isInitial = stage.stageType === 'INITIAL_PRE_EXPOSURE';
            const isFinal = stage.stageType === 'FINAL_POST_EXPOSURE';
            const isValidated = stage.status === 'VALIDATED';
            const isInProgress = stage.status === 'IN_PROGRESS';

            // Nombre de relevés pour cette étape
            const stageAcqs = Object.values(trial.acquisitions).filter((a) => a.stageId === stage.id);
            const stageRealized = stageAcqs.filter((a) => a.raw).length;
            const stageApplicableFamilies = stage.status === 'INACTIVE'
              ? []
              : getActiveFamiliesForStage(trial.config.activeFamilies, stage);
            const stageExpected = activePanels * stageApplicableFamilies.length;
            const stageWarnings = stageAcqs.filter((a) => a.alerts.some((x) => x.severity === 'WARNING')).length;
            const stageErrors = stageAcqs.filter((a) => a.alerts.some((x) => x.severity === 'BLOCKING')).length;

            return (
              <div
                key={stage.id}
                onClick={() => onSelectStageForDetail?.(stage.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isValidated
                    ? 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-300'
                    : isInProgress
                    ? 'bg-blue-50/40 border-blue-300 ring-2 ring-blue-100 hover:border-blue-400'
                    : 'bg-slate-50/60 border-slate-200 hover:border-slate-300 opacity-80'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs font-black font-mono px-2 py-0.5 rounded ${
                        isInitial
                          ? 'bg-indigo-100 text-indigo-800'
                          : isFinal
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      {stage.scheduledExposureHours} h
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {isInitial ? 'T0 Initiale' : isFinal ? '2016 h Finale' : `Cycle ${stage.cycleIndex}`}
                    </span>
                  </div>

                  {isValidated ? (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Validée
                    </span>
                  ) : isInProgress ? (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-100 text-blue-800 flex items-center gap-1 animate-pulse">
                      <Clock className="w-3 h-3 text-blue-600" />
                      En cours
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-200 text-slate-600">
                      À venir
                    </span>
                  )}
                </div>

                <div className="mt-2.5 space-y-1">
                  <p className="text-[11px] text-slate-600 line-clamp-1 font-medium">{stage.name}</p>
                  
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/50">
                    <span>Relevés :</span>
                    <span className="font-semibold text-slate-800">
                      {stageRealized} / {stageExpected}
                    </span>
                  </div>

                  {(stageWarnings > 0 || stageErrors > 0) && (
                    <div className="flex items-center gap-2 pt-1">
                      {stageWarnings > 0 && (
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                          ⚠ {stageWarnings} alertes
                        </span>
                      )}
                      {stageErrors > 0 && (
                        <span className="text-[10px] font-semibold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                          ✕ {stageErrors} erreurs
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. MATRICE D'ACQUISITIONS PANNEAUX × TEMPS (Section 13) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Matrice Complète d'Exposition : Éprouvettes × Calendrier
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Légende : <span className="text-emerald-700 font-bold">✓ Complet</span> • <span className="text-amber-700 font-bold">⚠ Avertissement</span> • <span className="text-rose-700 font-bold">✕ Erreur/Bloquant</span> • <span className="text-slate-400 font-bold">— Non réalisé</span>
            </p>
          </div>

          {/* Filtre de famille pour la matrice */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Filtrer par famille :</span>
            <select
              value={filterFamily}
              onChange={(e) => setFilterFamily(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Toutes les familles</option>
              {trial.config.activeFamilies.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700">
                <th className="p-2.5 font-bold sticky left-0 bg-slate-100 z-10 min-w-[140px]">Lot / Éprouvette</th>
                {trial.stages.map((st) => (
                  <th key={st.id} className="p-2 text-center font-bold whitespace-nowrap min-w-[65px]">
                    <div className="text-[11px] font-mono">{st.scheduledExposureHours} h</div>
                    <div className="text-[9px] text-slate-500 font-normal">
                      {st.cycleIndex === 0 ? 'T0' : st.cycleIndex === 12 ? '2016h' : `C${st.cycleIndex}`}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {trial.batches.map((batch) => (
                <React.Fragment key={batch.id}>
                  <tr className="bg-slate-50/70 text-slate-800 font-bold text-[11px]">
                    <td colSpan={trial.stages.length + 1} className="p-2 pl-3">
                      {batch.reference} — {batch.coatingSystem || 'Système non renseigné'} ({batch.woodSpecies || 'Bois'})
                    </td>
                  </tr>
                  {batch.panels.map((panel) => (
                    <tr key={panel.id} className="hover:bg-slate-50/50">
                      <td className="p-2 pl-4 sticky left-0 bg-white z-10 flex items-center justify-between gap-2 border-r border-slate-100">
                        <button
                          type="button"
                          onClick={() => onSelectPanelForDetail?.(batch.id, panel.id)}
                          className="font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1.5"
                        >
                          <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 text-[10px]">
                            {panel.label}
                          </span>
                          {panel.status === 'EXCLUDED' && (
                            <span className="text-[9px] text-rose-600 font-bold bg-rose-50 px-1 py-0.2 rounded">EXCLU</span>
                          )}
                        </button>
                      </td>

                      {trial.stages.map((stage) => {
                        const baseFamilies = filterFamily === 'ALL'
                          ? trial.config.activeFamilies
                          : trial.config.activeFamilies.includes(filterFamily as any)
                          ? [filterFamily as any]
                          : [];
                        const familiesToCheck = stage.status === 'INACTIVE'
                          ? []
                          : getActiveFamiliesForStage(baseFamilies, stage);

                        let hasError = false;
                        let hasWarning = false;
                        let filledCount = 0;

                        familiesToCheck.forEach((fam) => {
                          const key = `${stage.id}__${panel.id}__${fam}`;
                          const acq = trial.acquisitions[key];
                          if (acq && acq.raw) {
                            filledCount++;
                            if (acq.status === 'ERROR' || acq.alerts.some((a) => a.severity === 'BLOCKING')) {
                              hasError = true;
                            } else if (acq.status === 'WARNING' || acq.alerts.some((a) => a.severity === 'WARNING')) {
                              hasWarning = true;
                            }
                          }
                        });

                        const isApplicable = familiesToCheck.length > 0;
                        const isComplete = isApplicable && filledCount === familiesToCheck.length;
                        const isPartial = isApplicable && filledCount > 0 && filledCount < familiesToCheck.length;

                        return (
                          <td key={stage.id} className="p-1.5 text-center border-r border-slate-100 last:border-r-0">
                            {panel.status === 'EXCLUDED' ? (
                              <span className="text-slate-300 text-[11px]" title="Éprouvette exclue">—</span>
                            ) : !isApplicable ? (
                              <span className="text-slate-300 text-xs" title="Non applicable à ce jalon">—</span>
                            ) : hasError ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-rose-100 text-rose-700 font-black text-xs" title="Erreur bloquante sur le relevé">
                                ✕
                              </span>
                            ) : hasWarning ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-amber-100 text-amber-700 font-bold text-xs" title="Avertissement qualité">
                                ⚠
                              </span>
                            ) : isComplete ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 font-bold text-xs" title="Acquisition complète et conforme">
                                ✓
                              </span>
                            ) : isPartial ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-blue-100 text-blue-800 font-bold text-[10px]" title="Acquisition partielle">
                                {filledCount}/{familiesToCheck.length}
                              </span>
                            ) : (
                              <span className="text-slate-300 text-xs">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
