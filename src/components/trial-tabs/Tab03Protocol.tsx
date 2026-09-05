/**
 * QUV-Lab — 03 Protocole & Plan de Mesure (PROMPT 6 - Sections 10, 11 & 12)
 * Affiche le référentiel normatif, les configurations des familles et gère l'adaptation avec justification.
 */

import React, { useState } from 'react';
import { Trial } from '../../types/trial';
import { ScientificRuleSet, MeasurementFamilyId } from '../../types/scientific';
import { globalTrialStore } from '../../services/trialStore';
import {
  ShieldCheck,
  AlertTriangle,
  Lock,
  Edit3,
  CheckCircle2,
  X,
  Info,
  Layers,
  Sparkles
} from 'lucide-react';

interface Props {
  trial: Trial;
  ruleSet: ScientificRuleSet;
  onTrialUpdated: () => void;
}

export function Tab03Protocol({ trial, ruleSet, onTrialUpdated }: Props) {
  const [selectedFamilyForAdapt, setSelectedFamilyForAdapt] = useState<MeasurementFamilyId | null>(null);
  const [newCount, setNewCount] = useState<number>(4);
  const [justification, setJustification] = useState<string>('');
  const [operatorId, setOperatorId] = useState<string>('Simon Martin (Technicien)');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isLocked = trial.configurationStatus === 'LOCKED';

  const handleOpenAdapt = (famId: MeasurementFamilyId) => {
    if (isLocked) return;
    setSelectedFamilyForAdapt(famId);
    setErrorMsg(null);
    setJustification('');
    if (famId === 'COLOR') {
      setNewCount(trial.config.familyConfigs.COLOR?.countConfig?.configuredCount || 4);
    } else if (famId === 'PERSOZ') {
      setNewCount(trial.config.familyConfigs.PERSOZ?.countConfig?.configuredCount || 3);
    }
  };

  const handleConfirmAdapt = () => {
    if (!selectedFamilyForAdapt) return;

    try {
      globalTrialStore.adaptProtocolConfig(
        trial.id,
        selectedFamilyForAdapt,
        newCount,
        justification,
        operatorId
      );
      setSelectedFamilyForAdapt(null);
      onTrialUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de l\'adaptation du protocole');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Référentiel & Plan de Mesure</h3>
            <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-blue-100 text-blue-800">
              {ruleSet.standardReference} : {ruleSet.version}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {trial.config.activeFamilies.length} familles actives sur cet essai
          </p>
        </div>

        <div>
          {isLocked ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
              <Lock className="w-4 h-4 text-amber-600" />
              <span>Protocole <strong>VERROUILLÉ</strong> (Acquisitions en cours)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Protocole <strong>MODIFIABLE</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* RÉFÉRENTIEL NORMATIF DU MODULE QUV */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md space-y-4 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-blue-400">
                RÉFÉRENTIEL NORMATIF DU MODULE QUV
              </h3>
              <p className="text-xs text-slate-300">
                Le module QUV concerne <strong>exclusivement le vieillissement artificiel</strong>.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 text-xs font-black rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/40">
            NORMATIF : NF EN 927-6:2018
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Référentiel Principal */}
          <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                RÉFÉRENTIEL PRINCIPAL
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                NORMATIF QUV
              </span>
            </div>
            <p className="font-bold text-slate-100 text-sm">NF EN 927-6:2018</p>
            <p className="text-slate-300 leading-relaxed">
              Exposition des revêtements pour bois au vieillissement artificiel par des lampes UV fluorescentes et de l'eau (Cycles de 168 h / 2016 h). Base exclusive de conformité du module.
            </p>
          </div>

          {/* NF EN 927-3 - Hors périmètre */}
          <div className="p-3.5 bg-slate-800/80 rounded-xl border border-rose-900/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-rose-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                NF EN 927-3:2019
              </span>
              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                HORS PÉRIMÈTRE QUV
              </span>
            </div>
            <p className="font-bold text-rose-200 text-sm">Vieillissement naturel (VN)</p>
            <ul className="text-slate-300 space-y-1 list-disc list-inside">
              <li><strong className="text-rose-300">NE PAS utiliser</strong> pour le moteur de conformité QUV.</li>
              <li><strong className="text-rose-300">NE PAS utiliser</strong> pour définir les calculs ou seuils QUV.</li>
              <li>Sera traitée ultérieurement dans le <em>module de vieillissement naturel (VN)</em>.</li>
            </ul>
          </div>

          {/* NF P 23-305:2026 */}
          <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sky-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                NF P 23-305:2026
              </span>
              <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[10px] font-bold">
                MENUISERIE (SI APPLICABLE)
              </span>
            </div>
            <p className="font-semibold text-slate-100">Exigences menuiseries extérieures</p>
            <ul className="text-slate-300 space-y-1 list-disc list-inside">
              <li>Uniquement lorsque ses exigences sont pertinentes pour le périmètre de l'essai QUV.</li>
              <li>Ne pas remplacer les exigences spécifiques de NF EN 927-6.</li>
            </ul>
          </div>

          {/* INFIPERF / FCBA */}
          <div className="p-3.5 bg-slate-800/80 rounded-xl border border-purple-900/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                INFIPERF / FCBA
              </span>
              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold">
                CRITÈRES COMPLÉMENTAIRES
              </span>
            </div>
            <p className="font-semibold text-purple-200">Recommandations & indicateurs laboratoire</p>
            <ul className="text-slate-300 space-y-1 list-disc list-inside">
              <li>Critères complémentaires (ex. dureté Persoz ISO 1522, seuil indicatif 50% brillance).</li>
              <li>Toujours identifier clairement qu'il s'agit d'un référentiel complémentaire et non d'une exigence NF EN 927-6.</li>
            </ul>
          </div>
        </div>

        {/* Synthèse des Principes */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">PRINCIPE DIRECTEUR :</span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
            NF EN 927-6 = NORMATIF QUV
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
            INFIPERF / FCBA = COMPLÉMENTAIRE
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30">
            NF P 23-305 = EXIGENCES PERTINENTES MENUISERIE
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
            NF EN 927-3 = HORS PÉRIMÈTRE QUV
          </span>
        </div>
      </div>

      {/* Cards per Family */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* COULEUR */}
        {trial.config.activeFamilies.includes('COLOR') && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">COULEUR (CIE L*a*b*)</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-800">
                  NORMATIVE_REQUIREMENT
                </span>
              </div>
              {!isLocked && (
                <button
                  type="button"
                  onClick={() => handleOpenAdapt('COLOR')}
                  className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Adapter
                </button>
              )}
            </div>

            <div className="text-xs space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span>Norme de référence :</span>
                <strong className="text-slate-900">NF EN 927-6 (Clause 6.3.2)</strong>
              </div>
              <div className="flex justify-between">
                <span>Nombre standard recommandé :</span>
                <strong className="text-slate-900">4 points / panneau</strong>
              </div>
              <div className="flex justify-between">
                <span>Nombre configuré actif :</span>
                <strong
                  className={
                    trial.config.familyConfigs.COLOR?.countConfig?.deviationFromStandard
                      ? 'text-amber-700'
                      : 'text-emerald-700'
                  }
                >
                  {trial.config.familyConfigs.COLOR?.countConfig?.configuredCount || 4} points / panneau
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Formule d'écart de couleur :</span>
                <strong className="text-slate-900">CIE 1976 (ΔE*ab)</strong>
              </div>
              {trial.config.familyConfigs.COLOR?.countConfig?.deviationFromStandard && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] mt-2">
                  <p className="font-bold">Protocole Adapté :</p>
                  <p className="italic">{trial.config.familyConfigs.COLOR?.countConfig?.justification}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* BRILLANCE */}
        {trial.config.activeFamilies.includes('GLOSS') && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">BRILLANCE (GU 60°)</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-800">
                  NORMATIVE_REQUIREMENT
                </span>
              </div>
            </div>

            <div className="text-xs space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span>Norme de référence :</span>
                <strong className="text-slate-900">NF EN 927-6 (Clause 6.3.3) / ISO 2813</strong>
              </div>
              <div className="flex justify-between">
                <span>Séries configurées :</span>
                <strong className="text-slate-900">2 séries (Sens du fil + Perpendiculaire)</strong>
              </div>
              <div className="flex justify-between">
                <span>Relevés totaux :</span>
                <strong className="text-emerald-700">4 relevés / panneau</strong>
              </div>
              <div className="flex justify-between">
                <span>Grandeur dérivée :</span>
                <strong className="text-slate-900">Taux de rétention GTx / GT0 (%)</strong>
              </div>
            </div>
          </div>
        )}

        {/* PERSOZ */}
        {trial.config.activeFamilies.includes('PERSOZ') && (
          <div className="bg-white border border-purple-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-purple-100">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-purple-950">DURETÉ PERSOZ</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-purple-100 text-purple-800">
                  LAB_RECOMMENDATION
                </span>
              </div>
              {!isLocked && (
                <button
                  type="button"
                  onClick={() => handleOpenAdapt('PERSOZ')}
                  className="text-xs text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Adapter
                </button>
              )}
            </div>

            <div className="text-xs space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span>Cadre d'application :</span>
                <strong className="text-purple-900 font-semibold">Mesure laboratoire complémentaire (ISO 1522)</strong>
              </div>
              <div className="flex justify-between">
                <span>Statut dans NF EN 927-6 :</span>
                <strong className="text-purple-800">Non prescrite par la norme de référence</strong>
              </div>
              <div className="flex justify-between">
                <span>Répétitions configurées :</span>
                <strong className="text-purple-900">
                  {trial.config.familyConfigs.PERSOZ?.countConfig?.configuredCount || 3} répétitions / panneau
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* OBSERVATIONS */}
        {trial.config.activeFamilies.includes('OBSERVATIONS') && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">OBSERVATIONS VISUELLES</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-800">
                  NORMATIVE_REQUIREMENT
                </span>
              </div>
            </div>

            <div className="text-xs space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span>Normes de cotation :</span>
                <strong className="text-slate-900">ISO 4628-2, -4, -5, -6 / ISO 2409</strong>
              </div>
              <div className="flex justify-between">
                <span>Échelle de cotation :</span>
                <strong className="text-slate-900">Notes 0 (aucun défaut) à 5 (défaut maximal)</strong>
              </div>
              <div className="flex justify-between">
                <span>Photographies associées :</span>
                <strong className="text-emerald-700">Supportées avec traçabilité</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Adaptation */}
      {selectedFamilyForAdapt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-base text-slate-900">
                Adapter le Plan de Mesure — {selectedFamilyForAdapt}
              </h4>
              <button
                onClick={() => setSelectedFamilyForAdapt(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nouveau Nombre de Points / Répétitions *
              </label>
              <select
                value={newCount}
                onChange={(e) => setNewCount(parseInt(e.target.value, 10))}
                className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-300 rounded-lg"
              >
                <option value={2}>2 points</option>
                <option value={3}>3 points</option>
                <option value={4}>4 points (Standard NF EN 927-6)</option>
                <option value={5}>5 points</option>
                <option value={6}>6 points</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Opérateur *
              </label>
              <input
                type="text"
                value={operatorId}
                onChange={(e) => setOperatorId(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Justification Métrologique Obligatoire *
              </label>
              <textarea
                rows={3}
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Indiquez la raison technique ou expérimentale imposant cet écart..."
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedFamilyForAdapt(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-300"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmAdapt}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                Valider l'Adaptation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
