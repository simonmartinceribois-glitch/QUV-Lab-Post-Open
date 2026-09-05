/**
 * QUV-Lab — Assistant : étape 3 Création des lots (refactor/split-wizard).
 * JSX déplacé à l'identique depuis CreateTrialWizardModal.tsx (step === 3).
 * Aucun état ici : lots + gestionnaires reçus en props depuis le parent.
 */

import { Plus, Trash2 } from 'lucide-react';
import type { LotFormItem } from './wizardTypes';

interface Props {
  batches: LotFormItem[];
  onAddBatch: () => void;
  onUpdateBatch: (id: string, field: keyof LotFormItem, value: any) => void;
  onRemoveBatch: (id: string) => void;
}

export function WizardStep3Batches({ batches, onAddBatch, onUpdateBatch, onRemoveBatch }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Définition des Lots Expérimentaux ({batches.length} lots configurés)
          </h3>
          <p className="text-xs text-slate-500">
            Chaque lot possède ses propres paramètres d'application et son propre nombre de panneaux.
          </p>
        </div>
        <button
          onClick={onAddBatch}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Ajouter un Lot
        </button>
      </div>

      <div className="space-y-4">
        {batches.map((batch, idx) => (
          <div
            key={batch.id}
            className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-3"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-xs font-bold rounded bg-slate-900 text-white font-mono">
                  Lot #{idx + 1}
                </span>
                <input
                  type="text"
                  value={batch.reference}
                  onChange={(e) => onUpdateBatch(batch.id, 'reference', e.target.value)}
                  className="px-2 py-1 text-sm font-bold border border-slate-300 rounded font-mono text-blue-900 w-32"
                  placeholder="Ex: LOT XX1C"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <span>Nombre de panneaux :</span>
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={batch.panelCount}
                    onChange={(e) => onUpdateBatch(batch.id, 'panelCount', Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 px-2 py-1 text-xs border border-slate-300 rounded text-center font-bold bg-blue-50 text-blue-900"
                  />
                </div>
                {batches.length > 1 && (
                  <button
                    onClick={() => onRemoveBatch(batch.id)}
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="Supprimer ce lot"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Essence de bois</label>
                <input
                  type="text"
                  value={batch.woodSpecies}
                  onChange={(e) => onUpdateBatch(batch.id, 'woodSpecies', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                  placeholder="Ex: Chêne, Pin..."
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Produit appliqué (Réf.)</label>
                <input
                  type="text"
                  value={batch.productReference}
                  onChange={(e) => onUpdateBatch(batch.id, 'productReference', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                  placeholder="Ex: LAS-STD-01"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Fabricant / Fournisseur</label>
                <input
                  type="text"
                  value={batch.manufacturerOrSupplier}
                  onChange={(e) => onUpdateBatch(batch.id, 'manufacturerOrSupplier', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                  placeholder="Ex: Fournisseur Alpha"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-slate-600 font-medium mb-1">Système de finition / Revêtement</label>
                <input
                  type="text"
                  value={batch.coatingSystem}
                  onChange={(e) => onUpdateBatch(batch.id, 'coatingSystem', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-medium"
                  placeholder="Ex: Lasure solvantée 3 couches"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Nombre de couches</label>
                <input
                  type="number"
                  value={batch.coatCount}
                  onChange={(e) => onUpdateBatch(batch.id, 'coatCount', Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-center"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Méthode d'application</label>
                <input
                  type="text"
                  value={batch.applicationMethod}
                  onChange={(e) => onUpdateBatch(batch.id, 'applicationMethod', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                  placeholder="Ex: Pinceau, Pistolet..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Conditions d'application</label>
                <input
                  type="text"
                  value={batch.applicationConditions}
                  onChange={(e) => onUpdateBatch(batch.id, 'applicationConditions', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                  placeholder="Ex: 21°C, 55% HR"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Date d'application</label>
                <input
                  type="date"
                  value={batch.applicationDate}
                  onChange={(e) => onUpdateBatch(batch.id, 'applicationDate', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Temps de séchage / Stabilisation</label>
                <input
                  type="text"
                  value={batch.dryingOrConditioningTime}
                  onChange={(e) => onUpdateBatch(batch.id, 'dryingOrConditioningTime', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                  placeholder="Ex: 7 jours à 20°C"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1 text-xs">Observations / Notes du lot</label>
              <input
                type="text"
                value={batch.batchNotes}
                onChange={(e) => onUpdateBatch(batch.id, 'batchNotes', e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                placeholder="Remarques particulières..."
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
