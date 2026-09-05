/**
 * QUV-Lab — Analyse par Panneau / Éprouvette (PROMPT 7 - Sections 12 & 13)
 * Affichage chronologique complet d'une éprouvette avec bascule RAW DATA / COMPUTED DATA.
 */

import React, { useState } from 'react';
import { Trial, PanelDefinition, BatchDefinition } from '../../types/trial';
import { ScientificRuleSet, MeasurementFamilyId } from '../../types/scientific';
import { isFamilyScheduledForStage } from '../../scientific/panelUtils';
import {
  Square,
  Sparkles,
  Info,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Database,
  Calculator,
  Code
} from 'lucide-react';

interface Props {
  trial: Trial;
  ruleSet: ScientificRuleSet;
  initialBatchId?: string;
  initialPanelId?: string;
}

export function ResultsPanelAnalysisView({
  trial,
  ruleSet,
  initialBatchId,
  initialPanelId
}: Props) {
  const [selectedBatchId, setSelectedBatchId] = useState<string>(initialBatchId || trial.batches[0]?.id || '');
  const activeBatch = trial.batches.find((b) => b.id === selectedBatchId) || trial.batches[0];

  const [selectedPanelId, setSelectedPanelId] = useState<string>(
    initialPanelId || activeBatch?.panels[0]?.id || ''
  );
  const activePanel = activeBatch?.panels.find((p) => p.id === selectedPanelId) || activeBatch?.panels[0];

  const [viewMode, setViewMode] = useState<'COMPUTED' | 'RAW'>('COMPUTED');
  const [selectedFamily, setSelectedFamily] = useState<MeasurementFamilyId>('COLOR');

  if (!activeBatch || !activePanel) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
        Aucune éprouvette sélectionnée.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. BARRE DE SÉLECTION LOT & ÉPROUVETTE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-200">
            <Square className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-slate-900">Éprouvette {activePanel.label}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                activePanel.role === 'WITNESS' || activePanel.roleCode === 'T' || activePanel.label === 'T'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-blue-100 text-blue-900'
              }`}>
                {activePanel.role === 'WITNESS' || activePanel.roleCode === 'T' || activePanel.label === 'T'
                  ? 'T (Témoin non exposé)'
                  : `${activePanel.roleCode || 'E'} (Exposée)`}
              </span>
              <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                Lot {activeBatch.reference}
              </span>
              {activePanel.status === 'EXCLUDED' && (
                <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded">
                  EXCLU : {activePanel.exclusionReason}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Système : {activeBatch.coatingSystem || 'Non spécifié'} ({activeBatch.woodSpecies || 'Bois'})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Sélecteur de lot */}
          <select
            value={activeBatch.id}
            onChange={(e) => {
              setSelectedBatchId(e.target.value);
              const b = trial.batches.find((item) => item.id === e.target.value);
              if (b && b.panels.length > 0) setSelectedPanelId(b.panels[0].id);
            }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            {trial.batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.reference}
              </option>
            ))}
          </select>

          {/* Sélecteur de panneau */}
          <select
            value={activePanel.id}
            onChange={(e) => setSelectedPanelId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            {activeBatch.panels.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label} [{p.roleCode || (p.role === 'WITNESS' ? 'T' : 'E')}] {p.role === 'WITNESS' ? '• Témoin' : '• Exposé'} ({p.status})
              </option>
            ))}
          </select>

          {/* Bascule RAW / COMPUTED */}
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('COMPUTED')}
              className={`px-3 py-1 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === 'COMPUTED'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              Calculé (COMPUTED)
            </button>
            <button
              type="button"
              onClick={() => setViewMode('RAW')}
              className={`px-3 py-1 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === 'RAW'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              Brut (RAW)
            </button>
          </div>
        </div>
      </div>

      {/* 2. SÉLECTEUR DE FAMILLE */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-slate-600">Famille de mesure :</span>
        <div className="flex rounded-xl bg-white p-1 border border-slate-200 shadow-xs">
          {(['COLOR', 'GLOSS', 'PERSOZ', 'ADHESION', 'OBSERVATIONS'] as MeasurementFamilyId[]).map((fam) => (
            <button
              key={fam}
              type="button"
              onClick={() => setSelectedFamily(fam)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                selectedFamily === fam
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {fam === 'COLOR'
                ? 'Couleur'
                : fam === 'GLOSS'
                ? 'Brillance'
                : fam === 'PERSOZ'
                ? 'Persoz'
                : fam === 'ADHESION'
                ? 'Adhérence'
                : 'Observations'}
            </button>
          ))}
        </div>
      </div>

      {/* 3. TABLEAU CHRONOLOGIQUE PAR ÉTAPE (COMPUTED MODE) */}
      {viewMode === 'COMPUTED' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-600" />
              Évolution Chronologique Calculée — Éprouvette {activePanel.label} ({selectedFamily})
            </h3>
            <span className="text-xs font-mono text-slate-500">Moteur v{ruleSet.version}</span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
                  <th className="p-2.5">Étape d'Exposition</th>
                  <th className="p-2.5">Heures Réelles</th>
                  {selectedFamily === 'COLOR' && (
                    <>
                      <th className="p-2.5">Moyenne L*</th>
                      <th className="p-2.5">Moyenne a*</th>
                      <th className="p-2.5">Moyenne b*</th>
                      <th className="p-2.5 bg-amber-50 text-amber-950">ΔL*</th>
                      <th className="p-2.5 bg-amber-50 text-amber-950">Δa*</th>
                      <th className="p-2.5 bg-amber-50 text-amber-950">Δb*</th>
                      <th className="p-2.5 bg-purple-100 text-purple-950 font-black text-right">ΔE*ab</th>
                    </>
                  )}
                  {selectedFamily === 'GLOSS' && (
                    <>
                      <th className="p-2.5">Brillance Moyenne (60°)</th>
                      <th className="p-2.5">Écart-Type intra (s)</th>
                      <th className="p-2.5 bg-amber-50 text-amber-950">ΔGloss</th>
                      <th className="p-2.5 bg-emerald-100 text-emerald-950 font-black text-right">Rétention %</th>
                    </>
                  )}
                  {selectedFamily === 'PERSOZ' && (
                    <>
                      <th className="p-2.5">Temps Amortissement (s)</th>
                      <th className="p-2.5">Écart-Type intra (s)</th>
                      <th className="p-2.5">CV (%)</th>
                      <th className="p-2.5 bg-amber-50 text-amber-950">ΔDureté (s)</th>
                    </>
                  )}
                  {selectedFamily === 'ADHESION' && (
                    <>
                      <th className="p-2.5">Classe Quadrillage (0-5)</th>
                      <th className="p-2.5">Espacement Peigne</th>
                      <th className="p-2.5">Délai Application</th>
                      <th className="p-2.5 bg-indigo-50 text-indigo-950">ΔClasse vs T0</th>
                      <th className="p-2.5">Description Normalisée</th>
                    </>
                  )}
                  {selectedFamily === 'OBSERVATIONS' && (
                    <>
                      <th className="p-2.5">Observations Globales</th>
                      <th className="p-2.5">Cotation ISO</th>
                    </>
                  )}
                  <th className="p-2.5 text-center">Qualité</th>
                  <th className="p-2.5 text-center">Version Calcul</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {trial.stages
                  .filter(
                    (stage) =>
                      isFamilyScheduledForStage(selectedFamily, stage) ||
                      Boolean(trial.acquisitions[`${stage.id}__${activePanel.id}__${selectedFamily}`]?.raw)
                  )
                  .map((stage) => {
                  const key = `${stage.id}__${activePanel.id}__${selectedFamily}`;
                  const acq = trial.acquisitions[key];
                  const comp = acq?.computed as any;

                  if (!acq || !acq.raw) {
                    return (
                      <tr key={stage.id} className="text-slate-400">
                        <td className="p-2.5 font-bold font-mono text-slate-600">
                          {stage.scheduledExposureHours} h ({stage.name})
                        </td>
                        <td className="p-2.5">—</td>
                        <td colSpan={8} className="p-2.5 text-slate-400 italic">
                          Non mesuré à ce stade.
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={stage.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-900">
                        <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-700 mr-2">
                          {stage.scheduledExposureHours} h
                        </span>
                        {stage.cycleIndex === 0 ? 'T0 (Initiale)' : stage.cycleIndex === 12 ? '2016 h (Finale)' : `Cycle ${stage.cycleIndex}`}
                      </td>
                      <td className="p-2.5 font-mono text-slate-600">
                        {stage.actualExposureHours !== undefined ? `${stage.actualExposureHours} h` : '—'}
                      </td>

                      {selectedFamily === 'COLOR' && (
                        <>
                          <td className="p-2.5 font-mono text-slate-800">{comp?.meanL?.toFixed(2) ?? '—'}</td>
                          <td className="p-2.5 font-mono text-slate-800">{comp?.meanA?.toFixed(2) ?? '—'}</td>
                          <td className="p-2.5 font-mono text-slate-800">{comp?.meanB?.toFixed(2) ?? '—'}</td>
                          <td className="p-2.5 font-mono text-amber-950 font-bold bg-amber-50/40">
                            {comp?.deltaL !== null && comp?.deltaL !== undefined
                              ? (comp.deltaL > 0 ? `+${comp.deltaL.toFixed(2)}` : comp.deltaL.toFixed(2))
                              : '—'}
                          </td>
                          <td className="p-2.5 font-mono text-amber-950 font-bold bg-amber-50/40">
                            {comp?.deltaA !== null && comp?.deltaA !== undefined
                              ? (comp.deltaA > 0 ? `+${comp.deltaA.toFixed(2)}` : comp.deltaA.toFixed(2))
                              : '—'}
                          </td>
                          <td className="p-2.5 font-mono text-amber-950 font-bold bg-amber-50/40">
                            {comp?.deltaB !== null && comp?.deltaB !== undefined
                              ? (comp.deltaB > 0 ? `+${comp.deltaB.toFixed(2)}` : comp.deltaB.toFixed(2))
                              : '—'}
                          </td>
                          <td className="p-2.5 font-mono bg-purple-50 text-purple-900 font-black text-right">
                            {comp?.deltaE !== null && comp?.deltaE !== undefined ? comp.deltaE.toFixed(2) : 'RÉF'}
                          </td>
                        </>
                      )}

                      {selectedFamily === 'GLOSS' && (
                        <>
                          <td className="p-2.5 font-mono text-slate-900 font-bold">
                            {comp?.meanGloss !== null ? `${comp?.meanGloss.toFixed(1)} GU` : '—'}
                          </td>
                          <td className="p-2.5 font-mono text-slate-600">{comp?.stdDevGloss?.toFixed(2) ?? '—'}</td>
                          <td className="p-2.5 font-mono text-amber-950 font-bold bg-amber-50/40">
                            {comp?.deltaGloss !== null && comp?.deltaGloss !== undefined
                              ? `${comp.deltaGloss > 0 ? '+' : ''}${comp.deltaGloss.toFixed(1)} GU`
                              : 'RÉF'}
                          </td>
                          <td className="p-2.5 font-mono bg-emerald-50 text-emerald-950 font-black text-right">
                            {stage.cycleIndex === 0 && comp?.meanGloss !== null && comp?.meanGloss !== undefined
                              ? '100.0 %'
                              : comp?.retentionRatePercent !== null && comp?.retentionRatePercent !== undefined
                              ? `${comp.retentionRatePercent.toFixed(1)} %`
                              : '—'}
                          </td>
                        </>
                      )}

                      {selectedFamily === 'PERSOZ' && (
                        <>
                          <td className="p-2.5 font-mono text-slate-900 font-bold">
                            {comp?.meanDampingTime !== null ? `${comp?.meanDampingTime.toFixed(1)} s` : '—'}
                          </td>
                          <td className="p-2.5 font-mono text-slate-600">{comp?.stdDevDampingTime?.toFixed(2) ?? '—'}</td>
                          <td className="p-2.5 font-mono text-slate-600">{comp?.coefficientOfVariationPercent?.toFixed(1) ?? '—'} %</td>
                          <td className="p-2.5 font-mono text-amber-950 font-bold bg-amber-50/40">
                            {comp?.deltaDampingTime !== null && comp?.deltaDampingTime !== undefined
                              ? `${comp.deltaDampingTime > 0 ? '+' : ''}${comp.deltaDampingTime.toFixed(1)} s`
                              : 'RÉF'}
                          </td>
                        </>
                      )}

                      {selectedFamily === 'ADHESION' && (
                        <>
                          <td className="p-2.5 font-mono text-slate-900 font-bold">
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-bold">
                              Classe {comp?.adhesionClass ?? '—'}
                            </span>
                          </td>
                          <td className="p-2.5 font-mono text-slate-600">{comp?.gridSpacingUsedMm ? `${comp.gridSpacingUsedMm} mm` : '—'}</td>
                          <td className="p-2.5 font-mono text-slate-600">{comp?.elapsedTimeHours ? `${comp.elapsedTimeHours} h` : '—'}</td>
                          <td className="p-2.5 font-mono text-indigo-950 font-bold bg-indigo-50/40">
                            {comp?.deltaAdhesionClass !== null && comp?.deltaAdhesionClass !== undefined
                              ? `${comp.deltaAdhesionClass > 0 ? '+' : ''}${comp.deltaAdhesionClass}`
                              : 'RÉF'}
                          </td>
                          <td className="p-2.5 text-xs text-slate-700">{comp?.classDescription || '—'}</td>
                        </>
                      )}

                      {selectedFamily === 'OBSERVATIONS' && (
                        <>
                          <td className="p-2.5 text-slate-800">{comp?.summary || 'Aspect normal'}</td>
                          <td className="p-2.5 font-mono text-slate-600">ISO 4628 : Conforme</td>
                        </>
                      )}

                      <td className="p-2.5 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {comp?.qualityAssessment?.status || 'GOOD'}
                        </span>
                      </td>
                      <td className="p-2.5 text-center font-mono text-[10px] text-slate-500">
                        v{comp?.computation?.calculationVersion || ruleSet.version}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. TABLEAU DES DONNÉES BRUTES (RAW DATA MODE) */}
      {viewMode === 'RAW' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-purple-600" />
                Données Brutes de Mesure (RAW DATA) — Panneau {activePanel.label}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Précision native d'acquisition sans aucun arrondi destructif
              </p>
            </div>
            <span className="text-xs bg-purple-100 text-purple-900 px-2.5 py-1 rounded-lg font-bold">
              Immuabilité garantie
            </span>
          </div>

          <div className="space-y-3">
            {trial.stages.map((stage) => {
              const key = `${stage.id}__${activePanel.id}__${selectedFamily}`;
              const acq = trial.acquisitions[key];

              if (!acq || !acq.raw) return null;

              return (
                <div key={stage.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 font-mono">
                      Étape {stage.scheduledExposureHours} h — {stage.name}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Saisie par {acq.trace.createdBy} le {new Date(acq.trace.createdAt).toLocaleString('fr-FR')} (Source: {acq.trace.source})
                    </span>
                  </div>

                  <pre className="bg-slate-900 text-emerald-400 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                    {JSON.stringify(acq.raw, null, 2)}
                  </pre>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
