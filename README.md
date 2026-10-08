# AutoSentinel AI

> **See defects before they become failures.**

AutoSentinel AI is a hackathon prototype of an AI-powered quality inspection system for automotive **brake discs / rotors**. An operator uploads a brake disc photo, the system reports the defect, severity, confidence and risk, explains the result, recommends an action, and lets the team simulate how changing machine conditions would affect risk.

> ⚠️ **Prototype.** No trained computer-vision model is bundled. All inspection results, sensor values and statistics come from a deterministic **demo engine**, **demo dataset** and **simulated sensor data**. Nothing here is safety-certified or production-grade.

## 1. Features
- **Dashboard** – quality command center: KPIs, risk gauge, 12-hour risk trend, AI insights, recent inspections (updates live after each inspection).
- **Inspect Component** – drag-and-drop JPG/PNG upload, demo images, demo-scenario selector, animated scan, bounding boxes, risk meter, explanation, recommended action, save/detail dialogs.
- **Live Monitoring** – streaming simulated sensors (temperature, vibration, pressure, RPM, load) with occasional anomalies and NORMAL / WARNING / CRITICAL status.
- **AI Risk Analysis** – sliders + numeric inputs (validated & clamped), risk gauge, contribution bar chart, recommendation.
- **What-If Simulator** (hero) – current vs simulated conditions, Run Simulation, animated before/after chart, risk reduction in points.
- **Inspection History** – search, filters (All / Pass / Defect / Critical), detail panel.
- **Analytics** – KPIs and five charts with Today / 7 Days / 30 Days filter.
- **System Settings** – threshold, auto-analysis, history saving, alerts, line & interval (persisted locally).

## 2. Architecture
```text
Browser (React, TanStack Start)
  ├─ src/lib/ai/        inspection.ts · risk.ts · simulation.ts   (mock AI services)
  ├─ src/lib/mock/      demo dataset & generators
  ├─ src/lib/store.ts   local data layer (localStorage) → swap for Postgres later
  ├─ src/lib/api/       REST client + request schemas
  └─ src/routes/api/    built-in REST endpoints (same contracts as FastAPI)
backend/ (FastAPI)
  ├─ main.py
  ├─ routes/   inspect · risk · simulate · history · analytics · machine
  ├─ services/ inspection_service (DEMO_MODE / real model hook) · risk_service · mock_data
  └─ models/   Pydantic schemas
```
The risk formula is identical in `src/lib/ai/risk.ts` and `backend/services/risk_service.py`.

## 3. Tech stack
React 19 · TypeScript · TanStack Start (Vite, file-based routing, SSR) · Tailwind CSS v4 · shadcn/ui · Recharts · Lucide · FastAPI / Pydantic.
*(The brief asked for Next.js; this platform runs TanStack Start, which provides the same React + SSR + API-route capabilities. Pages live in `src/routes/`.)*

## 4. Local setup
```bash
cp .env.example .env
```

## 5. Running the frontend
```bash
npm install
npm run dev      # http://localhost:8080
npx vitest run   # risk-model tests
```

## 6. Running the backend (optional)
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
DEMO_MODE=true uvicorn main:app --reload --port 8000
```
Set `VITE_API_BASE_URL=http://localhost:8000` to point the REST client at FastAPI.

## 7. Demo mode
`DEMO_MODE=true` (default) — the app runs fully offline from external AI APIs. Scenarios:
1. PASS · 2. Surface Crack — High · 3. Corrosion — Medium · 4. Scratch — Low · 5. Uneven Wear — Medium · 6. Hole / Perforation — Critical

The prototype classifies images into five visual condition categories: Clean, Scratch, Wear, Corrosion, and Hole / Perforation. Additional defect classes require training and validation using a sufficiently large, properly labeled brake-component image dataset.

Pick one in the **Demo Scenario** selector on the Inspect page, or use *Auto*, which derives the scenario from the file name (`crack`, `rust`, `scratch`, `wear`, `clean`) or a hash.

### 3-minute demo script
1. **Dashboard** – "AutoSentinel AI monitors automotive production quality and machine conditions."
2. **Inspect Component** – click the *Crack* demo image → **Analyze with AutoSentinel AI** → DEFECT DETECTED · Surface Crack · 94.3% · Risk 78%.
3. **AI Risk Analysis** – click *Load high-risk case* → Calculate Risk → vibration is the main contributor.
4. **What-If Simulator** – set Temperature 85 °C, Vibration 3.0 mm/s (or *AI suggestion*) → **Run Simulation** → 78% → 21%, −57 points.
5. **Dashboard** – the new inspection appears at the top of Recent Inspections (marked *New*).

## 8. API endpoints
| Method | Path | Body / Output |
|---|---|---|
| POST | `/api/inspect` | multipart `image` → `{status, defect, severity, confidence, risk, recommendation}` |
| POST | `/api/risk` | `{temperature, vibration, pressure, rpm, load, component_age}` → `{risk, level, contributors, recommendation}` |
| POST | `/api/simulate` | `{current_conditions, simulated_conditions}` → `{current_risk, simulated_risk, risk_reduction, recommendation}` |
| GET | `/api/history` | demo inspection records |
| GET | `/api/analytics` | `?range=today\|7d\|30d` |
| GET | `/api/machine-status` | current simulated sensor snapshot |

## 9. Security
No API keys in frontend code. Server secrets live in env vars without the `VITE_` prefix (see `.env.example`). All endpoints validate and clamp inputs.

## 10. Future improvements
- Train a YOLOv8 / segmentation model on real brake-disc defect images and plug it into `inspection_service.run_model`.
- Persist inspections to PostgreSQL (types in `src/types` map to tables).
- Ingest real PLC / OPC-UA sensor streams; learn normal operating ranges per machine.
- Calibrate the risk model on historical failure data; add uncertainty estimates.
- Operator authentication and audit trail.
