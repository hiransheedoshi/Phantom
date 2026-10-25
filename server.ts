import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { engineInstance } from './src/server/simulationEngine';
import { fileURLToPath } from 'url';

dotenv.config();

// Determine __dirname based on environment
let __dirname: string;
if (typeof __filename !== 'undefined') {
  // CJS environment (bundled)
  __dirname = path.dirname(__filename);
} else if (typeof import.meta !== 'undefined' && import.meta.url) {
  // ESM environment (development)
  const __filename = fileURLToPath(import.meta.url);
  __dirname = path.dirname(__filename);
} else {
  // Fallback
  __dirname = process.cwd();
}

// Initialize AI report client if API key is present
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  } catch (err) {
    console.warn('AI client initialization warning:', err);
  }
}

export async function buildApp(): Promise<express.Express> {
  const app = express();

  app.use(express.json());

  // --- HEALTH & STATUS ---
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'UP',
      platform: 'PHANTOM//TRACE Deception Core',
      engineVersion: '2.4.1',
      geminiAiEnabled: !!process.env.GEMINI_API_KEY,
      timestamp: new Date().toISOString(),
    });
  });

  // --- DASHBOARD TELEMETRY ---
  app.get('/api/dashboard', (req: Request, res: Response) => {
    try {
      const stats = engineInstance.getDashboardStats();
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- ASSETS CRUD ---
  app.get('/api/assets', (req: Request, res: Response) => {
    res.json(engineInstance.getAssets());
  });

  app.get('/api/assets/:id', (req: Request, res: Response) => {
    const asset = engineInstance.getAssetById(req.params.id);
    if (!asset) {
      res.status(404).json({ error: 'Asset not found' });
      return;
    }
    res.json(asset);
  });

  app.post('/api/assets', (req: Request, res: Response) => {
    try {
      const created = engineInstance.createAsset(req.body);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch('/api/assets/:id', (req: Request, res: Response) => {
    const updated = engineInstance.updateAsset(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Asset not found' });
      return;
    }
    res.json(updated);
  });

  app.delete('/api/assets/:id', (req: Request, res: Response) => {
    const success = engineInstance.deleteAsset(req.params.id);
    if (!success) {
      res.status(404).json({ error: 'Asset not found or cannot delete' });
      return;
    }
    res.json({ success: true, deletedId: req.params.id });
  });

  // --- EVENTS ---
  app.get('/api/events', (req: Request, res: Response) => {
    res.json(engineInstance.getEvents());
  });

  // --- INCIDENTS ---
  app.get('/api/incidents', (req: Request, res: Response) => {
    res.json(engineInstance.getIncidents());
  });

  app.get('/api/incidents/:id', (req: Request, res: Response) => {
    const incident = engineInstance.getIncidentById(req.params.id);
    if (!incident) {
      res.status(404).json({ error: 'Incident not found' });
      return;
    }
    res.json(incident);
  });

  app.patch('/api/incidents/:id', (req: Request, res: Response) => {
    const updated = engineInstance.updateIncident(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Incident not found' });
      return;
    }
    res.json(updated);
  });

  app.post('/api/incidents/:id/notes', (req: Request, res: Response) => {
    const { author, note } = req.body;
    if (!note) {
      res.status(400).json({ error: 'Note text required' });
      return;
    }
    const updated = engineInstance.addAnalystNote(req.params.id, author, note);
    if (!updated) {
      res.status(404).json({ error: 'Incident not found' });
      return;
    }
    res.json(updated);
  });

  // --- SIMULATION SCENARIOS & ENGINE ---
  app.get('/api/simulations/scenarios', (req: Request, res: Response) => {
    res.json(engineInstance.getScenarios());
  });

  app.post('/api/simulations/start', (req: Request, res: Response) => {
    const { scenarioId, configuration } = req.body;
    const simState = engineInstance.startSimulation(scenarioId, configuration || 'baseline');
    res.json(simState);
  });

  app.get('/api/simulations/:runId/state', (req: Request, res: Response) => {
    const state = engineInstance.getSimulationState(req.params.runId);
    if (!state) {
      res.status(404).json({ error: 'Simulation run not found' });
      return;
    }
    res.json(state);
  });

  app.post('/api/simulations/:runId/pause', (req: Request, res: Response) => {
    const state = engineInstance.pauseSimulation(req.params.runId);
    if (!state) {
      res.status(404).json({ error: 'Simulation run not found' });
      return;
    }
    res.json(state);
  });

  app.post('/api/simulations/:runId/resume', (req: Request, res: Response) => {
    const state = engineInstance.resumeSimulation(req.params.runId);
    if (!state) {
      res.status(404).json({ error: 'Simulation run not found' });
      return;
    }
    res.json(state);
  });

  app.post('/api/simulations/:runId/stop', (req: Request, res: Response) => {
    const state = engineInstance.stopSimulation(req.params.runId);
    if (!state) {
      res.status(404).json({ error: 'Simulation run not found' });
      return;
    }
    res.json(state);
  });

  app.post('/api/simulations/:runId/step', (req: Request, res: Response) => {
    const result = engineInstance.executeSimulationStep(req.params.runId);
    const state = engineInstance.getSimulationState(req.params.runId);
    res.json({ result, state });
  });

  // --- ADAPTIVE DECEPTION RECOMMENDATIONS ---
  app.get('/api/deception/recommendations', (req: Request, res: Response) => {
    res.json(engineInstance.getRecommendations());
  });

  app.post('/api/deception/recommendations/:id/apply', (req: Request, res: Response) => {
    const result = engineInstance.applyRecommendation(req.params.id);
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    res.json(result);
  });

  // --- WHAT-IF SECURITY LAB EVALUATION ---
  app.post('/api/evaluations/compare', (req: Request, res: Response) => {
    const { scenarioId } = req.body;
    const comparison = engineInstance.compareWhatIf(scenarioId || 'SCENARIO-FINANCE-MIRAGE');
    res.json(comparison);
  });

  // --- EVIDENCE CHAIN & BLOCKCHAIN AUDIT ---
  app.get('/api/evidence/chain', (req: Request, res: Response) => {
    res.json(engineInstance.getEvidenceChain());
  });

  app.get('/api/evidence/verify', (req: Request, res: Response) => {
    res.json(engineInstance.verifyEvidenceChain());
  });

  // --- AI INVESTIGATION REPORT GENERATION ---
  app.post('/api/reports/incidents/:id', async (req: Request, res: Response) => {
    const incident = engineInstance.getIncidentById(req.params.id);
    if (!incident) {
      res.status(404).json({ error: 'Incident not found' });
      return;
    }

    const events = engineInstance
      .getEvents()
      .filter((e) => incident.relatedEventIds.includes(e.eventId));

    let aiGeneratedContent = '';
    let usedAiEngine = false;

    if (aiClient && process.env.GEMINI_API_KEY) {
      try {
        const prompt = `You are the lead cybersecurity forensics investigator generating an autonomous incident report for PHANTOM//TRACE.
CRITICAL RULES:
1. ONLY reference the exact provided event IDs: ${events.map((e) => e.eventId).join(', ')}.
2. DO NOT hallucinate or invent fake IP addresses, timestamps, or credentials.
3. Distinguish confirmed observations from analyst inferences.
4. Recommend concrete containment and deception countermeasures within the simulated network.

INCIDENT DETAILS:
ID: ${incident.id}
Title: ${incident.title}
Severity: ${incident.severity}
Status: ${incident.status}
Source IP: ${incident.sourceIp}
Observed Traversal Path: ${incident.observedPath.join(' -> ')}
Summary: ${incident.summary}

SUPPORTING EVIDENCE EVENTS:
${JSON.stringify(events, null, 2)}

Provide a rigorous Markdown forensic report with sections:
# Executive Summary
# Chronological Intrusion Reconstruction (citing Event IDs)
# Deception Sensor Efficacy Analysis
# Confidence & Uncertainty Boundaries
# Recommended Immediate Containment Steps
# Long-Term Architectural Deception Hardening`;

        const response = await aiClient.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: prompt,
        });

        if (response.text) {
          aiGeneratedContent = response.text;
          usedAiEngine = true;
        }
      } catch (err: any) {
        console.warn('AI report generation failed, using deterministic fallback:', err.message);
      }
    }

    // Deterministic fallback if Gemini is not available or encountered quota issue
    if (!aiGeneratedContent) {
      aiGeneratedContent = `# Incident Investigation Report: ${incident.id}
**Classification:** PHANTOM//TRACE Autonomous Forensic Record
**Severity:** ${incident.severity} | **Status:** ${incident.status} | **Generated:** ${new Date().toISOString()}

---

## 1. Executive Summary
During the execution of scenario **${incident.scenarioId}**, synthetic adversary **${incident.sourceIp}** launched an unauthorized reconnaissance and lateral traversal campaign across multiple security zones. 

The intrusion was successfully intercepted and fingerprinted by PHANTOM deception tripwires. Forensic confidence is rated at **99%** due to definitive interactions with planted canary digital assets.

---

## 2. Chronological Intrusion Reconstruction
${events.map((e, idx) => `### ${idx + 1}. Event ${e.eventId} — [${e.severity}] ${e.eventType}
- **Timestamp:** ${e.timestamp} (T+${e.relativeTimeSec}s)
- **Source:** ${e.sourceAssetId} (${e.sourceIp}) ➔ **Target:** ${e.targetAssetId}
- **Protocol:** \`${e.protocol}\` | **Outcome:** \`${e.outcome}\`
- **Forensic Evidence:** ${e.evidence.fileAccessed ? `Accessed file: \`${e.evidence.fileAccessed}\`` : ''} ${e.evidence.command ? `Executed command: \`${e.evidence.command}\`` : ''} ${e.evidence.canaryTokenId ? `Tripped token: \`${e.evidence.canaryTokenId}\`` : ''}
- **Analysis:** ${e.description}
`).join('\n')}

---

## 3. Observed Network Traversal Route
\`\`\`
${incident.observedPath.join(' ──[Observed Hop]──▶ ')}
\`\`\`
Total traversed nodes: **${incident.observedPath.length}**. 
Adversary progression was diverted away from critical production databases (**DB-PROD-POSTGRES**) into armed deception honeypots.

---

## 4. Deception Efficacy & Sensor Performance
- **Zero False Positives:** Normal operational traffic across production clusters proceeded without triggering tripwires.
- **Canary Tokens Tripped:** Successfully captured exfiltration attempts and token activations.
- **Deception Gravity Score:** High. Decoy financial assets acted as primary beacons.

---

## 5. Recommended Containment & Countermeasures
1. **Host Isolation:** Isolate traversed node \`${incident.observedPath[1] || 'compromised-host'}\` in the simulated network boundary.
2. **Credential Revocation:** Invalidate harvested decoy tokens and flush session caches.
3. **Adaptive Decoy Reinforcement:** Deploy an adjacent Cowrie SSH bastion or Honey Database in the target subnet to intercept future lateral scans.

*Generated by PHANTOM//TRACE Autonomous Forensic Correlator.*`;
    }

    // Persist AI explanation to incident record
    engineInstance.updateIncident(incident.id, { aiExplanation: aiGeneratedContent });

    res.json({
      incidentId: incident.id,
      reportMarkdown: aiGeneratedContent,
      usedAiEngine,
      timestamp: new Date().toISOString(),
    });
  });

  // --- RESET DEMO DATA ---
  app.post('/api/demo/reset', (req: Request, res: Response) => {
    engineInstance.resetToSeed();
    res.json({ success: true, message: 'All demo data, assets, and events restored to initial state.' });
  });

  // --- FRONTEND INTEGRATION (DEV / PROD) ---
  if (process.env.NODE_ENV === 'production') {
    // The bundled server lives inside dist/ itself, so accept both layouts.
    const candidates = [path.resolve(__dirname, 'dist'), __dirname];
    const distDir = candidates.find((dir) => fs.existsSync(path.join(dir, 'index.html')));
    if (distDir) {
      app.use(express.static(distDir));
      app.get('*', (req: Request, res: Response) => {
        res.sendFile(path.join(distDir, 'index.html'));
      });
    }
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  return app;
}

async function startServer() {
  const app = await buildApp();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PHANTOM//TRACE full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

// On Vercel the app is exported to the serverless function instead of listening.
if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Fatal server startup error:', err);
  });
}

export default buildApp;
