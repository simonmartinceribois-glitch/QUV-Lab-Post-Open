/**
 * QUV-Lab — 05 Suivi & Validation des Étapes (PROMPT 6 - Sections 14, 15 & 18)
 * Tableau de bord d'étape, avancement par famille de mesure, et validation d'étape.
 *
 * GATE 2.2 — Gestion dynamique et non-destructive des jalons intermédiaires C1 à C11.
 * T0 (Cycle 0) et C12 (2016h) sont obligatoires et verrouillés.
 */

import React, { useState } from 'react';
import { Trial, ExposureStage } from '../../types/trial';
import { MeasurementFamilyId } from '../../types/scientific';
import { globalTrialStore } from '../../services/trialStore';
import { isMandatoryStage, getActiveFamiliesForStage } from '../../scientific/panelUtils';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  ChevronRight,
  ShieldCheck,
  Info,
  Save,
  Check,
  FileCheck,
  X,
  Power,
  RotateCcw,
  Ban,
  Lock
} from 'lucide-react';

interface Props {
  trial: Trial;
  selectedStageId: string;
  onSelectStageId: (stageId: string) => void;
  onNavigateToFamilyBench: (familyId: MeasurementFamilyId) => void;
  onTrialUpdated: () => void;
}

export function Tab05Stages({
  trial,
  selectedStageId,
  onSelectStageId,
  onNavigateToFamilyBench,
  onTrialUpdated
}: Props) {
  // Gate 54 (D-1) : seuls les jalons actifs font partie du plan de mesurage.
  // Un jalon INACTIVE ne doit jamais pouvoir être sélectionné pour le banc de mesure.
  const activeStages = trial.stages.filter((s) => s.status !== 'INACTIVE');
  const currentStage = activeStages.find((s) => s.id === selectedStageId) || activeStages[0] || trial.stages[0];

  // Si selectedStageId est inactif ou introuvable parmi les actifs, synchroniser avec le parent
  React.useEffect(() => {
    const isSelectedActive = activeStages.some((s) => s.id === selectedStageId);
    if (!isSelectedActive && currentStage && currentStage.status !== 'INACTIVE') {
      onSelectStageId(currentStage.id);
    }
  }, [selectedStageId, activeStages, currentStage, onSelectStageId]);

  const [actualHours, setActualHours] = useState<string>(
    currentStage.actualExposureHours !== undefined ? currentStage.actualExposureHours.toString() : ''
  );
  const [operatorId, setOperatorId] = useState<string>('Simon Martin (Technicien)');
  const [validationNotes, setValidationNotes] = useState<string>('');
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showDeactivationModal, setShowDeactivationModal] = useState(false);
  const [deactivationReason, setDeactivationReason] = useState<string>('');
  const [saveHoursSuccess, setSaveHoursSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isMandatory = isMandatoryStage(currentStage);
  const isInactive = currentStage.status === 'INACTIVE';
  const isValidated = currentStage.status === 'VALIDATED';

  // Gate 54 (D-2) : verrouillage strict du plan après la 1ère acquisition
  const hasAcquisitions = Object.keys(trial.acquisitions || {}).length > 0;
  const isPlanLocked = trial.configurationStatus === 'LOCKED' || hasAcquisitions;

  const activePanels = trial.batches.flatMap((b) => b.panels).filter((p) => p.status === 'ACTIVE');
  const totalActivePanelsCount = activePanels.length;

  // Calcul des statistiques de complétude par famille pour l'étape courante
  // Familles de mesure applicables à ce jalon selon la règle métier (ex: ADHESION = T0 + C12 uniquement)
  const stageActiveFamilies = getActiveFamiliesForStage(trial.config.activeFamilies || [], currentStage);

  const familyStats: Record<
    string,
    { completed: number; total: number; warningCount: number; errorCount: number }
  > = {
    COLOR: { completed: 0, total: totalActivePanelsCount, warningCount: 0, errorCount: 0 },
    GLOSS: { completed: 0, total: totalActivePanelsCount, warningCount: 0, errorCount: 0 },
    PERSOZ: { completed: 0, total: totalActivePanelsCount, warningCount: 0, errorCount: 0 },
    ADHESION: { completed: 0, total: totalActivePanelsCount, warningCount: 0, errorCount: 0 },
    OBSERVATIONS: { completed: 0, total: totalActivePanelsCount, warningCount: 0, errorCount: 0 }
  };

  // Garantir l'initialisation pour toute famille configurée
  for (const fam of trial.config.activeFamilies || []) {
    if (!familyStats[fam]) {
      familyStats[fam] = { completed: 0, total: totalActivePanelsCount, warningCount: 0, errorCount: 0 };
    }
  }

  for (const panel of activePanels) {
    for (const fam of stageActiveFamilies) {
      const key = `${currentStage.id}__${panel.id}__${fam}`;
      const rec = trial.acquisitions[key];
      if (rec && rec.computed && familyStats[fam]) {
        familyStats[fam].completed++;
        if (rec.status === 'WARNING') familyStats[fam].warningCount++;
        if (rec.status === 'ERROR') familyStats[fam].errorCount++;
      }
    }
  }

  const allFamiliesComplete = stageActiveFamilies.every(
    (fam) => (familyStats[fam]?.completed ?? 0) === totalActivePanelsCount && totalActivePanelsCount > 0
  );

  const handleSaveHours = () => {
    const val = parseFloat(actualHours);
    if (!isNaN(val)) {
      currentStage.actualExposureHours = val;
      globalTrialStore.saveTrial(trial);
      setSaveHoursSuccess(true);
      setTimeout(() => setSaveHoursSuccess(false), 2000);
      onTrialUpdated();
    }
  };

  const handleConfirmValidation = () => {
    globalTrialStore.validateStage(trial.id, currentStage.id, operatorId, validationNotes);
    setShowValidationModal(false);
    onTrialUpdated();
  };

  const handleToggleStatus = (targetActive: boolean) => {
    if (isPlanLocked) {
      setStatusMessage({
        type: 'error',
        text: "Le plan de mesurage est verrouillé. Aucune modification du statut des étapes n'est autorisée après le démarrage de la campagne."
      });
      setTimeout(() => setStatusMessage(null), 4000);
      return;
    }

    try {
      globalTrialStore.toggleStageStatus(
        trial.id,
        currentStage.id,
        operatorId,
        deactivationReason || (targetActive ? 'Réactivation du jalon' : 'Jalon non retenu dans ce protocole allégé')
      );
      setShowDeactivationModal(false);
      setDeactivationReason('');
      setStatusMessage({
        type: 'success',
        text: targetActive ? 'Étape réactivée avec succès' : 'Étape désactivée avec succès (données préservées)'
      });
      setTimeout(() => setStatusMessage(null), 3000);
      onTrialUpdated();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Erreur lors du changement de statut de l\'étape'
      });
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border text-xs font-bold flex items-center justify-between shadow-xs ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="text-slate-500 hover:text-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Selector of stages */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        {trial.stages.map((stage) => {
          const isSelected = stage.id === currentStage.id;
          const isVal = stage.status === 'VALIDATED';
          const isInProg = stage.status === 'IN_PROGRESS';
          const isStInactive = stage.status === 'INACTIVE';
          const isStMandatory = isMandatoryStage(stage);

          return (
            <button
              key={stage.id}
              disabled={isStInactive}
              title={isStInactive ? "Cycle physique exclu du plan de mesurage (sélection interdite)" : undefined}
              onClick={() => {
                if (isStInactive) return;
                onSelectStageId(stage.id);
                setActualHours(stage.actualExposureHours !== undefined ? stage.actualExposureHours.toString() : '');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-xs'
                  : isStInactive
                  ? 'bg-slate-100 text-slate-400 line-through border border-dashed border-slate-300 opacity-60 cursor-not-allowed'
                  : isVal
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : isInProg
                  ? 'bg-blue-50 text-blue-800 border border-blue-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isVal && <CheckCircle2 className="w-3.5 h-3.5" />}
              {isInProg && !isVal && <PlayCircle className="w-3.5 h-3.5" />}
              {isStInactive && <Ban className="w-3.5 h-3.5 text-slate-400" />}
              {stage.cycleIndex === 0 ? 'T0 (0 h)' : `${stage.scheduledExposureHours} h`}
              {isStMandatory && <span className="text-[9px] px-1 bg-amber-200 text-amber-900 rounded">REQ</span>}
              {isStInactive && <span className="text-[9px] px-1 bg-slate-200 text-slate-500 rounded font-normal">EXCLU</span>}
            </button>
          );
        })}
      </div>

      {/* Stage Detail Header Card */}
      <div className={`bg-white border rounded-2xl p-6 shadow-xs space-y-4 ${isInactive ? 'border-dashed border-slate-300 bg-slate-50/50' : 'border-slate-200'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-lg font-bold ${isInactive ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{currentStage.name}</h3>
              <span
                className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                  isInactive
                    ? 'bg-slate-200 text-slate-700'
                    : isValidated
                    ? 'bg-emerald-100 text-emerald-800'
                    : currentStage.status === 'IN_PROGRESS'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {isInactive ? 'DÉSACTIVÉE (NON-DESTRUCTIF)' : currentStage.status}
              </span>
              {isMandatory && (
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 rounded-md">
                  Norme Obligatoire
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Exposition théorique prévue (NF EN 927-6) : <strong className="font-mono text-slate-800">{currentStage.cycleIndex} × 168 h = {currentStage.scheduledExposureHours} h</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Bouton de désactivation/réactivation du jalon */}
            {isPlanLocked ? (
              <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5 bg-slate-100 py-1.5 px-3 rounded-xl border border-slate-200" title="Plan de mesurage verrouillé">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                Plan verrouillé
              </span>
            ) : !isMandatory ? (
              isInactive ? (
                <button
                  type="button"
                  onClick={() => handleToggleStatus(true)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs"
                >
                  <RotateCcw className="w-4 h-4" />
                  Réactiver le Jalon
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeactivationModal(true)}
                  className="px-3 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-300 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
                >
                  <Power className="w-4 h-4 text-slate-500 hover:text-rose-600" />
                  Désactiver ce Jalon
                </button>
              )
            ) : (
              <span className="text-[11px] font-bold text-slate-400 italic px-2">
                Jalon verrouillé par la norme
              </span>
            )}

            {!isInactive && (
              !isValidated ? (
                <button
                  type="button"
                  onClick={() => setShowValidationModal(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Valider l'Étape
                </button>
              ) : (
                <div className="text-xs text-emerald-700 font-bold flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Étape Validée par {currentStage.validatedBy} le {new Date(currentStage.validatedAt || '').toLocaleDateString('fr-FR')}
                </div>
              )
            )}
          </div>
        </div>

        {/* Input Heures réelles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Heures réelles constatées (h)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                disabled={isInactive}
                value={actualHours}
                onChange={(e) => setActualHours(e.target.value)}
                placeholder={currentStage.scheduledExposureHours.toString()}
                className="w-full text-xs font-mono font-bold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
              />
              <button
                type="button"
                disabled={isInactive}
                onClick={handleSaveHours}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold disabled:opacity-50"
              >
                {saveHoursSuccess ? '✓' : 'Fixer'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Date effective du relevé
            </label>
            <input
              type="text"
              disabled
              value={currentStage.measuredAt ? new Date(currentStage.measuredAt).toLocaleString('fr-FR') : 'En cours...'}
              className="w-full text-xs px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Panneaux actifs attendus
            </label>
            <div className="text-xs font-bold text-slate-900 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
              {totalActivePanelsCount} éprouvettes sur {trial.batches.length} lots
            </div>
          </div>
        </div>
      </div>

      {/* Family Progress Cards */}
      {!isInactive ? (
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Avancement des Campagnes par Famille de Mesure
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stageActiveFamilies.map((fam) => {
              const stats = familyStats[fam] || { completed: 0, total: totalActivePanelsCount, warningCount: 0, errorCount: 0 };
              const percent = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
              const isComplete = stats.completed === stats.total && stats.total > 0;

              const familyLabel =
                fam === 'COLOR'
                  ? '🎨 COULEUR (CIE L*a*b*)'
                  : fam === 'GLOSS'
                  ? '✨ BRILLANCE (GU 60°)'
                  : fam === 'PERSOZ'
                  ? '⏱️ DURETÉ PERSOZ'
                  : fam === 'ADHESION'
                  ? '🏁 ADHÉRENCE AU QUADRILLAGE'
                  : fam === 'OBSERVATIONS'
                  ? '🔍 OBSERVATIONS VISUELLES'
                  : `📊 ${fam}`;

              return (
                <div
                  key={fam}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {familyLabel}
                        </span>
                      </div>
                      <span className="text-xs font-bold font-mono text-slate-600">
                        {stats.completed} / {stats.total} ({percent}%)
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-3">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isComplete ? 'bg-emerald-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      {stats.warningCount > 0 && (
                        <span className="text-amber-600 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {stats.warningCount} avertissement(s)
                        </span>
                      )}
                      {stats.errorCount > 0 && (
                        <span className="text-rose-600 font-bold flex items-center gap-1">
                          <X className="w-3.5 h-3.5" />
                          {stats.errorCount} anomalie(s)
                        </span>
                      )}
                      {stats.warningCount === 0 && stats.errorCount === 0 && isComplete && (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Toutes mesures conformes
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigateToFamilyBench(fam)}
                    className="w-full py-2 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-bold text-xs rounded-xl border border-slate-200 hover:border-blue-200 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Ouvrir le Banc de Mesure {fam}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-slate-100/70 border border-slate-200 rounded-2xl space-y-2">
          <Ban className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="font-bold text-slate-700 text-sm">Étape Désactivée</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Cette étape intermédiaire a été exclue de l'échéancier des mesures. Les données historiques éventuellement existantes sont conservées en base sans être altérées.
          </p>
          {!isPlanLocked ? (
            <button
              type="button"
              onClick={() => handleToggleStatus(true)}
              className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              Réactiver cette étape
            </button>
          ) : (
            <p className="text-xs text-amber-800 font-medium mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              Réactivation impossible : le plan de mesurage est verrouillé suite aux acquisitions.
            </p>
          )}
        </div>
      )}

      {/* Modal de Désactivation Non-Destructive */}
      {showDeactivationModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Power className="w-5 h-5 text-amber-600" />
                Désactivation Non-Destructive du Jalon
              </h3>
              <button onClick={() => setShowDeactivationModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p>
                Vous allez désactiver l'étape <strong>{currentStage.name} ({currentStage.scheduledExposureHours} h)</strong>.
              </p>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900">
                <strong>Garantie de non-destruction :</strong> Les données déjà saisies sur ce jalon ne seront pas effacées. L'étape sera masquée des campagnes de mesures et des calculs de tendances jusqu'à une éventuelle réactivation.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Motif de la désactivation (optionnel)
                </label>
                <input
                  type="text"
                  value={deactivationReason}
                  onChange={(e) => setDeactivationReason(e.target.value)}
                  placeholder="Ex : Jalon allégé selon accord client..."
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDeactivationModal(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-bold"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => handleToggleStatus(false)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
              >
                Confirmer la désactivation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Validation d'étape */}
      {showValidationModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Validation de l'Étape {currentStage.name}
              </h3>
              <button onClick={() => setShowValidationModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p>
                La validation de l'étape scelle les acquisitions scientifiques associées. Assurez-vous que l'ensemble des mesures requises ont été effectuées.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Opérateur de validation
                </label>
                <input
                  type="text"
                  value={operatorId}
                  onChange={(e) => setOperatorId(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Notes & Remarques métrologiques
                </label>
                <textarea
                  rows={3}
                  value={validationNotes}
                  onChange={(e) => setValidationNotes(e.target.value)}
                  placeholder="Conditions particulières de l'étape, observations de cycle..."
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowValidationModal(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-bold"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmValidation}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirmer la Validation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
