import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { MeasurementFamilyId, MeasurementCountConfiguration, MeasurementSeriesConfiguration } from '../types/scientific';

interface Props {
  familyId: MeasurementFamilyId;
  familyName: string;
  standardReference: string;
  standardValueText: string;
  configuredValueText: string;
  deviationDescription: string;
  currentJustification?: string;
  operatorId: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (justification: string) => void;
}

export const ProtocolAdaptationModal: React.FC<Props> = ({
  familyId,
  familyName,
  standardReference,
  standardValueText,
  configuredValueText,
  deviationDescription,
  currentJustification = '',
  operatorId,
  isOpen,
  onClose,
  onConfirm
}) => {
  const [justification, setJustification] = useState(currentJustification);

  if (!isOpen) return null;

  const isValid = justification.trim().length >= 5;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-amber-200 overflow-hidden">
        {/* Header */}
        <div className="bg-amber-500 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-100" />
            <h3 className="font-bold text-base">⚠ PROTOCOLE ADAPTÉ — {familyName.toUpperCase()}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white rounded-lg p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          <p className="text-slate-700 leading-relaxed">
            La configuration choisie diffère du protocole de référence standard. Pour garantir la traçabilité métrologique, toute adaptation doit être explicitement justifiée.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Référence Normative / Règle :</span>
              <span className="font-bold text-slate-800">{standardReference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Valeur recommandée par défaut :</span>
              <span className="font-bold text-slate-800">{standardValueText}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Valeur configurée pour cet essai :</span>
              <span className="font-bold text-amber-700">{configuredValueText}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200">
              <span className="text-slate-500 font-medium">Écart métrologique :</span>
              <span className="font-semibold text-slate-700">{deviationDescription}</span>
            </div>
          </div>

          {/* Mandatory Justification Input */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-800 flex items-center justify-between">
              <span>JUSTIFICATION TECHNIQUE OBLIGATOIRE :</span>
              <span className={`text-[11px] font-normal ${isValid ? 'text-emerald-600' : 'text-amber-600'}`}>
                {isValid ? 'Justification valide' : 'Min. 5 caractères requis'}
              </span>
            </label>
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Ex : Étude exploratoire R&D préliminaire — réduction convenue selon le plan d'échantillonnage client."
              rows={3}
              className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white placeholder:text-slate-400"
            />
          </div>

          {/* Trace Info */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <div><strong>Opérateur :</strong> {operatorId}</div>
            <div><strong>Horodatage :</strong> {new Date().toLocaleTimeString()}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Annuler / Rétablir Standard
          </button>
          <button
            type="button"
            disabled={!isValid}
            onClick={() => {
              if (isValid) {
                onConfirm(justification.trim());
              }
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
              isValid
                ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Valider l'Adaptation Justifiée
          </button>
        </div>
      </div>
    </div>
  );
};
