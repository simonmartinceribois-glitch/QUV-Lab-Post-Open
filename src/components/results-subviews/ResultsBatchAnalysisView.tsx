/**
 * QUV-Lab — Analyse par Lot & Fiche de Caractérisation (PROMPT 7 - Sections 10 & 11)
 * Consomme les données calculées et agrégées par le moteur scientifique.
 *
 * GATE 2.2 — Exclusion absolue du Témoin T dans toutes les agrégations du lot
 * E1 + E2 + E3 = Éprouvettes exposées aux cycles QUV
 * T = Témoin conservé à l'obscurité (exclu des moyennes, affiché pour comparaison)
 */

import React, { useState } from 'react';
import { Trial, BatchDefinition } from '../../types/trial';
import { ScientificRuleSet } from '../../types/scientific';
import { aggregateBatchColor, aggregateBatchGloss } from '../../scientific/aggregations';
import {
  Layers,
  Sparkles,
  Info,
  Calendar,
  Clock,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Eye
} from 'lucide-react';
import { getActiveExposedPanels, getWitnessPanel, getActiveStages } from '../../scientific/panelUtils';

interface Props {
  trial: Trial;
  ruleSet: ScientificRuleSet;
}

export function ResultsBatchAnalysisView({ trial, ruleSet }: Props) {
  const [selectedBatchId, setSelectedBatchId] = useState<string>(trial.batches[0]?.id || '');
  const activeBatch = trial.batches.find((b) => b.id === selectedBatchId) || trial.batches[0];

  if (!activeBatch) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
        Aucun lot défini dans cet essai.
      </div>
    );
  }

  // EXCLUSION ABSOLUE DU TÉMOIN T DES AGRÉGATIONS DU LOT
  const exposedActivePanels = getActiveExposedPanels(activeBatch.panels);
  const witnessPanel = getWitnessPanel(activeBatch.panels);
  const excludedPanels = activeBatch.panels.filter((p) => p.status === 'EXCLUDED');
  const activeStages = getActiveStages(trial.stages);

  return (
    <div className="space-y-6">
      {/* 1. SÉLECTEUR DE LOT */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            Fiche Complète & Résultats par Lot Expérimental
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Caractérisation du système, préparation et agrégations des éprouvettes exposées ({exposedActivePanels.length} exposées E1..E3)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600">Sélectionner un lot :</span>
          <select
            value={activeBatch.id}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            {trial.batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.reference} — {b.coatingSystem || 'Système'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. FICHE D'IDENTIFICATION DU LOT */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 text-xs font-black font-mono bg-blue-100 text-blue-900 rounded-lg">
              {activeBatch.reference}
            </span>
            <div>
              <h3 className="font-bold text-base text-slate-900">{activeBatch.coatingSystem || 'Système de finition non renseigné'}</h3>
              <p className="text-xs text-slate-500">
                Support : <span className="font-semibold text-slate-700">{activeBatch.woodSpecies || 'Bois massif'}</span> • 
                Fabricant : <span className="font-semibold text-slate-700">{activeBatch.manufacturerOrSupplier || 'Non précisé'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-semibold">
              {activeBatch.panels.length} éprouvettes ({exposedActivePanels.length} exposées E1..E3 • {witnessPanel ? '1 Témoin T' : '0 Témoin'} • {excludedPanels.length} exclues)
            </span>
          </div>
        </div>

        {/* Note informative de ségrégation du Témoin T */}
        <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <strong>Règle d'exclusion absolue du Témoin T :</strong> Le témoin conservé à l'obscurité (T) est strictement exclu de la moyenne de performance du lot, de l'écart-type s_inter, de la cinétique et du résultat global des exposés. Il est affiché dans sa colonne dédiée pour comparaison directe.
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">Référence Produit</span>
            <span className="font-bold text-slate-800 mt-1 block">{activeBatch.productReference || '—'}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">Nombre de couches</span>
            <span className="font-bold text-slate-800 mt-1 block">{activeBatch.coatCount || '3'} couches</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">Méthode d'Application</span>
            <span className="font-bold text-slate-800 mt-1 block">{activeBatch.applicationMethod || 'Pinceau / Manuel'}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">Conditions & Séchage</span>
            <span className="font-bold text-slate-800 mt-1 block">{activeBatch.dryingOrConditioningTime || '7 jours @ 20°C/65% HR'}</span>
          </div>
        </div>

        {activeBatch.batchNotes && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs text-slate-600">
            <strong className="font-semibold text-slate-800">Notes du lot :</strong> {activeBatch.batchNotes}
          </div>
        )}
      </div>

      {/* 3. SYNTHÈSE AGRÉGÉE DU LOT PAR ÉTAPE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              Résultats Moyens & Agrégations des Éprouvettes Exposées (E1, E2, E3)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Moyennes et dispersions inter-panneaux (s_inter) calculées exclusivement sur les éprouvettes exposées aux cycles QUV
            </p>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
                <th className="p-2.5">Étape d'Exposition</th>
                <th className="p-2.5 text-center">Exposés E1..E3</th>
                <th className="p-2.5 bg-indigo-50/60 text-indigo-950">Moyenne ΔE* Exposés</th>
                <th className="p-2.5 bg-indigo-50/60 text-indigo-950">s inter (ΔE*)</th>
                <th className="p-2.5 bg-blue-50/60 text-blue-950">Brillance Moyenne (60°)</th>
                <th className="p-2.5 bg-blue-50/60 text-blue-950">s inter (Gloss)</th>
                <th className="p-2.5 bg-emerald-50/60 text-emerald-950 font-black">Rétention Moyenne %</th>
                <th className="p-2.5 bg-amber-50/60 text-amber-950">Dureté Persoz Moy. (s)</th>
                <th className="p-2.5 bg-slate-100 text-slate-800 border-l border-slate-300 font-black">Témoin T (Obscurité)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {activeStages.map((stage) => {
                // Collecter les computed pour Couleur DES EXPOSÉS UNIQUEMENT
                const colorComputedList: any[] = [];
                const glossComputedList: any[] = [];
                const persozComputedList: any[] = [];

                exposedActivePanels.forEach((p) => {
                  const cAcq = trial.acquisitions[`${stage.id}__${p.id}__COLOR`];
                  if (cAcq?.computed) colorComputedList.push(cAcq.computed);

                  const gAcq = trial.acquisitions[`${stage.id}__${p.id}__GLOSS`];
                  if (gAcq?.computed) glossComputedList.push(gAcq.computed);

                  const pAcq = trial.acquisitions[`${stage.id}__${p.id}__PERSOZ`];
                  if (pAcq?.computed) persozComputedList.push(pAcq.computed);
                });

                // Témoin T (individuel, non-agrégé)
                let witnessInfo = '—';
                if (witnessPanel) {
                  const wColorAcq = trial.acquisitions[`${stage.id}__${witnessPanel.id}__COLOR`];
                  const wGlossAcq = trial.acquisitions[`${stage.id}__${witnessPanel.id}__GLOSS`];
                  const wDE = (wColorAcq?.computed as any)?.deltaE;
                  const wG = (wGlossAcq?.computed as any)?.meanGloss;
                  if (wDE !== undefined && wDE !== null) {
                    witnessInfo = `ΔE*=${wDE.toFixed(2)}${wG !== undefined ? ` / ${wG.toFixed(1)}GU` : ''}`;
                  } else if (wG !== undefined && wG !== null) {
                    witnessInfo = `${wG.toFixed(1)} GU`;
                  }
                }

                if (colorComputedList.length === 0 && glossComputedList.length === 0) {
                  return (
                    <tr key={stage.id} className="text-slate-400">
                      <td className="p-2.5 font-bold font-mono text-slate-600">
                        {stage.scheduledExposureHours} h ({stage.cycleIndex === 0 ? 'T0' : `Cycle ${stage.cycleIndex}`})
                      </td>
                      <td colSpan={8} className="p-2.5 text-slate-400 italic">
                        Aucun relevé validé à cette étape pour ce lot.
                      </td>
                    </tr>
                  );
                }

                // Utilisation des fonctions d'agrégation du moteur scientifique sur les exposés E1..E3
                const colorAgg = aggregateBatchColor(activeBatch.id, stage.id, colorComputedList);
                const glossAgg = aggregateBatchGloss(activeBatch.id, stage.id, glossComputedList);

                // Moyenne Persoz
                const persozMeans = persozComputedList
                  .map((p) => p.meanDampingTime)
                  .filter((v): v is number => typeof v === 'number');
                const meanPersozVal = persozMeans.length > 0
                  ? (persozMeans.reduce((a, b) => a + b, 0) / persozMeans.length).toFixed(1)
                  : '—';

                return (
                  <tr key={stage.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-700">
                        {stage.scheduledExposureHours} h
                      </span>
                      <span>{stage.cycleIndex === 0 ? 'T0 Initiale' : stage.cycleIndex === 12 ? '2016h Finale' : `Cycle ${stage.cycleIndex}`}</span>
                    </td>
                    <td className="p-2.5 text-center font-bold text-slate-700">
                      {colorComputedList.length} / {exposedActivePanels.length}
                    </td>
                    <td className="p-2.5 font-mono text-indigo-950 font-bold bg-indigo-50/30">
                      {stage.cycleIndex === 0 ? 'RÉF (0.00)' : colorAgg.meanDeltaE !== null ? colorAgg.meanDeltaE?.toFixed(2) : '—'}
                    </td>
                    <td className="p-2.5 font-mono text-slate-600 bg-indigo-50/30">
                      {stage.cycleIndex === 0 ? '—' : colorAgg.interPanelStdDev !== null ? colorAgg.interPanelStdDev?.toFixed(2) : '—'}
                    </td>
                    <td className="p-2.5 font-mono text-blue-950 font-bold bg-blue-50/30">
                      {glossAgg.interPanelMean !== null ? `${glossAgg.interPanelMean.toFixed(1)} GU` : '—'}
                    </td>
                    <td className="p-2.5 font-mono text-slate-600 bg-blue-50/30">
                      {glossAgg.interPanelStdDev !== null ? glossAgg.interPanelStdDev.toFixed(2) : '—'}
                    </td>
                    <td className="p-2.5 font-mono text-emerald-950 font-black bg-emerald-50/30">
                      {stage.cycleIndex === 0 ? '100.0 %' : glossAgg.meanGlossRetentionPercent !== null ? `${glossAgg.meanGlossRetentionPercent?.toFixed(1)} %` : '—'}
                    </td>
                    <td className="p-2.5 font-mono text-amber-950 bg-amber-50/30">
                      {meanPersozVal !== '—' ? `${meanPersozVal} s` : '—'}
                    </td>
                    <td className="p-2.5 font-mono text-slate-700 bg-slate-50 border-l border-slate-200">
                      <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 font-bold text-[10px] mr-1">T</span>
                      {witnessInfo}
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
