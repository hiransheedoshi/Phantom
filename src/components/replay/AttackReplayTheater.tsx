import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  FastForward,
  ShieldAlert,
  Flame,
  Radio,
  FileText,
  KeyRound,
  Terminal,
  Activity,
  CheckCircle2,
  ExternalLink,
  Info,
  Box,
  Network,
} from 'lucide-react';
import { Scenario, ScenarioStep, Asset } from '../../types/cyber';
import { NetworkTopology } from '../network/NetworkTopology';
import { PhantomCyberspace } from '../network3d/PhantomCyberspace';

interface AttackReplayTheaterProps {
  scenarios: Scenario[];
  assets: Asset[];
  onOpenIncident?: (incidentId: string) => void;
  onNavigateToAdaptive?: () => void;
}

export const AttackReplayTheater: React.FC<AttackReplayTheaterProps> = ({
  scenarios,
  assets,
  onOpenIncident,
  onNavigateToAdaptive,
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(
    scenarios[0]?.id || 'SCENARIO-FINANCE-MIRAGE'
  );
  const activeScenario = scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [viewMode3D, setViewMode3D] = useState<boolean>(true); // 3D vs 2D view toggle
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const steps = activeScenario?.steps || [];
  const currentStep: ScenarioStep | undefined = steps[currentStepIndex];

  // Progressive observed path up to currentStepIndex
  const currentObservedPath = React.useMemo(() => {
    const path: string[] = [];
    for (let i = 0; i <= currentStepIndex && i < steps.length; i++) {
      const s = steps[i];
      if (!path.includes(s.sourceAssetId)) path.push(s.sourceAssetId);
      if (!path.includes(s.targetAssetId)) path.push(s.targetAssetId);
    }
    return path;
  }, [steps, currentStepIndex]);

  // Handle Playback Interval
  useEffect(() => {
    if (isPlaying) {
      const baseDelay = 2000 / playbackSpeed;
      timerRef.current = setTimeout(() => {
        if (currentStepIndex < steps.length - 1) {
          setCurrentStepIndex((prev) => prev + 1);
        } else {
          setIsPlaying(false);
        }
      }, baseDelay);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentStepIndex, steps.length, playbackSpeed]);

  const handlePlayPause = () => {
    if (currentStepIndex >= steps.length - 1 && !isPlaying) {
      setCurrentStepIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleStepBack = () => {
    setIsPlaying(false);
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  };

  const handleStepForward = () => {
    setIsPlaying(false);
    setCurrentStepIndex((prev) => Math.min(steps.length - 1, prev + 1));
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  };

  const handleScenarioChange = (id: string) => {
    setIsPlaying(false);
    setSelectedScenarioId(id);
    setCurrentStepIndex(0);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Deck & Scenario Selector */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-cyan-950 text-indigo-700 dark:text-cyan-300 border border-indigo-200 dark:border-cyan-800/60 uppercase tracking-wider font-semibold">
                Forensic Replay Engine
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Step-by-Step Intrusion Reconstruction</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{activeScenario?.name}</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">{activeScenario?.description}</p>
          </div>

          {/* Scenario Selector & View Mode Switcher */}
          <div className="flex items-center gap-3">
            {/* 3D vs 2D Toggle */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setViewMode3D(true)}
                className={`px-2.5 py-1 text-xs font-semibold rounded flex items-center gap-1.5 transition-colors ${
                  viewMode3D
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-cyan-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Box className="w-3.5 h-3.5" />
                <span>3D Cyberspace</span>
              </button>
              <button
                onClick={() => setViewMode3D(false)}
                className={`px-2.5 py-1 text-xs font-semibold rounded flex items-center gap-1.5 transition-colors ${
                  !viewMode3D
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-cyan-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Network className="w-3.5 h-3.5" />
                <span>2D Topology</span>
              </button>
            </div>

            <select
              value={selectedScenarioId}
              onChange={(e) => handleScenarioChange(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 dark:focus:border-cyan-500"
            >
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.difficulty})
                </option>
              ))}
            </select>

            <button
              onClick={handleReset}
              title="Restart Scenario"
              className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Playback Controls & Timeline Scrubber Bar */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-3">
            {/* Play, Step buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleStepBack}
                disabled={currentStepIndex === 0}
                className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-30 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={handlePlayPause}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white rounded-lg flex items-center gap-2 text-xs font-semibold shadow-xs transition-colors"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                <span>{isPlaying ? 'Pause Playback' : 'Play Intrusion'}</span>
              </button>

              <button
                onClick={handleStepForward}
                disabled={currentStepIndex >= steps.length - 1}
                className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-30 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              {/* Speed Pills */}
              <div className="flex items-center gap-1 ml-4 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px]">
                {[0.5, 1, 2, 4].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setPlaybackSpeed(spd)}
                    className={`px-2 py-0.5 rounded font-mono transition-colors ${
                      playbackSpeed === spd
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-cyan-300 font-bold shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* Step Counter Indicator */}
            <div className="flex items-center gap-3 text-xs font-mono text-slate-500 dark:text-slate-400">
              <span>
                Step <strong className="text-indigo-600 dark:text-cyan-300">{currentStepIndex + 1}</strong> of {steps.length}
              </span>
              <span>·</span>
              <span className="tabular-nums">T+{currentStep?.relativeTimeSec ?? 0}s</span>
              {currentStepIndex === steps.length - 1 && (
                <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40 text-[10px] font-semibold">
                  RECONSTRUCTION COMPLETE
                </span>
              )}
            </div>
          </div>

          {/* Interactive Scrubber Slider */}
          <div className="relative w-full">
            <input
              type="range"
              min={0}
              max={steps.length - 1}
              value={currentStepIndex}
              onChange={(e) => {
                setIsPlaying(false);
                setCurrentStepIndex(parseInt(e.target.value, 10));
              }}
              className="w-full accent-indigo-600 dark:accent-cyan-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg"
            />
            {/* Step tick markers */}
            <div className="flex justify-between text-[10px] font-mono text-slate-400 dark:text-slate-600 mt-1 px-1">
              {steps.map((s, idx) => (
                <span
                  key={idx}
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentStepIndex(idx);
                  }}
                  className={`cursor-pointer hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors ${
                    idx === currentStepIndex ? 'text-indigo-600 dark:text-cyan-300 font-bold' : ''
                  }`}
                >
                  Step {idx + 1}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Split View: Synchronized Visualizer vs Event Inspection */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Synchronized Visualizer (7 cols) */}
        <div className="lg:col-span-7">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {viewMode3D ? '3D Spatial Reconstruction' : '2D Traversal Topology'}
            </h3>
            <span className="text-xs font-mono text-indigo-600 dark:text-cyan-400 font-semibold truncate max-w-sm">
              Active Path: {currentObservedPath.join(' ➔ ') || 'None'}
            </span>
          </div>

          {viewMode3D ? (
            <PhantomCyberspace
              assets={assets}
              observedPath={currentObservedPath}
              activeStepNodeId={currentStep?.targetAssetId}
              isSimulating={isPlaying}
            />
          ) : (
            <NetworkTopology
              assets={assets}
              observedPath={currentObservedPath}
              activeStepNodeId={currentStep?.targetAssetId}
            />
          )}
        </div>

        {/* Right: Step Evidence & Forensic Narrative Card (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Forensic Evidence Dossier
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {currentStep?.outcome === 'TRIPPED_CANARY' ? (
                <span className="text-red-600 dark:text-red-400 font-semibold flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" /> CANARY TRIPPED
                </span>
              ) : (
                <span className="text-slate-500 dark:text-slate-400">Passive Observation</span>
              )}
            </span>
          </div>

          {currentStep ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
              {/* Step Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        currentStep.severity === 'CRITICAL'
                          ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300 border border-red-300 dark:border-red-500/40'
                          : currentStep.severity === 'HIGH'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {currentStep.severity} Severity
                    </span>
                    <span className="text-xs font-mono text-slate-500">{currentStep.eventType}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{currentStep.description}</h4>
                </div>
              </div>

              {/* Hop Metadata */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px]">HOP SOURCE</span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold">{currentStep.sourceAssetId}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px]">HOP TARGET</span>
                  <span className="text-indigo-600 dark:text-cyan-400 font-semibold">{currentStep.targetAssetId}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px]">PROTOCOL</span>
                  <span className="text-slate-700 dark:text-slate-300">{currentStep.protocol}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px]">DETECTION OUTCOME</span>
                  <span
                    className={
                      currentStep.outcome === 'TRIPPED_CANARY' ? 'text-red-600 dark:text-red-400 font-bold' : 'text-slate-600 dark:text-slate-400'
                    }
                  >
                    {currentStep.outcome}
                  </span>
                </div>
              </div>

              {/* Forensic Narrative */}
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
                  Reconstruction Narrative
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80">
                  {currentStep.narrative}
                </p>
              </div>

              {/* MITRE ATT&CK Mapping */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-mono text-[11px]">MITRE ATT&CK:</span>
                <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 font-mono text-[11px]">
                  {currentStep.mitreTechnique}
                </span>
              </div>

              {/* Raw Evidence Payload Details */}
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
                  Sensor Evidence Dump
                </span>
                <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3 font-mono text-xs border border-slate-200 dark:border-slate-800 space-y-1.5 overflow-x-auto text-slate-700 dark:text-slate-300">
                  {currentStep.evidence.canaryTokenId && (
                    <div className="text-purple-600 dark:text-purple-400">
                      CanaryToken ID: <span className="text-slate-900 dark:text-slate-200">{currentStep.evidence.canaryTokenId}</span>
                    </div>
                  )}
                  {currentStep.evidence.command && (
                    <div className="text-sky-600 dark:text-cyan-400">
                      Shell Command: <span className="text-slate-900 dark:text-slate-200">{currentStep.evidence.command}</span>
                    </div>
                  )}
                  {currentStep.evidence.fileAccessed && (
                    <div className="text-amber-600 dark:text-amber-400">
                      File Interacted: <span className="text-slate-900 dark:text-slate-200">{currentStep.evidence.fileAccessed}</span>
                    </div>
                  )}
                  {currentStep.evidence.credentialUsed && (
                    <div className="text-red-600 dark:text-red-400">
                      Decoy Credential Used:{' '}
                      <span className="text-slate-900 dark:text-slate-200">{currentStep.evidence.credentialUsed}</span>
                    </div>
                  )}
                  {currentStep.evidence.openCanaryType && (
                    <div className="text-indigo-600 dark:text-sky-400">
                      OpenCanary Sensor: <span className="text-slate-900 dark:text-slate-200">{currentStep.evidence.openCanaryType}</span>
                    </div>
                  )}
                  {currentStep.evidence.hash && (
                    <div className="text-slate-500 dark:text-slate-400 text-[10px] truncate">
                      SHA256: <span className="text-slate-700 dark:text-slate-300">{currentStep.evidence.hash}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Post-Replay Actions */}
              {currentStepIndex === steps.length - 1 && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <button
                    onClick={() => onOpenIncident && onOpenIncident('INC-2026-084')}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-xs"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>Investigate Correlated Incident Dossier</span>
                  </button>

                  <button
                    onClick={() => onNavigateToAdaptive && onNavigateToAdaptive()}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>View Adaptive Decoy Recommendations for this Path</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              Select or play scenario to begin forensic replay.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
