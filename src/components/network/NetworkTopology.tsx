import React, { useState, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  applyNodeChanges,
  NodeChange,
} from '@xyflow/react';
import {
  ShieldAlert,
  Search,
  Filter,
  Eye,
  RotateCcw,
  Layers,
  Sparkles,
  X,
  FileCode,
  Terminal,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { Asset, TrustZone } from '../../types/cyber';
import { CyberNode } from './CyberNode';
import { useTheme } from '../../context/ThemeContext';

interface NetworkTopologyProps {
  assets: Asset[];
  observedPath?: string[];
  activeStepNodeId?: string;
  onUpdateAsset?: (asset: Asset) => void;
}

const nodeTypes = {
  cyberNode: CyberNode,
};

// Base topology connectivity
const BASE_TOPOLOGY_EDGES: Edge[] = [
  { id: 'e-gw-web', source: 'SRV-EDGE-GW', target: 'SRV-WEB-PORTAL', style: { strokeWidth: 1.5 } },
  { id: 'e-gw-canary', source: 'SRV-EDGE-GW', target: 'CANARY-HTTP-PORTAL', style: { strokeDasharray: '4 4' } },
  { id: 'e-web-eng', source: 'SRV-WEB-PORTAL', target: 'WS-ENG-04', style: { strokeWidth: 1.5 } },
  { id: 'e-eng-aws', source: 'WS-ENG-04', target: 'DECOY-AWS-CREDS', style: { strokeDasharray: '3 3' } },
  { id: 'e-eng-fin', source: 'WS-ENG-04', target: 'WS-FIN-02', style: { strokeWidth: 1.5 } },
  { id: 'e-eng-idp', source: 'WS-ENG-04', target: 'IDP-AUTH0-PROXY' },
  { id: 'e-fin-smb', source: 'WS-FIN-02', target: 'DECOY-SMB-SHARE', style: { strokeDasharray: '3 3' } },
  { id: 'e-fin-erp', source: 'WS-FIN-02', target: 'SRV-FIN-APP', style: { strokeWidth: 1.5 } },
  { id: 'e-erp-db', source: 'SRV-FIN-APP', target: 'DB-PROD-POSTGRES', style: { strokeWidth: 2 } },
  { id: 'e-erp-payroll', source: 'SRV-FIN-APP', target: 'DECOY-PAYROLL-DOC', style: { strokeDasharray: '3 3' } },
  { id: 'e-erp-honeydb', source: 'SRV-FIN-APP', target: 'DB-DECOY-HONEY', style: { strokeDasharray: '3 3' } },
  { id: 'e-gw-bastion', source: 'SRV-EDGE-GW', target: 'HONEY-SSH-BASTION', style: { strokeDasharray: '4 4' } },
  { id: 'e-core-telemetry', source: 'PHANTOM-CORE-ENGINE', target: 'SRV-FIN-APP', style: { strokeDasharray: '2 2' } },
];

export const NetworkTopology: React.FC<NetworkTopologyProps> = ({
  assets,
  observedPath = [],
  activeStepNodeId,
  onUpdateAsset,
}) => {
  const { isDark } = useTheme();
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [zoneFilter, setZoneFilter] = useState<'all' | TrustZone>('all');
  const [decoysOnly, setDecoysOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPayloadModal, setShowPayloadModal] = useState(false);

  // Filter nodes
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      if (zoneFilter !== 'all' && asset.trustZone !== zoneFilter) return false;
      if (decoysOnly && asset.category !== 'decoy') return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          asset.name.toLowerCase().includes(query) ||
          asset.id.toLowerCase().includes(query) ||
          asset.ipAddress.includes(query)
        );
      }
      return true;
    });
  }, [assets, zoneFilter, decoysOnly, searchQuery]);

  // Construct React Flow nodes
  const initialNodes: Node[] = useMemo(() => {
    return filteredAssets.map((asset) => ({
      id: asset.id,
      type: 'cyberNode',
      position: asset.position || { x: 100, y: 100 },
      data: {
        asset,
        isObservedPath: observedPath.includes(asset.id) || activeStepNodeId === asset.id,
        isSelected: selectedAsset?.id === asset.id,
        onSelect: (a: Asset) => setSelectedAsset(a),
      },
    }));
  }, [filteredAssets, observedPath, activeStepNodeId, selectedAsset]);

  const [nodes, setNodes] = useState<Node[]>(initialNodes);

  React.useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  // Dynamic edges based on observed attack path and theme
  const edges: Edge[] = useMemo(() => {
    const dynamicEdges: Edge[] = BASE_TOPOLOGY_EDGES.map((e) => ({
      ...e,
      style: {
        ...e.style,
        stroke: isDark ? '#334155' : '#94a3b8',
      },
    }));

    if (observedPath && observedPath.length > 1) {
      for (let i = 0; i < observedPath.length - 1; i++) {
        const source = observedPath[i];
        const target = observedPath[i + 1];
        const edgeId = `attack-${source}-${target}-${i}`;

        const existingIdx = dynamicEdges.findIndex(
          (e) => (e.source === source && e.target === target) || (e.source === target && e.target === source)
        );

        if (existingIdx !== -1) {
          dynamicEdges[existingIdx] = {
            ...dynamicEdges[existingIdx],
            animated: true,
            style: {
              stroke: '#ef4444',
              strokeWidth: 3,
            },
            className: 'animated-attack-edge',
          };
        } else {
          dynamicEdges.push({
            id: edgeId,
            source,
            target,
            animated: true,
            style: {
              stroke: isDark ? '#38bdf8' : '#0284c7',
              strokeWidth: 2.5,
            },
            className: 'animated-attack-edge',
          });
        }
      }
    }

    return dynamicEdges;
  }, [observedPath, isDark]);

  const handleIsolateToggle = () => {
    if (!selectedAsset) return;
    const newStatus = selectedAsset.status === 'isolated' ? 'online' : 'isolated';
    const updated = { ...selectedAsset, status: newStatus as any };
    setSelectedAsset(updated);
    if (onUpdateAsset) onUpdateAsset(updated);
  };

  return (
    <div className="relative w-full h-[620px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-xs">
      {/* Top Filter and Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white/95 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 z-10 backdrop-blur-md">
        {/* Zone Segmented Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setZoneFilter('all')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              zoneFilter === 'all'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-cyan-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            All Zones ({assets.length})
          </button>
          <button
            onClick={() => setZoneFilter('dmz')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              zoneFilter === 'dmz'
                ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800/60'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            DMZ
          </button>
          <button
            onClick={() => setZoneFilter('corporate_lan')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              zoneFilter === 'corporate_lan'
                ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800/60'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Corp LAN
          </button>
          <button
            onClick={() => setZoneFilter('finance_enclave')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              zoneFilter === 'finance_enclave'
                ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Finance Enclave
          </button>
          <button
            onClick={() => setZoneFilter('decoy_sandbox')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              zoneFilter === 'decoy_sandbox'
                ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800/60'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Decoy Sandbox
          </button>
        </div>

        {/* Search & Decoy Toggle */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search asset, IP, type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 w-44"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300 select-none">
            <input
              type="checkbox"
              checked={decoysOnly}
              onChange={(e) => setDecoysOnly(e.target.checked)}
              className="rounded bg-slate-100 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-purple-600 focus:ring-0"
            />
            <span>Decoys Only</span>
          </label>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 w-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.3}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background color={isDark ? '#1e293b' : '#cbd5e1'} gap={20} size={1} />
          <Controls showInteractive={false} position="bottom-left" />
          <MiniMap
            nodeColor={(node: any) => {
              if (node.data?.asset?.category === 'decoy') return '#a855f7';
              if (node.data?.asset?.trustZone === 'finance_enclave') return '#f59e0b';
              return '#38bdf8';
            }}
            maskColor={isDark ? 'rgba(3, 7, 18, 0.75)' : 'rgba(241, 245, 249, 0.75)'}
            position="bottom-right"
            style={{ width: 140, height: 90 }}
          />
        </ReactFlow>

        {/* Legend / Info Strip */}
        <div className="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 rounded-lg px-3 py-2 text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-4 pointer-events-none z-10 shadow-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
            <span>Production Node</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            <span>Decoy Honeypot</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span>Tripped Canary Sensor</span>
          </div>
          {observedPath.length > 0 && (
            <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-300 font-mono">
              <Activity className="w-3.5 h-3.5 text-cyan-500 animate-spin" />
              <span>{observedPath.length} Hops Traversed</span>
            </div>
          )}
        </div>
      </div>

      {/* Node Detail Drawer */}
      {selectedAsset && (
        <div className="absolute top-0 right-0 w-84 h-full bg-white/95 dark:bg-slate-900/95 border-l border-slate-200 dark:border-slate-800 p-5 shadow-2xl backdrop-blur-md overflow-y-auto z-20 transition-transform text-slate-900 dark:text-slate-100">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {selectedAsset.id}
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                  selectedAsset.status === 'tripped'
                    ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300 border border-red-300 dark:border-red-500/40'
                    : selectedAsset.status === 'isolated'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                }`}
              >
                {selectedAsset.status.toUpperCase()}
              </span>
            </div>
            <button
              onClick={() => setSelectedAsset(null)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-100 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h3 className="text-sm font-bold mb-1">{selectedAsset.name}</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">{selectedAsset.description}</p>

          <div className="space-y-2 text-xs font-mono border-t border-b border-slate-200 dark:border-slate-800/80 py-3 mb-4">
            <div className="flex justify-between">
              <span className="text-slate-400">Category:</span>
              <span className={selectedAsset.category === 'decoy' ? 'text-purple-600 dark:text-purple-400 font-semibold' : 'text-slate-700 dark:text-slate-300'}>
                {selectedAsset.category.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Trust Zone:</span>
              <span className="uppercase text-slate-700 dark:text-slate-300">{selectedAsset.trustZone.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">IP Address:</span>
              <span className="text-slate-700 dark:text-slate-300 tabular-nums">{selectedAsset.ipAddress}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">OS / Profile:</span>
              <span className="text-slate-700 dark:text-slate-300 truncate max-w-[140px]">{selectedAsset.os}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Open Ports:</span>
              <span className="text-slate-700 dark:text-slate-300">{selectedAsset.openPorts.join(', ') || 'Host Only'}</span>
            </div>
          </div>

          {/* Decoy Specifics */}
          {selectedAsset.category === 'decoy' && selectedAsset.decoyDetails && (
            <div className="mb-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 rounded-lg p-3 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Deception Specifications</span>
              </div>
              <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
                Signature: <span className="text-slate-900 dark:text-slate-200">{selectedAsset.decoyDetails.tripwireSignature}</span>
              </div>
              <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
                Recorded Hits: <span className="text-purple-600 dark:text-purple-400 font-bold">{selectedAsset.decoyDetails.interactionCount}</span>
              </div>

              <button
                onClick={() => setShowPayloadModal(true)}
                className="w-full mt-2 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-purple-700 dark:text-purple-200 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/40 dark:hover:bg-purple-900/60 border border-purple-300 dark:border-purple-700/50 rounded transition-colors"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>View Synthetic Decoy Payload</span>
              </button>
            </div>
          )}

          {/* Quick Actions */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleIsolateToggle}
              className={`w-full py-2 text-xs font-semibold rounded-lg transition-colors ${
                selectedAsset.status === 'isolated'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-amber-600 hover:bg-amber-500 text-white'
              }`}
            >
              {selectedAsset.status === 'isolated' ? 'Re-enable Simulated Node' : 'Isolate Node in Simulation'}
            </button>
          </div>
        </div>
      )}

      {/* Synthetic Payload Modal */}
      {showPayloadModal && selectedAsset?.decoyDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl max-w-lg w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Safe Synthetic Decoy Preview</h4>
              </div>
              <button
                onClick={() => setShowPayloadModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
              This deceptive content is safely generated to divert adversaries with zero production credentials or real-world secrets.
            </p>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-emerald-400 overflow-x-auto whitespace-pre-wrap max-h-60">
              {selectedAsset.decoyDetails.syntheticPayloadPreview}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowPayloadModal(false)}
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
