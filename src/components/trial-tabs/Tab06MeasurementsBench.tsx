/**
 * QUV-Lab — 06 Poste de Paillasse & Saisie de Campagne (PROMPT 6 - Sections 14, 15, 16 & 17)
 * Ergonomie de paillasse optimisée : Campagne par Famille sur tous les lots et panneaux,
 * navigation rapide, calculs scientifiques instantanés, contrôle qualité temps-réel, NEXT automatique.
 */

import React, { useState, useEffect } from 'react';
import {
  Trial,
  PanelAcquisitionRecord,
  BatchDefinition,
  PanelDefinition
} from '../../types/trial';
import {
  MeasurementFamilyId,
  ScientificRuleSet,
  ColorRawData,
  GlossRawData,
  PersozRawData,
  AdhesionRawData,
  VisualObservationsRawData,
  VisualObservationItem,
  QualityStatus
} from '../../types/scientific';
import { globalTrialStore, generateUUID } from '../../services/trialStore';
import {
  ISO2409_CLASSES,
  getApplicableGridSpacing,
  calculateDelayCompliance
} from '../../scientific/adhesionEngine';
import { isFamilyScheduledForStage, getActiveFamiliesForStage } from '../../scientific/panelUtils';
import { BenchTopBar } from '../bench/BenchTopBar';
import { BenchPanelGrid } from '../bench/BenchPanelGrid';
import { BenchComputedPanel } from '../bench/BenchComputedPanel';
import { BenchColorForm } from '../bench/BenchColorForm';
import { BenchGlossForm } from '../bench/BenchGlossForm';
import { BenchPersozForm } from '../bench/BenchPersozForm';
import { BenchAdhesionForm } from '../bench/BenchAdhesionForm';
import { BenchObservationsForm } from '../bench/BenchObservationsForm';
import {
  PlayCircle,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Layers,
  Sparkles,
  Save,
  Check,
  RotateCcw,
  Zap,
  Info,
  Sliders,
  ShieldCheck,
  Ban
} from 'lucide-react';

interface Props {
  trial: Trial;
  selectedStageId: string;
  selectedFamilyId: MeasurementFamilyId;
  ruleSet: ScientificRuleSet;
  onStageChange?: (stageId: string) => void;
  onFamilyChange: (family: MeasurementFamilyId) => void;
  onTrialUpdated: () => void;
}

