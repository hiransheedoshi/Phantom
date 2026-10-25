# PHANTOM//TRACE - Cyber Deception & Investigation Platform

**Orcathon Problem Statement 03: Cybersecurity & Blockchain / Cyber Deception System**

A production-ready active defense and cyber deception platform featuring autonomous intrusion investigation, decoy asset orchestration, hash-chain evidence integrity, and AI-powered incident reporting.

---

## 🌐 Live Deployment

**To deploy this project, see:** [FINAL-DEPLOYMENT.md](./FINAL-DEPLOYMENT.md)

**Recommended Platform:** Render (free, no credit card, full Node.js support)

**Local Testing:**
```bash
npm install
npm run dev
# Access at http://localhost:3000
```

---

## 🎯 Problem Statement Requirements

PHANTOM//TRACE fully implements PS 03 requirements:

### ✅ Core Requirements Met:

1. **Decoy Asset Management**
   - Create, configure, enable/disable decoy honeypots
   - Multiple decoy types: Canary documents, fake credentials, SSH honeypots, database traps
   - Trust zone placement: DMZ, Corporate LAN, Finance Enclave, Decoy Sandbox
   - Real-time status monitoring (online/tripped/isolated)

2. **Controlled Interaction Simulation**
   - Safe, repeatable attack scenario simulation engine
   - Pre-defined attack paths with MITRE ATT&CK technique mapping
   - Step-by-step breach progression with configurable timing
   - Live 3D and 2D network visualization during simulation

3. **Event Collection & Monitoring**
   - Real-time telemetry collection during simulations
   - Event severity classification (CRITICAL/HIGH/MEDIUM/LOW/INFO)
   - Event outcome tracking (TRIPPED_CANARY/SUCCESS/ACCESS_DENIED)
   - Comprehensive evidence capture (commands, payloads, protocols, ports)

4. **Alert & Incident Generation**
   - Automatic incident correlation from high-severity events
   - Deduplication and session-based grouping
   - Status workflow (NEW → INVESTIGATING → CONTAINED → RESOLVED)
   - Recommended containment actions (isolate node, block IP, deploy decoy)

5. **Investigation Timeline**
   - Chronological event reconstruction
   - Observed network traversal path visualization
   - Evidence linking and forensic correlation
   - Analyst note-taking and collaboration features

6. **Hash-Chain Integrity Verification**
   - Cryptographic evidence chain using SHA-256
   - Block-by-block payload commitment
   - Tamper detection and verification reporting
   - Genesis block anchoring

### 🚀 Advanced Features Beyond Requirements:

- **Adaptive Deception Engine**: ML-driven recommendations for optimal decoy placement based on observed attack patterns
- **What-If Security Lab**: Benchmark baseline vs. augmented deception coverage with quantified metrics
- **AI-Powered Investigation Reports**: Gemini AI generates detailed forensic analysis (optional, works without API key)
- **Interactive 3D Cyberspace**: Three.js spatial network visualization with animated attack paths
- **Demo Mode Guide**: Built-in walkthrough for judges and evaluators
- **Real-time Dashboard**: Live telemetry with operational metrics and system health

---

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- React 19 + TypeScript
- Tailwind CSS 4
- Three.js (3D visualization)
- Recharts (analytics)
- XYFlow (2D topology)

**Backend:**
- Node.js + Express
- TypeScript
- In-memory simulation engine
- Google Gemini AI (optional)

**Deployment:**
- Frontend: Surge (CDN with 10 global locations)
- Build: Vite 8
- Type Safety: TypeScript 7

### Project Structure

```
phantom-trace/
├── src/
│   ├── components/          # React UI components
│   │   ├── dashboard/      # Command center
│   │   ├── network/        # 2D topology
│   │   ├── network3d/      # 3D cyberspace
│   │   ├── assets/         # Decoy management
│   │   ├── incidents/      # Investigation dossiers
│   │   ├── adaptive/       # ML recommendations
│   │   ├── whatif/         # Security benchmarking
│   │   ├── replay/         # Attack theater
│   │   ├── events/         # Event explorer
│   │   └── reports/        # Evidence & reports
│   ├── server/             # Backend logic
│   │   ├── simulationEngine.ts  # Core simulation
│   │   └── evidenceChain.ts     # Hash-chain integrity
│   ├── types/              # TypeScript definitions
│   ├── services/           # API client
│   └── data/               # Seed data
├── server.ts               # Express server entry
└── dist/                   # Production build

```

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 20.11

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app runs on http://localhost:3000

