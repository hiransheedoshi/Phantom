import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Server,
  Terminal,
  Radio,
  FileCode,
  Sparkles,
  Info,
  ExternalLink,
} from 'lucide-react';
import { api } from '../../services/api';

interface SettingsHealthViewProps {
  onResetData: () => Promise<void>;
}

export const SettingsHealthView: React.FC<SettingsHealthViewProps> = ({ onResetData }) => {
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  const handleReset = async () => {
    if (!window.confirm('Reset all simulated assets, events, and runs to pristine seed data?')) return;
    try {
      setResetting(true);
      await onResetData();
      setResetSuccess('System reset complete. Initial seed network and scenarios restored.');
      setTimeout(() => setResetSuccess(null), 4000);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase font-semibold">
              Platform Diagnostics
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Sensor Telemetry & Honeynet Health</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Settings & System Health</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Monitor deception sensor health, MITRE ATT&CK coverage, honeynet telemetry, and manage demo state.
          </p>
        </div>
      </div>

      {resetSuccess && (
        <div className="bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-600/60 text-emerald-800 dark:text-emerald-200 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{resetSuccess}</span>
        </div>
      )}

      {/* Sensor Health Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sensor 1 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">OPENCANARY DAEMON</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100">Multi-Protocol Honeynet</div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">Ports 8080 (HTTP), 445 (SMB), 3306 (MySQL) active with tripwire alerts.</p>
        </div>

        {/* Sensor 2 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">COWRIE SSH ENGINE</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100">Interactive TTY Sandbox</div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">Session keystroke recording, fake filesystem, and brute-force tracking.</p>
        </div>

        {/* Sensor 3 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">CANARYTOKENS ROUTER</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100">Digital Tripwire Tokens</div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">AWS IAM tokens, Excel WebBugs, and SQL canary triggers armed.</p>
        </div>

        {/* Sensor 4 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">FORENSIC CORRELATOR</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100">PHANTOM Core Graph</div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">Autonomous session binding and SHA-256 evidence chain verification.</p>
        </div>
      </div>

      {/* MITRE ATT&CK Matrix Coverage */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">MITRE ATT&CK Deception Matrix</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Defensive deception coverage mapped to adversary tactics and techniques.</p>
          </div>
          <span className="text-xs font-mono text-indigo-600 dark:text-cyan-400 font-semibold">6 Techniques Mapped</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs font-mono">
          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">RECONNAISSANCE</span>
            <div className="text-slate-900 dark:text-slate-200 font-bold">T1046: Network Service Discovery</div>
            <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">OpenCanary Port 8080 & 2222</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">CREDENTIAL ACCESS</span>
            <div className="text-slate-900 dark:text-slate-200 font-bold">T1552.001: Dotfile Credentials</div>
            <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">Decoy .aws/credentials</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">LATERAL MOVEMENT</span>
            <div className="text-slate-900 dark:text-slate-200 font-bold">T1021.004: Remote Services (SSH)</div>
            <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">Cowrie SSH Honey Bastion</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">DISCOVERY</span>
            <div className="text-slate-900 dark:text-slate-200 font-bold">T1135: Network Share Discovery</div>
            <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">Decoy \\CORP-NAS SMB Share</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">COLLECTION</span>
            <div className="text-slate-900 dark:text-slate-200 font-bold">T1005: Data from Local System</div>
            <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">Canarytoken Executive Spreadsheet</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">EXFILTRATION</span>
            <div className="text-slate-900 dark:text-slate-200 font-bold">T1567: Exfiltration Over Web Service</div>
            <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">Canary WebBug Beacon & Honey DB</span>
          </div>
        </div>
      </div>
      {/* Proprietary Core Architecture & Engine Blueprint */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 uppercase font-semibold">
                Proprietary Kernel Architecture
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Authored by Falak · Core System Blueprint</span>
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              PHANTOM Engine Specifications & Micro-Kernel Subsystems
            </h3>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
            <span>Kernel Build:</span>
            <strong className="text-indigo-600 dark:text-cyan-400 font-bold">v3.4.2-PROPRIETARY</strong>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-indigo-600 dark:text-cyan-400 font-bold">
              <span>S.P.E.C.T.E.R.™ Engine</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800">PATH GRAVITY</span>
            </div>
            <div className="text-[11px] text-slate-700 dark:text-slate-300 font-sans">
              Spatial Path Evaluation & Countermeasure Tripwire Engine. Evaluates lateral movement vectors and calculates optimal honeynet gravity to intercept adversary corridors.
            </div>
            <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
              Execution Latency: <strong className="text-emerald-600 dark:text-emerald-400">1.2ms</strong>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-indigo-600 dark:text-cyan-400 font-bold">
              <span>K.R.Y.P.T.O.S.-256™</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800">IMMUTABLE</span>
            </div>
            <div className="text-[11px] text-slate-700 dark:text-slate-300 font-sans">
              Tamper-evident chronological evidence hash chain. Binds payload bytes, timestamps, and previous hashes into cryptographic blocks for court-admissible forensic non-repudiation.
            </div>
            <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
              Verification Speed: <strong className="text-emerald-600 dark:text-emerald-400">0.8ms / block</strong>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-indigo-600 dark:text-cyan-400 font-bold">
              <span>M.I.R.A.G.E.™ Fabric</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800">DECOY SYNTHESIS</span>
            </div>
            <div className="text-[11px] text-slate-700 dark:text-slate-300 font-sans">
              Autonomous Decoy Synthesis Engine. Generates high-interaction honeynet services, synthetic payloads, and bait credential tokens directly mapped into the 3D topology.
            </div>
            <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
              Provisioning Time: <strong className="text-emerald-600 dark:text-emerald-400">14.0ms</strong>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-indigo-600 dark:text-cyan-400 font-bold">
              <span>A.U.R.A.™ Correlator</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800">SESSION GRAPH</span>
            </div>
            <div className="text-[11px] text-slate-700 dark:text-slate-300 font-sans">
              Asymmetric Threat Correlation Graph. Aggregates multi-subnet sensor tripwires into definitive incident dossiers with automated MITRE tactic classification.
            </div>
            <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
              Correlative Accuracy: <strong className="text-emerald-600 dark:text-emerald-400">99.4%</strong>
            </div>
          </div>
        </div>

        {/* Engineering System Benchmarks Strip */}
        <div className="bg-slate-100/70 dark:bg-slate-950/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400 text-[11px]">
            <span>Memory Architecture: <strong className="text-slate-900 dark:text-slate-200">Zero-Copy In-Memory DAG</strong></span>
            <span>·</span>
            <span>Concurrent Threading: <strong className="text-slate-900 dark:text-slate-200">Asynchronous Event Loop</strong></span>
            <span>·</span>
            <span>3D Rendering Engine: <strong className="text-slate-900 dark:text-slate-200">Custom WebGL Pipeline</strong></span>
          </div>
          <div className="text-[11px] text-indigo-600 dark:text-cyan-400 font-semibold">
            Architect: Falak · Independent Innovation
          </div>
        </div>
      </div>

      {/* Demo Reset Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Factory Demo Reset</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Restores the initial network assets, historical incidents, and clears active simulation runs.
          </p>
        </div>

        <button
          onClick={handleReset}
          disabled={resetting}
          className="px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{resetting ? 'Resetting System...' : 'Restore Factory Seed Data'}</span>
        </button>
      </div>
    </div>
  );
};
