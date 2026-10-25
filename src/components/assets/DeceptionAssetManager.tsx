import React, { useState } from 'react';
import {
  Radio,
  FileWarning,
  KeyRound,
  DatabaseZap,
  Plus,
  Search,
  Filter,
  Eye,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  X,
  FileCode,
  Shield,
  Layers,
} from 'lucide-react';
import { Asset, TrustZone } from '../../types/cyber';

interface DeceptionAssetManagerProps {
  assets: Asset[];
  onCreateAsset: (asset: Partial<Asset>) => Promise<void>;
  onUpdateAsset: (id: string, updates: Partial<Asset>) => Promise<void>;
  onDeleteAsset: (id: string) => Promise<void>;
}

// Preset templates for quick, realistic decoy creation
const DECOY_TEMPLATES = [
  {
    name: 'Decoy Executive Compensation (Excel WebBug)',
    type: 'decoy_file' as const,
    trustZone: 'finance_enclave' as const,
    decoyType: 'canary_document' as const,
    ipAddress: '10.0.30.5',
    os: 'Canarytoken MS-Excel',
    description: 'Armored spreadsheet weaponized with embedded URL canary beacon.',
    payloadPreview:
      'Workbook: Executive_Compensation_Review_2026.xlsx\nSheet: Board_Summary\n[B2] Total Target Discretionary Bonus: $850,000\n[WebBug URL] http://canary.trace.phantom/beacon/exec_bonus_audit',
  },
  {
    name: 'Decoy AWS S3 Production Credentials',
    type: 'decoy_credential' as const,
    trustZone: 'corporate_lan' as const,
    decoyType: 'cloud_token' as const,
    ipAddress: '10.0.20.44',
    os: 'Synthetic AWS IAM Token',
    description: 'Planted ~/.aws/credentials dotfile token with zero actual AWS permissions.',
    payloadPreview:
      '[production_backup]\naws_access_key_id = AKIAIOSFODNN7EXAMPLE\naws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY\nregion = us-east-1',
  },
  {
    name: 'OpenCanary SMB Shared Storage (\\\\CORP-NAS)',
    type: 'decoy_service' as const,
    trustZone: 'corporate_lan' as const,
    decoyType: 'opencanary_service' as const,
    ipAddress: '10.0.20.99',
    os: 'OpenCanary Samba Sensor',
    description: 'Deceptive SMB file share listening on ports 139 and 445.',
    payloadPreview:
      '\\\\CORP-NAS\\Engineering_Vault\n  -> database_passwords.kdbx\n  -> vpn_client_certificates.tar.gz\n  -> internal_network_map.pdf',
  },
  {
    name: 'Cowrie SSH Honeypot Bastion (Port 2222)',
    type: 'decoy_service' as const,
    trustZone: 'decoy_sandbox' as const,
    decoyType: 'cowrie_ssh' as const,
    ipAddress: '10.0.99.10',
    os: 'Cowrie Interactive Shell v2.4',
    description: 'Simulated high-interaction Linux SSH bastion capturing keystrokes and session inputs.',
    payloadPreview:
      'Cowrie TTY Log Active\n$ ssh dev-admin@10.0.99.10 -p 2222\nPassword: *******\nLast login: Fri Oct 24 19:40:12 from 198.51.100.42\n[Session Keylogger armed]',
  },
  {
    name: 'Decoy Customer Banking Vault (MySQL 3306)',
    type: 'decoy_database' as const,
    trustZone: 'finance_enclave' as const,
    decoyType: 'honey_db' as const,
    ipAddress: '10.0.30.99',
    os: 'MySQL 5.7 Honeypot',
    description: 'Simulated MySQL database with synthetic credit cards and administrative accounts.',
    payloadPreview:
      'DATABASE: core_customer_vault\nTABLE: payment_instruments (500 synthetic rows)\nSELECT * FROM payment_instruments;\n[Tripwire Alert: Immediate SQL Dump Detected]',
  },
];