### Environment Variables

Optional `.env` file:

```env
# Optional: AI-powered incident reports
GEMINI_API_KEY="your_gemini_api_key_here"

# Auto-configured in production
APP_URL="http://localhost:3000"
NODE_ENV="development"
```

**Note:** The app works fully without a Gemini API key. AI reports will fall back to deterministic forensic templates.

### Build for Production

```bash
npm run build
npm start
```

---

## 🎮 Demo Workflow (For Judges)

### Quick 5-Minute Evaluation:

1. **Open the live URL:** https://phantom-trace-orcathon.surge.sh

2. **Enable Demo Guide:**
   - Look for "Enable Demo Guide" button in the left sidebar
   - Follow the guided walkthrough

3. **Run a Simulation:**
   - Click "Run Scenario" in the top-right
   - Watch live 3D/2D network visualization
   - Observe decoys being tripped in real-time

4. **Investigate the Incident:**
   - Navigate to "Incidents & Dossiers"
   - Select the auto-generated incident
   - Review chronological event timeline
   - Check recommended containment actions

5. **Verify Evidence Integrity:**
   - Go to "Reports & Evidence"
   - Click "Verify Evidence Chain"
   - See cryptographic verification results

6. **Test Adaptive Deception:**
   - Visit "Adaptive Lab"
   - Review ML-driven recommendations
   - Apply a recommendation to deploy a new decoy

7. **Benchmark What-If Analysis:**
   - Open "What-If Lab"
   - Run comparison between baseline and augmented coverage
   - Review quantified security improvements

---

## 🔍 Key Features Demonstration

### 1. Decoy Management
- Navigate to **"Deception Assets"**
- Click **"Deploy New Decoy"**
- Configure: Name, Type, Trust Zone, IP, Ports
- Save and see it appear in network topology

### 2. Controlled Simulation
- Click **"Run Scenario"** → Select "Finance Mirage"
- Watch step-by-step progression (T+0s → T+45s)
- See decoys change status from `online` → `tripped`
- Observe animated path in 3D cyberspace

### 3. Incident Investigation
- Auto-generated after simulation completes
- View observed traversal path
- See all related events chronologically
- Add analyst notes
- Update incident status

### 4. Evidence Chain Verification
```
Genesis Block → Event Block 0 → Event Block 1 → ... → Event Block N
```
- Each block contains: `previousHash`, `payloadHash`, `blockHash`
- Verification re-computes all hashes
- Reports any tampering or chain breaks

### 5. Adaptive Recommendations
- System analyzes attack patterns
- Recommends optimal decoy placement
- Quantifies detection advantage
- Shows probe frequency and zone criticality scores

---

## 📊 Metrics & Reporting

### Dashboard Metrics
- Total Assets / Active Decoys
- Total Interactions / Detection Coverage %
- Open Incidents / High Priority Count
- Recent Events (last 8)
- Top Engaged Decoys (by interaction count)
- Frequent Attack Paths

### System Health
- All Canaries Healthy: ✓/✗
- Tripwire Listeners Active: Count
- Telemetry Correlator: ONLINE/DEGRADED
- Evidence Chain Valid: ✓/✗
- Last Health Check: ISO Timestamp

---

## 🔐 Security Considerations

### What is Safe:
✅ All simulations run in controlled, synthetic environments  
✅ Decoy IPs are fake (10.0.x.x private ranges)  
✅ Credentials are synthetic canary tokens  
✅ No real systems are exposed or attacked  
✅ Evidence chain uses SHA-256 (industry standard)  

### What is NOT Done:
❌ No unauthorized external network scanning  
❌ No real credential exposure  
❌ No actual honeypot deployment on production systems  
❌ No connection to real threat intelligence feeds  

**For Production Use:** This is a demonstration and evaluation platform. Real-world deployment requires:
- Database persistence (PostgreSQL/MongoDB)
- Authentication & RBAC
- Audit logging
- Network isolation for decoys
- Integration with SIEM/SOAR platforms

---

## 🧪 Testing

### Type Checking
```bash
npm run typecheck
```

### Build Verification
```bash
npm run build
```

