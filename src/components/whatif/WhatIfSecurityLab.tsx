import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Sliders,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  Activity,
  CheckCircle2,
  Clock,
  Layers,
  Info,
  Play,
} from 'lucide-react';
import { WhatIfComparison, Scenario } from '../../types/cyber';
import { api } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

interface WhatIfSecurityLabProps {
  scenarios: Scenario[];
}

export const WhatIfSecurityLab: React.FC<WhatIfSecurityLabProps> = ({ scenarios }) => {
  const { isDark } = useTheme();
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(
    scenarios[0]?.id || 'SCENARIO-FINANCE-MIRAGE'
  );
  const [comparison, setComparison] = useState<WhatIfComparison | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [evaluating, setEvaluating] = useState<boolean>(false);

  const loadComparison = async (scenarioId: string) => {
    try {
      setLoading(true);
      const data = await api.compareWhatIf(scenarioId);
      setComparison(data);
    } catch (err) {
      console.error('Failed to load what-if comparison:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComparison(selectedScenarioId);
  }, [selectedScenarioId]);

  const handleRunEvaluation = async () => {
    setEvaluating(true);
    setTimeout(async () => {
      await loadComparison(selectedScenarioId);
      setEvaluating(false);
    }, 1200);
  };

  const chartData = comparison
    ? [
        {
          metric: 'Time to Alert (s)',
          Baseline: comparison.metrics.timeToFirstDecoySec.baseline,
          Augmented: comparison.metrics.timeToFirstDecoySec.augmented,
        },
        {
          metric: 'Decoys Tripped',
          Baseline: comparison.metrics.decoysEncountered.baseline,
          Augmented: comparison.metrics.decoysEncountered.augmented,
        },
        {
          metric: 'Coverage (%)',
          Baseline: comparison.metrics.detectionCoveragePercent.baseline,
          Augmented: comparison.metrics.detectionCoveragePercent.augmented,
        },
        {
          metric: 'Unmonitored Hops',
          Baseline: comparison.metrics.unmonitoredHops.baseline,
          Augmented: comparison.metrics.unmonitoredHops.augmented,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-cyan-50/70 via-white to-indigo-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-cyan-950/40 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60 uppercase font-semibold">
                What-If Security Lab
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Controlled Topology Comparative Benchmarking</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Deception Topology Comparative Evaluation</h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              Executes identical attack scenarios with matching random seeds against Configuration A (Baseline Network) versus Configuration B (Augmented Network with Adaptive Decoys) to measure concrete defensive gains.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedScenarioId}
              onChange={(e) => setSelectedScenarioId(e.target.value)}
              className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500 shadow-sm"
            >
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleRunEvaluation}
              disabled={evaluating}
              className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg flex items-center justify-center gap-2 text-xs font-semibold shadow-sm transition-colors whitespace-nowrap"
            >
              {evaluating ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  <span>Evaluating Scenarios...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Run Side-by-Side Test</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {loading || !comparison ? (
        <div className="flex items-center justify-center h-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-mono text-xs">
            <Activity className="w-4 h-4 text-cyan-600 dark:text-cyan-400 animate-spin" />
            <span>Calculating comparative metrics...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Comparative Metrics KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Time to First Decoy */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block mb-1">Time to First Alert</span>
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {comparison.metrics.timeToFirstDecoySec.augmented}s
                  </span>
                  <span className="text-xs line-through text-slate-400 dark:text-slate-500 font-mono tabular-nums">
                    {comparison.metrics.timeToFirstDecoySec.baseline}s
                  </span>
                </div>
                <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60 font-semibold">
                  -{comparison.metrics.timeToFirstDecoySec.improvementPct}%
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 border-t border-slate-100 dark:border-slate-800/80 pt-2">
                Adversary detected <strong>{comparison.metrics.timeToFirstDecoySec.improvementPct}% faster</strong> before pivoting.
              </p>
            </div>

            {/* KPI 2: Detection Coverage */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block mb-1">Detection Coverage</span>
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-cyan-600 dark:text-cyan-400 tabular-nums">
                    {comparison.metrics.detectionCoveragePercent.augmented}%
                  </span>
                  <span className="text-xs line-through text-slate-400 dark:text-slate-500 font-mono tabular-nums">
                    {comparison.metrics.detectionCoveragePercent.baseline}%
                  </span>
                </div>
                <span className="text-xs font-mono text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-800/60 font-semibold">
                  +{comparison.metrics.detectionCoveragePercent.diffPct}%
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 border-t border-slate-100 dark:border-slate-800/80 pt-2">
                Proportion of attack steps intercepted by tripwires.
              </p>
            </div>

            {/* KPI 3: Unmonitored Lateral Hops */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block mb-1">Unmonitored Blind Hops</span>
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-300 tabular-nums">
                    {comparison.metrics.unmonitoredHops.augmented}
                  </span>
                  <span className="text-xs line-through text-slate-400 dark:text-slate-500 font-mono tabular-nums">
                    {comparison.metrics.unmonitoredHops.baseline} hops
                  </span>
                </div>
                <span className="text-xs font-mono text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/80 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800/60 font-semibold">
                  -{comparison.metrics.unmonitoredHops.reductionPct}%
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 border-t border-slate-100 dark:border-slate-800/80 pt-2">
                Lateral steps completed without triggering a sensor.
              </p>
            </div>

            {/* KPI 4: Decoys Tripped */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block mb-1">Decoys Tripped</span>
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-300 tabular-nums">
                    {comparison.metrics.decoysEncountered.augmented}
                  </span>
                  <span className="text-xs line-through text-slate-400 dark:text-slate-500 font-mono tabular-nums">
                    {comparison.metrics.decoysEncountered.baseline} decoy
                  </span>
                </div>
                <span className="text-xs font-mono text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/80 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/60 font-semibold">
                  3x Gravity
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 border-t border-slate-100 dark:border-slate-800/80 pt-2">
                Total honeynet sensors engaged during run.
              </p>
            </div>
          </div>

          {/* Visual Bar Chart & Analysis Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Chart (7 cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Configuration A vs Configuration B Comparison
                </h3>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <span className="w-2.5 h-2.5 rounded bg-slate-400 dark:bg-slate-600"></span> Baseline
                  </span>
                  <span className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 font-semibold">
                    <span className="w-2.5 h-2.5 rounded bg-cyan-500"></span> Augmented
                  </span>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                    <XAxis
                      dataKey="metric"
                      stroke={isDark ? '#64748b' : '#94a3b8'}
                      tick={{ fill: isDark ? '#94a3b8' : '#475569', fontSize: 11 }}
                    />
                    <YAxis
                      stroke={isDark ? '#64748b' : '#94a3b8'}
                      tick={{ fill: isDark ? '#94a3b8' : '#475569', fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#0b1120' : '#ffffff',
                        borderColor: isDark ? '#1e293b' : '#e2e8f0',
                        borderRadius: '8px',
                        color: isDark ? '#f1f5f9' : '#0f172a',
                        fontSize: '12px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                    />
                    <Bar
                      dataKey="Baseline"
                      fill={isDark ? '#475569' : '#94a3b8'}
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="Augmented"
                      fill={isDark ? '#06b6d4' : '#0891b2'}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Architectural Explanation (5 cols) */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Architectural Findings</h3>
              </div>

              <div className="space-y-2">
                {comparison.keyFindings.map((finding, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800/80"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>{finding}</span>
                  </div>
                ))}
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 dark:text-slate-500 tracking-wider block mb-1">
                  Technical Explanation
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  {comparison.explanation}
                </p>
              </div>

              {/* Scientific Rigor Disclosure */}
              <div className="text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800/80 pt-3 flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
                <span>
                  All metrics are computed from simulated scenario state machines and reproducible seeds.
                  Simulated performance metrics demonstrate relative deception efficacy within the controlled environment.
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
