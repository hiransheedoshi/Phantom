import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  Laptop,
  Server,
  Database,
  Shield,
  KeyRound,
  FileWarning,
  Flame,
  Radio,
  DatabaseZap,
} from 'lucide-react';
import { Asset, TrustZone } from '../../types/cyber';

interface CyberNodeData {
  asset: Asset;
  isObservedPath: boolean;
  isSelected: boolean;
  onSelect: (asset: Asset) => void;
}

const getZoneColor = (zone: TrustZone) => {
  switch (zone) {
    case 'dmz':
      return 'border-sky-300 dark:border-sky-500/30 text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40';
    case 'corporate_lan':
      return 'border-indigo-300 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40';
    case 'finance_enclave':
      return 'border-amber-300 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40';
    case 'decoy_sandbox':
      return 'border-purple-300 dark:border-purple-500/30 text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40';
    default:
      return 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/40';
  }
};

const getZoneLabel = (zone: TrustZone) => {
  switch (zone) {
    case 'dmz':
      return 'DMZ';
    case 'corporate_lan':
      return 'CORP LAN';
    case 'finance_enclave':
      return 'FINANCE';
    case 'decoy_sandbox':
      return 'SANDBOX';
  }
};

const getNodeIcon = (asset: Asset) => {
  if (asset.category === 'decoy') {
    if (asset.decoyDetails?.decoyType === 'canary_document') return <FileWarning className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
    if (asset.decoyDetails?.decoyType === 'cloud_token' || asset.decoyDetails?.decoyType === 'fake_credential')
      return <KeyRound className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
    if (asset.decoyDetails?.decoyType === 'honey_db') return <DatabaseZap className="w-4 h-4 text-red-600 dark:text-red-400" />;
    return <Radio className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
  }

  switch (asset.type) {
    case 'workstation':
      return <Laptop className="w-4 h-4 text-slate-700 dark:text-slate-300" />;
    case 'server':
      return <Server className="w-4 h-4 text-slate-700 dark:text-slate-300" />;
    case 'database':
      return <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    case 'gateway':
      return <Shield className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
    case 'identity':
      return <KeyRound className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    default:
      return <Server className="w-4 h-4 text-slate-600 dark:text-slate-400" />;
  }
};

export const CyberNode = memo(({ data }: { data: CyberNodeData }) => {
  const { asset, isObservedPath, isSelected, onSelect } = data;
  const isDecoy = asset.category === 'decoy';
  const isTripped = asset.status === 'tripped';

  return (
    <div
      onClick={() => onSelect(asset)}
      className={`relative min-w-[210px] rounded-xl p-3 cursor-pointer transition-all duration-150 backdrop-blur-md select-none ${
        isTripped
          ? 'bg-red-50 dark:bg-red-950/40 border-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.25)]'
          : isObservedPath
          ? 'bg-sky-50/90 dark:bg-slate-900/90 border-2 border-cyan-500 dark:border-cyan-400 shadow-[0_0_15px_rgba(56,189,248,0.25)]'
          : isSelected
          ? 'bg-slate-50 dark:bg-slate-900/90 border-2 border-indigo-500 dark:border-cyan-400 shadow-md'
          : isDecoy
          ? 'bg-white dark:bg-slate-900/80 border border-purple-300 dark:border-purple-500/50 hover:border-purple-400 shadow-xs'
          : 'bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600 shadow-xs'
      }`}
    >
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-cyan-500 !border-white dark:!border-slate-900" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-cyan-500 !border-white dark:!border-slate-900" />

      {/* Header zone & type */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <div
            className={`p-1 rounded ${
              isTripped
                ? 'bg-red-100 dark:bg-red-500/20'
                : isDecoy
                ? 'bg-purple-100 dark:bg-purple-500/20'
                : 'bg-slate-100 dark:bg-slate-800'
            }`}
          >
            {getNodeIcon(asset)}
          </div>
          <span className="text-[10px] font-mono tracking-wider text-slate-500 dark:text-slate-400 uppercase truncate max-w-[90px]">
            {asset.id}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {isDecoy && (
            <span
              className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider font-semibold ${
                isTripped
                  ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300 border border-red-300 dark:border-red-500/40'
                  : 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300'
              }`}
            >
              {isTripped ? 'Tripped' : 'Decoy'}
            </span>
          )}
          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${getZoneColor(asset.trustZone)}`}>
            {getZoneLabel(asset.trustZone)}
          </span>
        </div>
      </div>

      {/* Asset Name */}
      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate mb-1" title={asset.name}>
        {asset.name}
      </div>

      {/* IP & Status Details */}
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/80">
        <span className="tabular-nums">{asset.ipAddress}</span>
        {isDecoy && asset.decoyDetails ? (
          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
            {asset.decoyDetails.interactionCount} hit{asset.decoyDetails.interactionCount !== 1 ? 's' : ''}
          </span>
        ) : (
          <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[65px]">{asset.type}</span>
        )}
      </div>

      {/* Traversal alert pulse beacon */}
      {isTripped && (
        <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-red-500 flex items-center justify-center animate-ping" />
      )}
    </div>
  );
});

CyberNode.displayName = 'CyberNode';
