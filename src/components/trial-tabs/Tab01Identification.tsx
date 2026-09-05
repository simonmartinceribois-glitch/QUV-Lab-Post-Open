/**
 * QUV-Lab — 01 Identification (PROMPT 6 v6.1 - Sections 7 & 8)
 * Affiche et permet la mise à jour des métadonnées et des caractéristiques communes de l'essai.
 */

import React, { useState } from 'react';
import { Trial, CommonCharacteristics } from '../../types/trial';
import { globalTrialStore } from '../../services/trialStore';
import {
  Info,
  Lock,
  CheckCircle2,
  Save,
  FileText,
  User,
  Calendar,
  ShieldCheck,
  Layers,
  Sliders
} from 'lucide-react';

interface Props {
  trial: Trial;
  onTrialUpdated: () => void;
}

export function Tab01Identification({ trial, onTrialUpdated }: Props) {
  const [title, setTitle] = useState(trial.metadata.title || '');
  const [orderNumber, setOrderNumber] = useState(trial.metadata.orderNumber || 'CO-VAN2026-001');
  const [reportNumber, setReportNumber] = useState(trial.metadata.reportNumber || 'RA-VAN2026-001');
  const [projectOrClient, setProjectOrClient] = useState(trial.metadata.projectOrClient || '');
  const [coatingSystemDescription, setCoatingSystemDescription] = useState(trial.metadata.coatingSystemDescription || '');
  const [substrateDescription, setSubstrateDescription] = useState(trial.metadata.substrateDescription || '');
  const [generalNotes, setGeneralNotes] = useState(trial.metadata.generalNotes || '');

  // Caractéristiques communes (Niveau PROJET)
  const [lengthMm, setLengthMm] = useState<number>(trial.commonCharacteristics?.dimensions?.lengthMm || 150);
  const [widthMm, setWidthMm] = useState<number>(trial.commonCharacteristics?.dimensions?.widthMm || 75);
  const [thicknessMm, setThicknessMm] = useState<number>(trial.commonCharacteristics?.dimensions?.thicknessMm || 15);
  const [dimUnit, setDimUnit] = useState<'mm' | 'cm'>(trial.commonCharacteristics?.dimensions?.unit || 'mm');
  const [substrateNature, setSubstrateNature] = useState<string>(trial.commonCharacteristics?.substrateNature || 'Bois massif');
  const [materialType, setMaterialType] = useState<string>(trial.commonCharacteristics?.materialType || 'Pin sylvestre (NF EN 927-6)');
  const [preparationNotes, setPreparationNotes] = useState<string>(trial.commonCharacteristics?.preparationNotes || 'Ponçage P120, dépoussiérage');
  const [conditioningNotes, setConditioningNotes] = useState<string>(trial.commonCharacteristics?.conditioningNotes || 'Conditionnement 7 jours à 20±2°C / 65±5% HR');
  const [generalProtocolNotes, setGeneralProtocolNotes] = useState<string>(trial.commonCharacteristics?.generalProtocolNotes || '');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const isLocked = trial.configurationStatus === 'LOCKED';

  const handleSave = () => {
    trial.metadata.title = title.trim();
    trial.metadata.orderNumber = orderNumber.trim();
    trial.metadata.reportNumber = reportNumber.trim();
    trial.metadata.projectOrClient = projectOrClient.trim();
    trial.metadata.coatingSystemDescription = coatingSystemDescription.trim();
    trial.metadata.substrateDescription = substrateDescription.trim();
    trial.metadata.generalNotes = generalNotes.trim();

    trial.commonCharacteristics = {
      dimensions: {
        lengthMm,
        widthMm,
        thicknessMm,
        unit: dimUnit
      },
      substrateNature: substrateNature.trim(),
      materialType: materialType.trim(),
      preparationNotes: preparationNotes.trim(),
      conditioningNotes: conditioningNotes.trim(),
      generalProtocolNotes: generalProtocolNotes.trim()
    };

    globalTrialStore.saveTrial(trial);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
    onTrialUpdated();
  };

  return (
    <div className="space-y-6">
      {/* Information Header & Lock Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">{trial.metadata.reference}</h3>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-800">
                {trial.status}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Créé le {new Date(trial.createdAt).toLocaleDateString('fr-FR')} par {trial.metadata.createdBy}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isLocked ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
              <Lock className="w-4 h-4 text-amber-600" />
              <span>Configuration <strong>LOCKED</strong> (Acquisitions enregistrées)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Configuration <strong>EDITABLE</strong> (Avant 1ère acquisition)</span>
            </div>
          )}
        </div>
      </div>

      {/* Normative/Context Disclaimer */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3 text-xs text-slate-600">
        <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-slate-800">Fiche d'identification et caractéristiques communes</p>
          <p>
            Ces informations garantissent la traçabilité complète des éprouvettes et du protocole (NF EN 927-6 §5). Elles sont séparées des données de calculs scientifiques.
          </p>
        </div>
      </div>

      {/* Form Grid 1 : Métadonnées */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
          1. Identification Administrative & Contexte
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Référence Essai (Immuable)
            </label>
            <input
              type="text"
              value={trial.metadata.reference}
              disabled
              className="w-full text-xs font-mono font-bold px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              N° Commande (CO-VANXXXX)
            </label>
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="Ex: CO-VAN2026-001"
              className="w-full text-xs font-mono font-semibold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              N° Rapport (RA-VANXXXX)
            </label>
            <input
              type="text"
              value={reportNumber}
              onChange={(e) => setReportNumber(e.target.value)}
              placeholder="Ex: RA-VAN2026-001"
              className="w-full text-xs font-mono font-semibold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Intitulé / Titre de l'Essai
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Client / Demandeur / Projet
            </label>
            <input
              type="text"
              value={projectOrClient}
              onChange={(e) => setProjectOrClient(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Opérateur / Responsable Création
            </label>
            <input
              type="text"
              value={trial.metadata.createdBy}
              disabled
              className="w-full text-xs px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Notes Générales & Contexte d'Essai
            </label>
            <input
              type="text"
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Contexte général de l'étude..."
            />
          </div>
        </div>
      </div>

      {/* Form Grid 2 : Caractéristiques Communes */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2 flex items-center justify-between">
          <span>2. Dimensions Communes des Éprouvettes (Niveau PROJET)</span>
          <span className="text-blue-600 font-bold normal-case">Saisies UNE SEULE FOIS pour tout le projet</span>
        </h4>

        {/* Dimensions */}
        <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              Dimensions physiques uniques applicables à tous les lots et éprouvettes
            </span>
            <span className="text-[11px] text-slate-500 italic">NF EN 927-6 §5 : 150 × 75 × 15 mm recommandé</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-700 mb-1 font-semibold">Longueur ({dimUnit})</label>
              <input
                type="number"
                value={lengthMm}
                onChange={(e) => setLengthMm(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-medium"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1 font-semibold">Largeur ({dimUnit})</label>
              <input
                type="number"
                value={widthMm}
                onChange={(e) => setWidthMm(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-medium"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1 font-semibold">Épaisseur ({dimUnit})</label>
              <input
                type="number"
                value={thicknessMm}
                onChange={(e) => setThicknessMm(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-medium"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1 font-semibold">Unité de mesure</label>
              <select
                value={dimUnit}
                onChange={(e) => setDimUnit(e.target.value as any)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-medium"
              >
                <option value="mm">mm</option>
                <option value="cm">cm</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nature du support (Général)
            </label>
            <input
              type="text"
              value={substrateNature}
              onChange={(e) => setSubstrateNature(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              placeholder="Ex: Bois massif"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Essence par défaut (Précisée par lot dans l'onglet 02)
            </label>
            <input
              type="text"
              value={materialType}
              onChange={(e) => setMaterialType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              placeholder="Ex: Pin sylvestre standardisé (NF EN 927-6)"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Informations de préparation
            </label>
            <textarea
              rows={2}
              value={preparationNotes}
              onChange={(e) => setPreparationNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              placeholder="Ponçage, dépoussiérage..."
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Informations de conditionnement
            </label>
            <textarea
              rows={2}
              value={conditioningNotes}
              onChange={(e) => setConditioningNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              placeholder="Stabilisation..."
            />
          </div>
        </div>

        {/* Bouton d'enregistrement */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div>
            {savedSuccess && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4" />
                Métadonnées et caractéristiques enregistrées avec succès
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            Enregistrer les Modifications
          </button>
        </div>
      </div>
    </div>
  );
}
