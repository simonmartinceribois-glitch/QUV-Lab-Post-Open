/**
 * QUV-Lab — Assistant de Création d'Essai (PROMPT 6 v6.1 - 7 Étapes Métier)
 * 1. Identification & Métadonnées
 * 2. Caractéristiques communes
 * 3. Création des lots (indépendance des caractéristiques et nombre de panneaux)
 * 4. Identification des panneaux (génération du référentiel permanent)
 * 5. Familles & Plan de mesure (NF EN 927-6 vs Lab, déviations justifiées)
 * 6. Calendrier de l'essai (T0 + 12 cycles de 168 h)
 * 7. Récapitulatif & Validation
 */

import React, { useState } from 'react';
import {
  TrialMetadata,
  CommonCharacteristics,
  TrialProtocolConfig,
  WoodGrainOrientation
} from '../types/trial';
import {
  MeasurementFamilyId,
  ScientificRuleSet
} from '../types/scientific';
import { globalTrialStore } from '../services/trialStore';
import { createCountConfiguration, createSeriesConfiguration } from '../scientific/ruleSet';
import { WizardStep1Identification } from './wizard/WizardStep1Identification';
import { WizardStep2Characteristics } from './wizard/WizardStep2Characteristics';
import { WizardStep3Batches } from './wizard/WizardStep3Batches';
import { WizardStep4Panels } from './wizard/WizardStep4Panels';
import { WizardStep5Families } from './wizard/WizardStep5Families';
import { WizardStep6Calendar } from './wizard/WizardStep6Calendar';
import { WizardStep7Review } from './wizard/WizardStep7Review';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  AlertTriangle,
  Layers,
  FlaskConical,
  Calendar,
  CheckCircle2,
  ShieldAlert,
  Info,
  Sliders,
  FileText,
  Tag,
  Clock,
  Sparkles,
  Lock,
  CheckSquare,
  Square
} from 'lucide-react';

interface Props {
  ruleSet?: ScientificRuleSet;
  isOpen?: boolean;
  onClose: () => void;
  onCreated?: (trialId: string) => void;
}

export interface LotFormItem {
  id: string;
  reference: string;
  woodSpecies: string;
  productReference: string;
  manufacturerOrSupplier: string;
  coatingSystem: string;
  coatCount: number;
  substratePreparation: string;
  applicationMethod: string;
  applicationConditions: string;
  applicationDate: string;
  dryingOrConditioningTime: string;
  batchNotes: string;
  panelCount: number;
}

