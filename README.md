# AstraSense

**AstraSense is a fleet intelligence and machine-condition monitoring system for defense-style vehicles. It helps operators assess readiness, detect anomalies, and inspect individual assets through a structured diagnostic interface.**

## What it does

AstraSense combines **fleet-level monitoring** with **per-vehicle diagnostics**.

It helps answer:
- Which assets are ready to deploy?
- Which vehicles need attention?
- Where are anomalies emerging?
- What changed from normal baseline behavior?
- What should be done next?

## Why it’s different

AstraSense is not just a dashboard.

It combines:

- **Fleet Intelligence** — alerts, readiness, and fleet trend visibility
- **Mission Readiness** — deploy ready, caution, or grounded states
- **Anomaly Score** — deviation from expected operator and machine behavior
- **Vehicle Dossier** — telemetry, timeline, diagnostic summary, and recommended actions for a single asset

## Core Features

### Fleet Overview
- fleet-wide monitoring
- readiness and anomaly trend visualization
- separate critical and anomaly alerts
- mission readiness summary
- filtering and sorting by asset type and state
- 15-asset fleet including tanks, jets, helicopters, APCs, MRAPs, UAVs, and support vehicles

### Vehicle Detail / Diagnostics
- hero asset view with 3D support where applicable
- identity and status panel
- diagnostic summary
- baseline vs current telemetry comparison
- anomaly score module
- incident timeline
- recommended actions

## Tech Stack

- **React**
- **TypeScript**
- **Vite**
- **Three.js-based 3D rendering**
- **xAI Grok API**
- **Render**
- **GitHub**

## How it works

1. Fleet status is surfaced through alerts, readiness, and trend views  
2. Asset anomalies are derived from deviations in expected operator and machine behavior  
3. Each vehicle can be opened into a detailed diagnostics view  
4. The analysis layer helps translate system state into operator-facing diagnostic insight  

## Why it works for a hackathon

AstraSense stands out because it combines:
- strong product identity
- realistic monitoring logic
- a polished UI
- a clear flow from fleet overview to asset-level intelligence

It is designed to be easy to understand quickly while still feeling technically thoughtful.

## Local Setup

### Prerequisites
- Node.js 18+
- npm

### Run locally

```bash
git clone https://github.com/pratiksharan/AstraSense.git
cd AstraSense
npm install
npm run dev
```

### Build

```bash
npm run build
npm run preview
```

## Deployment

AstraSense is deployed on **Render** and versioned through **GitHub**.

## Note

AstraSense uses bounded synthetic/demo telemetry to simulate believable fleet conditions, sparse anomaly activity, and realistic readiness shifts. It is built as a decision-support prototype.
