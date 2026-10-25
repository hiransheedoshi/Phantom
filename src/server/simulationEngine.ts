import {
  Asset,
  Scenario,
  ScenarioStep,
  SecurityEvent,
  Incident,
  IncidentStatus,
  DecoyRecommendation,
  EvidenceChainBlock,
  SimulationState,
  TrustZone,
  WhatIfComparison,
  AssetType,
  AssetCategory,
  DecoyDetails,
  DeceptionAlert,
  AlertStatus,
  EventSeverity,
} from '../types/cyber';
import {
  INITIAL_ASSETS,
  INITIAL_SCENARIOS,
  INITIAL_HISTORICAL_EVENTS,
  INITIAL_INCIDENTS,
  INITIAL_RECOMMENDATIONS,
  INITIAL_EVIDENCE_CHAIN,
} from '../data/seedData';
import { GENESIS_HASH, buildBlock, checkBlock } from './evidenceChain';

const MAX_EVENTS = 500;
const MAX_RETAINED_RUNS = 20;
const STEP_INTERVAL_MS = 1800;

const TRUST_ZONES: TrustZone[] = ['dmz', 'corporate_lan', 'finance_enclave', 'decoy_sandbox'];
const DECOY_TYPES: DecoyDetails['decoyType'][] = [
  'canary_document',
  'fake_credential',
  'opencanary_service',
  'cowrie_ssh',
  'honey_db',
  'cloud_token',
];

/** Deterministic, documented weights used by the recommendation scorer. */
const ZONE_CRITICALITY: Record<TrustZone, number> = {
  dmz: 18,
  corporate_lan: 28,
  finance_enclave: 35,
  decoy_sandbox: 12,
};

/** Where a user-placed decoy lands in 2D/3D space, per zone. */
const ZONE_ANCHOR: Record<TrustZone, { x: number; y: number }> = {
  dmz: { x: 100, y: 180 },
  corporate_lan: { x: 500, y: 200 },
  finance_enclave: { x: 850, y: 180 },
  decoy_sandbox: { x: 500, y: 450 },
};

const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

function isIpv4(value: string): boolean {
  const m = IPV4.exec(value);
  if (!m) return false;
  return m.slice(1).every((part) => Number(part) <= 255);
}

export type DeleteResult = { ok: boolean; error?: string };

export type ChainVerification = {
  valid: boolean;
  totalBlocks: number;
  verifiedBlocks: number;
  brokenBlocks: number[];
  failures: { blockIndex: number; eventId: string; reason: string }[];
  anchoredAtGenesis: boolean;
  checkedAt: string;
};

type RunMetrics = {
  firstAlertSec: number;
  decoysEncountered: number;
  decoysEngaged: Set<string>;
  coveragePercent: number;
  unmonitoredHops: number;
  interceptedSteps: number;
};

export class SimulationEngine {
  private assets: Asset[] = [];
  private scenarios: Scenario[] = [];
  private events: SecurityEvent[] = [];
  private incidents: Incident[] = [];
  private recommendations: DecoyRecommendation[] = [];
  private evidenceChain: EvidenceChainBlock[] = [];
  private alerts: DeceptionAlert[] = [];
  private activeSimulations: Map<string, SimulationState> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private tamperBackup: Map<string, SecurityEvent['evidence']> = new Map();

  constructor() {
    this.resetToSeed();
  }

  public resetToSeed() {
    for (const timer of this.timers.values()) {
      clearInterval(timer);
    }
    this.timers.clear();
    this.activeSimulations.clear();

    this.assets = JSON.parse(JSON.stringify(INITIAL_ASSETS));
    this.scenarios = JSON.parse(JSON.stringify(INITIAL_SCENARIOS));
    // Internal order is newest-first everywhere the engine reads events.
    this.events = JSON.parse(JSON.stringify(INITIAL_HISTORICAL_EVENTS)).sort((a: SecurityEvent, b: SecurityEvent) =>
      b.timestamp.localeCompare(a.timestamp)
    );
    this.incidents = JSON.parse(JSON.stringify(INITIAL_INCIDENTS));
    this.recommendations = JSON.parse(JSON.stringify(INITIAL_RECOMMENDATIONS));
    this.evidenceChain = JSON.parse(JSON.stringify(INITIAL_EVIDENCE_CHAIN));
    this.alerts = this.events.map((event) => this.buildAlert(event, this.incidentIdForEvent(event.eventId)));
    this.tamperBackup.clear();
  }

  public exportState() {
    return {
      assets: this.assets,
      events: this.events,
      incidents: this.incidents,
      recommendations: this.recommendations,
      evidenceChain: this.evidenceChain,
      alerts: this.alerts,
    };
  }

  public importState(state: ReturnType<SimulationEngine['exportState']>) {
    if (!state?.assets || !state?.events) return;
    this.assets = state.assets;
    this.events = state.events;
    this.incidents = state.incidents || [];
    this.recommendations = state.recommendations || JSON.parse(JSON.stringify(INITIAL_RECOMMENDATIONS));
    this.evidenceChain = state.evidenceChain || [];
    this.alerts = state.alerts || [];
  }

