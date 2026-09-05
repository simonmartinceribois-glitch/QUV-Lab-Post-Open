/**
 * QUV-Lab — Vue Détaillée d'Essai avec les 9 Onglets Métier (PROMPT 6)
 */

import React, { useState } from 'react';
import { Trial } from '../types/trial';
import { MeasurementFamilyId, ScientificRuleSet } from '../types/scientific';
import { Tab01Identification } from './trial-tabs/Tab01Identification';
import { Tab02LotsPanels } from './trial-tabs/Tab02LotsPanels';
import { Tab03Protocol } from './trial-tabs/Tab03Protocol';
import { Tab04Calendar } from './trial-tabs/Tab04Calendar';
import { Tab05Stages } from './trial-tabs/Tab05Stages';
import { Tab06MeasurementsBench } from './trial-tabs/Tab06MeasurementsBench';
import { Tab07QualityControl } from './trial-tabs/Tab07QualityControl';
import { Tab08ResultsViews } from './trial-tabs/Tab08ResultsViews';
import { Tab09AuditTrail } from './trial-tabs/Tab09AuditTrail';
import { TabPhotographs } from './trial-tabs/TabPhotographs';
import {
  ArrowLeft,
  FileText,
  Layers,
  Sliders,
  Calendar,
  Clock,
  PlayCircle,
  Camera,
  ShieldCheck,
  BarChart3,
  History,
  Lock,
  CheckCircle2
} from 'lucide-react';

interface Props {
  trial: Trial;
  ruleSet: ScientificRuleSet;
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onBackToDashboard: () => void;
  onTrialUpdated: () => void;
}

export function TrialDetailView({
  trial,
  ruleSet,
  activeTab,
  onSelectTab,
  onBackToDashboard,
  onTrialUpdated
}: Props) {
  const [selectedStageId, setSelectedStageId] = useState<string>(trial.stages[0]?.id || '');
  const [selectedFamilyId, setSelectedFamilyId] = useState<MeasurementFamilyId>('COLOR');

  const tabs = [
    { id: '01', label: '01 Identification', icon: FileText },
    { id: '02', label: '02 Lots & Échantillons', icon: Layers },
    { id: '03', label: '03 Protocole', icon: Sliders },
    { id: '04', label: '04 Calendrier', icon: Calendar },
    { id: '05', label: '05 Étapes', icon: Clock },
    { id: '06', label: '06 Paillasse / Saisie', icon: PlayCircle },
    { id: 'PHOTO', label: 'Photothèque', icon: Camera },
    { id: '07', label: '07 Contrôle Qualité', icon: ShieldCheck },
    { id: '08', label: '08 Résultats & Fiches', icon: BarChart3 },
    { id: '09', label: "09 Journal d'Audit", icon: History }
  ];

  const handleNavigateToBench = (fam: MeasurementFamilyId) => {
    setSelectedFamilyId(fam);
    onSelectTab('06');
  };

  const isLocked = trial.configurationStatus === 'LOCKED';

  return (
    <div className="space-y-6">
      {/* 1. TOP BAR DU SUIVI D'ESSAI */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
            title="Retour à la liste des essais"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-md bg-blue-100 text-blue-800">
                {trial.metadata.reference}
              </span>
              <h2 className="text-base font-bold text-slate-900">{trial.metadata.title || 'Essai QUV'}</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Client : {trial.metadata.projectOrClient || 'Standard'} • Créateur : {trial.metadata.createdBy}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isLocked ? (
            <span className="px-3 py-1 text-xs font-bold rounded-lg bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              Config Verrouillée
            </span>
          ) : (
            <span className="px-3 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Config Modifiable
            </span>
          )}

          <span
            className={`px-3 py-1 text-xs font-bold rounded-lg ${
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

      {/* 2. ONGLETS DE NAVIGATION */}
      <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 3. CONTENU DE L'ONGLET ACTIF */}
      <div>
        {activeTab === '01' && (
          <Tab01Identification trial={trial} onTrialUpdated={onTrialUpdated} />
        )}
        {activeTab === '02' && (
          <Tab02LotsPanels trial={trial} onTrialUpdated={onTrialUpdated} />
        )}
        {activeTab === '03' && (
          <Tab03Protocol trial={trial} ruleSet={ruleSet} onTrialUpdated={onTrialUpdated} />
        )}
        {activeTab === '04' && (
          <Tab04Calendar
            trial={trial}
            onSelectStage={(stId) => {
              setSelectedStageId(stId);
              onSelectTab('05');
            }}
            onTrialUpdated={onTrialUpdated}
          />
        )}
        {activeTab === '05' && (
          <Tab05Stages
            trial={trial}
            selectedStageId={selectedStageId}
            onSelectStageId={setSelectedStageId}
            onNavigateToFamilyBench={handleNavigateToBench}
            onTrialUpdated={onTrialUpdated}
          />
        )}
        {activeTab === '06' && (
          <Tab06MeasurementsBench
            trial={trial}
            selectedStageId={selectedStageId}
            selectedFamilyId={selectedFamilyId}
            ruleSet={ruleSet}
            onStageChange={setSelectedStageId}
            onFamilyChange={setSelectedFamilyId}
            onTrialUpdated={onTrialUpdated}
          />
        )}
        {activeTab === 'PHOTO' && (
          <TabPhotographs trial={trial} onTrialUpdated={onTrialUpdated} />
        )}
        {activeTab === '07' && (
          <Tab07QualityControl trial={trial} ruleSet={ruleSet} />
        )}
        {activeTab === '08' && (
          <Tab08ResultsViews trial={trial} ruleSet={ruleSet} onTrialUpdated={onTrialUpdated} />
        )}
        {activeTab === '09' && (
          <Tab09AuditTrail trial={trial} />
        )}
      </div>
    </div>
  );
}