export function Tab06MeasurementsBench({
  trial,
  selectedStageId,
  selectedFamilyId,
  ruleSet,
  onStageChange,
  onFamilyChange,
  onTrialUpdated
}: Props) {
  // Gate 54 (D-1 / D-2 UI) : Les jalons INACTIVE sont exclus du plan de mesurage.
  // currentStage doit impérativement être résolu parmi les jalons actifs.
  const activeStages = trial.stages.filter((s) => s.status !== 'INACTIVE');
  const measuredStages = activeStages.filter(
    (s) => isFamilyScheduledForStage(selectedFamilyId, s)
  );
  const currentStage =
    activeStages.find((s) => s.id === selectedStageId) || measuredStages[0] || activeStages[0] || trial.stages[0];
  const isInitialStage = currentStage.cycleIndex === 0;
  const isStageInactive = currentStage.status === 'INACTIVE';

  // Synchronisation avec le parent si selectedStageId transmis était inactif
  useEffect(() => {
    if (selectedStageId && onStageChange) {
      const isSelectedActive = activeStages.some((s) => s.id === selectedStageId);
      if (!isSelectedActive && currentStage && currentStage.status !== 'INACTIVE') {
        onStageChange(currentStage.id);
      }
    }
  }, [selectedStageId, activeStages, currentStage, onStageChange]);

  // Redirection automatique si la famille actuelle n'est pas planifiée au jalon sélectionné (ex: ADHESION sur C1..C11)
  useEffect(() => {
    if (!isFamilyScheduledForStage(selectedFamilyId, currentStage)) {
      const allowedFams = getActiveFamiliesForStage(trial.config.activeFamilies, currentStage);
      const fallback = allowedFams[0] || 'COLOR';
      onFamilyChange(fallback);
    }
  }, [currentStage.id, selectedFamilyId, trial.config.activeFamilies, onFamilyChange]);

  // Liste plate des panneaux actifs
  const activePanelsList = trial.batches.flatMap((b) =>
    b.panels.filter((p) => p.status === 'ACTIVE').map((p) => ({ batch: b, panel: p }))
  );

  const [selectedPanelId, setSelectedPanelId] = useState<string>(
    activePanelsList.length > 0 ? activePanelsList[0].panel.id : ''
  );

  const [operatorId, setOperatorId] = useState<string>('Simon Martin (Technicien)');
  const [showValidationSummaryModal, setShowValidationSummaryModal] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Panneau actif sélectionné
  const currentPanelItem = activePanelsList.find((item) => item.panel.id === selectedPanelId) || activePanelsList[0];
  const currentBatch = currentPanelItem?.batch;
  const currentPanel = currentPanelItem?.panel;

  // Configuration de la famille active
  const famConfig = trial.config.familyConfigs[selectedFamilyId];
  const colorCount = famConfig?.countConfig?.configuredCount || 4;
  const persozCount = famConfig?.countConfig?.configuredCount || 3;
  const glossSeries = famConfig?.seriesConfig?.configuredConfiguration.seriesCount || 2;
  const glossReadingsPerSeries = famConfig?.seriesConfig?.configuredConfiguration.readingsPerSeries || 2;

  // Acquisition en cours
  const acqKey = `${currentStage.id}__${currentPanel?.id}__${selectedFamilyId}`;
  const currentRecord = trial.acquisitions[acqKey];

  // --- ÉTATS LOCAUX DE SAISIE RAPIDE ---
  // Couleur : tableau de points L, a, b
  const [colorReadings, setColorReadings] = useState<{ L: string; a: string; b: string }[]>(() => {
    return Array.from({ length: colorCount }, () => ({ L: '', a: '', b: '' }));
  });

  // Brillance : séries de points
  const [glossSeriesData, setGlossSeriesData] = useState<{ orientation: string; values: string[] }[]>(() => {
    return [
      { orientation: 'Sens du fil', values: Array.from({ length: glossReadingsPerSeries }, () => '') },
      { orientation: 'Perpendiculaire', values: Array.from({ length: glossReadingsPerSeries }, () => '') }
    ];
  });

  // Persoz : répétitions en secondes
  const [persozValues, setPersozValues] = useState<string[]>(() => {
    return Array.from({ length: persozCount }, () => '');
  });

  // Observations : liste de cotations
  const [observations, setObservations] = useState<VisualObservationItem[]>([
    { category: 'BLISTERING', categoryLabel: 'Cloquage (ISO 4628-2)', rating: 0, status: 'CONFORME', comment: 'Aucun' },
    { category: 'FLAKING', categoryLabel: 'Écaillage (ISO 4628-5)', rating: 0, status: 'CONFORME', comment: 'Aucun' },
    { category: 'CRACKING', categoryLabel: 'Craquelage (ISO 4628-4)', rating: 0, status: 'CONFORME', comment: 'Aucun' },
    { category: 'CHALKING', categoryLabel: 'Farinage (ISO 4628-6)', rating: 0, status: 'CONFORME', comment: 'Aucun' },
    { category: 'GENERAL_APPEARANCE', categoryLabel: 'Aspect général', rating: 0, status: 'CONFORME', comment: 'Aspect uniforme' }
  ]);

  // Adhérence au quadrillage : classe (0 à 5) et observation
  const [adhesionClass, setAdhesionClass] = useState<number | null>(0);
  const [adhesionObservation, setAdhesionObservation] = useState<string>('');

  // Synchronisation lors du changement de panneau ou famille
  useEffect(() => {
    if (!currentPanel) return;
    const rec = trial.acquisitions[`${currentStage.id}__${currentPanel.id}__${selectedFamilyId}`];

    if (selectedFamilyId === 'COLOR') {
      const raw = rec?.raw as ColorRawData;
      if (raw && Array.isArray(raw.readings)) {
        const arr = Array.from({ length: colorCount }, (_, i) => {
          const pt = raw.readings[i];
          return {
            L: pt?.L !== null && pt?.L !== undefined ? pt.L.toString() : '',
            a: pt?.a !== null && pt?.a !== undefined ? pt.a.toString() : '',
            b: pt?.b !== null && pt?.b !== undefined ? pt.b.toString() : ''
          };
        });
        setColorReadings(arr);
      } else {
        setColorReadings(Array.from({ length: colorCount }, () => ({ L: '', a: '', b: '' })));
      }
    } else if (selectedFamilyId === 'GLOSS') {
      const raw = rec?.raw as GlossRawData;
      if (raw && Array.isArray(raw.series)) {
        const arr = raw.series.map((s) => ({
          orientation: s.orientation,
          values: s.readings.map((r) => (r.value !== null && r.value !== undefined ? r.value.toString() : ''))
        }));
        setGlossSeriesData(arr);
      } else {
        setGlossSeriesData([
          { orientation: 'Sens du fil', values: Array.from({ length: glossReadingsPerSeries }, () => '') },
          { orientation: 'Perpendiculaire', values: Array.from({ length: glossReadingsPerSeries }, () => '') }
        ]);
      }
    } else if (selectedFamilyId === 'PERSOZ') {
      const raw = rec?.raw as PersozRawData;
      if (raw && Array.isArray(raw.readings)) {
        const arr = raw.readings.map((r) =>
          r.dampingTimeSeconds !== null && r.dampingTimeSeconds !== undefined ? r.dampingTimeSeconds.toString() : ''
        );
        setPersozValues(arr);
      } else {
        setPersozValues(Array.from({ length: persozCount }, () => ''));
      }
    } else if (selectedFamilyId === 'ADHESION') {
      const raw = rec?.raw as AdhesionRawData;
      if (raw && raw.adhesionClass !== undefined && raw.adhesionClass !== null) {
        setAdhesionClass(raw.adhesionClass);
        setAdhesionObservation(raw.observation || '');
      } else {
        setAdhesionClass(0);
        setAdhesionObservation('');
      }
    } else if (selectedFamilyId === 'OBSERVATIONS') {
      const raw = rec?.raw as VisualObservationsRawData;
      if (raw && Array.isArray(raw.observations)) {
        setObservations(raw.observations);
      } else {
        setObservations([
          { category: 'BLISTERING', categoryLabel: 'Cloquage (ISO 4628-2)', rating: 0, status: 'CONFORME', comment: 'Aucun' },
          { category: 'FLAKING', categoryLabel: 'Écaillage (ISO 4628-5)', rating: 0, status: 'CONFORME', comment: 'Aucun' },
          { category: 'CRACKING', categoryLabel: 'Craquelage (ISO 4628-4)', rating: 0, status: 'CONFORME', comment: 'Aucun' },
          { category: 'CHALKING', categoryLabel: 'Farinage (ISO 4628-6)', rating: 0, status: 'CONFORME', comment: 'Aucun' },
          { category: 'GENERAL_APPEARANCE', categoryLabel: 'Aspect général', rating: 0, status: 'CONFORME', comment: 'Aspect uniforme' }
        ]);
      }
    }
  }, [selectedPanelId, selectedFamilyId, currentStage.id]);

  // Fonction d'enregistrement du panneau courant
  const handleSaveCurrentPanel = (autoAdvance = true) => {
    if (!currentPanel || !currentBatch) return;
    if (currentStage.status === 'INACTIVE') {
      alert("Ce jalon a été exclu du plan de mesurage ; aucune acquisition n'est autorisée.");
      return;
    }

    let rawPayload: unknown = null;

    if (selectedFamilyId === 'COLOR') {
      rawPayload = {
        readings: colorReadings.map((pt, idx) => ({
          pointIndex: idx + 1,
          L: pt.L !== '' ? parseFloat(pt.L) : null,
          a: pt.a !== '' ? parseFloat(pt.a) : null,
          b: pt.b !== '' ? parseFloat(pt.b) : null
        }))
      } as ColorRawData;
    } else if (selectedFamilyId === 'GLOSS') {
      rawPayload = {
        series: glossSeriesData.map((s, sIdx) => ({
          seriesIndex: sIdx + 1,
          orientation: s.orientation,
          readings: s.values.map((v, rIdx) => ({
            pointIndex: rIdx + 1,
            value: v !== '' ? parseFloat(v) : null
          }))
        })),
        instrumentMetadata: { instrumentId: 'TRI-GLOSS-60-LAB', geometry: '60' }
      } as GlossRawData;
    } else if (selectedFamilyId === 'PERSOZ') {
      rawPayload = {
        readings: persozValues.map((v, idx) => ({
          pointIndex: idx + 1,
          dampingTimeSeconds: v !== '' ? parseFloat(v) : null
        })),
        unit: 'SECONDS',
        instrumentMetadata: { temperatureCelsius: 21.5, relativeHumidityPercent: 50 }
      } as PersozRawData;
    } else if (selectedFamilyId === 'ADHESION') {
      const spacingInfo = getApplicableGridSpacing(currentBatch.dryFilmThicknessMicrons);
      if (currentBatch.dryFilmThicknessMicrons === undefined || currentBatch.dryFilmThicknessMicrons === null || currentBatch.dryFilmThicknessMicrons > 250) {
        return;
      }
      rawPayload = {
        adhesionClass: adhesionClass !== null ? adhesionClass : 0,
        gridSpacingMm: spacingInfo.gridSpacingMm || 2,
        coatingThicknessMicrons: currentBatch.dryFilmThicknessMicrons,
        measurementDateTime: new Date().toISOString(),
        applicationDateTime: currentBatch.applicationDate,
        requiredMinimumDelayHours: 168,
        normReference: 'NF EN ISO 2409:2020',
        observation: adhesionObservation.trim() || undefined
      } as AdhesionRawData;
    } else if (selectedFamilyId === 'OBSERVATIONS') {
      rawPayload = {
        observations,
        assessedBy: operatorId,
        assessedAt: new Date().toISOString()
      } as VisualObservationsRawData;
    }

    globalTrialStore.recordAcquisition({
      trialId: trial.id,
      stageId: currentStage.id,
      batchId: currentBatch.id,
      panelId: currentPanel.id,
      familyId: selectedFamilyId,
      raw: rawPayload,
      operatorId
    });

    setSaveSuccessMsg(`Enregistré : ${currentBatch.reference} — ${currentPanel.label}`);
    setTimeout(() => setSaveSuccessMsg(null), 2000);
    onTrialUpdated();

    // NEXT automatique vers le panneau suivant incomplet
    if (autoAdvance) {
      const currentIdx = activePanelsList.findIndex((item) => item.panel.id === currentPanel.id);
      // Chercher d'abord le prochain incomplet
      const nextIncomplete = activePanelsList.find((item, idx) => {
        if (idx <= currentIdx) return false;
        const key = `${currentStage.id}__${item.panel.id}__${selectedFamilyId}`;
        const r = trial.acquisitions[key];
        return !r || !r.computed;
      });

      if (nextIncomplete) {
        setSelectedPanelId(nextIncomplete.panel.id);
      } else if (currentIdx < activePanelsList.length - 1) {
        setSelectedPanelId(activePanelsList[currentIdx + 1].panel.id);
      }
    }
  };

  // Remplissage rapide / Import simulation
  const handleFastPrefill = () => {
    if (selectedFamilyId === 'COLOR') {
      setColorReadings([
        { L: '62.5', a: '8.4', b: '24.2' },
        { L: '62.3', a: '8.5', b: '24.1' },
        { L: '62.6', a: '8.3', b: '24.3' },
        { L: '62.4', a: '8.4', b: '24.2' }
      ]);
    } else if (selectedFamilyId === 'GLOSS') {
      setGlossSeriesData([
        { orientation: 'Sens du fil', values: ['44.5', '44.8'] },
        { orientation: 'Perpendiculaire', values: ['43.2', '43.6'] }
      ]);
    } else if (selectedFamilyId === 'PERSOZ') {
      setPersozValues(['85.2', '84.8', '85.5']);
    }
  };

  const computed = currentRecord?.computed as any;

  // Calcul du résumé de la campagne pour la famille
  const completedPanelsCount = activePanelsList.filter((item) => {
    const k = `${currentStage.id}__${item.panel.id}__${selectedFamilyId}`;
    const r = trial.acquisitions[k];
    return r && r.computed;
  }).length;

  const totalPanelsCount = activePanelsList.length;
  const isFamilyCampaignComplete = completedPanelsCount === totalPanelsCount && totalPanelsCount > 0;

  const currentMeasuredIndex = measuredStages.findIndex((s) => s.id === currentStage.id);
  const stageStepNumber = currentMeasuredIndex >= 0 ? currentMeasuredIndex + 1 : 1;
  const totalStagesCount = measuredStages.length;

  const stageHoursDisplay =
    currentStage.cycleIndex === 0
      ? 'T0 (0 h)'
      : `C${currentStage.cycleIndex} (${currentStage.scheduledExposureHours} h)`;

  const stageActionLabel =
    currentStage.stageType === 'INITIAL_PRE_EXPOSURE'
      ? 'MESURES INITIALES AVANT EXPOSITION'
      : currentStage.stageType === 'FINAL_POST_EXPOSURE'
      ? 'MESURES FINALES APRÈS EXPOSITION'
      : "MESURES EN COURS D'EXPOSITION";

  return (
    <div className="space-y-6">
      <BenchTopBar
        stageStepNumber={stageStepNumber}
        totalStagesCount={totalStagesCount}
        stageHoursDisplay={stageHoursDisplay}
        stageActionLabel={stageActionLabel}
        currentStage={currentStage}
        activeFamilies={trial.config.activeFamilies}
        selectedFamilyId={selectedFamilyId}
        measuredStages={measuredStages}
        activePanelsList={activePanelsList}
        acquisitions={trial.acquisitions}
        onFamilyChange={onFamilyChange}
        onStageChange={onStageChange}
        isStageInactive={isStageInactive}
      />

      <BenchPanelGrid
        completedPanelsCount={completedPanelsCount}
        totalPanelsCount={totalPanelsCount}
        isFamilyCampaignComplete={isFamilyCampaignComplete}
        selectedFamilyId={selectedFamilyId}
        activePanelsList={activePanelsList}
        currentPanelId={currentPanel?.id}
        currentStageId={currentStage.id}
        acquisitions={trial.acquisitions}
        onSelectPanel={setSelectedPanelId}
        onOpenValidationModal={() => setShowValidationSummaryModal(true)}
      />

      {/* 3. POSTE DE SAISIE DE PAILLASSE DU PANNEAU ACTIF */}
      {currentPanel && currentBatch && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Colonne Gauche : Formulaire de saisie (8 cols) */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            {/* Header du panneau */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-xs font-mono font-bold rounded-md bg-blue-100 text-blue-800">
                    {currentBatch.reference}
                  </span>
                  <h4 className="text-lg font-bold text-slate-900">Éprouvette {currentPanel.label}</h4>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {currentBatch.coatingSystem || 'Finition standard'} • Essence : {currentBatch.woodSpecies || 'Chêne'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFastPrefill}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1"
                  title="Pré-remplissage rapide pour test"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  Test Rapide
                </button>
              </div>
            </div>

            {/* Formulaire spécifique à la famille */}
            {selectedFamilyId === 'COLOR' && (
              <BenchColorForm
                colorCount={colorCount}
                colorReadings={colorReadings}
                onColorReadingsChange={setColorReadings}
              />
            )}

            {selectedFamilyId === 'GLOSS' && (
              <BenchGlossForm
                glossSeriesData={glossSeriesData}
                onGlossSeriesChange={setGlossSeriesData}
              />
            )}

            {selectedFamilyId === 'PERSOZ' && (
              <BenchPersozForm
                persozValues={persozValues}
                onPersozValuesChange={setPersozValues}
              />
            )}

            {selectedFamilyId === 'ADHESION' && (
              <BenchAdhesionForm
                currentBatch={currentBatch}
                currentPanel={currentPanel}
                currentStage={currentStage}
                isInitialStage={isInitialStage}
                adhesionClass={adhesionClass}
                onAdhesionClassChange={setAdhesionClass}
                adhesionObservation={adhesionObservation}
                onAdhesionObservationChange={setAdhesionObservation}
              />
            )}

            {selectedFamilyId === 'OBSERVATIONS' && (
              <BenchObservationsForm
                observations={observations}
                onObservationsChange={setObservations}
              />
            )}

            {/* Actions de validation du panneau */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div>
                {saveSuccessMsg && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-fadeIn">
                    <Check className="w-4 h-4" />
                    {saveSuccessMsg}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={isStageInactive}
                  onClick={() => handleSaveCurrentPanel(false)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all ${
                    isStageInactive
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  Enregistrer
                </button>
                <button
                  type="button"
                  disabled={isStageInactive}
                  onClick={() => handleSaveCurrentPanel(true)}
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all ${
                    isStageInactive
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                      : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Valider ce Panneau & Passer au Suivant
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <BenchComputedPanel
            computed={computed}
            currentRecord={currentRecord}
            selectedFamilyId={selectedFamilyId}
            isInitialStage={isInitialStage}
          />
          </div>
        )}

      {/* MODAL RÉCAPITULATIF AVANT VALIDATION DE CAMPAGNE FAMILLE */}
      {showValidationSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h4 className="font-bold text-base text-slate-900">
                  Validation de Campagne — {selectedFamilyId}
                </h4>
              </div>
              <button
                onClick={() => setShowValidationSummaryModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="font-bold uppercase tracking-wider text-slate-700 mb-1">
                Bilan de Complétude & Qualité :
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  Panneaux actifs attendus : <strong>{totalPanelsCount}</strong>
                </div>
                <div>
                  Panneaux mesurés : <strong>{completedPanelsCount}</strong>
                </div>
                <div>
                  Taux de réalisation :{' '}
                  <strong className="text-emerald-700">
                    {Math.round((completedPanelsCount / (totalPanelsCount || 1)) * 100)}%
                  </strong>
                </div>
                <div>
                  Statut de campagne :{' '}
                  <strong className={isFamilyCampaignComplete ? 'text-emerald-700' : 'text-amber-700'}>
                    {isFamilyCampaignComplete ? 'COMPLÈTE' : 'INCOMPLÈTE'}
                  </strong>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <p>
                La validation atteste de la complétude et de la qualité métrologique des relevés pour cette famille à l'étape <strong>{currentStage.name}</strong>.
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowValidationSummaryModal(false)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-300"
              >
                Fermer
              </button>

              <div className="flex items-center gap-2">
                {selectedFamilyId !== 'OBSERVATIONS' && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowValidationSummaryModal(false);
                      const fams = getActiveFamiliesForStage(trial.config.activeFamilies, currentStage);
                      const curIdx = fams.indexOf(selectedFamilyId);
                      if (curIdx < fams.length - 1) {
                        onFamilyChange(fams[curIdx + 1]);
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1"
                  >
                    Passer à la Famille Suivante
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
