/**
 * QUV-Lab — Assistant : étape 5 Familles & Plan de mesure (refactor/split-wizard).
 * JSX déplacé à l'identique depuis CreateTrialWizardModal.tsx (step === 5).
 * Aucun état ici : valeurs + setters + drapeaux reçus en props depuis le parent.
 */

import { Info } from 'lucide-react';
import type { NumberSetter, TextSetter } from './wizardTypes';
import type { MeasurementFamilyId } from '../../types/scientific';

interface Props {
  activeFamilies: MeasurementFamilyId[];
  onToggleFamily: (fam: MeasurementFamilyId) => void;
  colorPoints: number;
  onColorPointsChange: NumberSetter;
  colorJustification: string;
  onColorJustificationChange: TextSetter;
  isColorAdapted: boolean;
  glossSeriesCount: number;
  onGlossSeriesCountChange: NumberSetter;
  glossReadingsPerSeries: number;
  onGlossReadingsPerSeriesChange: NumberSetter;
  glossJustification: string;
  onGlossJustificationChange: TextSetter;
  isGlossAdapted: boolean;
  persozReps: number;
  onPersozRepsChange: NumberSetter;
  persozJustification: string;
  onPersozJustificationChange: TextSetter;
  isPersozAdapted: boolean;
}

export function WizardStep5Families({
  activeFamilies,
  onToggleFamily,
  colorPoints,
  onColorPointsChange,
  colorJustification,
  onColorJustificationChange,
  isColorAdapted,
  glossSeriesCount,
  onGlossSeriesCountChange,
  glossReadingsPerSeries,
  onGlossReadingsPerSeriesChange,
  glossJustification,
  onGlossJustificationChange,
  isGlossAdapted,
  persozReps,
  onPersozRepsChange,
  persozJustification,
  onPersozJustificationChange,
  isPersozAdapted
}: Props) {
  return (
    <div className="space-y-5">
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 flex items-start gap-3">
        <Info className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-slate-900">Distinction normative rigoureuse (NF EN 927-6 vs Recommandation Labo)</p>
          <p>
            La Couleur L*a*b* et la Brillance 60° sont des exigences normatives strictes de la NF EN 927-6. La dureté Pendule Persoz est une recommandation du laboratoire.
          </p>
        </div>
      </div>

      {/* Familles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          {
            id: 'COLOR' as MeasurementFamilyId,
            name: 'Colorimétrie CIELAB L*a*b*',
            norme: 'NF EN 927-6 §6.3.2',
            status: 'NORMATIVE_REQUIREMENT',
            badge: 'Exigence Normative'
          },
          {
            id: 'GLOSS' as MeasurementFamilyId,
            name: 'Brillance Spéculaire 60°',
            norme: 'NF EN 927-6 §6.3.3',
            status: 'NORMATIVE_REQUIREMENT',
            badge: 'Exigence Normative'
          },
          {
            id: 'PERSOZ' as MeasurementFamilyId,
            name: 'Dureté Pendule Persoz',
            norme: 'ISO 1522 / NF EN 927-6',
            status: 'LAB_RECOMMENDATION',
            badge: 'Recommandation Laboratoire'
          },
          {
            id: 'ADHESION' as MeasurementFamilyId,
            name: 'Adhérence au Quadrillage',
            norme: 'NF EN ISO 2409:2020',
            status: 'NORMATIVE_REQUIREMENT',
            badge: 'Méthode Qualitative'
          },
          {
            id: 'OBSERVATIONS' as MeasurementFamilyId,
            name: 'Observations Visuelles ISO',
            norme: 'ISO 4628 (1 à 6) & ISO 2409',
            status: 'NORMATIVE_REQUIREMENT',
            badge: 'Exigence Normative'
          }
        ].map((fam) => {
          const isActive = activeFamilies.includes(fam.id);
          return (
            <div
              key={fam.id}
              onClick={() => onToggleFamily(fam.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                isActive
                  ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500 shadow-xs'
                  : 'border-slate-200 bg-white opacity-60 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-slate-900">{fam.name}</span>
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    fam.status === 'NORMATIVE_REQUIREMENT'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {fam.badge}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">{fam.norme}</p>
            </div>
          );
        })}
      </div>

      {/* Configurations de mesure */}
      <div className="space-y-4 pt-2">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Configuration métrologique par grandeur
        </h4>

        {/* Couleur */}
        {activeFamilies.includes('COLOR') && (
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Points de mesure Couleur L*a*b*</span>
              <span className="text-xs text-slate-500 font-mono">Standard : 4 points / éprouvette</span>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs text-slate-700">Nombre de points par éprouvette :</label>
              <input
                type="number"
                min={1}
                max={12}
                value={colorPoints}
                onChange={(e) => onColorPointsChange(Number(e.target.value))}
                className="w-20 px-2 py-1 text-xs border border-slate-300 rounded text-center font-bold"
              />
              {isColorAdapted && (
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Adaptation du protocole
                </span>
              )}
            </div>
            {isColorAdapted && (
              <div>
                <label className="block text-xs font-bold text-red-700 mb-1">
                  Justification obligatoire de l'écart métrologique *
                </label>
                <input
                  type="text"
                  value={colorJustification}
                  onChange={(e) => onColorJustificationChange(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-red-300 rounded-lg bg-red-50/20"
                  placeholder="Motif technique de l'adaptation..."
                />
              </div>
            )}
          </div>
        )}

        {/* Brillance */}
        {activeFamilies.includes('GLOSS') && (
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Séries de Brillance Spéculaire 60°</span>
              <span className="text-xs text-slate-500 font-mono">Standard : 2 séries de 2 relevés (Sens du fil + Perpendiculaire)</span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span>Séries :</span>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={glossSeriesCount}
                  onChange={(e) => onGlossSeriesCountChange(Number(e.target.value))}
                  className="w-16 px-2 py-1 border border-slate-300 rounded text-center font-bold"
                />
              </div>
              <div className="flex items-center gap-2">
                <span>Relevés par série :</span>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={glossReadingsPerSeries}
                  onChange={(e) => onGlossReadingsPerSeriesChange(Number(e.target.value))}
                  className="w-16 px-2 py-1 border border-slate-300 rounded text-center font-bold"
                />
              </div>
              {isGlossAdapted && (
                <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Adaptation du protocole
                </span>
              )}
            </div>
            {isGlossAdapted && (
              <div>
                <label className="block text-xs font-bold text-red-700 mb-1">
                  Justification obligatoire de l'écart métrologique *
                </label>
                <input
                  type="text"
                  value={glossJustification}
                  onChange={(e) => onGlossJustificationChange(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-red-300 rounded-lg bg-red-50/20"
                  placeholder="Motif technique de l'adaptation..."
                />
              </div>
            )}
          </div>
        )}

        {/* Persoz */}
        {activeFamilies.includes('PERSOZ') && (
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Répétitions Dureté Persoz</span>
              <span className="text-xs text-slate-500 font-mono">Standard Labo : 3 répétitions</span>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs text-slate-700">Nombre de répétitions par éprouvette :</label>
              <input
                type="number"
                min={1}
                max={10}
                value={persozReps}
                onChange={(e) => onPersozRepsChange(Number(e.target.value))}
                className="w-20 px-2 py-1 text-xs border border-slate-300 rounded text-center font-bold"
              />
              {isPersozAdapted && (
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Adaptation Recommandation
                </span>
              )}
            </div>
            {isPersozAdapted && (
              <div>
                <label className="block text-xs font-bold text-red-700 mb-1">
                  Justification obligatoire de l'écart métrologique *
                </label>
                <input
                  type="text"
                  value={persozJustification}
                  onChange={(e) => onPersozJustificationChange(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-red-300 rounded-lg bg-red-50/20"
                  placeholder="Motif de l'adaptation..."
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
