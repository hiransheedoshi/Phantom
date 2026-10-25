import {
  Asset,
  SecurityEvent,
  Incident,
  Scenario,
  SimulationState,
  DecoyRecommendation,
  WhatIfComparison,
  EvidenceChainBlock,
} from '../types/cyber';

export interface DashboardData {
  totalAssets: number;
  activeDecoys: number;
  totalInteractions: number;
  openIncidents: number;
  highPriorityIncidents: number;
  detectionCoverage: number;
  recentEvents: SecurityEvent[];
  recentIncidents: Incident[];
  topDecoys: {
    id: string;
    name: string;
    type: string;
    trustZone: string;
    interactionCount: number;
    status: string;
  }[];
  frequentPaths: { path: string; count: number }[];
  simulationStatus: 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED';
  activeRunId: string | null;
  systemHealth: {
    allCanariesHealthy: boolean;
    tripwireListenersActive: number;
    telemetryCorrelatorStatus: string;
    lastHealthCheck: string;
  };
}

export const api = {
  async getHealth() {
    const res = await fetch('/api/health');
    return res.json();
  },

  async getDashboard(): Promise<DashboardData> {
    const res = await fetch('/api/dashboard');
    if (!res.ok) throw new Error('Failed to fetch dashboard data');
    return res.json();
  },

  async getAssets(): Promise<Asset[]> {
    const res = await fetch('/api/assets');
    if (!res.ok) throw new Error('Failed to fetch assets');
    return res.json();
  },

  async createAsset(asset: Partial<Asset>): Promise<Asset> {
    const res = await fetch('/api/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(asset),
    });
    if (!res.ok) throw new Error('Failed to create asset');
    return res.json();
  },

  async updateAsset(id: string, updates: Partial<Asset>): Promise<Asset> {
    const res = await fetch(`/api/assets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update asset');
    return res.json();
  },

  async deleteAsset(id: string): Promise<{ success: boolean; deletedId: string }> {
    const res = await fetch(`/api/assets/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete asset');
    return res.json();
  },

  async getEvents(): Promise<SecurityEvent[]> {
    const res = await fetch('/api/events');
    if (!res.ok) throw new Error('Failed to fetch events');
    return res.json();
  },

  async getIncidents(): Promise<Incident[]> {
    const res = await fetch('/api/incidents');
    if (!res.ok) throw new Error('Failed to fetch incidents');
    return res.json();
  },

  async getIncidentById(id: string): Promise<Incident> {
    const res = await fetch(`/api/incidents/${id}`);
    if (!res.ok) throw new Error('Failed to fetch incident');
    return res.json();
  },

  async updateIncident(id: string, updates: Partial<Incident>): Promise<Incident> {
    const res = await fetch(`/api/incidents/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update incident');
    return res.json();
  },

  async addAnalystNote(id: string, author: string, note: string): Promise<Incident> {
    const res = await fetch(`/api/incidents/${id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author, note }),
    });
    if (!res.ok) throw new Error('Failed to add note');
    return res.json();
  },

  async getScenarios(): Promise<Scenario[]> {
    const res = await fetch('/api/simulations/scenarios');
    if (!res.ok) throw new Error('Failed to fetch scenarios');
    return res.json();
  },

  async startSimulation(scenarioId: string, configuration: 'baseline' | 'augmented' = 'baseline'): Promise<SimulationState> {
    const res = await fetch('/api/simulations/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioId, configuration }),
    });
    if (!res.ok) throw new Error('Failed to start simulation');
    return res.json();
  },

  async getSimulationState(runId: string): Promise<SimulationState> {
    const res = await fetch(`/api/simulations/${runId}/state`);
    if (!res.ok) throw new Error('Failed to fetch simulation state');
    return res.json();
  },

  async pauseSimulation(runId: string): Promise<SimulationState> {
    const res = await fetch(`/api/simulations/${runId}/pause`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to pause simulation');
    return res.json();
  },

  async resumeSimulation(runId: string): Promise<SimulationState> {
    const res = await fetch(`/api/simulations/${runId}/resume`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to resume simulation');
    return res.json();
  },

  async stopSimulation(runId: string): Promise<SimulationState> {
    const res = await fetch(`/api/simulations/${runId}/stop`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to stop simulation');
    return res.json();
  },

  async stepSimulation(runId: string): Promise<{ result: { finished: boolean; currentEvent?: SecurityEvent }; state: SimulationState }> {
    const res = await fetch(`/api/simulations/${runId}/step`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to step simulation');
    return res.json();
  },

  async getRecommendations(): Promise<DecoyRecommendation[]> {
    const res = await fetch('/api/deception/recommendations');
    if (!res.ok) throw new Error('Failed to fetch recommendations');
    return res.json();
  },

  async applyRecommendation(id: string): Promise<{ success: boolean; createdAsset?: Asset; error?: string }> {
    const res = await fetch(`/api/deception/recommendations/${id}/apply`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to apply recommendation');
    return res.json();
  },

  async compareWhatIf(scenarioId: string): Promise<WhatIfComparison> {
    const res = await fetch('/api/evaluations/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioId }),
    });
    if (!res.ok) throw new Error('Failed to run comparison');
    return res.json();
  },

  async generateIncidentReport(incidentId: string): Promise<{ incidentId: string; reportMarkdown: string; usedAiEngine: boolean; timestamp: string }> {
    const res = await fetch(`/api/reports/incidents/${incidentId}`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to generate incident report');
    return res.json();
  },

  async getEvidenceChain(): Promise<EvidenceChainBlock[]> {
    const res = await fetch('/api/evidence/chain');
    if (!res.ok) throw new Error('Failed to fetch evidence chain');
    return res.json();
  },

  async verifyEvidenceChain(): Promise<{ valid: boolean; totalBlocks: number; verifiedBlocks: number; brokenBlocks: number[] }> {
    const res = await fetch('/api/evidence/verify');
    if (!res.ok) throw new Error('Failed to verify evidence chain');
    return res.json();
  },

  async resetDemoData(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/demo/reset', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset demo data');
    return res.json();
  },
};
