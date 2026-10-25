import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Network,
  Radio,
  PlaySquare,
  ShieldAlert,
  Sparkles,
  Sliders,
  ListFilter,
  FileCheck2,
  Settings,
  Activity,
  Compass,
  RotateCcw,
  Box,
  Share2,
} from 'lucide-react';
import { api, DashboardData } from './services/api';
import {
  Asset,
  Scenario,
  SecurityEvent,
  Incident,
  DecoyRecommendation,
  SimulationState,
} from './types/cyber';

// Views
import { CommandCenter } from './components/dashboard/CommandCenter';
import { NetworkTopology } from './components/network/NetworkTopology';
import { PhantomCyberspace } from './components/network3d/PhantomCyberspace';
import { DeceptionAssetManager } from './components/assets/DeceptionAssetManager';
import { AttackReplayTheater } from './components/replay/AttackReplayTheater';
import { IncidentsView } from './components/incidents/IncidentsView';
import { AdaptiveDeceptionLab } from './components/adaptive/AdaptiveDeceptionLab';
import { WhatIfSecurityLab } from './components/whatif/WhatIfSecurityLab';
import { EventExplorer } from './components/events/EventExplorer';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsHealthView } from './components/settings/SettingsHealthView';
import { DemoModeGuide } from './components/demo/DemoModeGuide';
import { ThemeSwitcher } from './components/common/ThemeSwitcher';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [demoMode, setDemoMode] = useState<boolean>(true);
  const [demoStep, setDemoStep] = useState<number>(1);
  const [networkViewMode, setNetworkViewMode] = useState<'3d' | '2d'>('3d');

  // App-level state
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [recommendations, setRecommendations] = useState<DecoyRecommendation[]>([]);
  const [activeIncidentId, setActiveIncidentId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Live simulation tracking
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [simState, setSimState] = useState<SimulationState | null>(null);

  // Load initial data
  const loadAllData = async () => {
    try {
      setLoading(true);
      const [dash, asts, scns, evts, incs, recs] = await Promise.all([
        api.getDashboard(),
        api.getAssets(),
        api.getScenarios(),
        api.getEvents(),
        api.getIncidents(),
        api.getRecommendations(),
      ]);
      setDashboardData(dash);
      setAssets(asts);
      setScenarios(scns);
      setEvents(evts);
      setIncidents(incs);
      setRecommendations(recs);
      if (incs.length > 0 && !activeIncidentId) {
        setActiveIncidentId(incs[0].id);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Poll dashboard & active simulation every 2.5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [dash, evts, asts] = await Promise.all([
          api.getDashboard(),
          api.getEvents(),
          api.getAssets(),
        ]);
        setDashboardData(dash);
        setEvents(evts);
        setAssets(asts);

        if (activeRunId) {
          const state = await api.getSimulationState(activeRunId);
          setSimState(state);
          if (state.status === 'COMPLETED') {
            const incs = await api.getIncidents();
            setIncidents(incs);
            setActiveRunId(null);
          }
        }
      } catch (err) {
        // quiet polling failure
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [activeRunId]);

  // Asset CRUD Handlers
  const handleCreateAsset = async (newAsset: Partial<Asset>) => {
    const created = await api.createAsset(newAsset);
    setAssets((prev) => [...prev, created]);
    const dash = await api.getDashboard();
    setDashboardData(dash);
  };

  const handleUpdateAsset = async (id: string, updates: Partial<Asset>) => {
    const updated = await api.updateAsset(id, updates);
    setAssets((prev) => prev.map((a) => (a.id === id ? updated : a)));
  };

  const handleDeleteAsset = async (id: string) => {
    await api.deleteAsset(id);
    setAssets((prev) => prev.filter((a) => a.id !== id));
    const dash = await api.getDashboard();
    setDashboardData(dash);
  };

  // Incident Handlers
  const handleUpdateIncident = async (id: string, updates: Partial<Incident>) => {
    const updated = await api.updateIncident(id, updates);
    setIncidents((prev) => prev.map((i) => (i.id === id ? updated : i)));
  };

  const handleAddNote = async (id: string, author: string, note: string) => {
    const updated = await api.addAnalystNote(id, author, note);
    setIncidents((prev) => prev.map((i) => (i.id === id ? updated : i)));
  };

  // Start Simulation
  const handleStartSimulation = async (scenarioId: string) => {
    try {
      const state = await api.startSimulation(scenarioId, 'baseline');
      setActiveRunId(state.runId);
      setSimState(state);
      setActiveTab('network'); // take user to live network to watch path evolve
    } catch (err) {
      console.error('Failed to start simulation:', err);
    }
  };

  // Apply Adaptive Decoy Recommendation
  const handleApplyRecommendation = async (id: string) => {
    const res = await api.applyRecommendation(id);
    if (res.success && res.createdAsset) {
      setAssets((prev) => [...prev, res.createdAsset!]);
      setRecommendations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'APPLIED' } : r))
      );
      const dash = await api.getDashboard();
      setDashboardData(dash);
    }
    return res;
  };

  // Reset Demo Data
  const handleResetDemo = async () => {
    await api.resetDemoData();
    setActiveRunId(null);
    setSimState(null);
    await loadAllData();
  };

  const navItems = [
    { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
    { id: 'network', label: 'Live Network', icon: Network },
    { id: 'assets', label: 'Deception Assets', icon: Radio },
    { id: 'replay', label: 'Replay Theater', icon: PlaySquare },
    { id: 'incidents', label: 'Incidents & Dossiers', icon: ShieldAlert },
    { id: 'adaptive', label: 'Adaptive Lab', icon: Sparkles },
    { id: 'whatif', label: 'What-If Lab', icon: Sliders },
    { id: 'events', label: 'Event Explorer', icon: ListFilter },
    { id: 'reports', label: 'Reports & Evidence', icon: FileCheck2 },
    { id: 'settings', label: 'Health & Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      {/* Left Navigation Rail (260px) */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between shrink-0 select-none z-20 shadow-sm">
        <div>
          {/* Brand Mark */}
          <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800/80">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Radio className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                PHANTOM<span className="text-cyan-600 dark:text-cyan-400">//</span>TRACE
              </span>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block -mt-0.5">
                Cyber Deception Core
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all text-left ${
                    isActive
                      ? 'bg-indigo-600 dark:bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Status & Demo Mode Trigger */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 space-y-2">
          {/* Engine State Indicator */}
          <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80 text-[11px] font-mono flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">Simulation:</span>
            <span
              className={`px-1.5 py-0.5 rounded uppercase font-bold text-[10px] ${
                dashboardData?.simulationStatus === 'RUNNING'
                  ? 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 animate-pulse'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {dashboardData?.simulationStatus || 'IDLE'}
            </span>
          </div>

          {/* Quick Demo Mode Toggle */}
          <button
            onClick={() => setDemoMode(!demoMode)}
            className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border transition-colors ${
              demoMode
                ? 'bg-cyan-50 dark:bg-cyan-950/70 border-cyan-300 dark:border-cyan-700/60 text-cyan-800 dark:text-cyan-300'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{demoMode ? 'Demo Guide Active' : 'Enable Demo Guide'}</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header Contract */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between gap-6 shrink-0 z-10 shadow-xs">
          {/* Breadcrumb Zone */}
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
            <span className="text-slate-400 dark:text-slate-500">PHANTOM</span>
            <span>/</span>
            <span className="text-indigo-600 dark:text-cyan-400 font-bold uppercase">
              {navItems.find((n) => n.id === activeTab)?.label || 'Console'}
            </span>
          </div>

          {/* Nav Links Strip (Top Bar Contract Zone 2) */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600 dark:text-slate-400">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`hover:text-slate-900 dark:hover:text-slate-200 transition-colors whitespace-nowrap ${
                activeTab === 'dashboard' ? 'text-indigo-600 dark:text-cyan-400 font-bold' : ''
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('network')}
              className={`hover:text-slate-900 dark:hover:text-slate-200 transition-colors whitespace-nowrap ${
                activeTab === 'network' ? 'text-indigo-600 dark:text-cyan-400 font-bold' : ''
              }`}
            >
              Topology & 3D
            </button>
            <button
              onClick={() => setActiveTab('replay')}
              className={`hover:text-slate-900 dark:hover:text-slate-200 transition-colors whitespace-nowrap ${
                activeTab === 'replay' ? 'text-indigo-600 dark:text-cyan-400 font-bold' : ''
              }`}
            >
              Replay
            </button>
            <button
              onClick={() => setActiveTab('whatif')}
              className={`hover:text-slate-900 dark:hover:text-slate-200 transition-colors whitespace-nowrap ${
                activeTab === 'whatif' ? 'text-indigo-600 dark:text-cyan-400 font-bold' : ''
              }`}
            >
              Benchmarks
            </button>
          </nav>

          {/* Primary Action Zone & Theme Switcher (Top Bar Contract Zone 3) */}
          <div className="flex items-center gap-3 shrink-0">
            <ThemeSwitcher />

            <button
              onClick={handleResetDemo}
              title="Reset Demo Data to Initial State"
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleStartSimulation('SCENARIO-FINANCE-MIRAGE')}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 dark:bg-cyan-600 dark:hover:bg-cyan-500 rounded-lg shadow-sm transition-colors whitespace-nowrap"
            >
              Run Scenario
            </button>
          </div>
        </header>

        {/* Viewport Content Canvas */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950">
          {/* Guided Demo Presentation Banner */}
          {demoMode && (
            <DemoModeGuide
              currentStep={demoStep}
              onSelectStep={(step) => setDemoStep(step)}
              onClose={() => setDemoMode(false)}
              onNavigate={(tab) => setActiveTab(tab)}
              onStartScenario={(scenId) => handleStartSimulation(scenId)}
              onInvestigateIncident={(incId) => {
                setActiveIncidentId(incId);
                setActiveTab('incidents');
              }}
            />
          )}

          {/* Page Routing */}
          {activeTab === 'dashboard' && (
            <CommandCenter
              data={dashboardData}
              scenarios={scenarios}
              onStartSimulation={handleStartSimulation}
              onNavigate={(tab) => setActiveTab(tab)}
              onInvestigateIncident={(id) => {
                setActiveIncidentId(id);
                setActiveTab('incidents');
              }}
            />
          )}

          {activeTab === 'network' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Live Network Environment</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Spatial 3D Cyberspace and 2D topology graph with active canary honeypots and animated traversal paths.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {simState?.status === 'RUNNING' && (
                    <div className="flex items-center gap-2 text-xs font-mono text-cyan-800 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-950/80 px-3 py-1.5 rounded-lg border border-cyan-200 dark:border-cyan-800">
                      <Activity className="w-4 h-4 text-cyan-600 dark:text-cyan-400 animate-spin" />
                      <span>Breach Progression: Step {simState.currentStepIndex} of {simState.totalSteps}</span>
                    </div>
                  )}

                  {/* 2D vs 3D View Switcher */}
                  <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                    <button
                      onClick={() => setNetworkViewMode('3d')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-colors ${
                        networkViewMode === '3d'
                          ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-cyan-300 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <Box className="w-3.5 h-3.5" />
                      <span>3D Cyberspace</span>
                    </button>
                    <button
                      onClick={() => setNetworkViewMode('2d')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-colors ${
                        networkViewMode === '2d'
                          ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-cyan-300 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>2D Topology</span>
                    </button>
                  </div>
                </div>
              </div>

              {networkViewMode === '3d' ? (
                <div className="h-[680px] w-full">
                  <PhantomCyberspace
                    assets={assets}
                    observedPath={simState?.activePath || []}
                    activeStepNodeId={simState?.events[simState.events.length - 1]?.targetAssetId}
                    isSimulating={simState?.status === 'RUNNING'}
                    onUpdateAsset={(updated) => handleUpdateAsset(updated.id, updated)}
                  />
                </div>
              ) : (
                <NetworkTopology
                  assets={assets}
                  observedPath={simState?.activePath || []}
                  activeStepNodeId={simState?.events[simState.events.length - 1]?.targetAssetId}
                  onUpdateAsset={(updated) => handleUpdateAsset(updated.id, updated)}
                />
              )}
            </div>
          )}

          {activeTab === 'assets' && (
            <DeceptionAssetManager
              assets={assets}
              onCreateAsset={handleCreateAsset}
              onUpdateAsset={handleUpdateAsset}
              onDeleteAsset={handleDeleteAsset}
            />
          )}

          {activeTab === 'replay' && (
            <AttackReplayTheater
              scenarios={scenarios}
              assets={assets}
              onOpenIncident={(incId) => {
                setActiveIncidentId(incId);
                setActiveTab('incidents');
              }}
              onNavigateToAdaptive={() => setActiveTab('adaptive')}
            />
          )}

          {activeTab === 'incidents' && (
            <IncidentsView
              incidents={incidents}
              events={events}
              selectedIncidentId={activeIncidentId}
              onUpdateIncident={handleUpdateIncident}
              onAddNote={handleAddNote}
              onNavigateToReplay={(scenarioId) => {
                setActiveTab('replay');
              }}
            />
          )}

          {activeTab === 'adaptive' && (
            <AdaptiveDeceptionLab
              recommendations={recommendations}
              onApplyRecommendation={handleApplyRecommendation}
              onNavigateToWhatIf={() => setActiveTab('whatif')}
            />
          )}

          {activeTab === 'whatif' && <WhatIfSecurityLab scenarios={scenarios} />}

          {activeTab === 'events' && <EventExplorer events={events} />}

          {activeTab === 'reports' && (
            <ReportsView
              incidents={incidents}
              onOpenIncident={(incId) => {
                setActiveIncidentId(incId);
                setActiveTab('incidents');
              }}
            />
          )}

          {activeTab === 'settings' && <SettingsHealthView onResetData={handleResetDemo} />}
        </main>
      </div>
    </div>
  );
}

export default App;
