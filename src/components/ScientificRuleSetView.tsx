import React from 'react';
import { ScientificRuleSet } from '../types/scientific';
import { BookOpen, ShieldCheck, CheckCircle2, AlertTriangle, Layers, Info } from 'lucide-react';

interface Props {
  ruleSet: ScientificRuleSet;
}

export const ScientificRuleSetView: React.FC<Props> = ({ ruleSet }) => {
  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                {ruleSet.status === 'VERIFIED' ? 'Référentiel Actif & Validé' : 'À Confirmer'}
              </span>
              <span className="text-xs text-slate-500 font-mono">v{ruleSet.version}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              Référentiel Scientifique : {ruleSet.standardReference}
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
              {ruleSet.sourceReference}
            </p>
          </div>
          <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200 shrink-0">
            <div><strong className="text-slate-700">Validé par :</strong> {ruleSet.validatedBy}</div>
            <div><strong className="text-slate-700">Date d'effet :</strong> 2018 (Révision Moteur 2026)</div>
          </div>
        </div>
      </div>

      {/* 5-Levels Explanation Banner */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
        <h3 className="text-sm font-bold text-indigo-950 flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-indigo-600" />
          Principe Cardinal : Les 5 Niveaux Indépendants de QUV-Lab & Origines de Règles (v1.2)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-xs">
            <div className="font-bold text-slate-900 mb-1">1. RAW DATA</div>
            <p className="text-slate-600 leading-relaxed">
              Source de vérité physique. <strong>Strictement immuable</strong> après saisie, jamais écrasée.
            </p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-xs">
            <div className="font-bold text-slate-900 mb-1">2. VALIDITÉ</div>
            <p className="text-slate-600 leading-relaxed">
              VALID, SUSPECT, INVALID, MISSING. Détection des NaN et bornes physiques.
            </p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-xs">
            <div className="font-bold text-slate-900 mb-1">3. QUALITÉ RELEVÉ</div>
            <p className="text-slate-600 leading-relaxed">
              GOOD, ACCEPTABLE, WARNING, INVALID. Complétude et répétabilité intra-série.
            </p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-xs">
            <div className="font-bold text-slate-900 mb-1">4. PROTOCOLE</div>
            <p className="text-slate-600 leading-relaxed">
              STANDARD vs ADAPTED_JUSTIFIED. Toute déviation requiert justification traçable.
            </p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-xs">
            <div className="font-bold text-slate-900 mb-1">5. CONFORMITÉ NORME</div>
            <p className="text-slate-600 leading-relaxed">
              NON ÉVALUÉE dans le moteur pur. Séparée rigoureusement du protocole adapté.
            </p>
          </div>
        </div>
      </div>

      {/* 4 Origins Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Typologie des 4 Origines de Règles Scientifiques (PROMPT 5 v1.2)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="font-bold text-blue-900 block mb-1">NORMATIVE_REQUIREMENT</span>
            <p className="text-blue-700 leading-relaxed">
              Prescription obligatoire de la norme (ex : NF EN 927-6 clauses 6.3.2 & 6.3.3).
            </p>
          </div>
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <span className="font-bold text-purple-900 block mb-1">LAB_RECOMMENDATION</span>
            <p className="text-purple-700 leading-relaxed">
              Recommandation ou procédure interne du laboratoire (ex : Persoz 3 reps, ISO 1522).
            </p>
          </div>
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <span className="font-bold text-emerald-900 block mb-1">METROLOGICAL_CHOICE</span>
            <p className="text-emerald-700 leading-relaxed">
              Choix méthodologique métrologique (ex : Écart-type échantillon n-1, seuil dispersion 15%).
            </p>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <span className="font-bold text-amber-900 block mb-1">PROTOCOL_ADAPTATION</span>
            <p className="text-amber-700 leading-relaxed">
              Adaptation locale configurée par l'opérateur nécessitant justification obligatoire.
            </p>
          </div>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Color Rules */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                Famille Couleur (L*a*b*)
              </h4>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800">
                NORMATIVE_REQUIREMENT
              </span>
            </div>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Norme & Clause :</span>
                <span className="font-bold text-slate-800">NF EN 927-6 § 6.3.2</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Relevés par panneau :</span>
                <span className="font-bold text-slate-800">4 points répartis</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Illuminant / Observateur :</span>
                <span className="font-medium text-slate-800">D65 / 10°</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Géométrie optique :</span>
                <span className="font-medium text-slate-800">45°/0° (ou d/8°)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Formule ΔE* :</span>
                <span className="font-medium text-slate-800">CIE 1976 ΔE*ab</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Écart-type L* max toléré :</span>
                <span className="font-medium text-slate-800">{ruleSet.statisticalRules.maxColorStdDev ?? 2.0}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 p-2.5 bg-blue-50/70 rounded-lg text-[11px] text-blue-900">
            Adaptable à 2 points avec <strong>justification obligatoire tracée</strong>.
          </div>
        </div>

        {/* Gloss Rules */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                Famille Brillance (GU)
              </h4>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800">
                NORMATIVE_REQUIREMENT
              </span>
            </div>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Norme & Clause :</span>
                <span className="font-bold text-slate-800">NF EN 927-6 § 6.3.3</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Organisation standard :</span>
                <span className="font-bold text-slate-800">2 × 2 = 4 relevés / panneau</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Orientations :</span>
                <span className="font-medium text-slate-800">Sens fil + Perpendiculaire</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Géométrie standard :</span>
                <span className="font-medium text-slate-800">60° (ISO 2813)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Indicateur clé :</span>
                <span className="font-medium text-slate-800">Taux de rétention (%)</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Seuil dispersion max :</span>
                <span className="font-medium text-slate-800">{ruleSet.statisticalRules.maxGlossDispersionPercent ?? 15}%</span>
              </div>
            </div>
          </div>
          <div className="mt-4 p-2.5 bg-amber-50/70 rounded-lg text-[11px] text-amber-900">
            Structure adaptable à 2 × 1 avec <strong>justification obligatoire tracée</strong>.
          </div>
        </div>

        {/* Persoz Rules */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                Dureté Persoz (Secondes)
              </h4>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-800">
                LAB_RECOMMENDATION
              </span>
            </div>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Norme support :</span>
                <span className="font-bold text-slate-800">NF EN ISO 1522 (Méthode B)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Répétitions par panneau :</span>
                <span className="font-bold text-slate-800">3 répétitions (Procédure Labo)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Statut d'intégration :</span>
                <span className="font-medium text-slate-800">Complément R&D</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Indicateurs calculés :</span>
                <span className="font-medium text-slate-800">Moyenne, s, CoV %</span>
              </div>
              <div className="flex justify-between py-1">
                <span>NF EN 927-6 obligatoire :</span>
                <span className="font-semibold text-rose-600">Non (procédure interne)</span>
              </div>
            </div>
          </div>
          <div className="mt-4 p-2.5 bg-purple-50/70 rounded-lg text-[11px] text-purple-900">
            Traçabilité explicite comme <strong>LAB_RECOMMENDATION</strong>.
          </div>
        </div>
      </div>
    </div>
  );
};
