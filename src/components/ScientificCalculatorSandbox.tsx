import React, { useState } from 'react';
import {
  getDefaultScientificRuleSet,
  createCountConfiguration,
  createSeriesConfiguration
} from '../scientific/ruleSet';
import { calculateColor } from '../scientific/colorEngine';
import { calculateGloss } from '../scientific/glossEngine';
import { calculatePersoz } from '../scientific/persozEngine';
import { ProtocolAdaptationModal } from './ProtocolAdaptationModal';
import {
  ColorRawData,
  GlossRawData,
  PersozRawData,
  ScientificRuleSet
} from '../types/scientific';
import {
  Calculator,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Info
} from 'lucide-react';

interface Props {
  ruleSet: ScientificRuleSet;
}

export const ScientificCalculatorSandbox: React.FC<Props> = ({ ruleSet }) => {
  const [activeTab, setActiveTab] = useState<'COLOR' | 'GLOSS' | 'PERSOZ'>('COLOR');

  // --- COLOR STATE ---
  const [colorCount, setColorCount] = useState<number>(4);
  const [colorJustification, setColorJustification] = useState<string>('');
  const [isColorModalOpen, setIsColorModalOpen] = useState<boolean>(false);

  const [colorT0, setColorT0] = useState<{ L: string; a: string; b: string }[]>([
    { L: '50.2', a: '1.2', b: '-0.4' },
    { L: '50.4', a: '1.1', b: '-0.3' },
    { L: '50.1', a: '1.3', b: '-0.5' },
    { L: '50.3', a: '1.2', b: '-0.4' }
  ]);

  const [colorTt, setColorTt] = useState<{ L: string; a: string; b: string }[]>([
    { L: '53.2', a: '2.5', b: '3.6' },
    { L: '53.5', a: '2.4', b: '3.8' },
    { L: '53.1', a: '2.6', b: '3.5' },
    { L: '53.4', a: '2.5', b: '3.7' }
  ]);

  // --- GLOSS STATE ---
  const [glossSeriesCount, setGlossSeriesCount] = useState<number>(2);
  const [glossReadingsPerSeries, setGlossReadingsPerSeries] = useState<number>(2);
  const [glossJustification, setGlossJustification] = useState<string>('');
  const [isGlossModalOpen, setIsGlossModalOpen] = useState<boolean>(false);
  const [glossGeometry, setGlossGeometry] = useState<'60' | '20' | '85'>('60');

  const [glossT0, setGlossT0] = useState<string[][]>([
    ['42.5', '43.0'],
    ['41.8', '42.2']
  ]);

  const [glossTt, setGlossTt] = useState<string[][]>([
    ['28.4', '29.1'],
    ['27.9', '28.5']
  ]);

  // --- PERSOZ STATE ---
  const [persozCount, setPersozCount] = useState<number>(3);
  const [persozJustification, setPersozJustification] = useState<string>('');
  const [isPersozModalOpen, setIsPersozModalOpen] = useState<boolean>(false);

  const [persozT0, setPersozT0] = useState<string[]>(['142', '145', '144']);
  const [persozTt, setPersozTt] = useState<string[]>(['118', '120', '119']);

  // =========================================================================
  // EXÉCUTION DU MOTEUR SCIENTIFIQUE
  // =========================================================================

  // 1. Calcul Couleur
  const colorConfig = createCountConfiguration('COLOR', colorCount, ruleSet, {
    justification: colorJustification,
    operatorId: 'S. Martin'
  });

  const rawColorT0: ColorRawData = {
    readings: colorT0.slice(0, colorCount).map((pt, idx) => ({
      pointIndex: idx + 1,
      L: pt.L === '' ? null : Number(pt.L),
      a: pt.a === '' ? null : Number(pt.a),
      b: pt.b === '' ? null : Number(pt.b)
    }))
  };

  const rawColorTt: ColorRawData = {
    readings: colorTt.slice(0, colorCount).map((pt, idx) => ({
      pointIndex: idx + 1,
      L: pt.L === '' ? null : Number(pt.L),
      a: pt.a === '' ? null : Number(pt.a),
      b: pt.b === '' ? null : Number(pt.b)
    }))
  };

  const colorResult = calculateColor(rawColorTt, colorConfig, ruleSet, {
    referenceRaw: rawColorT0,
    referenceStageId: 'stage-t0-uuid'
  });

  // 2. Calcul Brillance
  const glossConfig = createSeriesConfiguration(
    'GLOSS',
    glossSeriesCount,
    glossReadingsPerSeries,
    ruleSet,
    {
      justification: glossJustification,
      operatorId: 'S. Martin'
    }
  );

  const rawGlossT0: GlossRawData = {
    series: glossT0.slice(0, glossSeriesCount).map((s, sIdx) => ({
      seriesIndex: sIdx + 1,
      orientation: sIdx === 0 ? 'Sens du fil' : 'Perpendiculaire',
      readings: s.slice(0, glossReadingsPerSeries).map((v, rIdx) => ({
        pointIndex: rIdx + 1,
        value: v === '' ? null : Number(v)
      }))
    })),
    instrumentMetadata: { geometry: glossGeometry }
  };

  const rawGlossTt: GlossRawData = {
    series: glossTt.slice(0, glossSeriesCount).map((s, sIdx) => ({
      seriesIndex: sIdx + 1,
      orientation: sIdx === 0 ? 'Sens du fil' : 'Perpendiculaire',
      readings: s.slice(0, glossReadingsPerSeries).map((v, rIdx) => ({
        pointIndex: rIdx + 1,
        value: v === '' ? null : Number(v)
      }))
    })),
    instrumentMetadata: { geometry: glossGeometry }
  };

  const glossResult = calculateGloss(rawGlossTt, glossConfig, ruleSet, {
    referenceRaw: rawGlossT0,
    referenceStageId: 'stage-t0-uuid'
  });

  // 3. Calcul Persoz
  const persozConfig = createCountConfiguration('PERSOZ', persozCount, ruleSet, {
    justification: persozJustification,
    operatorId: 'S. Martin'
  });

  const rawPersozT0: PersozRawData = {
    unit: 'SECONDS',
    readings: persozT0.slice(0, persozCount).map((v, idx) => ({
      pointIndex: idx + 1,
      dampingTimeSeconds: v === '' ? null : Number(v)
    }))
  };

  const rawPersozTt: PersozRawData = {
    unit: 'SECONDS',
    readings: persozTt.slice(0, persozCount).map((v, idx) => ({
      pointIndex: idx + 1,
      dampingTimeSeconds: v === '' ? null : Number(v)
    }))
  };

  const persozResult = calculatePersoz(rawPersozTt, persozConfig, ruleSet, {
    referenceRaw: rawPersozT0,
    referenceStageId: 'stage-t0-uuid'
  });

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('COLOR')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'COLOR'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
          Paillasse Couleur (NF EN 927-6)
        </button>
        <button
          onClick={() => setActiveTab('GLOSS')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'GLOSS'
              ? 'border-amber-600 text-amber-600 bg-amber-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          Paillasse Brillance (2×2 vs 2×1)
        </button>
        <button
          onClick={() => setActiveTab('PERSOZ')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'PERSOZ'
              ? 'border-purple-600 text-purple-600 bg-purple-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
          Paillasse Dureté Persoz (Règle Labo)
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. ONGLET COULEUR */}
      {/* ========================================================================= */}
      {activeTab === 'COLOR' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls & Inputs */}
          <div className="lg:col-span-7 space-y-4">
            {/* Protocol Setting Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Plan de Mesure Couleur</h3>
                  <p className="text-xs text-slate-500">
                    Norme : <strong>4 points</strong> / panneau. Adaptable à 2 points avec justification.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setColorCount(4);
                      setColorJustification('');
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      colorCount === 4
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    4 pts (Standard)
                  </button>
                  <button
                    onClick={() => {
                      if (colorCount !== 2) {
                        setIsColorModalOpen(true);
                      }
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      colorCount === 2
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    2 pts (Adapté)
                  </button>
                </div>
              </div>

              {colorConfig.deviationFromStandard && (
                <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-bold text-amber-900">Protocole Adapté Actif</div>
                    <div className="text-amber-800 italic">"{colorConfig.justification}"</div>
                    <button
                      onClick={() => setIsColorModalOpen(true)}
                      className="text-[11px] text-amber-700 underline font-semibold mt-1"
                    >
                      Modifier la justification
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Inputs Table */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <h4 className="font-bold text-xs text-slate-800 mb-3 flex items-center justify-between">
                <span>Saisie des Relevés Colorimétriques (CIE L*a*b*)</span>
                <span className="text-[11px] text-slate-500 font-normal">Illuminant D65 / Obs. 10°</span>
              </h4>

              <div className="grid grid-cols-2 gap-4">
                {/* T0 Readings */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-700 bg-slate-100 p-2 rounded-lg text-center">
                    Étape T0 (Avant Expo, 0 h)
                  </div>
                  {colorT0.slice(0, colorCount).map((pt, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-xs">
                      <span className="w-6 font-bold text-slate-500">P{idx + 1}</span>
                      <input
                        type="number"
                        value={pt.L}
                        onChange={(e) => {
                          const next = [...colorT0];
                          next[idx].L = e.target.value;
                          setColorT0(next);
                        }}
                        placeholder="L*"
                        className="w-full p-1.5 border rounded text-xs text-center"
                      />
                      <input
                        type="number"
                        value={pt.a}
                        onChange={(e) => {
                          const next = [...colorT0];
                          next[idx].a = e.target.value;
                          setColorT0(next);
                        }}
                        placeholder="a*"
                        className="w-full p-1.5 border rounded text-xs text-center"
                      />
                      <input
                        type="number"
                        value={pt.b}
                        onChange={(e) => {
                          const next = [...colorT0];
                          next[idx].b = e.target.value;
                          setColorT0(next);
                        }}
                        placeholder="b*"
                        className="w-full p-1.5 border rounded text-xs text-center"
                      />
                    </div>
                  ))}
                </div>

                {/* Tt Readings */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-blue-900 bg-blue-50 p-2 rounded-lg text-center">
                    Étape C6 (1008 h Exposition)
                  </div>
                  {colorTt.slice(0, colorCount).map((pt, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-xs">
                      <span className="w-6 font-bold text-blue-600">P{idx + 1}</span>
                      <input
                        type="number"
                        value={pt.L}
                        onChange={(e) => {
                          const next = [...colorTt];
                          next[idx].L = e.target.value;
                          setColorTt(next);
                        }}
                        placeholder="L*"
                        className="w-full p-1.5 border rounded text-xs text-center font-semibold text-blue-900"
                      />
                      <input
                        type="number"
                        value={pt.a}
                        onChange={(e) => {
                          const next = [...colorTt];
                          next[idx].a = e.target.value;
                          setColorTt(next);
                        }}
                        placeholder="a*"
                        className="w-full p-1.5 border rounded text-xs text-center font-semibold text-blue-900"
                      />
                      <input
                        type="number"
                        value={pt.b}
                        onChange={(e) => {
                          const next = [...colorTt];
                          next[idx].b = e.target.value;
                          setColorTt(next);
                        }}
                        placeholder="b*"
                        className="w-full p-1.5 border rounded text-xs text-center font-semibold text-blue-900"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-blue-600" />
                  Résultats Moteur Scientifique
                </h3>
                <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                  v{colorResult.computed.computation.calculationVersion}
                </span>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    colorResult.computed.protocolStatus === 'STANDARD'
                      ? 'bg-blue-100 text-blue-800'
                      : colorResult.computed.protocolStatus === 'ADAPTED_JUSTIFIED'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  Protocole : {colorResult.computed.protocolStatus}
                </span>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    colorResult.computed.qualityAssessment.status === 'GOOD'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  Qualité : {colorResult.computed.qualityAssessment.status} (
                  {colorResult.computed.validCount}/{colorResult.computed.pointsCount})
                </span>
              </div>

              {/* Key Scientific Derivations */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div className="text-center p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
                  <div className="text-xs text-slate-500 font-medium">Écart Global de Couleur (CIE 1976)</div>
                  <div className="text-3xl font-extrabold text-blue-600 mt-1">
                    ΔE*<sub>ab</sub> = {colorResult.computed.deltaE ?? '—'}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <div className="text-slate-500">ΔL* (Clarté)</div>
                    <div className="font-bold text-slate-900 mt-0.5">{colorResult.computed.deltaL ?? '—'}</div>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <div className="text-slate-500">Δa* (Axe R/V)</div>
                    <div className="font-bold text-slate-900 mt-0.5">{colorResult.computed.deltaA ?? '—'}</div>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <div className="text-slate-500">Δb* (Axe J/B)</div>
                    <div className="font-bold text-slate-900 mt-0.5">{colorResult.computed.deltaB ?? '—'}</div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-3 text-xs space-y-1 text-slate-600">
                  <div className="flex justify-between">
                    <span>Moyenne L* / a* / b* (Tt) :</span>
                    <span className="font-semibold text-slate-800">
                      {colorResult.computed.meanL} / {colorResult.computed.meanA} / {colorResult.computed.meanB}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Écart-type L* (intra-panneau) :</span>
                    <span className="font-semibold text-slate-800">s = {colorResult.computed.stdDevL ?? '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Chroma C* / Hue h* :</span>
                    <span className="font-semibold text-slate-800">
                      {colorResult.computed.chromaC ?? '—'} / {colorResult.computed.hueH ?? '—'}°
                    </span>
                  </div>
                </div>
              </div>

              {/* Alerts Log */}
              {colorResult.alerts.length > 0 && (
                <div className="space-y-1.5 text-xs">
                  <div className="font-bold text-slate-700">Messages & Alertes Moteur :</div>
                  {colorResult.alerts.map((al, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded text-[11px] flex items-start gap-1.5 ${
                        al.severity === 'BLOCKING'
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : al.severity === 'WARNING'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-blue-50 text-blue-800 border border-blue-200'
                      }`}
                    >
                      <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span><strong>[{al.code}]</strong> {al.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ONGLET BRILLANCE */}
      {/* ========================================================================= */}
      {activeTab === 'GLOSS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Structure de Mesure Brillance (60°)</h3>
                  <p className="text-xs text-slate-500">
                    Standard : <strong>2 × 2 = 4 relevés</strong> (sens fil & perpendiculaire).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setGlossSeriesCount(2);
                      setGlossReadingsPerSeries(2);
                      setGlossJustification('');
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      glossReadingsPerSeries === 2
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    2 × 2 (Standard)
                  </button>
                  <button
                    onClick={() => {
                      if (glossReadingsPerSeries !== 1) {
                        setIsGlossModalOpen(true);
                      }
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      glossReadingsPerSeries === 1
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    2 × 1 (Adapté)
                  </button>
                </div>
              </div>

              {/* Geometry Selector for testing mismatch */}
              <div className="mt-3 flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-lg">
                <span className="text-slate-600">Géométrie instrumentale utilisée :</span>
                <div className="flex items-center gap-2">
                  {(['60', '20', '85'] as const).map((geom) => (
                    <button
                      key={geom}
                      onClick={() => setGlossGeometry(geom)}
                      className={`px-2.5 py-1 rounded text-xs font-semibold ${
                        glossGeometry === geom
                          ? geom === '60'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-rose-600 text-white'
                          : 'bg-white border text-slate-700'
                      }`}
                    >
                      {geom}° {geom === '60' ? '(Standard)' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {glossConfig.deviationFromStandard && (
                <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-bold text-amber-900">Structure Brillance Adaptée</div>
                    <div className="text-amber-800 italic">"{glossConfig.justification}"</div>
                  </div>
                </div>
              )}
            </div>

            {/* Inputs Table */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <h4 className="font-bold text-xs text-slate-800 flex items-center justify-between">
                <span>Relevés de Brillance (GU)</span>
                <span className="text-[11px] text-slate-500 font-normal">ISO 2813 / 60°</span>
              </h4>

              <div className="grid grid-cols-2 gap-4">
                {/* T0 */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-700 bg-slate-100 p-2 rounded-lg text-center">
                    T0 (Initial, 0 h)
                  </div>
                  {glossT0.slice(0, glossSeriesCount).map((series, sIdx) => (
                    <div key={sIdx} className="space-y-1">
                      <div className="text-[11px] font-semibold text-slate-600">
                        {sIdx === 0 ? 'Sens du fil' : 'Perpendiculaire au fil'} :
                      </div>
                      <div className="flex gap-2">
                        {series.slice(0, glossReadingsPerSeries).map((val, rIdx) => (
                          <input
                            key={rIdx}
                            type="number"
                            value={val}
                            onChange={(e) => {
                              const next = glossT0.map((s) => [...s]);
                              next[sIdx][rIdx] = e.target.value;
                              setGlossT0(next);
                            }}
                            className="w-full p-2 border rounded text-xs text-center"
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tt */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-amber-900 bg-amber-50 p-2 rounded-lg text-center">
                    Étape C6 (1008 h)
                  </div>
                  {glossTt.slice(0, glossSeriesCount).map((series, sIdx) => (
                    <div key={sIdx} className="space-y-1">
                      <div className="text-[11px] font-semibold text-amber-900">
                        {sIdx === 0 ? 'Sens du fil' : 'Perpendiculaire au fil'} :
                      </div>
                      <div className="flex gap-2">
                        {series.slice(0, glossReadingsPerSeries).map((val, rIdx) => (
                          <input
                            key={rIdx}
                            type="number"
                            value={val}
                            onChange={(e) => {
                              const next = glossTt.map((s) => [...s]);
                              next[sIdx][rIdx] = e.target.value;
                              setGlossTt(next);
                            }}
                            className="w-full p-2 border rounded text-xs text-center font-bold text-amber-900"
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Gloss Results */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-amber-600" />
                  Rétention & Statistiques Brillance
                </h3>
                <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                  v{glossResult.computed.computation.calculationVersion}
                </span>
              </div>

              {/* Status */}
              <div className="flex flex-wrap gap-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                  Protocole : {glossResult.computed.protocolStatus}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  Qualité : {glossResult.computed.qualityAssessment.status} ({glossResult.computed.validCount}/{glossResult.computed.totalReadings})
                </span>
              </div>

              {/* Key Retention Box */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div className="text-center p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
                  <div className="text-xs text-slate-500 font-medium">Taux de Rétention de Brillance (%)</div>
                  <div className="text-3xl font-extrabold text-amber-600 mt-1">
                    {glossResult.computed.retentionRatePercent !== null
                      ? `${glossResult.computed.retentionRatePercent} %`
                      : 'Non calculable (T0 = 0)'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <div className="text-slate-500">Moyenne Tt</div>
                    <div className="font-bold text-slate-900 mt-0.5">{glossResult.computed.meanGloss} GU</div>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <div className="text-slate-500">Écart ΔBrillance</div>
                    <div className="font-bold text-slate-900 mt-0.5">{glossResult.computed.deltaGloss} GU</div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-3 text-xs space-y-1.5 text-slate-600">
                  <div className="font-bold text-slate-800 text-[11px]">Détail par Orientation :</div>
                  {glossResult.computed.seriesStats.map((st, idx) => (
                    <div key={idx} className="flex justify-between text-[11px] bg-white p-1.5 rounded border border-slate-100">
                      <span>{st.orientation} :</span>
                      <span className="font-semibold text-slate-800">
                        {st.mean} GU (s = {st.stdDev ?? '—'})
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alerts */}
              {glossResult.alerts.length > 0 && (
                <div className="space-y-1.5 text-xs">
                  <div className="font-bold text-slate-700">Messages & Alertes :</div>
                  {glossResult.alerts.map((al, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded text-[11px] flex items-start gap-1.5 ${
                        al.severity === 'BLOCKING'
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : al.severity === 'WARNING'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-blue-50 text-blue-800 border border-blue-200'
                      }`}
                    >
                      <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span><strong>[{al.code}]</strong> {al.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ONGLET PERSOZ */}
      {/* ========================================================================= */}
      {activeTab === 'PERSOZ' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900">Dureté Pendulaire Persoz</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                      RÈGLE LABORATOIRE (NF EN ISO 1522)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mesure complémentaire R&D. Standard labo : <strong>3 répétitions</strong>.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setPersozCount(3);
                      setPersozJustification('');
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      persozCount === 3
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    3 rép. (Standard Labo)
                  </button>
                  <button
                    onClick={() => {
                      if (persozCount !== 2) {
                        setIsPersozModalOpen(true);
                      }
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      persozCount === 2
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    2 rép. (Adapté)
                  </button>
                </div>
              </div>

              {persozConfig.deviationFromStandard && (
                <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-bold text-amber-900">Plan Persoz Adapté</div>
                    <div className="text-amber-800 italic">"{persozConfig.justification}"</div>
                  </div>
                </div>
              )}
            </div>

            {/* Inputs */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <h4 className="font-bold text-xs text-slate-800">
                Temps d'Amortissement Persoz (Secondes)
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-700 bg-slate-100 p-2 rounded-lg text-center">
                    T0 (Initial, 0 h)
                  </div>
                  {persozT0.slice(0, persozCount).map((val, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 w-6">R{idx + 1}</span>
                      <input
                        type="number"
                        value={val}
                        onChange={(e) => {
                          const next = [...persozT0];
                          next[idx] = e.target.value;
                          setPersozT0(next);
                        }}
                        className="w-full p-2 border rounded text-xs text-center"
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-purple-900 bg-purple-50 p-2 rounded-lg text-center">
                    Étape C6 (1008 h)
                  </div>
                  {persozTt.slice(0, persozCount).map((val, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-purple-600 w-6">R{idx + 1}</span>
                      <input
                        type="number"
                        value={val}
                        onChange={(e) => {
                          const next = [...persozTt];
                          next[idx] = e.target.value;
                          setPersozTt(next);
                        }}
                        className="w-full p-2 border rounded text-xs text-center font-bold text-purple-900"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Persoz Results */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-purple-600" />
                  Résultats Dureté Persoz
                </h3>
                <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                  v{persozResult.computed.computation.calculationVersion}
                </span>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div className="text-center p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
                  <div className="text-xs text-slate-500 font-medium">Temps d'Amortissement Moyen (Tt)</div>
                  <div className="text-3xl font-extrabold text-purple-600 mt-1">
                    {persozResult.computed.meanDampingTime} s
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <div className="text-slate-500">Écart-type s</div>
                    <div className="font-bold text-slate-900 mt-0.5">{persozResult.computed.stdDevDampingTime ?? '—'} s</div>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <div className="text-slate-500">CoV (%)</div>
                    <div className="font-bold text-slate-900 mt-0.5">{persozResult.computed.coefficientOfVariationPercent ?? '—'} %</div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-3 text-xs space-y-1 text-slate-600">
                  <div className="flex justify-between">
                    <span>Évolution absolue (Δs) :</span>
                    <span className="font-semibold text-slate-800">{persozResult.computed.deltaDampingTime ?? '—'} s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Variation relative :</span>
                    <span className="font-semibold text-slate-800">{persozResult.computed.relativeHardnessVariationPercent ?? '—'} %</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALES D'ADAPTATION DU PROTOCOLE */}
      {/* ========================================================================= */}
      <ProtocolAdaptationModal
        isOpen={isColorModalOpen}
        onClose={() => setIsColorModalOpen(false)}
        familyId="COLOR"
        familyName="Couleur"
        standardReference={ruleSet.standardReference}
        standardValueText="4 mesures par panneau (NF EN 927-6)"
        configuredValueText="2 mesures par panneau"
        deviationDescription="Réduction de 50% du plan d'échantillonnage"
        currentJustification={colorJustification}
        operatorId="S. Martin"
        onConfirm={(just) => {
          setColorCount(2);
          setColorJustification(just);
          setIsColorModalOpen(false);
        }}
      />

      <ProtocolAdaptationModal
        isOpen={isGlossModalOpen}
        onClose={() => setIsGlossModalOpen(false)}
        familyId="GLOSS"
        familyName="Brillance"
        standardReference="NF EN 927-6 / ISO 2813"
        standardValueText="2 × 2 = 4 relevés par panneau"
        configuredValueText="2 × 1 = 2 relevés par panneau"
        deviationDescription="1 seul relevé par orientation au lieu de 2"
        currentJustification={glossJustification}
        operatorId="S. Martin"
        onConfirm={(just) => {
          setGlossSeriesCount(2);
          setGlossReadingsPerSeries(1);
          setGlossJustification(just);
          setIsGlossModalOpen(false);
        }}
      />

      <ProtocolAdaptationModal
        isOpen={isPersozModalOpen}
        onClose={() => setIsPersozModalOpen(false)}
        familyId="PERSOZ"
        familyName="Dureté Persoz"
        standardReference="Procédure Interne Laboratoire"
        standardValueText="3 répétitions par panneau"
        configuredValueText="2 répétitions par panneau"
        deviationDescription="Allègement du nombre d'oscillations"
        currentJustification={persozJustification}
        operatorId="S. Martin"
        onConfirm={(just) => {
          setPersozCount(2);
          setPersozJustification(just);
          setIsPersozModalOpen(false);
        }}
      />
    </div>
  );
};
