/**
 * QUV-Lab — Assistant : étape 7 Récapitulatif et Validation (refactor/split-wizard).
 * JSX déplacé à l'identique depuis CreateTrialWizardModal.tsx (step === 7).
 * Lecture seule ici : valeurs reçues en props depuis le parent.
 */

import { CheckCircle2, ShieldAlert } from 'lucide-react';
import type { LotFormItem, MeasurementFamilyId } from './wizardTypes';

interface Props {
  reference: string;
  title: string;
  projectOrClient: string;
  createdBy: string;
  substrateNature: string;
  materialType: string;
  lengthMm: number;
  widthMm: number;
  thicknessMm: number;
  dimUnit: 'mm' | 'cm';
  woodGrainOrientation: string;
  batches: LotFormItem[];
  totalPanelsCount: number;
  activeFamilies: MeasurementFamilyId[];
  colorPoints: number;
  glossSeriesCount: number;
  glossReadingsPerSeries: number;
  persozReps: number;
  selectedMeasurementCycles: number[];
}

export function WizardStep7Review({
  reference,
  title,
  projectOrClient,
  createdBy,
  substrateNature,
  materialType,
  lengthMm,
  widthMm,
  thicknessMm,
  dimUnit,
  woodGrainOrientation,
  batches,
  totalPanelsCount,
  activeFamilies,
  colorPoints,
  glossSeriesCount,
  glossReadingsPerSeries,
  persozReps,
  selectedMeasurementCycles
}: Props) {
  return (
    <div className="space-y-5">
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-emerald-950">Vérification finale avant création de l'essai</p>
          <p>
            L'essai sera initialisé avec le statut de configuration <strong>EDITABLE</strong>. Dès la première saisie scientifique sur paillasse, la configuration sera automatiquement verrouillée (<strong>LOCKED</strong>).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Identification */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 text-xs">
          <h4 className="font-bold text-slate-900 uppercase tracking-wider border-b pb-1.5">
            1. Identification
          </h4>
          <div className="space-y-1">
            <p><span className="text-slate-500">Référence :</span> <strong className="font-mono">{reference}</strong></p>
            <p><span className="text-slate-500">Titre :</span> {title || '—'}</p>
            <p><span className="text-slate-500">Demandeur :</span> {projectOrClient || '—'}</p>
            <p>
              <span className="text-slate-500">Opérateur :</span>{' '}
              {createdBy.trim() ? (
                <strong className="text-slate-900">{createdBy.trim()}</strong>
              ) : (
                <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  Non renseigné (bloquant pour la création)
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Substrat commun */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 text-xs">
          <h4 className="font-bold text-slate-900 uppercase tracking-wider border-b pb-1.5">
            2. Caractéristiques Communes
          </h4>
          <div className="space-y-1">
            <p><span className="text-slate-500">Support :</span> {substrateNature} — {materialType}</p>
            <p><span className="text-slate-500">Dimensions :</span> {lengthMm}×{widthMm}×{thicknessMm} {dimUnit}</p>
            <p><span className="text-slate-500">Fil :</span> {woodGrainOrientation}</p>
          </div>
        </div>
      </div>

      {/* Lots & Panneaux */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 text-xs">
        <h4 className="font-bold text-slate-900 uppercase tracking-wider border-b pb-1.5 flex items-center justify-between">
          <span>3. Lots & Référentiel ({batches.length} lots • {totalPanelsCount} éprouvettes)</span>
          <span className="font-mono text-blue-700">Total : {totalPanelsCount} panneaux</span>
        </h4>
        <div className="space-y-2">
          {batches.map((b) => (
            <div key={b.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
              <div>
                <span className="font-mono font-bold text-slate-900">{b.reference}</span>
                <span className="text-slate-500 ml-2">({b.coatingSystem})</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold font-mono">
                {b.panelCount} panneaux
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Plan de Mesure (Familles) */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 text-xs">
        <h4 className="font-bold text-slate-900 uppercase tracking-wider border-b pb-1.5">
          4. Grandeurs & Caractérisations ({activeFamilies.length} familles actives)
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {activeFamilies.map((f) => (
            <div key={f} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 font-medium text-xs">
              {f === 'COLOR' && `Couleur (${colorPoints} pts / face)`}
              {f === 'GLOSS' && `Brillance (${glossSeriesCount}×${glossReadingsPerSeries} mes)`}
              {f === 'PERSOZ' && `Persoz (${persozReps} reps)`}
              {f === 'OBSERVATIONS' && 'Observations ISO'}
              {f === 'ADHESION' && (
                <div className="text-amber-900 font-semibold">
                  <span>Adhérence ISO 2409</span>
                  <span className="block text-[10px] text-amber-700 font-normal">T0 + C12 uniquement</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Calendrier & Plan de Mesurage */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5 text-xs">
        <h4 className="font-bold text-slate-900 uppercase tracking-wider border-b pb-1.5 flex items-center justify-between">
          <span>5. Calendrier & Plan de Mesurage ({selectedMeasurementCycles.length} jalons mesurés / 13)</span>
          <span className="font-mono text-emerald-700 font-bold">2016 h cumulées (12 cycles)</span>
        </h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-500 font-medium">Jalons mesurés prévus :</span>
            <div className="flex flex-wrap gap-1 font-mono font-bold">
              {selectedMeasurementCycles.map((c) => (
                <span
                  key={c}
                  className={`px-2 py-0.5 rounded border text-[11px] ${
                    c === 0
                      ? 'bg-blue-50 text-blue-800 border-blue-200'
                      : c === 12
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                  }`}
                >
                  {c === 0 ? 'T0 (0 h)' : `C${c} (${c * 168} h)`}
                </span>
              ))}
            </div>
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            Les 12 cycles physiques d'exposition de 168 h sont maintenus dans le modèle. {13 - selectedMeasurementCycles.length > 0 ? `${13 - selectedMeasurementCycles.length} cycle(s) seront en exposition continue seule sans arrêt paillasse.` : 'Tous les cycles feront l\'objet d\'une campagne de caractérisation.'}
          </p>
          {activeFamilies.includes('ADHESION') && (
            <div className="text-amber-900 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200 text-[11px] flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                <strong>Règle normative Adhérence (NF EN ISO 2409) :</strong> Mesurée exclusivement à T0 (0 h) et C12 (2016 h). Aucun essai d'adhérence aux jalons intermédiaires C1 à C11.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
