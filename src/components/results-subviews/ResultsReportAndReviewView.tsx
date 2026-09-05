/**
 * QUV-Lab — Générateur de Rapport Scientifique, Revue & Exports (PROMPT 7 - Sections 21 à 26, 32, 34)
 */

import React, { useState } from 'react';
import { Trial } from '../../types/trial';
import {
  ScientificRuleSet,
  ScientificReport,
  ScientificReportStatus,
  ScientificReportReviewComment
} from '../../types/scientific';
import {
  auditTrialBeforeReport,
  exportReportToCsv,
  exportRawDataToCsv
} from '../../services/reportGenerator';
import { downloadTextFile, downloadJsonFile, printElementById } from '../../services/exportService';
import { globalTrialStore } from '../../services/trialStore';
import {
  FileText,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  MessageSquare,
  Sparkles,
  Layers,
  History,
  FileSpreadsheet,
  ChevronDown,
  UserCheck,
  Send
} from 'lucide-react';

interface Props {
  trial: Trial;
  ruleSet: ScientificRuleSet;
  onTrialUpdated?: () => void;
}

export function ResultsReportAndReviewView({ trial, ruleSet, onTrialUpdated }: Props) {
  const audit = auditTrialBeforeReport(trial, ruleSet);
  const reports = trial.reports || [];
  const [selectedReportId, setSelectedReportId] = useState<string>(reports[0]?.id || '');
  const activeReport = reports.find((r) => r.id === selectedReportId) || reports[0];

  const [operatorId, setOperatorId] = useState<string>('SM (Technicien)');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Formulaire de commentaire de revue
  const [reviewCommentText, setReviewCommentText] = useState<string>('');
  const [reviewCategory, setReviewCategory] = useState<ScientificReportReviewComment['category']>('GENERAL');
  const [activeAnnexTab, setActiveAnnexTab] = useState<string>('A');

  const handleGenerateReport = () => {
    setIsGenerating(true);
    try {
      const rep = globalTrialStore.generateScientificReportForTrial(trial.id, operatorId, ruleSet);
      setSelectedReportId(rep.id);
      onTrialUpdated?.();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateStatus = (newStatus: ScientificReportStatus) => {
    if (!activeReport) return;
    globalTrialStore.updateReportStatus(trial.id, activeReport.id, newStatus, operatorId);
    onTrialUpdated?.();
  };

  const handleAddComment = () => {
    if (!activeReport || !reviewCommentText.trim()) return;
    globalTrialStore.addReportReviewComment(trial.id, activeReport.id, {
      author: operatorId,
      text: reviewCommentText.trim(),
      category: reviewCategory
    });
    setReviewCommentText('');
    onTrialUpdated?.();
  };

  const handleExportCsv = () => {
    if (!activeReport) return;
    const csvContent = exportReportToCsv(trial, activeReport, ruleSet);
    const filename = `RAPPORT_${trial.metadata.reference}_${activeReport.metadata.reportVersion}.csv`;
    downloadTextFile(filename, csvContent, 'text/csv;charset=utf-8');
    globalTrialStore.logReportExport(trial.id, activeReport.id, 'REPORT_CSV', operatorId);
  };

  const handleExportRawCsv = () => {
    const csvContent = exportRawDataToCsv(trial);
    const filename = `DONNEES_BRUTES_RAW_${trial.metadata.reference}.csv`;
    downloadTextFile(filename, csvContent, 'text/csv;charset=utf-8');
    globalTrialStore.logReportExport(trial.id, activeReport?.id || trial.id, 'RAW_DATA_CSV', operatorId);
  };

  const handleExportJson = () => {
    const filename = `DOSSIER_SCIENTIFIQUE_${trial.metadata.reference}.json`;
    downloadJsonFile(filename, { trial, ruleSet, activeReport });
    globalTrialStore.logReportExport(trial.id, activeReport?.id || trial.id, 'COMPUTED_DATA_CSV', operatorId);
  };

  const handlePrintPdf = () => {
    if (activeReport) {
      globalTrialStore.logReportExport(trial.id, activeReport.id, 'REPORT_PDF', operatorId);
    }
    printElementById('scientific-report-printable-area');
  };

  return (
    <div className="space-y-6">
      {/* 1. AUDIT PRÉ-RAPPORT (Section 32) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              Contrôle d'Audit Préalable à l'Émission du Rapport Scientifique
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Vérification des 10 critères méthodologiques d'intégrité selon NF EN 927-6
            </p>
          </div>

          <div className="flex items-center gap-2">
            {audit.isComplete ? (
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                Dossier Complet (2016 h atteint)
              </span>
            ) : (
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Rapport Partiel (Campagne en cours)
              </span>
            )}
          </div>
        </div>

        {/* Grille des critères d'audit */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
            {audit.checklist.trialIdentified ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span className="font-semibold text-slate-700">1. Essai Identifié</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
            {audit.checklist.batchesIdentified ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span className="font-semibold text-slate-700">2. Lots Caractérisés</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
            {audit.checklist.panelsIdentified ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span className="font-semibold text-slate-700">3. Éprouvettes Définies</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
            {audit.checklist.t0Available ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span className="font-semibold text-slate-700">4. T0 Référence Validé</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
            {audit.checklist.intermediateStagesAnalyzable ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
            <span className="font-semibold text-slate-700">5. Cycles Intermédiaires</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
            {audit.isComplete ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <Clock className="w-4 h-4 text-amber-600 shrink-0" />}
            <span className="font-semibold text-slate-700">6. Étape Finale 2016 h</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
            {audit.checklist.computationsAvailable ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span className="font-semibold text-slate-700">7. Calculs Validés</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
            {audit.checklist.engineVersionAvailable ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span className="font-semibold text-slate-700">8. Moteur v{ruleSet.version}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
            {audit.checklist.adaptationsTraced ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span className="font-semibold text-slate-700">9. Adaptations Tracées</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
            {audit.checklist.alertsCataloged ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span className="font-semibold text-slate-700">10. Alertes Recensées</span>
          </div>
        </div>

        {/* Bouton de génération / régénération */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span>Opérateur :</span>
            <input
              type="text"
              value={operatorId}
              onChange={(e) => setOperatorId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800"
            />
          </div>

          <button
            type="button"
            onClick={handleGenerateReport}
            disabled={isGenerating || !audit.canGenerate}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all"
          >
            <FileText className="w-4 h-4" />
            {reports.length > 0 ? `Régénérer une nouvelle version (v${reports.length + 1}.0)` : 'Générer le Rapport Scientifique (v1.0)'}
          </button>
        </div>
      </div>

      {/* 2. HISTORIQUE DES VERSIONS & ACTIONS D'EXPORTATION */}
      {reports.length > 0 && activeReport && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-700">Versions émises :</span>
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {reports.map((rep) => (
                <button
                  key={rep.id}
                  type="button"
                  onClick={() => setSelectedReportId(rep.id)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                    activeReport.id === rep.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {rep.metadata.reportVersion} ({rep.status})
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrintPdf}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-1.5 transition-all"
              title="Imprimer ou enregistrer en PDF"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              Imprimer / PDF
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs rounded-xl border border-emerald-200 flex items-center gap-1.5 transition-all"
              title="Exporter le rapport complet en CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              Export CSV
            </button>

            <button
              type="button"
              onClick={handleExportRawCsv}
              className="px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold text-xs rounded-xl border border-purple-200 flex items-center gap-1.5 transition-all"
              title="Exporter les données brutes individuelles"
            >
              <Download className="w-3.5 h-3.5 text-purple-700" />
              Données RAW CSV
            </button>
          </div>
        </div>
      )}

      {/* 3. VISUALISEUR DU RAPPORT OFFICIEL (Section 22 & 23) */}
      {activeReport ? (
        <div id="scientific-report-printable-area" className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xs space-y-8 print:p-0 print:border-none">
          {/* En-tête officiel du rapport */}
          <div className="border-b-2 border-slate-900 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-blue-700 font-mono block">
                  LABORATOIRE D'ESSAIS & VIEILLISSEMENT DU BOIS • NF EN 927-6
                </span>
                <h1 className="text-2xl font-black text-slate-900 mt-1">
                  RAPPORT SCIENTIFIQUE D'ESSAI
                </h1>
                <p className="text-sm font-semibold text-slate-600 mt-0.5">
                  Référence d'essai : <span className="font-mono text-slate-900 font-bold">{trial.metadata.reference}</span> • 
                  Version rapport : <span className="font-mono text-slate-900 font-bold">{activeReport.metadata.reportVersion}</span>
                </p>
              </div>

              <div className="text-right text-xs text-slate-600 space-y-1 font-medium">
                <div>Statut : <strong className="font-black px-2 py-0.5 rounded bg-blue-100 text-blue-900">{activeReport.status}</strong></div>
                <div>Généré le : {new Date(activeReport.metadata.generatedAt).toLocaleString('fr-FR')}</div>
                <div>Par : {activeReport.metadata.generatedBy}</div>
                <div>Moteur de calcul : <span className="font-mono font-bold">QUV-Lab v{activeReport.metadata.calculationVersion}</span></div>
              </div>
            </div>
          </div>

          {/* Sommaire exécutif */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
            <strong className="font-bold text-slate-900 uppercase tracking-wider block text-[11px]">Résumé Exécutif</strong>
            <p>{activeReport.executiveSummary}</p>
          </div>

          {/* Sections structurées du rapport (1 à 19) */}
          <div className="space-y-6 text-xs text-slate-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200/80 space-y-1.5">
                <h3 className="font-bold text-slate-900 text-sm">1. Identification & Métadonnées</h3>
                <pre className="font-sans whitespace-pre-wrap text-slate-700 leading-relaxed">{activeReport.sections.identification}</pre>
              </div>

              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200/80 space-y-1.5">
                <h3 className="font-bold text-slate-900 text-sm">2. Objet de l'Étude</h3>
                <pre className="font-sans whitespace-pre-wrap text-slate-700 leading-relaxed">{activeReport.sections.studyPurpose}</pre>
              </div>
            </div>

            <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200/80 space-y-1.5">
              <h3 className="font-bold text-slate-900 text-sm">3. Référentiels Normatifs & Méthodologiques</h3>
              <pre className="font-sans whitespace-pre-wrap text-slate-700 leading-relaxed">{activeReport.sections.normativeReferences}</pre>
            </div>

            <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200/80 space-y-1.5">
              <h3 className="font-bold text-slate-900 text-sm">4. Matériaux & Lots Expérimentaux</h3>
              <pre className="font-sans whitespace-pre-wrap text-slate-700 leading-relaxed">{activeReport.sections.materialsAndBatches}</pre>
            </div>

            <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200/80 space-y-1.5">
              <h3 className="font-bold text-slate-900 text-sm">5. Définition & Préparation des Éprouvettes</h3>
              <pre className="font-sans whitespace-pre-wrap text-slate-700 leading-relaxed">{activeReport.sections.panelsDefinition}</pre>
            </div>

            <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200/80 space-y-1.5">
              <h3 className="font-bold text-slate-900 text-sm">6. Calendrier d'Exposition (13 Étapes normalisées)</h3>
              <pre className="font-sans whitespace-pre-wrap text-slate-700 leading-relaxed">{activeReport.sections.exposureSchedule}</pre>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200/80 space-y-1.5">
                <h3 className="font-bold text-slate-900 text-sm">7. Résultats Couleur (ΔE*)</h3>
                <pre className="font-sans whitespace-pre-wrap text-slate-700 leading-relaxed">{activeReport.sections.colorResults}</pre>
              </div>

              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200/80 space-y-1.5">
                <h3 className="font-bold text-slate-900 text-sm">8. Résultats Brillance (60°)</h3>
                <pre className="font-sans whitespace-pre-wrap text-slate-700 leading-relaxed">{activeReport.sections.glossResults}</pre>
              </div>

              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200/80 space-y-1.5">
                <h3 className="font-bold text-slate-900 text-sm">9. Dureté Persoz (Labo)</h3>
                <pre className="font-sans whitespace-pre-wrap text-slate-700 leading-relaxed">{activeReport.sections.persozResults}</pre>
              </div>
            </div>

            <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200/80 space-y-1.5">
              <h3 className="font-bold text-slate-900 text-sm">10. Traçabilité du Calcul & Moteur Scientifique</h3>
              <pre className="font-sans whitespace-pre-wrap text-slate-700 leading-relaxed">{activeReport.sections.calculationTraceability}</pre>
            </div>

            <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200/80 space-y-1.5">
              <h3 className="font-bold text-slate-900 text-sm">11. Adaptations de Protocole & Dérogations</h3>
              <pre className="font-sans whitespace-pre-wrap text-slate-700 leading-relaxed">{activeReport.sections.deviationsAndAdaptations}</pre>
            </div>

            {/* Section 23 : Conclusion Factuelle Obligatoire */}
            <div className="p-5 bg-blue-50/50 rounded-2xl border-2 border-blue-200 space-y-2">
              <h3 className="font-black text-blue-950 text-sm uppercase tracking-wider">
                CONCLUSION FACTUELLE SCIENTIFIQUE
              </h3>
              <div className="text-slate-800 leading-relaxed font-medium whitespace-pre-wrap">
                {activeReport.sections.factualConclusion}
              </div>
            </div>
          </div>

          {/* 4. ANNEXES STRUCTURÉES (A à F) */}
          <div className="border-t border-slate-200 pt-6 space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Annexes Techniques du Rapport
            </h3>

            <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
              {(['A', 'B', 'C', 'D', 'E', 'F'] as const).map((anx) => (
                <button
                  key={anx}
                  type="button"
                  onClick={() => setActiveAnnexTab(anx)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg ${
                    activeAnnexTab === anx ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  Annexe {anx}
                </button>
              ))}
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 whitespace-pre-wrap">
              {activeAnnexTab === 'A' && activeReport.annexes.annexA_RawDataSummary}
              {activeAnnexTab === 'B' && activeReport.annexes.annexB_ComputedResultsSummary}
              {activeAnnexTab === 'C' && activeReport.annexes.annexC_QualityAssessmentSummary}
              {activeAnnexTab === 'D' && activeReport.annexes.annexD_ProtocolAdaptationsSummary}
              {activeAnnexTab === 'E' && activeReport.annexes.annexE_AuditTrailSummary}
              {activeAnnexTab === 'F' && activeReport.annexes.annexF_ScientificVersionSummary}
            </div>
          </div>

          {/* 5. ESPACE REVUE SCIENTIFIQUE & COMMENTAIRES (Section 34) */}
          <div className="border-t border-slate-200 pt-6 space-y-4 print:hidden">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                Revue Scientifique & Approbation du Rapport
              </h3>

              <div className="flex items-center gap-2">
                {activeReport.status !== 'APPROVED' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus('REVIEWED')}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-bold text-xs rounded-xl border border-indigo-200"
                    >
                      Marquer comme Revue (REVIEWED)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus('APPROVED')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
                    >
                      Approuver le Rapport (APPROVED)
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Liste des commentaires de revue */}
            {activeReport.reviewComments && activeReport.reviewComments.length > 0 && (
              <div className="space-y-2">
                {activeReport.reviewComments.map((com) => (
                  <div key={com.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span className="font-bold text-slate-800">
                        {com.author} — <span className="text-blue-700 font-mono">[{com.category}]</span>
                      </span>
                      <span>{new Date(com.createdAt).toLocaleString('fr-FR')}</span>
                    </div>
                    <p className="text-slate-700 font-medium">{com.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Formulaire d'ajout de commentaire */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <select
                value={reviewCategory}
                onChange={(e) => setReviewCategory(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 shrink-0"
              >
                <option value="GENERAL">Général</option>
                <option value="ANOMALY">Anomalie</option>
                <option value="PROTOCOL">Protocole</option>
                <option value="CALCULATION">Calcul</option>
                <option value="CONCLUSION">Conclusion</option>
              </select>

              <input
                type="text"
                placeholder="Ajouter une remarque d'expertise ou commentaire de revue scientifique..."
                value={reviewCommentText}
                onChange={(e) => setReviewCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                className="grow bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />

              <button
                type="button"
                onClick={handleAddComment}
                disabled={!reviewCommentText.trim()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Commenter
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 space-y-3">
          <FileText className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Aucun rapport scientifique émis</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Cliquez sur le bouton « Générer le Rapport Scientifique » pour auditer l'essai et produire le rapport complet v1.0.
          </p>
        </div>
      )}
    </div>
  );
}
