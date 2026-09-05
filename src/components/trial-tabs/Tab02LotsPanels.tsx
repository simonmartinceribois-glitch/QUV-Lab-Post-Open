/**
 * QUV-Lab — 02 Lots & Échantillons (GATE 2.1 + GATE 2.2)
 * Gère le référentiel hiérarchique :
 * PROJET (Dimensions communes)
 *  └── LOTS (Essence, Produit, Système)
 *       └── ÉCHANTILLONS (T, 1/E1, 2/E2, 3/E3 avec Orientation fil et Face d'exposition)
 */

import React, { useState } from 'react';
import { Trial, BatchDefinition, PanelDefinition, WoodGrainOrientation, ExposureFace } from '../../types/trial';
import { globalTrialStore, generateUUID } from '../../services/trialStore';
import {
  Layers,
  Plus,
  Ban,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  X,
  FileText,
  User,
  Calendar,
  Lock,
  Tag,
  Sparkles,
  Sliders,
  Compass,
  Maximize2
} from 'lucide-react';

interface Props {
  trial: Trial;
  onTrialUpdated: () => void;
}

export function Tab02LotsPanels({ trial, onTrialUpdated }: Props) {
  const [selectedPanelForExclusion, setSelectedPanelForExclusion] = useState<{
    panel: PanelDefinition;
    batch: BatchDefinition;
  } | null>(null);
  const [exclusionReason, setExclusionReason] = useState('');
  const [operatorId, setOperatorId] = useState(trial.metadata.createdBy || 'Simon Martin (Technicien)');
  const [exclusionError, setExclusionError] = useState<string | null>(null);

  // Ajout de nouveau lot (si non verrouillé)
  const [showAddBatchModal, setShowAddBatchModal] = useState(false);
  const [newBatchRef, setNewBatchRef] = useState('');
  const [newBatchWood, setNewBatchWood] = useState(trial.commonCharacteristics?.materialType || 'Pin sylvestre standardisé');
  const [newBatchProduct, setNewBatchProduct] = useState('');
  const [newBatchSupplier, setNewBatchSupplier] = useState('');
  const [newBatchCoating, setNewBatchCoating] = useState('');
  const [newBatchCoatCount, setNewBatchCoatCount] = useState(3);
  const [newBatchPrep, setNewBatchPrep] = useState('Ponçage grain P120');
  const [newBatchMethod, setNewBatchMethod] = useState('Pinceau');
  const [newBatchConditions, setNewBatchConditions] = useState('21°C, 55% HR');
  const [newBatchDate, setNewBatchDate] = useState(new Date().toISOString().slice(0, 10));
  const [newBatchDrying, setNewBatchDrying] = useState('7 jours à 20°C/65% HR');
  const [newBatchThickness, setNewBatchThickness] = useState<number | undefined>(60);
  const [newBatchNotes, setNewBatchNotes] = useState('');

  const isLocked = trial.configurationStatus === 'LOCKED';

  const handleUpdateBatchThickness = (batchId: string, thickness: number | undefined) => {
    const batch = trial.batches.find((b) => b.id === batchId);
    if (!batch) return;
    batch.dryFilmThicknessMicrons = thickness;
    globalTrialStore.saveTrial(trial);
    onTrialUpdated();
  };

  const handleUpdateSpecimenGrain = (batchId: string, panelId: string, orientation: WoodGrainOrientation) => {
    const batch = trial.batches.find((b) => b.id === batchId);
    if (!batch) return;
    const panel = batch.panels.find((p) => p.id === panelId);
    if (!panel) return;

    panel.grainOrientation = orientation;
    globalTrialStore.saveTrial(trial);
    onTrialUpdated();
  };

  const handleUpdateSpecimenFace = (batchId: string, panelId: string, face: ExposureFace) => {
    const batch = trial.batches.find((b) => b.id === batchId);
    if (!batch) return;
    const panel = batch.panels.find((p) => p.id === panelId);
    if (!panel) return;

    panel.exposureFace = face;
    globalTrialStore.saveTrial(trial);
    onTrialUpdated();
  };

  const handleOpenExclusion = (batch: BatchDefinition, panel: PanelDefinition) => {
    setSelectedPanelForExclusion({ batch, panel });
    setExclusionReason('');
    setExclusionError(null);
  };

  const handleConfirmExclusion = () => {
    if (!selectedPanelForExclusion) return;
    if (!exclusionReason.trim()) {
      setExclusionError("Le motif d'exclusion de l'éprouvette est obligatoire.");
      return;
    }

    try {
      globalTrialStore.excludePanel(
        trial.id,
        selectedPanelForExclusion.panel.id,
        exclusionReason.trim(),
        operatorId
      );
      setSelectedPanelForExclusion(null);
      onTrialUpdated();
    } catch (err: any) {
      setExclusionError(err.message || "Erreur lors de l'exclusion");
    }
  };

  const handleAddBatch = () => {
    if (isLocked) return;
    if (!newBatchRef.trim()) return;

    const batchId = generateUUID();
    const panels: PanelDefinition[] = [
      {
        id: generateUUID(),
        batchId,
        index: 1,
        label: 'T',
        role: 'WITNESS',
        roleCode: 'T',
        grainOrientation: 'Quartier',
        status: 'ACTIVE'
      },
      {
        id: generateUUID(),
        batchId,
        index: 2,
        label: '1',
        role: 'EXPOSED_1',
        roleCode: 'E1',
        grainOrientation: 'Quartier',
        exposureFace: 'Face externe',
        status: 'ACTIVE'
      },
      {
        id: generateUUID(),
        batchId,
        index: 3,
        label: '2',
        role: 'EXPOSED_2',
        roleCode: 'E2',
        grainOrientation: 'Quartier',
        exposureFace: 'Face externe',
        status: 'ACTIVE'
      },
      {
        id: generateUUID(),
        batchId,
        index: 4,
        label: '3',
        role: 'EXPOSED_3',
        roleCode: 'E3',
        grainOrientation: 'Faux quartier',
        exposureFace: 'Face externe',
        status: 'ACTIVE'
      }
    ];

    const newBatch: BatchDefinition = {
      id: batchId,
      trialId: trial.id,
      reference: newBatchRef.trim(),
      orderIndex: trial.batches.length + 1,
      woodSpecies: newBatchWood.trim() || undefined,
      productReference: newBatchProduct.trim() || undefined,
      manufacturerOrSupplier: newBatchSupplier.trim() || undefined,
      coatingSystem: newBatchCoating.trim() || undefined,
      coatCount: newBatchCoatCount,
      substratePreparation: newBatchPrep.trim() || undefined,
      applicationMethod: newBatchMethod.trim() || undefined,
      applicationConditions: newBatchConditions.trim() || undefined,
      applicationDate: newBatchDate,
      dryingOrConditioningTime: newBatchDrying.trim() || undefined,
      dryFilmThicknessMicrons: newBatchThickness ? Number(newBatchThickness) : undefined,
      dryFilmThicknessUnit: 'µm',
      batchNotes: newBatchNotes.trim() || undefined,
      panels
    };

    trial.batches.push(newBatch);
    trial.auditTrail.push({
      id: generateUUID(),
      trialId: trial.id,
      timestamp: new Date().toISOString(),
      operatorId: operatorId || 'OPERATOR',
      action: 'CREATE_BATCH',
      entityType: 'BATCH',
      entityId: batchId,
      details: { reference: newBatch.reference, panelCount: 4 }
    });

    globalTrialStore.saveTrial(trial);
    setShowAddBatchModal(false);
    setNewBatchRef('');
    setNewBatchCoating('');
    onTrialUpdated();
  };

  const totalActivePanels = trial.batches.reduce(
    (acc, b) => acc + b.panels.filter((p) => p.status === 'ACTIVE').length,
    0
  );
  const totalPanels = trial.batches.reduce((acc, b) => acc + b.panels.length, 0);

  const dimLength = trial.commonCharacteristics?.dimensions?.lengthMm || 150;
  const dimWidth = trial.commonCharacteristics?.dimensions?.widthMm || 75;
  const dimThick = trial.commonCharacteristics?.dimensions?.thicknessMm || 15;
  const dimUnit = trial.commonCharacteristics?.dimensions?.unit || 'mm';

  return (
    <div className="space-y-6">
      {/* Header Info & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Référentiel : Lots & Échantillons</h3>
            <span className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-blue-50 text-blue-700 border border-blue-200">
              GATE 2.1 & 2.2
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {trial.batches.length} lots expérimentaux • {totalActivePanels} éprouvettes actives ({trial.batches.length} témoins T + {totalActivePanels - trial.batches.length} exposées E)
          </p>
        </div>

        {!isLocked ? (
          <button
            type="button"
            onClick={() => {
              setNewBatchRef(`LOT XX${trial.batches.length + 1}C`);
              setShowAddBatchModal(true);
            }}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter un Lot (T + 3 E)
          </button>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold">
            <Lock className="w-4 h-4 text-slate-500" />
            <span>Référentiel verrouillé (Acquisitions en cours)</span>
          </div>
        )}
      </div>

      {/* Rappel Dimensions PROJET & Règles de Hiérarchie */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center gap-3 text-xs">
          <Maximize2 className="w-5 h-5 text-blue-600 shrink-0" />
          <div>
            <span className="font-bold text-blue-900 block">Dimensions Communes PROJET</span>
            <span className="font-mono font-semibold text-blue-800">
              {dimLength} × {dimWidth} × {dimThick} {dimUnit}
            </span>
            <span className="text-[10px] text-blue-600 block">Saisies 1 seule fois au niveau Projet</span>
          </div>
        </div>

        <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-center gap-3 text-xs">
          <Layers className="w-5 h-5 text-indigo-600 shrink-0" />
          <div>
            <span className="font-bold text-indigo-900 block">Niveau LOT</span>
            <span className="text-indigo-800">Essence • Produit • Système de finition</span>
            <span className="text-[10px] text-indigo-600 block">4 éprouvettes par lot (T, E1, E2, E3)</span>
          </div>
        </div>

        <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center gap-3 text-xs">
          <Compass className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <span className="font-bold text-emerald-900 block">Niveau ÉCHANTILLON</span>
            <span className="text-emerald-800">Orientation du fil • Face d'exposition</span>
            <span className="text-[10px] text-emerald-600 block">Défini individuellement par éprouvette</span>
          </div>
        </div>
      </div>

      {/* Liste des Lots */}
      <div className="space-y-6">
        {trial.batches.map((batch) => {
          const activePanels = batch.panels.filter((p) => p.status === 'ACTIVE').length;
          const excludedPanels = batch.panels.filter((p) => p.status === 'EXCLUDED').length;

          return (
            <div
              key={batch.id}
              className="border border-slate-200 rounded-2xl bg-white p-5 shadow-xs space-y-4"
            >
              {/* Batch Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs font-mono">
                    #{batch.orderIndex}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 font-mono">{batch.reference}</h4>
                      {batch.productReference && (
                        <span className="px-2 py-0.5 text-xs font-mono font-medium rounded bg-slate-100 text-slate-700">
                          {batch.productReference}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 font-medium">
                      {batch.coatingSystem || 'Système non spécifié'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                    {activePanels} actif(s)
                  </span>
                  {excludedPanels > 0 && (
                    <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 font-bold border border-rose-200">
                      {excludedPanels} exclu(s)
                    </span>
                  )}
                  <span className="text-slate-400 font-mono text-[11px]">UUID: {batch.id.slice(0, 8)}</span>
                </div>
              </div>

              {/* Paramètres du LOT (Essence, Produit, Système) */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Essence (Bois)</span>
                  <span className="font-semibold text-slate-800">{batch.woodSpecies || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Produit / Référence</span>
                  <span className="font-semibold text-slate-800">{batch.productReference || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Système & Couches</span>
                  <span className="font-semibold text-slate-800">
                    {batch.coatingSystem || '—'} {batch.coatCount ? `(${batch.coatCount} couches)` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Épaisseur sèche (ISO 2808)</span>
                  <span className={`font-semibold ${batch.dryFilmThicknessMicrons ? 'text-indigo-900 font-mono font-bold' : 'text-slate-400 italic'}`}>
                    {batch.dryFilmThicknessMicrons ? `${batch.dryFilmThicknessMicrons} µm` : 'Non renseignée'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Fabricant & Méthode</span>
                  <span className="font-semibold text-slate-800">
                    {batch.manufacturerOrSupplier || '—'} {batch.applicationMethod ? `• ${batch.applicationMethod}` : ''}
                  </span>
                </div>
              </div>

              {/* ÉCHANTILLONS DU LOT (T, 1, 2, 3) */}
              <div className="space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <span>Éprouvettes du Lot ({batch.reference})</span>
                    <span className="text-[11px] font-normal normal-case text-slate-400">
                      1 Témoin (T) + 3 Exposées (1, 2, 3) selon NF EN 927-6
                    </span>
                  </h5>

                  {/* Ligne / contrôle d'épaisseur sèche associée au lot */}
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50/70 border border-indigo-200/80 rounded-xl text-xs">
                    <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                      Épaisseur sèche du film (µm) :
                    </span>
                    {isLocked ? (
                      <span className={`font-mono font-bold ${batch.dryFilmThicknessMicrons ? 'text-indigo-900' : 'text-slate-400 italic'}`}>
                        {batch.dryFilmThicknessMicrons ? `${batch.dryFilmThicknessMicrons} µm` : 'Non renseignée'}
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="1"
                          max="1000"
                          placeholder="ex: 60"
                          value={batch.dryFilmThicknessMicrons ?? ''}
                          onChange={(e) =>
                            handleUpdateBatchThickness(
                              batch.id,
                              e.target.value !== '' ? Number(e.target.value) : undefined
                            )
                          }
                          className="w-20 px-2 py-0.5 bg-white border border-indigo-300 rounded-lg text-xs font-mono font-bold text-indigo-900 text-center focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        />
                        <span className="font-mono text-indigo-800 font-semibold text-[11px]">µm</span>
                        {batch.dryFilmThicknessMicrons ? (
                          <span
                            className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                              batch.dryFilmThicknessMicrons <= 60
                                ? 'bg-emerald-100 text-emerald-800'
                                : batch.dryFilmThicknessMicrons <= 120
                                ? 'bg-blue-100 text-blue-800'
                                : batch.dryFilmThicknessMicrons <= 250
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                            title="Espacement requis pour essai quadrillage ISO 2409"
                          >
                            Peigne {batch.dryFilmThicknessMicrons <= 120 ? '2 mm' : batch.dryFilmThicknessMicrons <= 250 ? '3 mm' : '>250 µm'}
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded font-medium">
                            Requis pour ISO 2409
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {batch.panels.map((panel, pIdx) => {
                    const isWitness = pIdx === 0 || panel.label === 'T' || panel.roleCode === 'T';
                    const isExcluded = panel.status === 'EXCLUDED';
                    const specimenLabel = isWitness ? 'T' : (panel.label === 'P02' ? '1' : panel.label === 'P03' ? '2' : panel.label === 'P04' ? '3' : panel.label);
                    const specimenCode = `${batch.reference}-${specimenLabel}`;
                    const currentOrientation = panel.grainOrientation || (isWitness ? 'Quartier' : pIdx === 3 ? 'Faux quartier' : 'Quartier');
                    const currentFace = panel.exposureFace || 'Face externe';

                    return (
                      <div
                        key={panel.id}
                        className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                          isExcluded
                            ? 'border-rose-200 bg-rose-50/60 opacity-85'
                            : isWitness
                            ? 'border-purple-200 bg-purple-50/30 hover:border-purple-300 shadow-2xs'
                            : 'border-slate-200 bg-white hover:border-blue-300 shadow-2xs'
                        }`}
                      >
                        <div>
                          {/* Card Header */}
                          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-xs text-slate-900">
                                {specimenCode}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                                  isWitness
                                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                                }`}
                              >
                                {isWitness ? 'Témoin (T)' : `Exposé (${specimenLabel})`}
                              </span>
                            </div>

                            {!isExcluded && (
                              <button
                                type="button"
                                title="Exclure cette éprouvette (Motif requis)"
                                onClick={() => handleOpenExclusion(batch, panel)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Specimen Configuration Fields */}
                          <div className="mt-2.5 space-y-2 text-xs">
                            {/* Orientation du fil */}
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                                Orientation du fil
                              </label>
                              <select
                                value={currentOrientation}
                                onChange={(e) => handleUpdateSpecimenGrain(batch.id, panel.id, e.target.value as WoodGrainOrientation)}
                                disabled={isExcluded}
                                className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-800 focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="Quartier">Quartier (NF EN 927-6)</option>
                                <option value="Faux quartier">Faux quartier</option>
                                <option value="Dosse">Dosse</option>
                              </select>
                            </div>

                            {/* Face d'exposition */}
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                                Face d'exposition
                              </label>
                              {isWitness ? (
                                <div className="px-2 py-1 bg-purple-100/60 border border-purple-200 rounded-md text-[11px] text-purple-900 italic">
                                  Conservé à l'obscurité (non exposé)
                                </div>
                              ) : (
                                <select
                                  value={currentFace}
                                  onChange={(e) => handleUpdateSpecimenFace(batch.id, panel.id, e.target.value as ExposureFace)}
                                  disabled={isExcluded}
                                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-800 focus:ring-1 focus:ring-blue-500"
                                >
                                  <option value="Face externe">Face externe (côté soleil)</option>
                                  <option value="Face interne">Face interne (côté coeur)</option>
                                </select>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status / Exclusion info */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                          <span
                            className={`px-1.5 py-0.5 font-bold rounded ${
                              isExcluded ? 'bg-rose-200 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {panel.status}
                          </span>
                          <span className="text-slate-400 font-mono">
                            {dimLength}×{dimWidth} mm
                          </span>
                        </div>

                        {isExcluded && (
                          <div className="mt-1 pt-1 border-t border-rose-200 text-[10px] text-rose-800 space-y-0.5">
                            <p className="font-bold">Motif d'exclusion :</p>
                            <p className="italic line-clamp-2">{panel.exclusionReason}</p>
                            <p className="text-[9px] text-rose-600 mt-0.5">
                              Par {panel.excludedBy} le {new Date(panel.excludedAt || '').toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Exclusion Motivée */}
      {selectedPanelForExclusion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
                <h4 className="font-bold text-base text-slate-900">Exclusion Motivée d'Éprouvette</h4>
              </div>
              <button
                onClick={() => setSelectedPanelForExclusion(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
              Vous vous apprêtez à exclure l'éprouvette{' '}
              <strong>
                {selectedPanelForExclusion.batch.reference} — {selectedPanelForExclusion.panel.label}
              </strong>
              . Les données antérieures restent intégralement archivées, mais elle sera écartée des synthèses normatives ultérieures.
            </div>

            {exclusionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold">
                {exclusionError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Opérateur Responsable *
              </label>
              <input
                type="text"
                value={operatorId}
                onChange={(e) => setOperatorId(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Motif Obligatoire de l'Exclusion *
              </label>
              <textarea
                rows={3}
                value={exclusionReason}
                onChange={(e) => setExclusionReason(e.target.value)}
                placeholder="Explication technique : fente substrat, défaut d'adhérence non représentatif, choc mécanique..."
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedPanelForExclusion(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmExclusion}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                Confirmer l'Exclusion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajout Nouveau Lot */}
      {showAddBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                Ajouter un Lot Expérimental (T + 3 E)
              </h4>
              <button
                onClick={() => setShowAddBatchModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Référence Lot *
                </label>
                <input
                  type="text"
                  value={newBatchRef}
                  onChange={(e) => setNewBatchRef(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                  placeholder="Ex: LOT XX4C"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Structure des Éprouvettes
                </label>
                <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg font-bold text-slate-700">
                  4 Éprouvettes (T, 1, 2, 3)
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Essence de bois (Lot)
                </label>
                <input
                  type="text"
                  value={newBatchWood}
                  onChange={(e) => setNewBatchWood(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Produit / Référence (Lot)
                </label>
                <input
                  type="text"
                  value={newBatchProduct}
                  onChange={(e) => setNewBatchProduct(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="Ex: LAS-04"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Épaisseur sèche du film (µm)
                </label>
                <input
                  type="number"
                  value={newBatchThickness || ''}
                  onChange={(e) => setNewBatchThickness(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="Ex: 60"
                />
              </div>

              <div className="col-span-2">
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Système de finition (Lot)
                </label>
                <input
                  type="text"
                  value={newBatchCoating}
                  onChange={(e) => setNewBatchCoating(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="Description du système appliqué..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddBatchModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleAddBatch}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                Créer le Lot avec ses 4 Éprouvettes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