export function CreateTrialWizardModal({
  ruleSet: propRuleSet,
  isOpen = true,
  onClose,
  onCreated
}: Props) {
  const ruleSet = propRuleSet || globalTrialStore['ruleSet'];
  if (!isOpen) return null;

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(1);

  // ==========================================
  // ÉTAPE 1 : Identification & Métadonnées
  // ==========================================
  const [reference, setReference] = useState(`QUV-2026-0${Math.floor(Math.random() * 80 + 20)}`);
  const [title, setTitle] = useState('');
  const [projectOrClient, setProjectOrClient] = useState('');
  const [createdBy, setCreatedBy] = useState('Simon Martin (Technicien Labo)');
  const [generalNotes, setGeneralNotes] = useState('');

  // ==========================================
  // ÉTAPE 2 : Caractéristiques communes de l'essai
  // ==========================================
  const [lengthMm, setLengthMm] = useState<number>(150);
  const [widthMm, setWidthMm] = useState<number>(75);
  const [thicknessMm, setThicknessMm] = useState<number>(15);
  const [dimUnit, setDimUnit] = useState<'mm' | 'cm'>('mm');
  const [substrateNature, setSubstrateNature] = useState<string>('Bois massif');
  const [materialType, setMaterialType] = useState<string>('Pin sylvestre standardisé (NF EN 927-6)');
  const [woodGrainOrientation, setWoodGrainOrientation] = useState<string>('Sur quartier (NF EN 927-6 §5)');
  const [preparationNotes, setPreparationNotes] = useState<string>('Ponçage mécanique P120, dépoussiérage soigné');
  const [conditioningNotes, setConditioningNotes] = useState<string>('Conditionnement 7 jours à 20±2°C et 65±5% HR jusqu\'à masse constante');
  const [commonProtocolNotes, setCommonProtocolNotes] = useState<string>('Éprouvettes usinées sans nœud ni défaut selon prescriptions de la norme.');

  // ==========================================
  // ÉTAPE 6 : Plan de mesurage & Calendrier
  // ==========================================
  const [selectedMeasurementCycles, setSelectedMeasurementCycles] = useState<number[]>([
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12
  ]);

  const toggleCycleMeasurement = (cycleIndex: number) => {
    if (cycleIndex === 0 || cycleIndex === 12) return; // T0 et C12 obligatoires
    setSelectedMeasurementCycles((prev) =>
      prev.includes(cycleIndex) ? prev.filter((c) => c !== cycleIndex) : [...prev, cycleIndex].sort((a, b) => a - b)
    );
  };

  const setPlanPreset = (preset: 'FULL' | 'QUARTERLY' | 'LIGHT') => {
    if (preset === 'FULL') {
      setSelectedMeasurementCycles([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    } else if (preset === 'QUARTERLY') {
      setSelectedMeasurementCycles([0, 3, 6, 9, 12]);
    } else if (preset === 'LIGHT') {
      setSelectedMeasurementCycles([0, 6, 12]);
    }
  };
  const [batches, setBatches] = useState<LotFormItem[]>([
    {
      id: '1',
      reference: 'LOT XX1C',
      woodSpecies: 'Pin sylvestre standardisé',
      productReference: 'LAS-STD-01',
      manufacturerOrSupplier: 'Fournisseur Alpha',
      coatingSystem: 'Système Témoin Standard (3 couches)',
      coatCount: 3,
      substratePreparation: 'Ponçage grain P120',
      applicationMethod: 'Pinceau',
      applicationConditions: '21°C, 55% HR',
      applicationDate: new Date().toISOString().slice(0, 10),
      dryingOrConditioningTime: '7 jours à 20°C/65% HR',
      batchNotes: 'Lot témoin sans stabilisant UV renforcé',
      panelCount: 4
    },
    {
      id: '2',
      reference: 'LOT XX2C',
      woodSpecies: 'Pin sylvestre standardisé',
      productReference: 'LAS-UV15-02',
      manufacturerOrSupplier: 'Fournisseur Alpha',
      coatingSystem: 'Système Anti-UV HALS 1.5%',
      coatCount: 3,
      substratePreparation: 'Ponçage grain P120',
      applicationMethod: 'Pinceau',
      applicationConditions: '21°C, 55% HR',
      applicationDate: new Date().toISOString().slice(0, 10),
      dryingOrConditioningTime: '7 jours à 20°C/65% HR',
      batchNotes: 'Formulation avec absorbeurs UV organiques',
      panelCount: 4
    },
    {
      id: '3',
      reference: 'LOT XX3C',
      woodSpecies: 'Pin sylvestre standardisé',
      productReference: 'LAS-NANO-03',
      manufacturerOrSupplier: 'Fournisseur Bêta',
      coatingSystem: 'Système Hybride Nano-TiO2',
      coatCount: 3,
      substratePreparation: 'Ponçage grain P120',
      applicationMethod: 'Pinceau',
      applicationConditions: '21°C, 55% HR',
      applicationDate: new Date().toISOString().slice(0, 10),
      dryingOrConditioningTime: '7 jours à 20°C/65% HR',
      batchNotes: 'Formulation avec nano-charges minérales',
      panelCount: 4
    }
  ]);

  // ==========================================
  // ÉTAPE 5 : Familles actives & Plan de mesure
  // ==========================================
  const [activeFamilies, setActiveFamilies] = useState<MeasurementFamilyId[]>([
    'COLOR',
    'GLOSS',
    'PERSOZ',
    'ADHESION',
    'OBSERVATIONS'
  ]);

  const [colorPoints, setColorPoints] = useState<number>(4);
  const [colorJustification, setColorJustification] = useState<string>('');

  const [glossSeriesCount, setGlossSeriesCount] = useState<number>(2);
  const [glossReadingsPerSeries, setGlossReadingsPerSeries] = useState<number>(2);
  const [glossJustification, setGlossJustification] = useState<string>('');

  const [persozReps, setPersozReps] = useState<number>(3);
  const [persozJustification, setPersozJustification] = useState<string>('');

  // Gestion des familles
  const toggleFamily = (fam: MeasurementFamilyId) => {
    if (activeFamilies.includes(fam)) {
      setActiveFamilies(activeFamilies.filter((f) => f !== fam));
    } else {
      setActiveFamilies([...activeFamilies, fam]);
    }
  };

  const addBatchRow = () => {
    const nextIdx = batches.length + 1;
    setBatches([
      ...batches,
      {
        id: Date.now().toString(),
        reference: `LOT XX${nextIdx}C`,
        woodSpecies: materialType || 'Pin sylvestre standardisé',
        productReference: `PROD-0${nextIdx}`,
        manufacturerOrSupplier: 'Laboratoire / Fabricant',
        coatingSystem: `Système Expérimental #${nextIdx}`,
        coatCount: 3,
        substratePreparation: 'Ponçage P120',
        applicationMethod: 'Pinceau',
        applicationConditions: '20°C, 60% HR',
        applicationDate: new Date().toISOString().slice(0, 10),
        dryingOrConditioningTime: '7 jours à 20°C/65% HR',
        batchNotes: '',
        panelCount: 4
      }
    ]);
  };

  const updateBatch = (id: string, field: keyof LotFormItem, value: any) => {
    setBatches(batches.map((b) => (b.id === id ? { ...b, [field]: value } : b)));
  };

  const removeBatchRow = (id: string) => {
    if (batches.length <= 1) return;
    setBatches(batches.filter((b) => b.id !== id));
  };

  // Validations adaptations
  const isColorAdapted = colorPoints !== 4;
  const isColorAdaptationInvalid = isColorAdapted && colorJustification.trim().length === 0;

  const isGlossAdapted = glossSeriesCount !== 2 || glossReadingsPerSeries !== 2;
  const isGlossAdaptationInvalid = isGlossAdapted && glossJustification.trim().length === 0;

  const isPersozAdapted = persozReps !== 3;
  const isPersozAdaptationInvalid = isPersozAdapted && persozJustification.trim().length === 0;

  const isStep1Valid = Boolean(reference.trim() && createdBy.trim());
  const isStep5Valid = !isColorAdaptationInvalid && !isGlossAdaptationInvalid && !isPersozAdaptationInvalid;
  const isFinalStepValid = Boolean(createdBy.trim());

  // Calcul du nombre total de panneaux
  const totalPanelsCount = batches.reduce((sum, b) => sum + (Number(b.panelCount) || 1), 0);

  // Soumission finale
  const handleFinalCreate = () => {
    const trimmedCreatedBy = createdBy.trim();
    if (!trimmedCreatedBy) {
      return;
    }

    const metadata: TrialMetadata = {
      reference: reference.trim(),
      title: title.trim() || 'Essai de vieillissement accéléré UV (NF EN 927-6)',
      projectOrClient: projectOrClient.trim() || 'Projet Interne',
      coatingSystemDescription: batches.map((b) => `${b.reference}: ${b.coatingSystem}`).join(' | '),
      substrateDescription: `${substrateNature} — ${materialType} (${lengthMm}×${widthMm}×${thicknessMm} ${dimUnit})`,
      createdBy: trimmedCreatedBy,
      generalNotes: generalNotes.trim()
    };

    // Frontière de saisie : la liste contrôlée GATE 2.1 s'applique au modèle persisté.
    // Une valeur libre non listée n'est pas persistée (undefined) au lieu d'être forcée.
    const ALLOWED_GRAIN_ORIENTATIONS: readonly string[] = [
      'Quartier', 'Faux quartier', 'Dosse', 'Sur quartier (NF EN 927-6)', 'Sur dosse',
      'QUARTER_SAWN', 'SLASH_SAWN', 'MIXED', 'STANDARD', 'QUARTER', 'FALSE_QUARTER', 'SLASH'
    ];
    const sanitizedGrain: WoodGrainOrientation | undefined = ALLOWED_GRAIN_ORIENTATIONS.includes(woodGrainOrientation)
      ? (woodGrainOrientation as WoodGrainOrientation)
      : undefined;

    const commonCharacteristics: CommonCharacteristics = {
      dimensions: {
        lengthMm,
        widthMm,
        thicknessMm,
        unit: dimUnit
      },
      substrateNature,
      materialType,
      woodGrainOrientation: sanitizedGrain,
      preparationNotes,
      conditioningNotes,
      generalProtocolNotes: commonProtocolNotes
    };

    const colorConfig = isColorAdapted
      ? createCountConfiguration('COLOR', colorPoints, ruleSet, { justification: colorJustification, operatorId: trimmedCreatedBy })
      : createCountConfiguration('COLOR', 4, ruleSet);

    const glossConfig = isGlossAdapted
      ? createSeriesConfiguration('GLOSS', glossSeriesCount, glossReadingsPerSeries, ruleSet, {
          justification: glossJustification,
          operatorId: trimmedCreatedBy
        })
      : createSeriesConfiguration('GLOSS', 2, 2, ruleSet);

    const persozConfig = isPersozAdapted
      ? createCountConfiguration('PERSOZ', persozReps, ruleSet, { justification: persozJustification, operatorId: trimmedCreatedBy })
      : createCountConfiguration('PERSOZ', 3, ruleSet);

    const createdTrial = globalTrialStore.createTrial({
      metadata,
      commonCharacteristics,
      batches: batches.map((b) => ({
        reference: b.reference.trim(),
        coatingSystem: b.coatingSystem.trim(),
        woodSpecies: b.woodSpecies.trim(),
        productReference: b.productReference.trim(),
        manufacturerOrSupplier: b.manufacturerOrSupplier.trim(),
        coatCount: Number(b.coatCount) || 3,
        substratePreparation: b.substratePreparation.trim(),
        applicationMethod: b.applicationMethod.trim(),
        applicationConditions: b.applicationConditions.trim(),
        applicationDate: b.applicationDate,
        dryingOrConditioningTime: b.dryingOrConditioningTime.trim(),
        batchNotes: b.batchNotes.trim(),
        panelCount: Number(b.panelCount) || 4
      })),
      activeFamilies,
      familyConfigs: {
        COLOR: { familyId: 'COLOR', enabled: activeFamilies.includes('COLOR'), countConfig: colorConfig },
        GLOSS: { familyId: 'GLOSS', enabled: activeFamilies.includes('GLOSS'), seriesConfig: glossConfig },
        PERSOZ: { familyId: 'PERSOZ', enabled: activeFamilies.includes('PERSOZ'), countConfig: persozConfig },
        ADHESION: { familyId: 'ADHESION', enabled: activeFamilies.includes('ADHESION') },
        OBSERVATIONS: { familyId: 'OBSERVATIONS', enabled: activeFamilies.includes('OBSERVATIONS') }
      },
      selectedMeasurementCycles
    });

    if (onCreated) onCreated(createdTrial.id);
    onClose();
  };

  const stepsList = [
    { num: 1, label: '01 Identification' },
    { num: 2, label: '02 Caractéristiques' },
    { num: 3, label: '03 Lots' },
    { num: 4, label: '04 Panneaux' },
    { num: 5, label: '05 Plan de Mesure' },
    { num: 6, label: '06 Calendrier' },
    { num: 7, label: '07 Validation' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <FlaskConical className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">Assistant de Création d'un Nouvel Essai</h2>
              <p className="text-xs text-slate-400">Flux Métier Laboratoire • NF EN 927-6 • Référentiel Permanent</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper (7 étapes) */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs overflow-x-auto gap-2">
          {stepsList.map((s) => (
            <div
              key={s.num}
              onClick={() => {
                // Navigation vers étapes antérieures toujours permise
                if (s.num < step) setStep(s.num as any);
              }}
              className={`flex items-center gap-2 font-medium shrink-0 ${
                s.num < step ? 'cursor-pointer hover:opacity-80' : ''
              } ${
                step === s.num
                  ? 'text-blue-700 font-bold'
                  : step > s.num
                  ? 'text-emerald-700'
                  : 'text-slate-400'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  step === s.num
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : step > s.num
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {step > s.num ? '✓' : s.num}
              </div>
              <span className="hidden md:inline">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {step === 1 && (
            <WizardStep1Identification
              reference={reference}
              onReferenceChange={setReference}
              title={title}
              onTitleChange={setTitle}
              projectOrClient={projectOrClient}
              onProjectOrClientChange={setProjectOrClient}
              createdBy={createdBy}
              onCreatedByChange={setCreatedBy}
              generalNotes={generalNotes}
              onGeneralNotesChange={setGeneralNotes}
            />
          )}

          {step === 2 && (
            <WizardStep2Characteristics
              lengthMm={lengthMm}
              onLengthChange={setLengthMm}
              widthMm={widthMm}
              onWidthChange={setWidthMm}
              thicknessMm={thicknessMm}
              onThicknessChange={setThicknessMm}
              dimUnit={dimUnit}
              onDimUnitChange={setDimUnit}
              substrateNature={substrateNature}
              onSubstrateNatureChange={setSubstrateNature}
              materialType={materialType}
              onMaterialTypeChange={setMaterialType}
              woodGrainOrientation={woodGrainOrientation}
              onWoodGrainOrientationChange={setWoodGrainOrientation}
              preparationNotes={preparationNotes}
              onPreparationNotesChange={setPreparationNotes}
              conditioningNotes={conditioningNotes}
              onConditioningNotesChange={setConditioningNotes}
              commonProtocolNotes={commonProtocolNotes}
              onCommonProtocolNotesChange={setCommonProtocolNotes}
            />
          )}
          {step === 3 && (
            <WizardStep3Batches
              batches={batches}
              onAddBatch={addBatchRow}
              onUpdateBatch={updateBatch}
              onRemoveBatch={removeBatchRow}
            />
          )}

          {step === 4 && (
            <WizardStep4Panels batches={batches} totalPanelsCount={totalPanelsCount} />
          )}

          {step === 5 && (
            <WizardStep5Families
              activeFamilies={activeFamilies}
              onToggleFamily={toggleFamily}
              colorPoints={colorPoints}
              onColorPointsChange={setColorPoints}
              colorJustification={colorJustification}
              onColorJustificationChange={setColorJustification}
              isColorAdapted={isColorAdapted}
              glossSeriesCount={glossSeriesCount}
              onGlossSeriesCountChange={setGlossSeriesCount}
              glossReadingsPerSeries={glossReadingsPerSeries}
              onGlossReadingsPerSeriesChange={setGlossReadingsPerSeries}
              glossJustification={glossJustification}
              onGlossJustificationChange={setGlossJustification}
              isGlossAdapted={isGlossAdapted}
              persozReps={persozReps}
              onPersozRepsChange={setPersozReps}
              persozJustification={persozJustification}
              onPersozJustificationChange={setPersozJustification}
              isPersozAdapted={isPersozAdapted}
            />
          )}

          {step === 6 && (
            <WizardStep6Calendar
              activeFamilies={activeFamilies}
              selectedMeasurementCycles={selectedMeasurementCycles}
              onPreset={setPlanPreset}
              onToggleCycle={toggleCycleMeasurement}
            />
          )}

          {step === 7 && (
            <WizardStep7Review
              reference={reference}
              title={title}
              projectOrClient={projectOrClient}
              createdBy={createdBy}
              substrateNature={substrateNature}
              materialType={materialType}
              lengthMm={lengthMm}
              widthMm={widthMm}
              thicknessMm={thicknessMm}
              dimUnit={dimUnit}
              woodGrainOrientation={woodGrainOrientation}
              batches={batches}
              totalPanelsCount={totalPanelsCount}
              activeFamilies={activeFamilies}
              colorPoints={colorPoints}
              glossSeriesCount={glossSeriesCount}
              glossReadingsPerSeries={glossReadingsPerSeries}
              persozReps={persozReps}
              selectedMeasurementCycles={selectedMeasurementCycles}
            />
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div>
            {step > 1 && (
              <button
                onClick={() => setStep((step - 1) as any)}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 hover:bg-white text-slate-700 rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                <ChevronLeft className="w-4 h-4" />
                Précédent
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-semibold"
            >
              Annuler
            </button>

            {step < 7 ? (
              <button
                onClick={() => {
                  if (step === 1 && !isStep1Valid) return;
                  if (step === 5 && !isStep5Valid) return;
                  setStep((step + 1) as any);
                }}
                disabled={(step === 1 && !isStep1Valid) || (step === 5 && !isStep5Valid)}
                className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs disabled:opacity-50"
              >
                Suivant
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-3">
                {!createdBy.trim() && (
                  <span className="text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                    Créateur de l'essai obligatoire pour finaliser la création
                  </span>
                )}
                <button
                  id="btn-create-trial-final"
                  onClick={handleFinalCreate}
                  disabled={!createdBy.trim()}
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Créer l'Essai et Ouvrir la Campagne
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Règle de validation du bouton final de création (GATE 53)
 * Vérifie que la création ne peut jamais aboutir si le créateur est absent ou constitué d'espaces blancs.
 */
export function isFinalCreateAllowed(step: number, createdBy: string): boolean {
  if (step === 7) {
    return Boolean(createdBy && createdBy.trim().length > 0);
  }
  return true;
}
