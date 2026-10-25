import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Activity,
  Layers,
  Radio,
  Sliders,
  Check,
} from 'lucide-react';
import { DecoyRecommendation, Asset } from '../../types/cyber';

interface AdaptiveDeceptionLabProps {
  recommendations: DecoyRecommendation[];
  onApplyRecommendation: (id: string) => Promise<{ success: boolean; createdAsset?: Asset }>;
  onNavigateToWhatIf: () => void;
}

export const AdaptiveDeceptionLab: React.FC<AdaptiveDeceptionLabProps> = ({
  recommendations,
  onApplyRecommendation,
  onNavigateToWhatIf,
}) => {
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [appliedSuccess, setAppliedSuccess] = useState<string | null>(null);

  const handleApply = async (id: string) => {
    try {
      setApplyingId(id);
      const res = await onApplyRecommendation(id);
      if (res.success) {
        setAppliedSuccess(`Decoy successfully provisioned into the simulated network!`);
        setTimeout(() => setAppliedSuccess(null), 4000);
      }
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-50/70 via-white to-indigo-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-purple-950/40 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 uppercase font-semibold">
                Autonomous Deception Lab
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Explainable Graph-Driven Decoy Placement</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Adaptive Decoy Placement Engine</h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              Analyzes observed adversary lateral movement corridors and probe frequencies.
              When gaps are detected, the rule-based engine recommends high-gravity decoy assets in adjacent subnets to intercept subsequent infiltration attempts.
            </p>
          </div>

          <button
            onClick={onNavigateToWhatIf}
            className="px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-indigo-600 dark:text-cyan-300 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center gap-2 text-xs font-semibold shadow-sm transition-colors whitespace-nowrap self-start md:self-auto"
          >
            <span>What-If Lab Benchmarking</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Live Toast Confirmation */}
      {appliedSuccess && (
        <div className="bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-600/60 text-emerald-800 dark:text-emerald-200 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-medium animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{appliedSuccess}</span>
        </div>
      )}

      {/* Recommendations Cards */}
      <div className="space-y-4">
        <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Ranked Placement Recommendations ({recommendations.length})
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {recommendations.map((rec) => {
            const isApplied = rec.status === 'APPLIED';

            return (
              <div
                key={rec.id}
                className={`bg-white dark:bg-slate-900 border rounded-xl p-5 shadow-sm transition-all flex flex-col justify-between ${
                  isApplied
                    ? 'border-emerald-400/60 bg-emerald-50/40 dark:bg-emerald-950/10 dark:border-emerald-500/40'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Card Header & Score */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                        {rec.id}
                      </span>
                      <span className="text-xs font-mono text-purple-600 dark:text-purple-400 uppercase font-semibold">
                        {rec.recommendedDecoyType.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Priority Score:</span>
                      <span className="text-sm font-bold font-mono text-indigo-600 dark:text-cyan-400 tabular-nums">
                        {rec.scoreBreakdown.totalScore}/100
                      </span>
                    </div>
                  </div>

                  {/* Suggested Asset */}
                  <div className="mb-3">
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase">PROPOSED DECOY</span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{rec.suggestedAssetName}</h4>
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      Target Zone: <strong className="text-slate-700 dark:text-slate-300 uppercase">{rec.suggestedPlacementZone.replace('_', ' ')}</strong>
                    </span>
                  </div>

                  {/* Observed Pattern & Supporting Event IDs */}
                  <div className="bg-slate-50 dark:bg-slate-950 rounded-lg p-3 text-xs mb-3 border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <div>
                      <span className="text-slate-500 block text-[10px] font-mono">OBSERVED BEHAVIOR PATTERN</span>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{rec.observedPattern}</p>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-200 dark:border-slate-900 text-[11px] font-mono">
                      <span className="text-slate-500">Supporting Telemetry:</span>
                      <span className="text-indigo-600 dark:text-cyan-400 font-semibold">{rec.triggerEventIds.join(', ')}</span>
                    </div>
                  </div>

                  {/* Explainable Rationale */}
                  <div className="space-y-2 text-xs mb-4">
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase block">WHY THIS WORKS</span>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{rec.rationale}</p>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-500 uppercase block font-semibold">
                        DETECTION ADVANTAGE
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">{rec.detectionAdvantage}</p>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono text-amber-600 dark:text-amber-500 uppercase block font-semibold">
                        DOCUMENTED LIMITATIONS
                      </span>
                      <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">{rec.limitations}</p>
                    </div>
                  </div>

                  {/* Scoring Breakdown Bars */}
                  <div className="bg-slate-50 dark:bg-slate-950/60 rounded-lg p-3 border border-slate-200 dark:border-slate-800/80 mb-4 space-y-1.5 text-[11px] font-mono">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold mb-1">
                      Deterministic Score Rationale
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Adversary Probe Frequency:</span>
                      <span className="text-slate-900 dark:text-slate-200 font-medium">+{rec.scoreBreakdown.probeFrequency} pts</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Target Subnet Criticality:</span>
                      <span className="text-slate-900 dark:text-slate-200 font-medium">+{rec.scoreBreakdown.zoneCriticality} pts</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Path Vulnerability Gap:</span>
                      <span className="text-slate-900 dark:text-slate-200 font-medium">+{rec.scoreBreakdown.pathVulnerability} pts</span>
                    </div>
                  </div>
                </div>

                {/* Apply Button */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-500">
                    Status: <strong className={isApplied ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}>{rec.status}</strong>
                  </span>

                  {isApplied ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40 text-xs font-semibold">
                      <Check className="w-3.5 h-3.5" />
                      <span>Decoy Active in Topology</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleApply(rec.id)}
                      disabled={applyingId === rec.id}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-2 text-xs font-semibold shadow-sm transition-colors"
                    >
                      {applyingId === rec.id ? (
                        <>
                          <Activity className="w-3.5 h-3.5 animate-spin" />
                          <span>Provisioning...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Apply to Network</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
