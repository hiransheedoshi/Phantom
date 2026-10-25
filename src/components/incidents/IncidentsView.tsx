import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  Flame,
  Radio,
  FileText,
  KeyRound,
  Download,
  Plus,
  Send,
  X,
  Sparkles,
  Activity,
  ArrowRight,
  Lock,
  Box,
  Target,
  Fingerprint,
  Zap,
} from 'lucide-react';
import { Incident, IncidentStatus, SecurityEvent } from '../../types/cyber';

interface IncidentsViewProps {
  incidents: Incident[];
  events: SecurityEvent[];
  selectedIncidentId?: string | null;
  onUpdateIncident: (id: string, updates: Partial<Incident>) => Promise<void>;
  onAddNote: (id: string, author: string, note: string) => Promise<void>;
  onNavigateToReplay: (scenarioId: string) => void;
}

export const IncidentsView: React.FC<IncidentsViewProps> = ({
  incidents,
  events,
  selectedIncidentId,
  onUpdateIncident,
  onAddNote,
  onNavigateToReplay,
}) => {
  const [activeIncidentId, setActiveIncidentId] = useState<string | null>(
    selectedIncidentId || (incidents.length > 0 ? incidents[0].id : null)
  );
  const [statusFilter, setStatusFilter] = useState<'ALL' | IncidentStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Analyst note input
  const [newNoteAuthor, setNewNoteAuthor] = useState('SOC Analyst');
  const [newNoteText, setNewNoteText] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  // Active incident
  const activeIncident = incidents.find((i) => i.id === activeIncidentId) || incidents[0];

  // Correlated events for active incident
  const correlatedEvents = events.filter((e) =>
    activeIncident ? activeIncident.relatedEventIds.includes(e.eventId) : false
  );

  const filteredIncidents = incidents.filter((inc) => {
    if (statusFilter !== 'ALL' && inc.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        inc.title.toLowerCase().includes(q) ||
        inc.id.toLowerCase().includes(q) ||
        inc.sourceIp.includes(q) ||
        inc.summary.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleStatusChange = async (newStatus: IncidentStatus) => {
    if (!activeIncident) return;
    await onUpdateIncident(activeIncident.id, { status: newStatus });
  };

  const handleToggleAction = async (actionId: string) => {
    if (!activeIncident) return;
    const updatedActions = activeIncident.recommendedActions.map((act) =>
      act.id === actionId
        ? {
            ...act,
            applied: !act.applied,
            appliedAt: !act.applied ? new Date().toISOString() : undefined,
          }
        : act
    );
    await onUpdateIncident(activeIncident.id, { recommendedActions: updatedActions });
  };

  const handleAddNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeIncident || !newNoteText.trim()) return;
    try {
      setSubmittingNote(true);
      await onAddNote(activeIncident.id, newNoteAuthor, newNoteText.trim());
      setNewNoteText('');
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleExportJSON = () => {
    if (!activeIncident) return;
    const bundle = {
      incident: activeIncident,
      correlatedEvents,
      exportedAt: new Date().toISOString(),
      platform: 'PHANTOM//TRACE Forensic Dossier',
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeIncident.id}-forensic-dossier.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-200 dark:border-red-800/60 uppercase font-semibold">
                Autonomous Incident Correlator
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Behavioral Correlation & Forensic Dossiers</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Intrusion Incident Investigations</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              High-signal tripwire events are autonomously aggregated into behavioral intrusion sessions with chronological movement replay.
            </p>
          </div>

          {activeIncident && (
            <div className="flex items-center gap-2">
              {/* Prominent REPLAY IN 3D Action */}
              <button
                onClick={() => onNavigateToReplay(activeIncident.scenarioId)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-2 text-xs font-bold shadow-xs transition-colors whitespace-nowrap"
              >
                <Box className="w-3.5 h-3.5" />
                <span>Replay in 3D Cyberspace</span>
              </button>

              <button
                onClick={handleExportJSON}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg flex items-center gap-1.5 text-xs font-medium border border-slate-200 dark:border-slate-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Investigation Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Incident Master List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          {/* Filter & Search */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 space-y-3 shadow-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search incident ID, IP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 dark:focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] overflow-x-auto">
              {(['ALL', 'NEW', 'INVESTIGATING', 'CONTAINED', 'RESOLVED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2 py-0.5 rounded whitespace-nowrap font-medium transition-colors ${
                    statusFilter === st
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-cyan-300 shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Incident Cards List */}
          <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
            {filteredIncidents.map((inc) => {
              const isSelected = activeIncident?.id === inc.id;

              return (
                <div
                  key={inc.id}
                  onClick={() => setActiveIncidentId(inc.id)}
                  className={`border rounded-xl p-4 cursor-pointer transition-all shadow-xs ${
                    isSelected
                      ? 'border-indigo-500 dark:border-cyan-500 bg-indigo-50/40 dark:bg-slate-900/90 ring-1 ring-indigo-500/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">{inc.id}</span>
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        inc.severity === 'CRITICAL'
                          ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300 border border-red-300 dark:border-red-500/40'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                      }`}
                    >
                      {inc.severity}
                    </span>
                  </div>

                  <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-1 mb-1">{inc.title}</h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-2">{inc.summary}</p>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <span>Source: {inc.sourceIp}</span>
                    <span className="text-indigo-600 dark:text-cyan-400 font-semibold">{inc.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Detailed Investigation Workspace (8 cols) */}
        <div className="lg:col-span-8">
          {activeIncident ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
              {/* Incident Header & Status Workflow */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300">
                      {activeIncident.id}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        activeIncident.severity === 'CRITICAL'
                          ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300 border border-red-300 dark:border-red-500/40'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                      }`}
                    >
                      {activeIncident.severity} Severity
                    </span>
                    <span className="text-xs font-mono text-slate-500">Session: {activeIncident.sessionId}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{activeIncident.title}</h3>
                  <div className="flex items-center gap-3 text-xs font-mono text-slate-500 mt-1">
                    <span>Source IP: <strong className="text-slate-800 dark:text-slate-200">{activeIncident.sourceIp}</strong></span>
                    <span>·</span>
                    <span>Created: {activeIncident.createdAt.slice(0, 19).replace('T', ' ')} UTC</span>
                  </div>
                </div>

                {/* Status Transitions */}
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 px-1 uppercase">Workflow:</span>
                  {(['NEW', 'INVESTIGATING', 'CONTAINED', 'RESOLVED'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(st)}
                      className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                        activeIncident.status === st
                          ? 'bg-indigo-600 dark:bg-cyan-600 text-white font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Observed Attack Route Corridor */}
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2 font-semibold">
                  Reconstructed Traversal Corridor ({activeIncident.observedPath.length} Nodes)
                </span>
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 font-mono text-xs flex flex-wrap items-center gap-2 text-indigo-700 dark:text-cyan-300">
                  {activeIncident.observedPath.map((nodeId, idx) => (
                    <React.Fragment key={idx}>
                      <span className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-2xs">
                        {nodeId}
                      </span>
                      {idx < activeIncident.observedPath.length - 1 && (
                        <span className="text-red-500 font-bold">➔</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* AI-Assisted Forensic Analysis Block */}
              <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/40 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300 font-semibold text-xs">
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Autonomous Forensic Deduction & Analysis</span>
                  </div>
                  <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">Grounded in Event Telemetry</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {activeIncident.aiExplanation || activeIncident.summary}
                </p>
              </div>

              {/* Autonomous Adversary Behavioral Profile & TTP Dossier */}
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-850">
                  <div className="flex items-center gap-2">
                    <Fingerprint className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                      Adversary Behavioral Profile & TTP Fingerprint
                    </span>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-bold">
                    Designation: APT-PHANTOM-LYNX
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">LATERAL VELOCITY</span>
                    <span className="text-slate-900 dark:text-slate-100 font-bold">1.4 hops / min</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">SOPHISTICATION</span>
                    <span className="text-purple-600 dark:text-purple-400 font-bold">Tier 4 (Targeted)</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">ASYMMETRIC RATIO</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">100% Intercepted</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">CONFIDENCE</span>
                    <span className="text-indigo-600 dark:text-cyan-400 font-bold">99.4% Grounded</span>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400 flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-slate-400 dark:text-slate-500">Observed Toolchain Signatures:</span>
                  <span className="px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-900 text-slate-800 dark:text-slate-300">nmap-nse-probe</span>
                  <span className="px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-900 text-slate-800 dark:text-slate-300">aws-cred-scanner</span>
                  <span className="px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-900 text-slate-800 dark:text-slate-300">tty-keystroke-script</span>
                  <span className="px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-900 text-slate-800 dark:text-slate-300">canary-tripwire-trigger</span>
                </div>
              </div>

              {/* Correlated Event Timeline */}
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2 font-semibold">
                  Chronological Telemetry Chain ({correlatedEvents.length} Events)
                </span>
                <div className="space-y-2">
                  {correlatedEvents.map((evt) => (
                    <div
                      key={evt.eventId}
                      className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-cyan-400">{evt.eventId}</span>
                          <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">T+{evt.relativeTimeSec}s</span>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                              evt.outcome === 'TRIPPED_CANARY'
                                ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400'
                            }`}
                          >
                            {evt.outcome}
                          </span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">{evt.description}</p>
                      </div>

                      <div className="text-right text-[10px] font-mono text-slate-400 shrink-0">
                        <div>{evt.protocol}</div>
                        <div className="text-slate-800 dark:text-slate-300 font-semibold">{evt.targetAssetId}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Containment Actions in Simulation */}
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2 font-semibold">
                  Interactive Containment Measures (Simulation State)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeIncident.recommendedActions.map((action) => (
                    <div
                      key={action.id}
                      onClick={() => handleToggleAction(action.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        action.applied
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-600/50 text-emerald-800 dark:text-emerald-200'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle2
                          className={`w-4 h-4 ${action.applied ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-600'}`}
                        />
                        <span className="font-medium">{action.label}</span>
                      </div>
                      <span className="text-[10px] font-mono uppercase text-slate-400 dark:text-slate-500">
                        {action.applied ? 'APPLIED' : 'PENDING'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Analyst Notes */}
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2 font-semibold">
                  Analyst Log & Audit Entries ({activeIncident.analystNotes.length})
                </span>

                <div className="space-y-2 mb-3">
                  {activeIncident.analystNotes.map((note) => (
                    <div
                      key={note.id}
                      className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 dark:text-slate-500 mb-1">
                        <span className="text-slate-900 dark:text-slate-200 font-semibold">{note.author}</span>
                        <span>{note.timestamp.slice(11, 19)} UTC</span>
                      </div>
                      <p className="leading-relaxed">{note.note}</p>
                    </div>
                  ))}
                </div>

                {/* Add Note Form */}
                <form onSubmit={handleAddNoteSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Add verified forensic note or hypothesis..."
                    className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 dark:focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    disabled={submittingNote || !newNoteText.trim()}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Save Note</span>
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              Select an incident from the left list to view forensic details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
