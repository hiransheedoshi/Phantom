import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  ChevronDown,
  ChevronRight,
  Flame,
  Radio,
  FileText,
  KeyRound,
  Terminal,
  Activity,
  ArrowUpDown,
  ExternalLink,
} from 'lucide-react';
import { SecurityEvent, EventSeverity, SecurityEventType } from '../../types/cyber';

interface EventExplorerProps {
  events: SecurityEvent[];
}

export const EventExplorer: React.FC<EventExplorerProps> = ({ events }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | EventSeverity>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | SecurityEventType>('ALL');
  const [outcomeFilter, setOutcomeFilter] = useState<'ALL' | 'TRIPPED_CANARY' | 'SUCCESS' | 'OBSERVED'>('ALL');
  const [sortDesc, setSortDesc] = useState(true);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [payloadViewMode, setPayloadViewMode] = useState<Record<string, 'json' | 'hex'>>({});

  const generateHexDump = (data: any): string => {
    const str = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    const bytes = Array.from(str).map((c) => c.charCodeAt(0));
    let result = '';
    for (let i = 0; i < Math.min(bytes.length, 320); i += 16) {
      const chunk = bytes.slice(i, i + 16);
      const offset = i.toString(16).padStart(4, '0');
      const hexParts = chunk.map((b) => b.toString(16).padStart(2, '0')).join(' ');
      const paddedHex = hexParts.padEnd(48, ' ');
      const ascii = chunk.map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.')).join('');
      result += `${offset}  ${paddedHex}  |${ascii}|\n`;
    }
    if (bytes.length > 320) {
      result += `... [${bytes.length - 320} bytes remaining truncated for forensic display]\n`;
    }
    return result;
  };

  const filteredEvents = useMemo(() => {
    return events
      .filter((e) => {
        if (severityFilter !== 'ALL' && e.severity !== severityFilter) return false;
        if (typeFilter !== 'ALL' && e.eventType !== typeFilter) return false;
        if (outcomeFilter !== 'ALL' && e.outcome !== outcomeFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            e.eventId.toLowerCase().includes(q) ||
            e.description.toLowerCase().includes(q) ||
            e.sourceIp.includes(q) ||
            e.sourceAssetId.toLowerCase().includes(q) ||
            e.targetAssetId.toLowerCase().includes(q) ||
            e.protocol.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return sortDesc ? timeB - timeA : timeA - timeB;
      });
  }, [events, severityFilter, typeFilter, outcomeFilter, searchQuery, sortDesc]);

  const handleExportCSV = () => {
    const headers = ['EventID', 'Timestamp', 'Severity', 'Type', 'Outcome', 'SourceAsset', 'TargetAsset', 'Protocol', 'Description'];
    const rows = filteredEvents.map((e) => [
      e.eventId,
      e.timestamp,
      e.severity,
      e.eventType,
      e.outcome,
      e.sourceAssetId,
      e.targetAssetId,
      e.protocol,
      `"${e.description.replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phantom-events-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(filteredEvents, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phantom-events-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60 uppercase font-semibold">
              Forensic Log Store
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Canonical Security Event Records</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Event Explorer</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Browse immutable telemetry events produced by autonomous honeynets, honey bastions, and digital canary tripwires during intrusion runs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg flex items-center gap-1.5 text-xs font-medium border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportJSON}
            className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg flex items-center gap-1.5 text-xs font-medium border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm">
        {/* Search */}
        <div className="relative sm:col-span-2">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search event ID, description, IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Severity */}
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value as any)}
          className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-300 focus:outline-none focus:border-cyan-500"
        >
          <option value="ALL">All Severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
          <option value="INFO">Info</option>
        </select>

        {/* Outcome */}
        <select
          value={outcomeFilter}
          onChange={(e) => setOutcomeFilter(e.target.value as any)}
          className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-300 focus:outline-none focus:border-cyan-500"
        >
          <option value="ALL">All Outcomes</option>
          <option value="TRIPPED_CANARY">Canary Tripped</option>
          <option value="SUCCESS">Success</option>
          <option value="OBSERVED">Observed</option>
        </select>

        {/* Sort Toggle */}
        <button
          onClick={() => setSortDesc(!sortDesc)}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          <span>{sortDesc ? 'Newest First' : 'Oldest First'}</span>
        </button>
      </div>

      {/* Events Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-950/30">
          <span>Displaying {filteredEvents.length} Recorded Events</span>
          <span>Validated Sensor Telemetry</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {filteredEvents.map((event) => {
            const isExpanded = expandedEventId === event.eventId;

            return (
              <div key={event.eventId} className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-950/40">
                <div
                  onClick={() => setExpandedEventId(isExpanded ? null : event.eventId)}
                  className="px-5 py-3.5 flex items-center justify-between gap-4 cursor-pointer select-none text-xs"
                >
                  <div className="flex items-center gap-3">
                    <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>

                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        event.severity === 'CRITICAL'
                          ? 'bg-red-100 text-red-700 border border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/40'
                          : event.severity === 'HIGH'
                          ? 'bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-transparent'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {event.severity}
                    </span>

                    <span className="font-mono font-bold text-slate-900 dark:text-slate-200">{event.eventId}</span>
                    <span className="font-mono text-indigo-600 dark:text-cyan-400 font-semibold">{event.eventType}</span>
                  </div>

                  <p className="text-slate-600 dark:text-slate-300 truncate max-w-md hidden md:block">{event.description}</p>

                  <div className="flex items-center gap-4 font-mono text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
                    <span
                      className={
                        event.outcome === 'TRIPPED_CANARY'
                          ? 'text-red-600 dark:text-red-400 font-bold'
                          : 'text-slate-500'
                      }
                    >
                      {event.outcome}
                    </span>
                    <span className="tabular-nums text-slate-400 dark:text-slate-500">{event.timestamp.slice(11, 19)}</span>
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800/80 text-xs space-y-3 font-mono">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-slate-600 dark:text-slate-400">
                      <div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">SOURCE HOP</span>
                        <span className="text-slate-800 dark:text-slate-200 font-medium">{event.sourceAssetId} ({event.sourceIp})</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">TARGET ASSET</span>
                        <span className="text-cyan-600 dark:text-cyan-400 font-bold">{event.targetAssetId}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">PROTOCOL / PORT</span>
                        <span className="text-slate-800 dark:text-slate-200 font-medium">{event.protocol}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">CORRELATION KEY</span>
                        <span className="text-slate-700 dark:text-slate-300 truncate block">{event.correlationKey}</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                          Forensic Telemetry Dissector
                        </span>
                        <div className="flex items-center gap-1 bg-slate-200/60 dark:bg-slate-900 p-0.5 rounded text-[10px]">
                          <button
                            onClick={() =>
                              setPayloadViewMode((prev) => ({ ...prev, [event.eventId]: 'json' }))
                            }
                            className={`px-2 py-0.5 rounded transition-colors ${
                              (payloadViewMode[event.eventId] || 'json') === 'json'
                                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-cyan-400 font-bold shadow-2xs'
                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                          >
                            Structured JSON
                          </button>
                          <button
                            onClick={() =>
                              setPayloadViewMode((prev) => ({ ...prev, [event.eventId]: 'hex' }))
                            }
                            className={`px-2 py-0.5 rounded transition-colors ${
                              payloadViewMode[event.eventId] === 'hex'
                                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-cyan-400 font-bold shadow-2xs'
                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                          >
                            Raw Hex Dissector
                          </button>
                        </div>
                      </div>

                      {payloadViewMode[event.eventId] === 'hex' ? (
                        <div className="bg-slate-950 text-cyan-400 border border-slate-800 rounded-lg p-3 font-mono text-[10px] overflow-x-auto leading-relaxed shadow-inner">
                          <div className="text-slate-500 pb-1 mb-1 border-b border-slate-900 select-none">
                            OFFSET  00 01 02 03 04 05 06 07  08 09 0A 0B 0C 0D 0E 0F  |ASCII TEXT DECODE|
                          </div>
                          <pre className="text-emerald-400">{generateHexDump(event.evidence)}</pre>
                        </div>
                      ) : (
                        <pre className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-800 dark:text-slate-300 overflow-x-auto text-[11px] leading-relaxed">
                          {JSON.stringify(event.evidence, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
