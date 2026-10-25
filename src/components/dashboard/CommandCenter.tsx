import React from 'react';
import {
  ShieldAlert,
  Radio,
  Flame,
  Activity,
  Play,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Server,
  FileWarning,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Box,
} from 'lucide-react';
import { DashboardData } from '../../services/api';
import { Scenario } from '../../types/cyber';

interface CommandCenterProps {
  data: DashboardData | null;
  scenarios: Scenario[];
  onStartSimulation: (scenarioId: string) => void;
  onNavigate: (tab: string) => void;
  onInvestigateIncident: (incidentId: string) => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  data,
  scenarios,
  onStartSimulation,
  onNavigate,
  onInvestigateIncident,
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = React.useState(
    scenarios[0]?.id || 'SCENARIO-FINANCE-MIRAGE'
  );

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-mono text-sm">
          <Activity className="w-5 h-5 text-indigo-600 dark:text-cyan-400 animate-spin" />
          <span>Polling PHANTOM Telemetry Engine...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Action Banner */}
      <div className="bg-gradient-to-r from-white via-indigo-50/30 to-sky-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-cyan-950 text-indigo-700 dark:text-cyan-300 border border-indigo-200 dark:border-cyan-800/60 font-semibold tracking-wider uppercase">
                Autonomous Deception Mesh
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Zero-False-Positive Threat Interception</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              PHANTOM//TRACE Command Center
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              Decoy assets (Canary documents, cloud credentials, honeynet bastions, and synthetic databases) are actively monitored across 4 security zones.
              Adversary interactions trigger instantaneous tripwire alarms, reconstruct intrusion corridors in 3D, and generate tamper-evident forensic dossiers.
            </p>
          </div>

          {/* Quick Simulation Launch Card */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white/90 dark:bg-slate-950/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase">Preset Attack Scenario</span>
              <select
                value={selectedScenarioId}
                onChange={(e) => setSelectedScenarioId(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer py-1"
              >
                {scenarios.map((s) => (
                  <option key={s.id} value={s.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                    {s.name} ({s.difficulty})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => onStartSimulation(selectedScenarioId)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-md shadow-indigo-600/20 whitespace-nowrap"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Launch Live Breach Run</span>
            </button>
          </div>
        </div>

        {/* Subtle accent glow */}
        <div className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full bg-indigo-500/10 dark:bg-cyan-500/5 blur-3xl pointer-events-none" />
      </div>

      {/* Primary KPI Grid (4 Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Monitored Assets</span>
            <Server className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
              {data.totalAssets}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">nodes in topology</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2">
            <span>4 Security Zones</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold">100% Online</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Active Decoy Honeypots</span>
            <Radio className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-300 tabular-nums">
              {data.activeDecoys}
            </span>
            <span className="text-[11px] text-purple-600/80 dark:text-purple-400/80 font-mono">canary tripwires</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2">
            <span>Files, Tokens, DB</span>
            <button
              onClick={() => onNavigate('assets')}
              className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
            >
              Manage ➔
            </button>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Decoy Tripwire Alerts</span>
            <Flame className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-red-600 dark:text-red-400 tabular-nums">
              {data.totalInteractions}
            </span>
            <span className="text-[11px] text-red-600/80 dark:text-red-400/80 font-mono">adversary hits</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2">
            <span>Detection Coverage:</span>
            <span className="text-indigo-600 dark:text-cyan-400 font-mono font-bold">{data.detectionCoverage}%</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Correlated Incidents</span>
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-300 tabular-nums">
              {data.openIncidents}
            </span>
            <span className="text-[11px] text-amber-600/80 dark:text-amber-400/80 font-mono">active dossiers</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2">
            <span className="text-red-600 dark:text-red-400 font-mono">{data.highPriorityIncidents} Critical</span>
            <button
              onClick={() => onNavigate('incidents')}
              className="text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 font-medium"
            >
              Review ➔
            </button>
          </div>
        </div>
      </div>

      {/* Middle Split: Live Event Stream vs Decoy Effectiveness */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Live Event Stream (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600 dark:bg-cyan-500"></span>
              </span>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Live Security Event Telemetry</h3>
            </div>
            <button
              onClick={() => onNavigate('events')}
              className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-cyan-400 dark:hover:text-cyan-300 font-medium flex items-center gap-1"
            >
              <span>Event Explorer</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Event Stream List */}
          <div className="space-y-2.5 overflow-y-auto max-h-[360px] pr-1">
            {data.recentEvents.map((event) => (
              <div
                key={event.eventId}
                className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl p-3.5 transition-colors text-xs"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                        event.severity === 'CRITICAL'
                          ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300 border border-red-300 dark:border-red-500/40'
                          : event.severity === 'HIGH'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400'
                      }`}
                    >
                      {event.severity}
                    </span>
                    <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">{event.eventId}</span>
                    <span className="text-slate-400 dark:text-slate-600">·</span>
                    <span className="font-mono text-[11px] text-indigo-600 dark:text-cyan-400 font-medium">{event.eventType}</span>
                  </div>

                  <span className="font-mono text-[10px] text-slate-500 tabular-nums">
                    {event.timestamp.slice(11, 19)}
                  </span>
                </div>

                <p className="text-slate-700 dark:text-slate-300 mb-2 leading-relaxed">{event.description}</p>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1.5 border-t border-slate-200/80 dark:border-slate-900">
                  <span className="truncate max-w-[200px]">
                    {event.sourceAssetId} ➔ <strong className="text-slate-700 dark:text-slate-300">{event.targetAssetId}</strong>
                  </span>
                  <span
                    className={
                      event.outcome === 'TRIPPED_CANARY' ? 'text-red-600 dark:text-red-400 font-bold' : 'text-slate-500'
                    }
                  >
                    {event.outcome}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Decoy Effectiveness & Frequent Traversal Paths (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Decoy Performance Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Top Decoy Tripwire Gravity</h3>
              <span className="text-[11px] font-mono text-purple-600 dark:text-purple-400 font-semibold">HONEYNET GAIN</span>
            </div>

            <div className="space-y-3">
              {data.topDecoys.map((decoy) => (
                <div
                  key={decoy.id}
                  className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80 text-xs"
                >
                  <div className="flex items-center gap-2 truncate max-w-[220px]">
                    <div className="p-1 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                      <Radio className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <div className="font-semibold text-slate-900 dark:text-slate-200 truncate">{decoy.name}</div>
                      <div className="text-[10px] font-mono text-slate-500 uppercase">{decoy.trustZone}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-purple-600 dark:text-purple-300 tabular-nums">
                      {decoy.interactionCount}
                    </span>
                    <span className="text-[10px] text-slate-500 block">tripped hits</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Most Traversed Paths */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Frequent Traversal Corridors</h3>
              <span className="text-[11px] font-mono text-indigo-600 dark:text-cyan-400">PATH FREQUENCY</span>
            </div>

            <div className="space-y-2">
              {data.frequentPaths.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800/80 font-mono"
                >
                  <span className="text-slate-700 dark:text-slate-300 truncate max-w-[240px]">{item.path}</span>
                  <span className="text-indigo-600 dark:text-cyan-400 font-bold tabular-nums">{item.count}x</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Active Incidents Quick Review */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Active Investigation Dossiers</h3>
          </div>
          <button
            onClick={() => onNavigate('incidents')}
            className="text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 font-medium flex items-center gap-1"
          >
            <span>All Incidents</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.recentIncidents.map((incident) => (
            <div
              key={incident.id}
              onClick={() => onInvestigateIncident(incident.id)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 p-4 rounded-xl cursor-pointer transition-colors space-y-2 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-300">{incident.id}</span>
                <span
                  className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                    incident.severity === 'CRITICAL'
                      ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300 border border-red-300 dark:border-red-500/40'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                  }`}
                >
                  {incident.severity}
                </span>
              </div>

              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-200 line-clamp-1">{incident.title}</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">{incident.summary}</p>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-200/80 dark:border-slate-900">
                <span>{incident.observedPath.length} Nodes in Path</span>
                <span className="text-indigo-600 dark:text-cyan-400 flex items-center gap-1 font-semibold">
                  <span>Investigate</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
