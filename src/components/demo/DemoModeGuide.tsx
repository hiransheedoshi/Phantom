import React from 'react';
import {
  Sparkles,
  ChevronRight,
  CheckCircle2,
  X,
  Play,
  RotateCcw,
  ShieldAlert,
  Sliders,
  FileText,
  Compass,
} from 'lucide-react';

interface DemoModeGuideProps {
  currentStep: number;
  onSelectStep: (step: number) => void;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  onStartScenario: (scenarioId: string) => void;
  onInvestigateIncident: (id: string) => void;
}

const DEMO_STEPS = [
  {
    step: 1,
    title: '1. Inspect Deception Topology',
    description: 'Explore the 4 zones and review planted canary files, tokens, and honeypot services.',
    targetTab: 'network',
    actionLabel: 'View Topology',
  },
  {
    step: 2,
    title: '2. Launch "The Finance Mirage" Simulation',
    description: 'Trigger autonomous adversary probe pivoting from DMZ to developer workstation to finance ERP.',
    targetTab: 'dashboard',
    actionLabel: 'Launch Scenario',
    scenarioId: 'SCENARIO-FINANCE-MIRAGE',
  },
  {
    step: 3,
    title: '3. Watch Live Tripwire Alerts',
    description: 'Witness OpenCanary and Canarytokens tripwires fire as fake credentials are read.',
    targetTab: 'events',
    actionLabel: 'View Event Stream',
  },
  {
    step: 4,
    title: '4. Forensic Attack Replay Theater',
    description: 'Replay the intrusion step-by-step with synchronized node illumination and packet evidence.',
    targetTab: 'replay',
    actionLabel: 'Open Replay Theater',
  },
  {
    step: 5,
    title: '5. Autonomous Incident Dossier',
    description: 'Inspect the correlated incident, containment actions, analyst notes, and MITRE mapping.',
    targetTab: 'incidents',
    actionLabel: 'Investigate Incident',
    incidentId: 'INC-2026-084',
  },
  {
    step: 6,
    title: '6. Adaptive Decoy Intelligence',
    description: 'Review rule-based recommendations and apply a new Cowrie SSH or Honey DB decoy.',
    targetTab: 'adaptive',
    actionLabel: 'Open Adaptive Lab',
  },
  {
    step: 7,
    title: '7. What-If Security Lab Benchmark',
    description: 'Compare Baseline vs Augmented network to measure 85% reduction in time-to-alert.',
    targetTab: 'whatif',
    actionLabel: 'Run What-If Benchmark',
  },
  {
    step: 8,
    title: '8. AI Report & SHA-256 Ledger',
    description: 'Generate evidence-grounded report and verify cryptographic hash chain integrity.',
    targetTab: 'reports',
    actionLabel: 'Review Report & Ledger',
  },
];

export const DemoModeGuide: React.FC<DemoModeGuideProps> = ({
  currentStep,
  onSelectStep,
  onClose,
  onNavigate,
  onStartScenario,
  onInvestigateIncident,
}) => {
  const activeStepObj = DEMO_STEPS.find((s) => s.step === currentStep) || DEMO_STEPS[0];

  const handleStepAction = () => {
    if (activeStepObj.scenarioId) {
      onStartScenario(activeStepObj.scenarioId);
    }
    if (activeStepObj.incidentId) {
      onInvestigateIncident(activeStepObj.incidentId);
    }
    onNavigate(activeStepObj.targetTab);
  };

  const handleNextStep = () => {
    const next = currentStep < DEMO_STEPS.length ? currentStep + 1 : 1;
    onSelectStep(next);
    const nextObj = DEMO_STEPS.find((s) => s.step === next)!;
    if (nextObj.scenarioId) {
      onStartScenario(nextObj.scenarioId);
    }
    if (nextObj.incidentId) {
      onInvestigateIncident(nextObj.incidentId);
    }
    onNavigate(nextObj.targetTab);
  };

  return (
    <div className="bg-gradient-to-r from-cyan-500/10 via-white to-indigo-500/10 dark:from-cyan-950/90 dark:via-slate-900 dark:to-indigo-950/90 border border-cyan-200 dark:border-cyan-800/80 rounded-xl p-4 shadow-lg backdrop-blur-md mb-6 transition-all animate-fadeIn">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Step Info */}
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-700/60 shrink-0">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200 border border-cyan-200 dark:border-cyan-700 uppercase font-bold tracking-wider">
                Guided Interactive Tour · Step {currentStep} of {DEMO_STEPS.length}
              </span>
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-200">{activeStepObj.title}</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">{activeStepObj.description}</p>
          </div>
        </div>

        {/* Step Buttons & Controls */}
        <div className="flex items-center gap-2.5 shrink-0 self-end lg:self-center">
          <button
            onClick={handleStepAction}
            className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <span>{activeStepObj.actionLabel}</span>
          </button>

          <button
            onClick={handleNextStep}
            className="px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-cyan-700 dark:text-cyan-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <span>Next Stage</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClose}
            title="Exit Demo Mode"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Track */}
      <div className="grid grid-cols-8 gap-1.5 mt-3 pt-3 border-t border-cyan-100 dark:border-cyan-900/40">
        {DEMO_STEPS.map((s) => (
          <button
            key={s.step}
            onClick={() => {
              onSelectStep(s.step);
              if (s.scenarioId) onStartScenario(s.scenarioId);
              if (s.incidentId) onInvestigateIncident(s.incidentId);
              onNavigate(s.targetTab);
            }}
            className={`h-1.5 rounded-full transition-all ${
              s.step === currentStep
                ? 'bg-cyan-500 dark:bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                : s.step < currentStep
                ? 'bg-cyan-300 dark:bg-cyan-800'
                : 'bg-slate-200 dark:bg-slate-800'
            }`}
            title={s.title}
          />
        ))}
      </div>
    </div>
  );
};
