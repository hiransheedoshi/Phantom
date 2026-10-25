import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Activity,
  Lock,
  Copy,
  Check,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { Incident, EvidenceChainBlock } from '../../types/cyber';
import { api } from '../../services/api';

interface ReportsViewProps {
  incidents: Incident[];
  onOpenIncident?: (id: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ incidents, onOpenIncident }) => {
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(
    incidents[0]?.id || 'INC-2026-084'
  );
  const [activeTab, setActiveTab] = useState<'report' | 'evidence_ledger'>('report');
  const [reportMarkdown, setReportMarkdown] = useState<string>('');
  const [generating, setGenerating] = useState<boolean>(false);
  const [usedAiEngine, setUsedAiEngine] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Blockchain Evidence Chain State
  const [evidenceBlocks, setEvidenceBlocks] = useState<EvidenceChainBlock[]>([]);
  const [verifyingChain, setVerifyingChain] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<{
    valid: boolean;
    totalBlocks: number;
    verifiedBlocks: number;
  } | null>(null);

  const loadReport = async (incidentId: string) => {
    try {
      setGenerating(true);
      const res = await api.generateIncidentReport(incidentId);
      setReportMarkdown(res.reportMarkdown);
      setUsedAiEngine(res.usedAiEngine);
    } catch (err) {
      console.error('Failed to generate report:', err);
    } finally {
      setGenerating(false);
    }
  };

  const loadEvidenceChain = async () => {
    try {
      const blocks = await api.getEvidenceChain();
      setEvidenceBlocks(blocks);
    } catch (err) {
      console.error('Failed to load evidence chain:', err);
    }
  };

  useEffect(() => {
    if (selectedIncidentId) {
      loadReport(selectedIncidentId);
    }
    loadEvidenceChain();
  }, [selectedIncidentId]);

  const handleVerifyChain = async () => {
    try {
      setVerifyingChain(true);
      const result = await api.verifyEvidenceChain();
      setVerificationResult(result);
    } catch (err) {
      console.error('Failed to verify chain:', err);
    } finally {
      setVerifyingChain(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(reportMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([reportMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incident-report-${selectedIncidentId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 uppercase font-semibold">
                Autonomous Forensic Reports
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Formal Dossiers & Tamper-Evident Ledger</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Reports & Evidence Dossiers</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Produces formal cybersecurity incident reports citing exact event IDs, with cryptographic SHA-256 evidence chain verification.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedIncidentId}
              onChange={(e) => setSelectedIncidentId(e.target.value)}
              className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500 shadow-sm"
            >
              {incidents.map((inc) => (
                <option key={inc.id} value={inc.id}>
                  {inc.id} — {inc.title.slice(0, 30)}...
                </option>
              ))}
            </select>

            <button
              onClick={() => loadReport(selectedIncidentId)}
              disabled={generating}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg flex items-center gap-1.5 text-xs font-semibold shadow-sm transition-colors whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Regenerate</span>
            </button>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab('report')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'report'
                ? 'bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-cyan-300 font-semibold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Formal Incident Report</span>
          </button>

          <button
            onClick={() => setActiveTab('evidence_ledger')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'evidence_ledger'
                ? 'bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-cyan-300 font-semibold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Cryptographic Evidence Ledger (SHA-256)</span>
          </button>
        </div>
      </div>

      {activeTab === 'report' ? (
        /* Incident Report Tab */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                Target Dossier: <strong className="text-slate-900 dark:text-slate-200">{selectedIncidentId}</strong>
              </span>
              {usedAiEngine ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/40 font-semibold">
                  AI-Enhanced Report
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-medium">
                  Deterministic Forensic Engine
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Text'}</span>
              </button>

              <button
                onClick={handleDownloadMarkdown}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .md</span>
              </button>
            </div>
          </div>

          {generating ? (
            <div className="flex items-center justify-center h-72">
              <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-mono text-xs">
                <Activity className="w-4 h-4 text-cyan-600 dark:text-cyan-400 animate-spin" />
                <span>Synthesizing evidence events and generating report...</span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-6 font-mono text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap max-h-[640px] overflow-y-auto">
              {reportMarkdown}
            </div>
          )}
        </div>
      ) : (
        /* Cryptographic Evidence Chain Tab */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Lock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Cryptographic Evidence Hash Chain</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Every qualifying security event payload is canonicalized and bound into an immutable SHA-256 hash chain with strict chronological ordering.
              </p>
            </div>

            <button
              onClick={handleVerifyChain}
              disabled={verifyingChain}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg flex items-center gap-2 text-xs font-semibold transition-colors whitespace-nowrap shadow-sm"
            >
              {verifyingChain ? (
                <>
                  <Activity className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying Proofs...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify Hash Chain Integrity</span>
                </>
              )}
            </button>
          </div>

          {/* Verification Status Banner */}
          {verificationResult && (
            <div
              className={`p-4 rounded-xl border flex items-center justify-between text-xs font-mono ${verificationResult.valid
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-600/50 text-emerald-800 dark:text-emerald-200'
                  : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-600/50 text-red-800 dark:text-red-200'
                }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>
                  Ledger Status: <strong>{verificationResult.valid ? '100% UNTAMPERED' : 'CHAIN COMPROMISED'}</strong>
                </span>
              </div>
              <span>
                {verificationResult.verifiedBlocks} / {verificationResult.totalBlocks} Blocks Verified
              </span>
            </div>
          )}

          {/* Blocks List */}
          <div className="space-y-3 font-mono text-xs">
            {evidenceBlocks.map((block) => (
              <div
                key={block.blockIndex}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-200 dark:border-slate-900">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-900 text-slate-800 dark:text-cyan-300 font-bold">
                      BLOCK #{block.blockIndex}
                    </span>
                    <span className="text-slate-800 dark:text-slate-300 font-medium">{block.recordId}</span>
                    <span>·</span>
                    <span className="text-slate-500">Event: {block.eventId}</span>
                  </div>
                  <span className="text-slate-500 tabular-nums">{block.timestamp}</span>
                </div>

                <div className="space-y-1 text-[11px]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-slate-500">Payload Hash:</span>
                    <span className="text-slate-700 dark:text-slate-300 truncate max-w-lg">{block.payloadCanonicalHash}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-slate-500">Previous Hash:</span>
                    <span className="text-slate-600 dark:text-slate-400 truncate max-w-lg">{block.previousHash}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-1 border-t border-slate-200 dark:border-slate-900">
                    <span className="text-indigo-600 dark:text-cyan-400 font-semibold">Block Hash:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold truncate max-w-lg">{block.blockHash}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