  public getDashboardStats() {
    const decoys = this.assets.filter((a) => a.category === 'decoy');
    const totalAssets = this.assets.length;
    const activeDecoys = decoys.filter((a) => a.status === 'online').length;
    const totalInteractions = decoys.reduce((acc, a) => acc + (a.decoyDetails?.interactionCount || 0), 0);
    const openIncidents = this.incidents.filter(
      (i) => i.status === 'NEW' || i.status === 'INVESTIGATING' || i.status === 'REOPENED'
    ).length;
    const highPriorityIncidents = this.incidents.filter(
      (i) => (i.severity === 'CRITICAL' || i.severity === 'HIGH') && i.status !== 'RESOLVED'
    ).length;

    const trippedEvents = this.events.filter((e) => e.outcome === 'TRIPPED_CANARY').length;
    const detectionCoverage = this.events.length === 0 ? 0 : Math.round((trippedEvents / this.events.length) * 100);

    const topDecoys = decoys
      .map((a) => ({
        id: a.id,
        name: a.name,
        type: a.decoyDetails?.decoyType || a.type,
        trustZone: a.trustZone,
        interactionCount: a.decoyDetails?.interactionCount || 0,
        status: a.status,
      }))
      .sort((a, b) => b.interactionCount - a.interactionCount)
      .slice(0, 5);

    const pathFrequency: Record<string, number> = {};
    for (const inc of this.incidents) {
      for (let i = 0; i < inc.observedPath.length - 1; i++) {
        const hop = `${inc.observedPath[i]} ➔ ${inc.observedPath[i + 1]}`;
        pathFrequency[hop] = (pathFrequency[hop] || 0) + 1;
      }
    }
    const frequentPaths = Object.entries(pathFrequency)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    let activeRun: SimulationState | undefined;
    for (const run of this.activeSimulations.values()) {
      if (run.status === 'RUNNING' || run.status === 'PAUSED') {
        activeRun = run;
        break;
      }
    }

    const chain = this.verifyEvidenceChain();
    const lastEvent = this.events[0];

    return {
      totalAssets,
      activeDecoys,
      totalDecoys: decoys.length,
      totalInteractions,
      openIncidents,
      highPriorityIncidents,
      detectionCoverage,
      totalEvents: this.events.length,
      recentEvents: this.events.slice(0, 8),
      recentIncidents: this.incidents.slice(0, 5),
      recentAlerts: this.alerts.slice(0, 8),
      openAlerts: this.alerts.filter((a) => a.status === 'OPEN').length,
      topDecoys,
      frequentPaths,
      zonesPlayed: new Set(this.assets.map((a) => a.trustZone)).size,
      simulationStatus: activeRun ? activeRun.status : 'IDLE',
      activeRunId: activeRun ? activeRun.runId : null,
      systemHealth: {
        allCanariesHealthy: decoys.every((a) => a.status !== 'offline') && decoys.length > 0,
        decoysArmed: activeDecoys,
        decoysTripped: decoys.filter((a) => a.status === 'tripped').length,
        tripwireListenersActive: decoys.filter((a) => a.status !== 'offline' && a.openPorts.length > 0).length,
        telemetryCorrelatorStatus: chain.valid ? 'ONLINE' : 'DEGRADED',
        evidenceChainValid: chain.valid,
        evidenceBlocks: chain.totalBlocks,
        activeRuns: this.activeSimulations.size,
        lastEventAt: lastEvent ? lastEvent.timestamp : null,
        lastHealthCheck: new Date().toISOString(),
      },
    };
  }

  public getAssets(): Asset[] {
    return this.assets;
  }

  public getAssetById(id: string): Asset | undefined {
    return this.assets.find((a) => a.id === id);
  }

  public createAsset(newAsset: Partial<Asset>): Asset {
    const errors: string[] = [];
    const name = typeof newAsset.name === 'string' ? newAsset.name.trim() : '';
    if (!name) errors.push('Asset name is required');
    else if (name.length > 120) errors.push('Asset name must be 120 characters or fewer');

    const trustZone = newAsset.trustZone ?? 'corporate_lan';
    if (!TRUST_ZONES.includes(trustZone)) errors.push(`Unknown trust zone: ${trustZone}`);

    const ipAddress = typeof newAsset.ipAddress === 'string' ? newAsset.ipAddress.trim() : '';
    if (!isIpv4(ipAddress)) errors.push('IP address must be a valid IPv4 address');

    const category: AssetCategory = newAsset.category === 'production' ? 'production' : 'decoy';
    const requestedId = typeof newAsset.id === 'string' ? newAsset.id.trim() : '';
    if (requestedId && this.assets.some((a) => a.id === requestedId)) {
      errors.push(`Asset id already exists: ${requestedId}`);
    }

    const openPorts = Array.isArray(newAsset.openPorts) ? newAsset.openPorts : [];
    if (openPorts.some((p) => !Number.isInteger(p) || p < 1 || p > 65535)) {
      errors.push('Open ports must be integers between 1 and 65535');
    }

    if (errors.length > 0) throw new Error(errors.join('; '));

    const id = requestedId || `DECOY-CUST-${Date.now().toString(36).toUpperCase()}`;
    const anchor = ZONE_ANCHOR[trustZone];
    const offset = { x: (this.assets.length % 6) * 26, y: Math.floor(this.assets.length / 6) * 22 };

    let decoyDetails: DecoyDetails | undefined;
    if (category === 'decoy') {
      const requestedType = newAsset.decoyDetails?.decoyType;
      const decoyType: DecoyDetails['decoyType'] =
        requestedType && DECOY_TYPES.includes(requestedType) ? requestedType : 'canary_document';
      const provided = newAsset.decoyDetails;
      decoyDetails = {
        decoyType,
        tripwireSignature: `CANARY-SIG-${id}`,
        syntheticPayloadPreview:
          provided?.syntheticPayloadPreview ||
          'Confidential Internal Operations Memo\nAuthor: security@phantom.trace',
        interactionCount: 0,
        deploymentZone: trustZone,
        alertWebhookTag: provided?.alertWebhookTag,
      };
    }

    const asset: Asset = {
      id,
      name,
      type: (newAsset.type || (category === 'decoy' ? 'decoy_file' : 'server')) as AssetType,
      category,
      trustZone,
      ipAddress,
      os: newAsset.os || 'Simulated Decoy Sensor',
      openPorts,
      description: newAsset.description || 'User-defined cyber deception asset.',
      status: 'online',
      position: newAsset.position || { x: anchor.x + offset.x, y: anchor.y + offset.y },
      decoyDetails,
    };

    this.assets.push(asset);
    return asset;
  }

