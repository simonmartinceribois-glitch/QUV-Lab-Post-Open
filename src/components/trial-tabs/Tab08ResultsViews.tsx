/**
 * QUV-Lab — Onglet 08 : RÉSULTATS, SYNTHÈSES, COMPARAISONS & RAPPORT SCIENTIFIQUE (PROMPT 7)
 * Module complet intégrant l'ensemble des 7 sous-vues scientifiques et le moteur de rapport.
 */

import React, { useState } from 'react';
import { Trial } from '../../types/trial';
import { ScientificRuleSet } from '../../types/scientific';
import { globalTrialStore } from '../../services/trialStore';
import { ResultsGlobalView } from '../results-subviews/ResultsGlobalView';
import { ResultsTemporalComparisonView } from '../results-subviews/ResultsTemporalComparisonView';
import { ResultsBatchAnalysisView } from '../results-subviews/ResultsBatchAnalysisView';
import { ResultsPanelAnalysisView } from '../results-subviews/ResultsPanelAnalysisView';
import { ResultsFamilyAnalysisView } from '../results-subviews/ResultsFamilyAnalysisView';
import { ResultsAdvancedComparisonsView } from '../results-subviews/ResultsAdvancedComparisonsView';
import { ResultsReportAndReviewView } from '../results-subviews/ResultsReportAndReviewView';
import {
  Layers,
  GitCompare,
  Square,
  BarChart3,
  FileText,
  Sliders,
  Sparkles,
  TrendingUp
} from 'lucide-react';

interface Props {
  trial: Trial;
  ruleSet: ScientificRuleSet;
  onTrialUpdated?: () => void;
}

type SubViewType =
  | 'GLOBAL'
  | 'TEMPORAL'
  | 'BATCH'
  | 'PANEL'
  | 'FAMILY'
  | 'ADVANCED'
  | 'REPORT';

export function Tab08ResultsViews({ trial, ruleSet, onTrialUpdated }: Props) {
  const [activeSubView, setActiveSubView] = useState<SubViewType>('GLOBAL');

  return (
    <div className="space-y-6">
      {/* BARRE DE SOUS-ONGLETS PROMPT 7 */}
      <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1.5 overflow-x-auto text-xs font-bold border border-slate-200">
        <button
          type="button"
          onClick={() => setActiveSubView('GLOBAL')}
          className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeSubView === 'GLOBAL'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4 text-blue-600" />
          1. Vue Globale & Synthèse
        </button>

        <button
          type="button"
          onClick={() => setActiveSubView('TEMPORAL')}
          className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeSubView === 'TEMPORAL'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <GitCompare className="w-4 h-4 text-indigo-600" />
          2. Comparaison T0 / Étapes
        </button>

        <button
          type="button"
          onClick={() => setActiveSubView('BATCH')}
          className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeSubView === 'BATCH'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4 text-amber-600" />
          3. Analyse par Lot
        </button>

        <button
          type="button"
          onClick={() => setActiveSubView('PANEL')}
          className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeSubView === 'PANEL'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Square className="w-4 h-4 text-emerald-600" />
          4. Fiche Panneau (RAW/COMP)
        </button>

        <button
          type="button"
          onClick={() => setActiveSubView('FAMILY')}
          className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeSubView === 'FAMILY'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-purple-600" />
          5. Cinétiques & Graphiques
        </button>

        <button
          type="button"
          onClick={() => setActiveSubView('ADVANCED')}
          className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeSubView === 'ADVANCED'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-teal-600" />
          6. Comparaisons Croisées
        </button>

        <button
          type="button"
          onClick={() => setActiveSubView('REPORT')}
          className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeSubView === 'REPORT'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-700 hover:text-slate-900 bg-blue-50/50'
          }`}
        >
          <FileText className="w-4 h-4" />
          7. Rapport Scientifique & Exports
        </button>
      </div>

      {/* CONTENU DE LA SOUS-VUE ACTIVE */}
      {activeSubView === 'GLOBAL' && (
        <ResultsGlobalView trial={trial} ruleSet={ruleSet} />
      )}

      {activeSubView === 'TEMPORAL' && (
        <ResultsTemporalComparisonView trial={trial} ruleSet={ruleSet} />
      )}

      {activeSubView === 'BATCH' && (
        <ResultsBatchAnalysisView trial={trial} ruleSet={ruleSet} />
      )}

      {activeSubView === 'PANEL' && (
        <ResultsPanelAnalysisView trial={trial} ruleSet={ruleSet} />
      )}

      {activeSubView === 'FAMILY' && (
        <ResultsFamilyAnalysisView trial={trial} ruleSet={ruleSet} />
      )}

      {activeSubView === 'ADVANCED' && (
        <ResultsAdvancedComparisonsView trial={trial} ruleSet={ruleSet} />
      )}

      {activeSubView === 'REPORT' && (
        <ResultsReportAndReviewView
          trial={trial}
          ruleSet={ruleSet}
          onTrialUpdated={onTrialUpdated}
        />
      )}
    </div>
  );
}