export const DeceptionAssetManager: React.FC<DeceptionAssetManagerProps> = ({
  assets,
  onCreateAsset,
  onUpdateAsset,
  onDeleteAsset,
}) => {
  const [zoneFilter, setZoneFilter] = useState<'all' | TrustZone>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    trustZone: 'corporate_lan' as TrustZone,
    type: 'decoy_file' as any,
    decoyType: 'canary_document' as any,
    ipAddress: '10.0.20.90',
    description: '',
    payloadPreview: '',
  });

  const decoys = assets.filter((a) => a.category === 'decoy');

  const filteredDecoys = decoys.filter((d) => {
    if (zoneFilter !== 'all' && d.trustZone !== zoneFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        d.name.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q) ||
        d.ipAddress.includes(q) ||
        d.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleApplyTemplate = (tmpl: (typeof DECOY_TEMPLATES)[0]) => {
    setFormData({
      name: tmpl.name,
      trustZone: tmpl.trustZone,
      type: tmpl.type,
      decoyType: tmpl.decoyType,
      ipAddress: tmpl.ipAddress,
      description: tmpl.description,
      payloadPreview: tmpl.payloadPreview,
    });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    await onCreateAsset({
      name: formData.name,
      type: formData.type,
      category: 'decoy',
      trustZone: formData.trustZone,
      ipAddress: formData.ipAddress,
      os: 'Simulated Decoy Asset',
      openPorts: formData.type === 'decoy_service' ? [80, 443] : [],
      description: formData.description || 'User-provisioned deception tripwire.',
      decoyDetails: {
        decoyType: formData.decoyType,
        tripwireSignature: `SIG-CUST-${Date.now().toString(36).toUpperCase()}`,
        syntheticPayloadPreview: formData.payloadPreview || 'Synthetic Decoy Content Payload',
        interactionCount: 0,
        deploymentZone: formData.trustZone,
      },
    });

    setShowCreateModal(false);
  };

  const handleToggleStatus = async (asset: Asset) => {
    const newStatus = asset.status === 'online' ? 'offline' : 'online';
    await onUpdateAsset(asset.id, { status: newStatus as any });
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 uppercase tracking-wider font-semibold">
              Deception Fleet
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Canary Files, Tokens & Honey Services</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Deception Asset Management</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Deploy realistic decoy digital assets to divert adversaries and produce zero-false-positive forensic alarms.
          </p>
        </div>

        <button
          onClick={() => {
            handleApplyTemplate(DECOY_TEMPLATES[0]);
            setShowCreateModal(true);
          }}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg flex items-center justify-center gap-2 text-xs font-semibold shadow-xs transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Deploy New Decoy</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xs">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setZoneFilter('all')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              zoneFilter === 'all'
                ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            All Decoys ({decoys.length})
          </button>
          <button
            onClick={() => setZoneFilter('dmz')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              zoneFilter === 'dmz' ? 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            DMZ
          </button>
          <button
            onClick={() => setZoneFilter('corporate_lan')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              zoneFilter === 'corporate_lan' ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Corp LAN
          </button>
          <button
            onClick={() => setZoneFilter('finance_enclave')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              zoneFilter === 'finance_enclave' ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Finance Enclave
          </button>
          <button
            onClick={() => setZoneFilter('decoy_sandbox')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              zoneFilter === 'decoy_sandbox' ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Decoy Sandbox
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search decoy name, signature, IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-purple-500 w-56"
          />
        </div>
      </div>

      {/* Decoys Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDecoys.map((asset) => (
          <div
            key={asset.id}
            className={`border rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between ${
              asset.status === 'tripped'
                ? 'border-red-400 dark:border-red-500/60 bg-red-50/50 dark:bg-red-950/10'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                  {asset.id}
                </span>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                      asset.status === 'tripped'
                        ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300 border border-red-300 dark:border-red-500/40'
                        : asset.status === 'online'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {asset.status.toUpperCase()}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 uppercase">
                    {asset.trustZone.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1 line-clamp-1">{asset.name}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 line-clamp-2 leading-relaxed">{asset.description}</p>

              {/* Decoy Stats Pill */}
              <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3 text-xs font-mono space-y-1.5 border border-slate-200 dark:border-slate-800/80 mb-4">
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Type:</span>
                  <span className="text-purple-600 dark:text-purple-400 font-semibold">{asset.decoyDetails?.decoyType || asset.type}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Simulated IP:</span>
                  <span className="text-slate-800 dark:text-slate-300 tabular-nums">{asset.ipAddress}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Tripwire Hits:</span>
                  <span className="text-red-600 dark:text-red-400 font-bold tabular-nums">
                    {asset.decoyDetails?.interactionCount || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setPreviewAsset(asset)}
                className="flex items-center gap-1.5 text-xs text-purple-700 dark:text-purple-300 hover:text-purple-800 dark:hover:text-purple-200 font-medium py-1 px-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800/50 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Payload</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleStatus(asset)}
                  className={`text-xs px-2.5 py-1 rounded-lg transition-colors font-medium ${
                    asset.status === 'online'
                      ? 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800'
                      : 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800/60'
                  }`}
                >
                  {asset.status === 'online' ? 'Deactivate' : 'Arm Decoy'}
                </button>

                <button
                  onClick={() => onDeleteAsset(asset.id)}
                  title="Remove Decoy Asset"
                  className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Deploy New Decoy Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Deploy Cyber Deception Asset</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Templates Strip */}
            <div className="mb-4">
              <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block mb-2 font-semibold">
                Select Proven Deception Template:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DECOY_TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyTemplate(tmpl)}
                    className="text-left p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-purple-400 transition-colors"
                  >
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-200 truncate">{tmpl.name}</div>
                    <div className="text-[10px] text-slate-500 uppercase">{tmpl.trustZone.replace('_', ' ')}</div>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Asset Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Decoy Executive Payroll 2026.xlsx"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Trust Zone Placement</label>
                  <select
                    value={formData.trustZone}
                    onChange={(e) => setFormData({ ...formData, trustZone: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="dmz">DMZ Perimeter</option>
                    <option value="corporate_lan">Corporate LAN</option>
                    <option value="finance_enclave">Finance Enclave</option>
                    <option value="decoy_sandbox">Decoy Sandbox Zone</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Decoy Category</label>
                  <select
                    value={formData.decoyType}
                    onChange={(e) => setFormData({ ...formData, decoyType: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="canary_document">Canary Document (WebBug)</option>
                    <option value="cloud_token">Synthetic Cloud Token</option>
                    <option value="fake_credential">Fake Database Credential</option>
                    <option value="opencanary_service">OpenCanary Sensor Service</option>
                    <option value="cowrie_ssh">Cowrie SSH Honey Bastion</option>
                    <option value="honey_db">Honey Database Table</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Simulated IP Address</label>
                <input
                  type="text"
                  value={formData.ipAddress}
                  onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                  placeholder="10.0.20.90"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Purpose & Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Explains what this decoy detects and where it is planted..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Synthetic Payload Preview (Safe Fake Content)
                </label>
                <textarea
                  rows={4}
                  value={formData.payloadPreview}
                  onChange={(e) => setFormData({ ...formData, payloadPreview: e.target.value })}
                  placeholder="Enter safe synthetic payload (e.g. fake config lines, fake accounts)..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                >
                  Deploy Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Synthetic Payload View Modal */}
      {previewAsset && previewAsset.decoyDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{previewAsset.name} — Payload</h4>
              </div>
              <button
                onClick={() => setPreviewAsset(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
              Synthetic payload presented to simulated adversaries when this asset is interacted with:
            </p>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-emerald-400 overflow-x-auto whitespace-pre-wrap max-h-64">
              {previewAsset.decoyDetails.syntheticPayloadPreview}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setPreviewAsset(null)}
                className="px-4 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