  public updateAsset(id: string, updates: Partial<Asset>): Asset | undefined {
    const idx = this.assets.findIndex((a) => a.id === id);
    if (idx === -1) return undefined;
    const { id: _ignoredId, ...safe } = updates;
    const current = this.assets[idx];
    const next: Asset = { ...current, ...safe, id: current.id };
    if (current.decoyDetails && safe.decoyDetails) {
      next.decoyDetails = { ...current.decoyDetails, ...safe.decoyDetails, deploymentZone: next.trustZone };
    }
    this.assets[idx] = next;
    return next;
  }

  /** Decoys are user-manageable; seeded production nodes keep the topology coherent. */
  public deleteAsset(id: string): DeleteResult {
    const asset = this.assets.find((a) => a.id === id);
    if (!asset) return { ok: false, error: 'Asset not found' };
    if (asset.category !== 'decoy') {
      return { ok: false, error: `${asset.id} is a production asset and cannot be removed from the simulation` };
    }
    this.assets = this.assets.filter((a) => a.id !== id);
    return { ok: true };
  }

  public getEvents(): SecurityEvent[] {
    return this.events;
  }

  public getAlerts(): DeceptionAlert[] {
    return this.alerts;
  }

  public updateAlert(id: string, updates: Partial<Pick<DeceptionAlert, 'status'>>): DeceptionAlert | undefined {
    const alert = this.alerts.find((a) => a.id === id);
    if (!alert) return undefined;
    if (updates.status) alert.status = updates.status as AlertStatus;
    return alert;
  }

  public getIncidents(): Incident[] {
    return this.incidents;
  }

  public getIncidentById(id: string): Incident | undefined {
    return this.incidents.find((i) => i.id === id);
  }

  public updateIncident(id: string, updates: Partial<Incident>): Incident | undefined {
    const idx = this.incidents.findIndex((i) => i.id === id);
    if (idx === -1) return undefined;
    const { id: _ignoredId, ...safe } = updates;
    const current = this.incidents[idx];
    const next: Incident = { ...current, ...safe, id: current.id, updatedAt: new Date().toISOString() };
    this.incidents[idx] = next;
    return next;
  }

  public setIncidentStatus(id: string, status: IncidentStatus): Incident | undefined {
    return this.updateIncident(id, { status });
  }