### Manual Testing Checklist
- [x] Build succeeds without errors
- [x] Dev server starts successfully
- [x] Production build completes
- [x] Frontend loads without console errors
- [x] Dashboard displays metrics
- [x] Simulation runs end-to-end
- [x] Incidents are auto-generated
- [x] Evidence chain verifies correctly
- [x] 3D and 2D visualizations render
- [x] All navigation links work
- [x] Decoy CRUD operations succeed
- [x] Adaptive recommendations score correctly
- [x] What-If comparison computes metrics

---

## 🚢 Deployment

### Current Deployment
- **Platform:** Surge (https://surge.sh)
- **CDN:** 10 global locations (US, UK, Canada, EU, Asia)
- **HTTPS:** Auto-configured
- **URL:** https://phantom-trace-orcathon.surge.sh

### Alternative Deployment Options

**For Full-Stack (with backend):**

#### Option 1: Render
```bash
# Deploy both frontend and backend
# render.yaml is pre-configured
```
1. Connect GitHub repo to Render
2. Render auto-detects `render.yaml`
3. Add `GEMINI_API_KEY` in environment

#### Option 2: Vercel
```bash
# Deploy frontend + serverless functions
# vercel.json is pre-configured
```
1. Import project to Vercel
2. Auto-detects settings
3. Add environment variables

#### Option 3: Netlify
```bash
# Deploy static + serverless
# netlify.toml is pre-configured
```
1. Drag project folder to Netlify Drop
2. Or connect via Git

---

## 📋 PS 03 Compliance Summary

| Requirement | Implementation | Status |
|------------|----------------|--------|
| Decoy Asset Management | Full CRUD, multi-type, zone-based | ✅ Complete |
| Controlled Simulation | Multi-step scenarios, MITRE mapped | ✅ Complete |
| Event Collection | Real-time telemetry, evidence capture | ✅ Complete |
| Alert Generation | Auto-correlation, severity-based | ✅ Complete |
| Incident Investigation | Timeline, path, forensics | ✅ Complete |
| Hash-Chain Integrity | SHA-256, tamper detection | ✅ Complete |

### Additional Value:
- Adaptive ML recommendations
- What-If benchmarking
- AI forensic analysis
- 3D spatial visualization
- Real-time operational dashboard

---

## 🎓 Educational Value

This platform demonstrates:
- **Cyber Deception Theory:** Active defense vs. passive monitoring
- **Attack Path Analysis:** Lateral movement and traversal visualization
- **Evidence Integrity:** Blockchain-inspired immutable audit trails
- **Security Benchmarking:** Quantified detection coverage improvements
- **Forensic Correlation:** Session-based event aggregation
- **Incident Response:** Recommended containment workflows

---

## 📝 Known Limitations

1. **In-Memory Storage:** Events/incidents reset on server restart
   - **For Production:** Add PostgreSQL/MongoDB persistence

2. **Simulated Environment:** Attacks are scripted scenarios
   - **For Production:** Integrate real honeypot frameworks (Cowrie, OpenCanary, T-Pot)

3. **No Authentication:** Open access demo
   - **For Production:** Add JWT auth, RBAC, audit logs

4. **Single-Tenant:** No multi-organization support
   - **For Production:** Add tenant isolation

5. **Evidence Chain:** Local verification only
   - **For Production:** Consider distributed ledger or timestamping authority

---

## 🤝 Credits

**Developed for:** Orcathon Problem Statement 03  
**Architecture:** Autonomous cyber deception and investigation platform  
**Technologies:** React, TypeScript, Node.js, Express, Three.js, Tailwind  

---

## 📞 Support

For questions about this submission:
- Review the **Demo Mode Guide** in the application
- Check the **Settings & Health** page for system status
- Use **Reset Demo Data** button to restore initial state

---

## ✅ Final Checklist

- [x] All PS 03 requirements implemented
- [x] Build succeeds without errors
- [x] TypeScript type-safe throughout
- [x] Production deployment live and verified
- [x] Demo workflow documented
- [x] Architecture documented
- [x] Security considerations addressed
- [x] Testing completed
- [x] README comprehensive
- [x] Live URL provided

---

**🌐 Live Demo:** [https://phantom-trace-orcathon.surge.sh](https://phantom-trace-orcathon.surge.sh)

**⚡ Status:** Production Ready | Submission Complete
