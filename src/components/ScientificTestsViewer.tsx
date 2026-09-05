import React, { useState, useEffect } from 'react';
import { runAllScientificTests, TestResult } from '../scientific/tests/scientificEngine.test';
import { CheckCircle2, XCircle, Play, ShieldAlert, Filter, Info } from 'lucide-react';

export const ScientificTestsViewer: React.FC = () => {
  const [testOutput, setTestOutput] = useState<{
    results: TestResult[];
    summary: { total: number; passed: number; failed: number };
  } | null>(null);

  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const executeTests = () => {
    const res = runAllScientificTests();
    setTestOutput(res);
  };

  useEffect(() => {
    executeTests();
  }, []);

  if (!testOutput) return null;

  const categories = ['ALL', ...Array.from(new Set(testOutput.results.map((r) => r.category)))];

  const filteredResults =
    filterCategory === 'ALL'
      ? testOutput.results
      : testOutput.results.filter((r) => r.category === filterCategory);

  return (
    <div className="space-y-6">
      {/* Header with Run Button & Summary */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Suite de Validation Métrologique (PROMPT 5 — {testOutput.summary.total} Tests)
          </h3>
          <p className="text-xs text-slate-600 mt-1">
            Contrôle automatique du déterminisme, de la séparation des 5 niveaux, des alertes de géométrie et de l'immuabilité de RAW.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
            <span className="font-bold text-emerald-600">
              {testOutput.summary.passed} / {testOutput.summary.total} RÉUSSIS
            </span>
            {testOutput.summary.failed > 0 && (
              <span className="font-bold text-rose-600">({testOutput.summary.failed} ÉCHECS)</span>
            )}
          </div>
          <button
            onClick={executeTests}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Ré-exécuter la Suite
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1.5 text-xs">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterCategory === cat
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cat === 'ALL' ? `Tous les tests (${testOutput.results.length})` : cat}
          </button>
        ))}
      </div>

      {/* Tests Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="divide-y divide-slate-100">
          {filteredResults.map((t) => (
            <div key={t.id} className="p-4 hover:bg-slate-50/70 transition-colors flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                {t.passed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-400">TEST {t.id}</span>
                  <span className="font-bold text-xs text-slate-900">{t.name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                    {t.category}
                  </span>
                </div>
                <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-slate-500">
                  <div>
                    <strong className="text-slate-700">Attendu :</strong> {t.expected}
                  </div>
                  <div>
                    <strong className="text-slate-700">Obtenu :</strong> {t.actual}
                  </div>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <span
                  className={`px-2 py-1 rounded text-[10px] font-bold ${
                    t.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {t.passed ? 'SUCCÈS' : 'ÉCHEC'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
