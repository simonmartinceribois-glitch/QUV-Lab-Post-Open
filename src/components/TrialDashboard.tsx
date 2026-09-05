/**
 * QUV-Lab — Accueil & Tableau de Bord des Essais (PROMPT 6 - Section 2)
 * Vue d'accueil permettant le pilotage de l'ensemble des campagnes d'essais du laboratoire.
 */

import React, { useState } from 'react';
import { Trial } from '../types/trial';
import { TrialStatus } from '../types/scientific';
import {
  FlaskConical,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  PlayCircle,
  FileEdit,
  Lock,
  ChevronRight,
  Layers,
  Calendar,
  Sparkles
} from 'lucide-react';

interface Props {
  trials: Trial[];
  onSelectTrial: (trialId: string) => void;
  onOpenCreateWizard: () => void;
}

export function TrialDashboard({ trials, onSelectTrial, onOpenCreateWizard }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TrialStatus | 'VALIDATED'>('ALL');

  // Indicateurs clés
  const totalCount = trials.length;
  const inProgressCount = trials.filter((t) => t.status === 'IN_PROGRESS').length;
  const completedCount = trials.filter((t) => t.status === 'COMPLETED').length;
  const draftCount = trials.filter((t) => t.status === 'DRAFT').length;

  const filteredTrials = trials.filter((t) => {
    // 'VALIDATED' (bouton « Validé ») = campagnes terminées : aucun TrialStatus ne porte ce libellé
    const effectiveFilter = statusFilter === 'VALIDATED' ? 'COMPLETED' : statusFilter;
    if (effectiveFilter !== 'ALL' && t.status !== effectiveFilter) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      t.metadata.reference.toLowerCase().includes(term) ||
      (t.metadata.title || '').toLowerCase().includes(term) ||
      (t.metadata.projectOrClient || '').toLowerCase().includes(term) ||
      (t.metadata.createdBy || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER ACCUEIL */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Campagnes d'Essais de Vieillissement UV
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Suivi des cycles de vieillissement selon la norme NF EN 927-6 et protocoles laboratoires
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreateWizard}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          Nouvel Essai QUV
        </button>
      </div>

      {/* 2. INDICATEURS CLÉS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Essais</span>
          <div className="text-2xl font-bold text-slate-900 font-mono">{totalCount}</div>
          <p className="text-[11px] text-slate-500">Campagnes enregistrées</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">En Cours</span>
          <div className="text-2xl font-bold text-blue-700 font-mono">{inProgressCount}</div>
          <p className="text-[11px] text-slate-500">Cycles d'exposition actifs</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Terminés / Clôturés</span>
          <div className="text-2xl font-bold text-emerald-700 font-mono">{completedCount}</div>
          <p className="text-[11px] text-slate-500">Campagnes terminées</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Brouillons</span>
          <div className="text-2xl font-bold text-amber-700 font-mono">{draftCount}</div>
          <p className="text-[11px] text-slate-500">En cours de configuration</p>
        </div>
      </div>

      {/* 3. BARRE DE FILTRES & RECHERCHE */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par référence, titre, client, opérateur..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-300 shadow-xs">
          {(['ALL', 'IN_PROGRESS', 'DRAFT', 'VALIDATED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === st ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st === 'ALL'
                ? 'Tous'
                : st === 'IN_PROGRESS'
                ? 'En cours'
                : st === 'DRAFT'
                ? 'Brouillon'
                : 'Validé'}
            </button>
          ))}
        </div>
      </div>

      {/* 4. LISTE DES ESSAIS */}
      <div className="space-y-3.5">
        {filteredTrials.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 space-y-3">
            <FlaskConical className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold">Aucun essai ne correspond aux critères.</p>
          </div>
        ) : (
          filteredTrials.map((trial) => {
            const isLocked = trial.configurationStatus === 'LOCKED';
            const totalPanels = trial.batches.reduce((sum, b) => sum + b.panels.length, 0);
            const activePanels = trial.batches.reduce(
              (sum, b) => sum + b.panels.filter((p) => p.status === 'ACTIVE').length,
              0
            );

            // Progression de l'exposition
            const validatedStages = trial.stages.filter((s) => s.status === 'VALIDATED').length;
            const currentStage = trial.stages.find((s) => s.status === 'IN_PROGRESS') || trial.stages[0];
            const maxHours = trial.stages[trial.stages.length - 1]?.scheduledExposureHours || 2016;
            const currentHours = currentStage.scheduledExposureHours || 0;
            const progressPercent = Math.min(100, Math.round((currentHours / maxHours) * 100));

            return (
              <div
                key={trial.id}
                onClick={() => onSelectTrial(trial.id)}
                className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 text-xs font-mono font-bold rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                      {trial.metadata.reference}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{trial.metadata.title || 'Essai QUV'}</h3>
                      <p className="text-xs text-slate-500">
                        {trial.metadata.projectOrClient || 'Projet Standard'} • Créé le{' '}
                        {new Date(trial.createdAt).toLocaleDateString('fr-FR')} par {trial.metadata.createdBy}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isLocked ? (
                      <span className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-amber-600" />
                        Verrouillé
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Modifiable
                      </span>
                    )}

                    <span
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-md ${
                        trial.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : trial.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {trial.status}
                    </span>
                  </div>
                </div>

                {/* Info Lots / Panneaux / Familles & Barre de progression */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="md:col-span-4 space-y-1 text-xs text-slate-600">
                    <div>
                      Référentiel : <strong>{trial.batches.length} lots</strong> ({activePanels} éprouvettes actives)
                    </div>
                    <div>
                      Familles :{' '}
                      <strong className="text-slate-800">
                        {trial.config.activeFamilies.join(' • ')}
                      </strong>
                    </div>
                  </div>

                  <div className="md:col-span-5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-600 font-sans">
                        Étape active : <strong>{currentStage.name}</strong> ({currentHours} / {maxHours} h)
                      </span>
                      <span className="font-bold text-blue-700">{progressPercent}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="md:col-span-3 flex justify-end">
                    <div className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                      Ouvrir le Suivi de l'Essai
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