  public addAnalystNote(incidentId: string, author: string, note: string): Incident | undefined {
    const inc = this.getIncidentById(incidentId);
    if (!inc) return undefined;
    inc.analystNotes.push({
      id: `NOTE-${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
      author: (author || 'SOC Analyst').slice(0, 60),
      note: note.slice(0, 4000),
    });
    inc.updatedAt = new Date().toISOString();
    return inc;
  }

  public getScenarios(): Scenario[] {
    return this.scenarios;
  }

  public getScenarioById(id: string): Scenario | undefined {
    return this.scenarios.find((s) => s.id === id);
  }

  /**
   * Scores are recomputed from the live event log on every read, so the ranking
   * follows what the simulation actually observed instead of a fixed snapshot.
   */
  public getRecommendations(): DecoyRecommendation[] {
    for (const rec of this.recommendations) {
      if (rec.status === 'APPLIED') continue;

      const zoneEvents = this.events.filter(
        (e) => this.assetZone(e.targetAssetId) === rec.suggestedPlacementZone
      );
      const probes = zoneEvents.length;
      const probeFrequency = Math.min(40, probes * 5);
      const zoneCriticality = ZONE_CRITICALITY[rec.suggestedPlacementZone];
      const hasSensorOnline = this.assets.some(
        (a) => a.category === 'decoy' && a.trustZone === rec.suggestedPlacementZone && a.status !== 'offline'
      );
      const pathVulnerability = hasSensorOnline ? 15 : 30;

      rec.triggerEventIds = zoneEvents.slice(0, 4).map((e) => e.eventId);
      rec.scoreBreakdown = {
        probeFrequency,
        zoneCriticality,
        pathVulnerability,
        totalScore: probeFrequency + zoneCriticality + pathVulnerability,
      };
    }

    return [...this.recommendations].sort((a, b) => b.scoreBreakdown.totalScore - a.scoreBreakdown.totalScore);
  }

  private assetZone(assetId: string): TrustZone | undefined {
    return this.assets.find((a) => a.id === assetId)?.trustZone;
  }

  public applyRecommendation(recommendationId: string): { success: boolean; createdAsset?: Asset; error?: string } {
    const rec = this.recommendations.find((r) => r.id === recommendationId);
    if (!rec) return { success: false, error: 'Recommendation not found' };
    if (rec.status === 'APPLIED') return { success: false, error: 'Recommendation already applied' };
    if (rec.status === 'DISMISSED') return { success: false, error: 'Recommendation was dismissed' };

    const zone = rec.suggestedPlacementZone;
    const newDecoyId = `DECOY-ADAPTIVE-${Date.now().toString(36).toUpperCase()}`;
    const anchor = ZONE_ANCHOR[zone];
    const isSsh = rec.recommendedDecoyType === 'cowrie_ssh';

    const newAsset: Asset = {
      id: newDecoyId,
      name: rec.suggestedAssetName,
      type: isSsh ? 'decoy_service' : 'decoy_database',
      category: 'decoy',
      trustZone: zone,
      ipAddress: zone === 'finance_enclave' ? '10.0.30.95' : zone === 'decoy_sandbox' ? '10.0.99.95' : '10.0.20.95',
      os: isSsh ? 'Cowrie Interactive SSH v2.4' : 'MySQL 5.7 Honeypot',
      openPorts: isSsh ? [2222] : [3306],
      description: `Adaptive Deception: ${rec.rationale}`,
      status: 'online',
      position: { x: anchor.x + 30, y: anchor.y + 30 },
      decoyDetails: {
        decoyType: rec.recommendedDecoyType,
        tripwireSignature: `ADAPTIVE-SIG-${newDecoyId}`,
        syntheticPayloadPreview: `[Adaptive Deception Planted]\nZone: ${zone}\nAdvantage: ${rec.detectionAdvantage}`,
        interactionCount: 0,
        deploymentZone: zone,
        alertWebhookTag: `adaptive.${rec.recommendedDecoyType}.intercept`,
      },
    };

    this.assets.push(newAsset);
    rec.status = 'APPLIED';
    return { success: true, createdAsset: newAsset };
  }

  public dismissRecommendation(recommendationId: string): { success: boolean; error?: string } {
    const rec = this.recommendations.find((r) => r.id === recommendationId);
    if (!rec) return { success: false, error: 'Recommendation not found' };
    if (rec.status === 'APPLIED') return { success: false, error: 'Already applied' };
    rec.status = 'DISMISSED';
    return { success: true };
  }

  // --- SIMULATION RUNNER ---
  public startSimulation(scenarioId: string, configuration: 'baseline' | 'augmented' = 'baseline'): SimulationState {
    const scenario = this.getScenarioById(scenarioId);
    if (!scenario) throw new Error(`Unknown scenario: ${scenarioId}`);

    const runId = `RUN-${Date.now().toString(36).toUpperCase()}`;
    const state: SimulationState = {
      runId,
      scenarioId: scenario.id,
      status: 'RUNNING',
      currentStepIndex: 0,
      totalSteps: scenario.steps.length,
      startedAt: new Date().toISOString(),
      events: [],
      activePath: [],
      configuration,
    };

    this.activeSimulations.set(runId, state);
    this.pruneRuns();

    this.timers.set(
      runId,
      setInterval(() => {
        this.executeSimulationStep(runId);
      }, STEP_INTERVAL_MS)
    );

    return state;
  }

  public getSimulationState(runId: string): SimulationState | undefined {
    return this.activeSimulations.get(runId);
  }

  public pauseSimulation(runId: string): SimulationState | undefined {
    const sim = this.activeSimulations.get(runId);
    if (!sim) return undefined;
    if (sim.status === 'RUNNING') {
      sim.status = 'PAUSED';
      this.clearTimer(runId);
    }
    return sim;
  }

  public resumeSimulation(runId: string): SimulationState | undefined {
    const sim = this.activeSimulations.get(runId);
    if (!sim || sim.status !== 'PAUSED') return sim;
    sim.status = 'RUNNING';
    this.clearTimer(runId);
    this.timers.set(
      runId,
      setInterval(() => {
        this.executeSimulationStep(runId);
      }, STEP_INTERVAL_MS)
    );
    return sim;
  }

  public stopSimulation(runId: string, reason: 'completed' | 'stopped' = 'completed'): SimulationState | undefined {
    const sim = this.activeSimulations.get(runId);
    if (!sim) return undefined;
    sim.status = reason === 'completed' ? 'COMPLETED' : 'STOPPED';
    sim.completedAt = new Date().toISOString();
    this.clearTimer(runId);
    return sim;
  }

  private clearTimer(runId: string) {
    const timer = this.timers.get(runId);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(runId);
    }
  }

  private pruneRuns() {
    if (this.activeSimulations.size <= MAX_RETAINED_RUNS) return;
    const finished = [...this.activeSimulations.values()]
      .filter((s) => s.status === 'COMPLETED' || s.status === 'STOPPED')
      .sort((a, b) => (a.completedAt || '').localeCompare(b.completedAt || ''));
    for (const run of finished.slice(0, this.activeSimulations.size - MAX_RETAINED_RUNS)) {
      this.activeSimulations.delete(run.runId);
    }
  }

  public executeSimulationStep(runId: string): { finished: boolean; currentEvent?: SecurityEvent } {
    const sim = this.activeSimulations.get(runId);
    if (!sim || sim.status !== 'RUNNING') return { finished: true };

    const scenario = this.getScenarioById(sim.scenarioId);
    if (!scenario || sim.currentStepIndex >= scenario.steps.length) {
      if (scenario) this.finishRun(sim, scenario);
      else this.stopSimulation(runId, 'stopped');
      return { finished: true };
    }

    const step = scenario.steps[sim.currentStepIndex];
    const eventId = `EVT-${Date.now().toString(36).toUpperCase()}-${sim.currentStepIndex + 1}`;
    const sourceIp = scenario.attackerIp;

    const newEvent: SecurityEvent = {
      eventId,
      simulationRunId: runId,
      scenarioId: scenario.id,
      sessionId: `SESS-${runId}`,
      timestamp: new Date().toISOString(),
      relativeTimeSec: step.relativeTimeSec,
      simulatedSourceId: `SYNTH-ACTOR-${sourceIp}`,
      sourceIp,
      sourceAssetId: step.sourceAssetId,
      targetAssetId: step.targetAssetId,
      eventType: step.eventType,
      severity: step.severity,
      outcome: step.outcome,
      description: step.description,
      protocol: step.protocol,
      mitreTechnique: step.mitreTechnique,
      evidence: step.evidence,
      correlationKey: `SESS-${runId}::${sourceIp}`,
      confidence: step.outcome === 'TRIPPED_CANARY' ? 0.99 : 0.85,
      relatedEventIds: sim.events.map((e) => e.eventId),
      simulated: true,
    };

    const targetAsset = this.assets.find((a) => a.id === step.targetAssetId);
    if (targetAsset && targetAsset.category === 'decoy') {
      targetAsset.status = 'tripped';
      if (targetAsset.decoyDetails) {
        targetAsset.decoyDetails.interactionCount = (targetAsset.decoyDetails.interactionCount || 0) + 1;
        targetAsset.decoyDetails.lastInteractedAt = newEvent.timestamp;
      }
    }

    sim.events.push(newEvent);
    this.pushEvent(newEvent);
    sim.currentEventId = eventId;

    if (!sim.activePath.includes(step.sourceAssetId)) sim.activePath.push(step.sourceAssetId);
    if (!sim.activePath.includes(step.targetAssetId)) sim.activePath.push(step.targetAssetId);

    this.appendEvidenceChainBlock(newEvent);
    this.raiseAlert(newEvent);

    sim.currentStepIndex++;

    if (sim.currentStepIndex >= scenario.steps.length) {
      this.finishRun(sim, scenario);
      return { finished: true, currentEvent: newEvent };
    }

    return { finished: false, currentEvent: newEvent };
  }

  private pushEvent(event: SecurityEvent) {
    this.events.unshift(event);
    if (this.events.length > MAX_EVENTS) {
      const overflow = this.events.length - MAX_EVENTS;
      this.events.length = MAX_EVENTS;
      // The ledger window is oldest-first, so it loses the same oldest entries.
      this.evidenceChain.splice(0, overflow);
    }
  }

  private finishRun(sim: SimulationState, scenario: Scenario) {
    this.stopSimulation(sim.runId, 'completed');
    this.correlateAndCreateIncident(sim, scenario);
  }

  private appendEvidenceChainBlock(event: SecurityEvent) {
    const previousHash =
      this.evidenceChain.length > 0 ? this.evidenceChain[this.evidenceChain.length - 1].blockHash : GENESIS_HASH;
    const block = buildBlock(event, this.evidenceChain.length, previousHash, 'UNLINKED');
    this.evidenceChain.push(block);
  }

  private correlateAndCreateIncident(sim: SimulationState, scenario: Scenario) {
    const qualifyingEvents = sim.events.filter(
      (e) => e.severity === 'CRITICAL' || e.severity === 'HIGH' || e.outcome === 'TRIPPED_CANARY'
    );
    if (qualifyingEvents.length === 0) return;

    const now = Date.now();
    const incidentId = `INC-${now.toString(36).toUpperCase()}`;
    const tripped = sim.events.filter((e) => e.outcome === 'TRIPPED_CANARY').length;
    const incident: Incident = {
      id: incidentId,
      title: `${scenario.name} Intrusion Path Detected`,
      severity: qualifyingEvents.some((e) => e.severity === 'CRITICAL') ? 'CRITICAL' : 'HIGH',
      status: 'NEW',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      scenarioId: scenario.id,
      simulationRunId: sim.runId,
      sessionId: `SESS-${sim.runId}`,
      sourceIp: scenario.attackerIp,
      targetAssets: Array.from(new Set(sim.events.map((e) => e.targetAssetId))),
      relatedEventIds: sim.events.map((e) => e.eventId),
      observedPath: [...sim.activePath],
      summary: `Correlation engine aggregated ${sim.events.length} telemetry events from run ${sim.runId}. The simulated actor traversed ${sim.activePath.length} nodes and tripped ${tripped} deception sensor(s).`,
      recommendedActions: [
        {
          id: `ACT-01-${incidentId}`,
          label: `Isolate traversed node ${sim.activePath[1] || 'internal node'}`,
          actionType: 'isolate_node',
          targetAssetId: sim.activePath[1],
          applied: false,
        },
        {
          id: `ACT-02-${incidentId}`,
          label: `Deploy adaptive decoy in ${this.zoneOfPath(sim.activePath)}`,
          actionType: 'deploy_decoy',
          applied: false,
        },
        {
          id: `ACT-03-${incidentId}`,
          label: `Block ingress ${scenario.attackerIp} at the edge gateway`,
          actionType: 'block_ip',
          applied: false,
        },
      ],
      analystNotes: [
        {
          id: `NOTE-${now}`,
          timestamp: new Date().toISOString(),
          author: 'PHANTOM Correlator',
          note: `Aggregated ${qualifyingEvents.length} canary/high-severity trigger(s) from session SESS-${sim.runId}. Evidence committed to the hash ledger.`,
        },
      ],
    };

    this.incidents.unshift(incident);

    // Back-link the ledger blocks written while this run was still unnamed.
    const eventIds = new Set(incident.relatedEventIds);
    for (const block of this.evidenceChain) {
      if (eventIds.has(block.eventId)) block.incidentId = incident.id;
    }
    for (const alert of this.alerts) {
      if (eventIds.has(alert.eventId)) alert.incidentId = incident.id;
    }
  }

  private incidentIdForEvent(eventId: string): string | undefined {
    return this.incidents.find((i) => i.relatedEventIds.includes(eventId))?.id;
  }

  private buildAlert(event: SecurityEvent, incidentId?: string): DeceptionAlert {
    return {
      id: `ALT-${event.eventId}`,
      eventId: event.eventId,
      decoyId: event.targetAssetId,
      incidentId,
      severity: event.severity,
      status: event.outcome === 'TRIPPED_CANARY' || event.severity === 'CRITICAL' || event.severity === 'HIGH' ? 'OPEN' : 'ACKNOWLEDGED',
      title: `Simulated ${event.eventType.replaceAll('_', ' ')} against ${event.targetAssetId}`,
      timestamp: event.timestamp,
      simulated: true,
    };
  }

  private raiseAlert(event: SecurityEvent, incidentId?: string): DeceptionAlert {
    const existing = this.alerts.find((a) => a.eventId === event.eventId);
    if (existing) {
      if (incidentId) existing.incidentId = incidentId;
      return existing;
    }
    const alert = this.buildAlert(event, incidentId);
    this.alerts.unshift(alert);
    return alert;
  }

  /**
   * Safe, labeled interaction against one decoy. Writes a real telemetry event,
   * a hash-chain block, an alert, and a correlated incident.
   */
  public simulateDecoyInteraction(
    assetId: string,
    options: { sourceIp?: string } = {}
  ): { event: SecurityEvent; alert: DeceptionAlert; incident: Incident } {
    const asset = this.getAssetById(assetId);
    if (!asset) throw new Error('Asset not found');
    if (asset.category !== 'decoy') throw new Error('Only decoy assets accept simulated interactions');
    if (asset.status === 'offline' || asset.status === 'isolated') {
      throw new Error(`Decoy ${asset.id} is ${asset.status} and cannot receive interactions`);
    }

    const sourceIp = (options.sourceIp || '198.51.100.77').trim();
    if (!isIpv4(sourceIp)) throw new Error('Source IP must be a valid IPv4 address');

    const now = new Date().toISOString();
    const runId = `RUN-INTERACT-${Date.now().toString(36).toUpperCase()}`;
    const eventId = `EVT-${Date.now().toString(36).toUpperCase()}-HIT`;
    const decoyType = asset.decoyDetails?.decoyType || 'opencanary_service';

    const eventTypeMap: Record<string, SecurityEvent['eventType']> = {
      canary_document: 'DECOY_FILE_ACCESS',
      fake_credential: 'FAKE_CRED_AUTH',
      cloud_token: 'FAKE_CRED_AUTH',
      cowrie_ssh: 'SHELL_COMMAND',
      honey_db: 'DATA_EXFIL_ATTEMPT',
      opencanary_service: 'HONEYPOT_HIT',
    };

    const event: SecurityEvent = {
      eventId,
      simulationRunId: runId,
      scenarioId: 'CONTROLLED-INTERACTION',
      sessionId: `SESS-${runId}`,
      timestamp: now,
      relativeTimeSec: 0,
      simulatedSourceId: `SYNTH-ACTOR-${sourceIp}`,
      sourceIp,
      sourceAssetId: 'SRV-EDGE-GW',
      targetAssetId: asset.id,
      eventType: eventTypeMap[decoyType] || 'HONEYPOT_HIT',
      severity: 'HIGH',
      outcome: 'TRIPPED_CANARY',
      description: `Controlled simulated interaction against decoy ${asset.name} (${asset.id}). Synthetic payload only; no production system was contacted.`,
      protocol: decoyType === 'cowrie_ssh' ? 'SSH' : decoyType === 'honey_db' ? 'MYSQL' : 'HTTPS',
      mitreTechnique: 'T1005',
      evidence: {
        canaryTokenId: asset.decoyDetails?.tripwireSignature,
        payload: asset.decoyDetails?.syntheticPayloadPreview?.slice(0, 240),
        targetAssetId: asset.id,
      },
      correlationKey: `SESS-${runId}::${sourceIp}`,
      confidence: 0.99,
      relatedEventIds: [],
      simulated: true,
    };

    asset.status = 'tripped';
    if (asset.decoyDetails) {
      asset.decoyDetails.interactionCount = (asset.decoyDetails.interactionCount || 0) + 1;
      asset.decoyDetails.lastInteractedAt = now;
    }

    this.pushEvent(event);
    this.appendEvidenceChainBlock(event);

    const incidentId = `INC-${Date.now().toString(36).toUpperCase()}`;
    const incident: Incident = {
      id: incidentId,
      title: `Simulated decoy trip: ${asset.name}`,
      severity: 'HIGH' as EventSeverity,
      status: 'NEW',
      createdAt: now,
      updatedAt: now,
      scenarioId: 'CONTROLLED-INTERACTION',
      simulationRunId: runId,
      sessionId: event.sessionId,
      sourceIp,
      targetAssets: [asset.id],
      relatedEventIds: [event.eventId],
      observedPath: ['SRV-EDGE-GW', asset.id],
      summary: `A judge/demo operator triggered a labeled simulated interaction with ${asset.id}. The event was committed to the telemetry log and SHA-256 evidence ledger.`,
      recommendedActions: [
        {
          id: `ACT-01-${incidentId}`,
          label: `Review synthetic payload on ${asset.id}`,
          actionType: 'isolate_node',
          targetAssetId: asset.id,
          applied: false,
        },
      ],
      analystNotes: [
        {
          id: `NOTE-${Date.now()}`,
          timestamp: now,
          author: 'PHANTOM Correlator',
          note: 'This incident was generated by the controlled interaction simulator. It is not live attacker telemetry.',
        },
      ],
    };
    this.incidents.unshift(incident);
    const chainBlock = this.evidenceChain[this.evidenceChain.length - 1];
    if (chainBlock && chainBlock.eventId === event.eventId) chainBlock.incidentId = incident.id;

    const alert = this.raiseAlert(event, incident.id);
    return { event, alert, incident };
  }

  private zoneOfPath(path: string[]): TrustZone {
    for (const id of path) {
      const zone = this.assetZone(id);
      if (zone === 'finance_enclave') return zone;
    }
    return this.assetZone(path[path.length - 1]) || 'corporate_lan';
  }

  // --- WHAT-IF SECURITY LAB EVALUATION ---
  /**
   * Deterministically walks the scenario steps twice. The augmented pass adds
   * the sensors recommended by the adaptive engine: a production hop inside one
   * of those zones is treated as observed because the decoy advertises the same
   * services in that segment. No numbers are hard-coded.
   */
  public compareWhatIf(scenarioId: string): WhatIfComparison {
    const scenario = this.getScenarioById(scenarioId);
    if (!scenario) throw new Error(`Unknown scenario: ${scenarioId}`);

    const augmentedZones = new Set<TrustZone>(this.recommendations.map((r) => r.suggestedPlacementZone));
    const onlineDecoys = this.assets.filter((a) => a.category === 'decoy' && a.status !== 'offline');

    const baseline = this.evaluateRun(scenario, null);
    const augmented = this.evaluateRun(scenario, augmentedZones);

    const pct = (from: number, to: number) => (from === 0 ? 0 : Math.round(((from - to) / from) * 1000) / 10);
    const utilisation = (run: RunMetrics) =>
      onlineDecoys.length === 0
        ? 0
        : Math.round((run.decoysEngaged.size / onlineDecoys.length) * 1000) / 10;

    const coverageDiff = Math.round((augmented.coveragePercent - baseline.coveragePercent) * 10) / 10;
    const timeImprovement = pct(baseline.firstAlertSec, augmented.firstAlertSec);
    const hopReduction = pct(baseline.unmonitoredHops, augmented.unmonitoredHops);

    const interceptedByAdaptive = augmented.decoysEncountered - baseline.decoysEncountered;
    const zoneList = [...augmentedZones].join(', ');

    return {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      baselineRunId: `EVAL-${scenario.id}-BASELINE`,
      augmentedRunId: `EVAL-${scenario.id}-AUGMENTED`,
      metrics: {
        timeToFirstDecoySec: {
          baseline: baseline.firstAlertSec,
          augmented: augmented.firstAlertSec,
          improvementPct: timeImprovement,
        },
        decoysEncountered: {
          baseline: baseline.decoysEncountered,
          augmented: augmented.decoysEncountered,
        },
        detectionCoveragePercent: {
          baseline: baseline.coveragePercent,
          augmented: augmented.coveragePercent,
          diffPct: coverageDiff,
        },
        unmonitoredHops: {
          baseline: baseline.unmonitoredHops,
          augmented: augmented.unmonitoredHops,
          reductionPct: hopReduction,
        },
        interactionRatePercent: {
          baseline: utilisation(baseline),
          augmented: utilisation(augmented),
          diffPct: Math.round((utilisation(augmented) - utilisation(baseline)) * 10) / 10,
        },
      },
      keyFindings: [
        `First alert moved from T+${baseline.firstAlertSec}s to T+${augmented.firstAlertSec}s across ${scenario.steps.length} scripted hops.`,
        interceptedByAdaptive > 0
          ? `${interceptedByAdaptive} production hop(s) that the baseline network could not see are observed once adaptive decoys are deployed in ${zoneList}.`
          : `Adaptive decoys add no coverage to this scenario: every hop already ends on a sensor.`,
        `Unmonitored hops fall from ${baseline.unmonitoredHops} to ${augmented.unmonitoredHops} (${hopReduction}% reduction).`,
      ],
      explanation:
        `Both passes replay the identical step list from scenario ${scenario.id} against the current asset set. ` +
        `Baseline counts a hop as detected when the step targets an online decoy. ` +
        `Augmented additionally treats a production hop as detected when its trust zone (${zoneList || 'none recommended'}) ` +
        `would contain a recommended adaptive decoy. Metrics are modelled from the scenario script, not measured from real traffic.`,
    };
  }

  private evaluateRun(scenario: Scenario, augmentedZones: Set<TrustZone> | null): RunMetrics {
    let firstAlertSec = 0;
    let alerted = false;
    let intercepted = 0;
    const decoysEngaged = new Set<string>();

    for (const step of scenario.steps) {
      const hit = this.isStepDetected(step, augmentedZones);
      if (hit.targetAssetId) decoysEngaged.add(hit.targetAssetId);
      if (hit.detected) {
        intercepted++;
        if (!alerted) {
          firstAlertSec = step.relativeTimeSec;
          alerted = true;
        }
      }
    }

    const last = scenario.steps[scenario.steps.length - 1];
    const total = scenario.steps.length || 1;

    return {
      firstAlertSec: alerted ? firstAlertSec : (last ? last.relativeTimeSec + 5 : 0),
      decoysEncountered: intercepted,
      decoysEngaged,
      coveragePercent: Math.round((intercepted / total) * 1000) / 10,
      unmonitoredHops: total - intercepted,
      interceptedSteps: intercepted,
    };
  }

  private isStepDetected(step: ScenarioStep, augmentedZones: Set<TrustZone> | null): {
    detected: boolean;
    targetAssetId?: string;
  } {
    const target = this.assets.find((a) => a.id === step.targetAssetId);
    if (target && target.category === 'decoy' && target.status !== 'offline' && target.status !== 'isolated') {
      return { detected: true, targetAssetId: target.id };
    }
    if (augmentedZones && target && augmentedZones.has(target.trustZone)) {
      return { detected: true, targetAssetId: target.id };
    }
    return { detected: false };
  }

  // --- CRYPTOGRAPHIC EVIDENCE CHAIN ---
  public getEvidenceChain(): EvidenceChainBlock[] {
    return this.evidenceChain;
  }

  public verifyEvidenceChain(): ChainVerification {
    const failures: { blockIndex: number; eventId: string; reason: string }[] = [];
    const head = this.evidenceChain[0];
    const anchoredAtGenesis = !head || head.blockIndex === 0;
    let expectedPreviousHash = anchoredAtGenesis ? GENESIS_HASH : head.previousHash;

    for (const block of this.evidenceChain) {
      const event = this.events.find((e) => e.eventId === block.eventId);
      const integrity = checkBlock(block, event, expectedPreviousHash);

      if (!integrity.previousHashOk) {
        failures.push({ blockIndex: block.blockIndex, eventId: block.eventId, reason: 'Chain link broken: previousHash does not match the preceding block' });
      } else if (!integrity.payloadOk) {
        failures.push({ blockIndex: block.blockIndex, eventId: block.eventId, reason: event ? 'Source event no longer matches the committed payload hash' : 'Committed source event is missing from the telemetry log' });
      } else if (!integrity.linkOk) {
        failures.push({ blockIndex: block.blockIndex, eventId: block.eventId, reason: 'Block hash does not replay from the stored fields (record rewritten)' });
      }

      expectedPreviousHash = block.blockHash;
    }

    return {
      valid: failures.length === 0,
      totalBlocks: this.evidenceChain.length,
      verifiedBlocks: this.evidenceChain.length - failures.length,
      brokenBlocks: failures.map((f) => f.blockIndex),
      failures,
      anchoredAtGenesis,
      checkedAt: new Date().toISOString(),
    };
  }

  /**
   * Demo hook: rewrites one committed event without re-hashing it, so the
   * verification run can show tamper detection actually firing.
   */
  public simulateTamper(eventId: string): { success: boolean; error?: string } {
    const block = this.evidenceChain.find((b) => b.eventId === eventId);
    if (!block) return { success: false, error: 'No ledger block for that event' };
    const event = this.events.find((e) => e.eventId === eventId);
    if (!event) return { success: false, error: 'Source event is no longer in the log' };

    if (!this.tamperBackup.has(eventId)) {
      this.tamperBackup.set(eventId, JSON.parse(JSON.stringify(event.evidence)));
    }
    event.evidence = { ...event.evidence, payload: `${event.evidence.payload || 'tampered'} :: edited after commit` };
    return { success: true };
  }

  /** Reverses simulateTamper byte-for-byte and re-seals the block. */
  public restoreFromTamper(eventId: string): { success: boolean; error?: string } {
    const event = this.events.find((e) => e.eventId === eventId);
    const original = this.tamperBackup.get(eventId);
    if (!event || !original) return { success: false, error: 'Nothing to restore for that event' };

    event.evidence = original;
    this.tamperBackup.delete(eventId);

    const block = this.evidenceChain.find((b) => b.eventId === eventId);
    if (block) {
      const fresh = buildBlock(event, block.blockIndex, block.previousHash, block.incidentId);
      block.payloadCanonicalHash = fresh.payloadCanonicalHash;
      block.blockHash = fresh.blockHash;
    }
    return { success: true };
  }
}

export const engineInstance = new SimulationEngine();
