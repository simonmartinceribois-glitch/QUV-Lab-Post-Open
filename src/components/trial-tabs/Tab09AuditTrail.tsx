/**
 * QUV-Lab — 09 Historique & Journal d'Audit (PROMPT 6 - Section 21)
 * Journal d'audit complet immuable (append-only) de toutes les actions métrologiques et administratives.
 */

import React, { useState } from 'react';
import { Trial, AuditEvent } from '../../types/trial';
import {
  History,
  ShieldCheck,
  Search,
  Filter,
  Lock,
  Ban,
  CheckCircle2,
  FileText,
  User,
  Calendar,
  AlertTriangle
} from 'lucide-react';

interface Props {
  trial: Trial;
}

export function Tab09AuditTrail({ trial }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('ALL');

  const filteredEvents = trial.auditTrail
    .filter((ev) => {
      if (filterAction !== 'ALL' && ev.action !== filterAction) return false;
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        ev.action.toLowerCase().includes(term) ||
        ev.operatorId.toLowerCase().includes(term) ||
        ev.entityType.toLowerCase().includes(term) ||
        JSON.stringify(ev.details || {}).toLowerCase().includes(term)
      );
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Journal d'Audit Métrologique (Append-Only)</h3>
            <span className="px-2 py-0.5 text-xs font-mono font-bold rounded-md bg-blue-100 text-blue-800">
              {trial.auditTrail.length} événements tracés
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Traçabilité intégrale de l'ensemble des créations, exclusions, verrouillages, saisies et validations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Registre Immuable
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par opérateur, action, entité, motif..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="text-xs font-semibold px-3 py-1.5 bg-white border border-slate-300 rounded-xl"
        >
          <option value="ALL">Toutes les actions</option>
          <option value="CREATE_TRIAL">CREATE_TRIAL</option>
          <option value="LOCK_TRIAL_CONFIGURATION">LOCK_TRIAL_CONFIGURATION</option>
          <option value="EXCLUDE_PANEL">EXCLUDE_PANEL</option>
          <option value="RECORD_ACQUISITION">RECORD_ACQUISITION</option>
          <option value="MODIFY_MEASUREMENT_CONFIG">MODIFY_MEASUREMENT_CONFIG</option>
          <option value="VALIDATE_STAGE">VALIDATE_STAGE</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <th className="py-3 px-4 text-left">Horodatage (UTC)</th>
                <th className="py-3 px-4 text-left">Action</th>
                <th className="py-3 px-4 text-left">Entité</th>
                <th className="py-3 px-4 text-left">Opérateur</th>
                <th className="py-3 px-4 text-left">Détails & Motifs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredEvents.map((ev) => {
                const isLock = ev.action.includes('LOCK');
                const isExclude = ev.action.includes('EXCLUDE');
                const isAdapt = ev.action.includes('MODIFY') || ev.action.includes('ADAPT');
                const isVal = ev.action.includes('VALIDATE');

                return (
                  <tr key={ev.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(ev.timestamp).toLocaleString('fr-FR')}
                    </td>
                    <td className="py-2.5 px-4 font-bold whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] ${
                          isLock
                            ? 'bg-amber-100 text-amber-800'
                            : isExclude
                            ? 'bg-rose-100 text-rose-800'
                            : isAdapt
                            ? 'bg-purple-100 text-purple-800'
                            : isVal
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {ev.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 font-sans whitespace-nowrap">
                      {ev.entityType} ({ev.entityId?.slice(0, 8)}...)
                    </td>
                    <td className="py-2.5 px-4 font-sans text-slate-800 font-bold whitespace-nowrap">
                      {ev.operatorId}
                    </td>
                    <td className="py-2.5 px-4 font-sans text-slate-700">
                      {typeof ev.details === 'object' ? (
                        <div className="space-y-0.5">
                          {Object.entries(ev.details || {}).map(([k, v]) => (
                            <div key={k} className="text-[11px]">
                              <span className="text-slate-400 font-mono">{k} : </span>
                              <strong className="text-slate-800">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</strong>
                            </div>
                          ))}
                        </div>
                      ) : (
                        String(ev.details)
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
