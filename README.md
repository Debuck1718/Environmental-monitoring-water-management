# Environmental Monitoring and Water Management System

## System Overview & Main Goal
This system uses a real-life webcam (mounted above the field, acting as a “satellite”) to continuously monitor the environment and a connected water management setup:
- Environmental monitoring via top-mounted camera:
  - Detect percentage reduction in tree cover (felling/deforestation risk).
  - Detect signs of deep-hole excavation indicative of potential galamsey activity.
  - When risks are detected, send alerts to the interface for nearby authorities or civilians to check.
- Water quality and filtration management:
  - Sensors detect chemicals present in polluted water and their concentrations.
  - Provide best-practice treatment recommendations for that specific water profile.
  - Automate debris interception using a net in the water channel; automatically dump debris when the net is full.
  - Track the amount of water entering filtration tubes and show filtration progress.
- Energy and distribution:
  - Monitor electricity produced by turbines driven by filtered water flow.
  - Distribute filtered water to households and determine optimal routing paths.
  - Provide daily statistics for: amount of water filtered, electricity generated, and water distributed.

This README reflects current progress and how each module aligns with the above goals.

## Development Phases & Progress Tracking

The software will be developed in the following phases. Progress will be tracked here as features are completed.

### Phase 1: Project Setup & Environmental Monitoring Module
- [x] Project structure initialized (folders and main.py created)
- [x] Environmental Monitoring (initial implementation)
  - Tree cover: green-pixel ratio with baseline learning and alert threshold (top-camera friendly)
  - Excavation detection: background subtraction + contour solidity filtering (deep-hole/terrain change cues)
  - Activity alerts: motion magnitude grouping (foundation for risk cues; not reporting normal movement)
  - Unified per-frame result payload and alert flags
- [x] Dependency management (requirements.txt)
- [x] External configuration (config.yaml) and CLI flag to load
- [x] JSONL logging and ROI support in runner
- [x] Alerting with rate limiting (console notifier)
- [x] Testing scaffold (pytest) and baseline capture utility
- [x] Packaging and CLI entry point (envmon)

### Phase 2: Water Quality Monitoring Module
- [x] Water quality ingest (mock and serial placeholder)
- [x] Rule evaluation for pH/turbidity/temperature with recommendations (chemical detection foundation)
- [ ] Concentration-based treatment advice for additional contaminants (extend rules)
- [ ] Integration with central dashboard (pending)

### Phase 3: Filtration System Management Module
- [x] Filtration control loop (state machine) with mock sensors/actuators
- [ ] Automatic debris net capacity detection and dump cycle integration (align with main goal)
- [ ] Track volume of water entering filtration and filtration-stage progress UI
- [x] Water distribution routing planner (simulated) and volume tracking (SQLite)

### Phase 4: Energy Generation & Statistics Module
- [x] Turbine telemetry ingestion (mock)
- [x] SQLite-backed daily energy statistics (kWh, avg power)
- [ ] Daily statistics dashboard (filtered water, energy, distributed water)

### Phase 5: User Interface & Dashboard
- [ ] Real-time video feed and alert notifications (tree % drop, excavation risk)
- [ ] Water quality and filtration panels (chemical concentrations, treatment steps, debris net status)
- [ ] Distribution routes and daily statistics (water filtered, electricity generated, water distributed)
- [x] Backend API (FastAPI) with endpoints:
  - GET /health
  - GET /energy/stats
  - GET /filtration/status
  - GET /env/alerts (stream NDJSON from JSONL)
  - GET /water/latest (last water reading from JSONL)
  - GET /env/recent (recent env frames from SQLite runs/data.db)
  - GET /water/recent (recent water readings from SQLite runs/data.db)
  - GET /env/summary (avg current green ratio vs baseline; percentage tree-cover drop; recent excavation/activity counts)
  - GET /stats/overview (counts of persisted env/water + today's energy stats + distribution today)
  - GET /distribution/summary (recent daily totals of distributed water)
---
_Progress will be updated as each phase is completed._

## Installation (Editable)

- python -m venv .venv && source .venv/bin/activate  (Windows: .venv\Scripts\activate)
- pip install -r requirements.txt
- pip install -e .

This provides the envmon CLI entry point and installs FastAPI/Uvicorn for the backend.

## Quick Start

Run with webcam (top-mounted camera replacing satellite):
- envmon

Persist environment results to SQLite (optional):
- envmon --db runs/data.db

Run with a video file:
- envmon --video "<path-to-video>"

Use a custom configuration:
- envmon --config config.yaml

Log per-frame results to JSONL:
- mkdir -p runs
- envmon --log runs/monitor_log.jsonl

Restrict processing to a polygon ROI (also visualized as a yellow polygon overlay):
- envmon --roi "100,100;500,100;500,400;100,400"

Enable console alerts with rate limiting (default 120s between repeats per type):
- envmon --alerts --alert-interval 180

Capture baseline green ratio (median over ~60 frames) and print to console:
- envmon --baseline-capture

Disable visual window (headless):
- envmon --no-gui

Output:
- On-screen overlays (if GUI enabled): tree green ratio (as tree-cover proxy), excavation regions, activity regions, and ROI polygon (if set)
- Console summary every 60 frames with alert flags
- Optional JSONL log containing timestamped alerts and counts
- Alerts on tree-cover threshold breach and excavation-like changes, aligned with galamsey risk cues

## Water Quality Monitoring (Phase 2)

Run mock ingestion with rule evaluation:
- python water_main.py --period 1.0 --log runs/water_log.jsonl

Persist to SQLite (optional):
- python water_main.py --period 1.0 --db runs/data.db

Use a serial sensor (placeholder line protocol: ph,turbidity,temperature,dissolved_oxygen):
- python water_main.py --serial-port COM3 --baudrate 9600 --period 1.0 --log runs/water_log.jsonl

Adjust thresholds:
- python water_main.py --ph-min 6.8 --ph-max 8.2 --turbidity-max 5 --temp-max 32

Simulate contaminants (mg/L) to get concentration-based treatment recommendations:
- python water_main.py --lead 0.02 --arsenic 0.02 --nitrate 60

Output:
- Console line with readings and alerts; optional JSONL logs with recommendations.
- Aligns with: detecting chemicals/quality and advising treatment steps.

## Backend API (Phase 5)

Run the backend server:
- python backend_main.py --host 0.0.0.0 --port 8000 --reload

Endpoints:
- GET http://localhost:8000/health
- GET http://localhost:8000/energy/stats
- GET http://localhost:8000/filtration/status
- GET http://localhost:8000/env/alerts     (stream NDJSON from JSONL)
- GET http://localhost:8000/water/latest    (latest from JSONL)
- GET http://localhost:8000/env/recent      (recent env frames from SQLite runs/data.db)
- GET http://localhost:8000/water/recent    (recent water readings from SQLite runs/data.db)
- GET http://localhost:8000/env/summary     (avg current green ratio vs baseline; percentage tree-cover drop; recent excavation/activity counts)
- GET http://localhost:8000/stats/overview  (counts of persisted env/water + today's energy stats + distribution today)
- GET http://localhost:8000/distribution/summary  (recent daily totals of distributed water)
- GET http://localhost:8000/water/config    (current water-rule thresholds and contaminant limits)
- POST http://localhost:8000/water/evaluate (ad-hoc evaluation of a single reading with optional contaminants)

Notes:
- Set ENERGY_DB to override energy DB path (default runs/energy.db).
- Set DATA_DB to override environment/water SQLite path (default runs/data.db).
- CORS: By default, CORS is open for development in src/backend/server.py; tighten allowed origins for production.
- Security: Protect backend endpoints (network ACL/reverse proxy/auth) and do not expose SQLite files publicly.

## Data Export

Export persisted environment, water, and distribution data to CSV:
- python tools/export_csv.py --db runs/data.db --out runs/exports
- Optional: select tables with --tables "env_frames,water_readings,distribution_daily"

## Scheduler

Run periodic rollups and exports (suitable for cron/Task Scheduler):
- python tools/scheduler.py --once
- python tools/scheduler.py --interval-min 60

## CLI Client

Quickly query backend endpoints:
- python tools/client.py --endpoint health
- python tools/client.py --endpoint env/summary
- python tools/client.py --endpoint energy/stats
- python tools/client.py --endpoint water/recent
- python tools/client.py --endpoint distribution/summary

Initial setup (optional):
- python tools/setup_env.py

Orchestrated Demo (start core services together):
- python tools/run_all.py
  - Starts: env monitor (webcam, headless, logs+db), water monitor (mock), filtration sim, energy telemetry, distribution sim, and backend API on :8000

## Filtration System (Phase 3)

Run filtration control loop (simulated):
- python filtration_main.py --log runs/filtration_log.jsonl --period 1.0 --dump-threshold 80 --dp-max 25 --dump-duration 5 --backwash-duration 10

Behavior:
- Simulates debris accumulation, pressure rise, and flow drop; triggers debris dump and backwash cycles.
- To align with the goal: add net-capacity sensing, auto-dump when full, and filtration volume tracking.

## Energy Generation & Daily Stats (Phase 4)

Run energy telemetry and stats aggregation:
- python energy_main.py --period 1.0 --base-power 150 --db runs/energy.db

Output:
- Console line with instantaneous power/rpm and rolling daily energy stats (kWh, avg power), persisted to SQLite at runs/energy.db.
- Aligns with: reporting electricity produced by turbines driven by filtered water.

## Water Distribution (Phase 3)

Simulate routing filtered water to homes and persist daily distributed volume:
- python distribution_main.py --homes "H1:10,H2:15,H3:8" --duration 120 --db runs/data.db

Behavior:
- Uses a simple pipe network graph to compute shortest routes from plant to each home.
- Delivers per-home volume based on demand (LPM) over simulation time; persists events and daily totals to SQLite.
- Summaries available via backend endpoint: GET /distribution/summary

## Testing

Run unit tests:
- pytest -q

Tests cover:
- Tree-cover green ratio behavior on synthetic frames
- Activity motion handling with/without previous frame
- Excavation detector filtering of small regions

## Module Details

Environmental Monitoring (Phase 1)
- Tree Cover Monitoring
  - Approach: HSV green masking with saturation gating and G-channel clamp
  - Baseline: median of first 60 frames; change percentage computed vs baseline
  - Alert: triggers if green ratio < configured threshold (default 0.30)
  - Aligns with: percentage reduction in trees (felling/deforestation risk)

- Excavation Detection
  - Approach: MOG2 background subtraction, morphological cleanup, contour area and solidity filtering
  - Output: bounding boxes for candidate excavation regions
  - Aligns with: deep-hole excavation risk alerts to authorities/civilians

- Activity Alert System
  - Approach: Farneback optical flow; threshold on motion magnitude; contour grouping
  - Output: bounding boxes and average motion magnitude
  - Note: General movement is not necessarily alerted—focus on risk cues (tree loss, excavation)

Configuration
- Edit config.yaml to tune thresholds:
  - monitor.green_threshold, monitor.green_saturation_min, monitor.tree_alert_threshold
  - monitor.bg_history, monitor.bg_var_thresh, monitor.excavation_area_min, monitor.excavation_solid_thresh
  - monitor.motion_mag_threshold, monitor.activity_area_min
  - filtration.debris_dump_threshold, filtration.filter_dp_max_kpa, filtration.dump_duration_sec, filtration.backwash_duration_sec, filtration.cycle_period_sec

- Or adjust directly in code:
  - src/environmental_monitoring/monitor.py -> MonitorConfig
  - main.py / water_main.py / filtration_main.py / energy_main.py -> CLI flags

## Next Steps (to fully match the main goal)
- Environmental
  - Calibrate green-ratio thresholds with sample frames; add persistent deforestation change tracking (hour/day windows).
  - Persist alerts to SQLite and expose via backend for UI notifications.
- Water Quality
  - Extend rules to handle additional contaminants and concentration-specific treatment guidance.
  - Persist readings to SQLite and summarize daily water-quality stats.
- Filtration
  - Implement net-capacity sensing (e.g., load cell/encoder inputs) and auto-dump cycles.
  - Track water volume through filtration; add per-stage progress metrics.
  - Add distribution routing planner (graph-based) and home supply telemetry.
- Energy
  - Correlate energy production with water throughput; include in daily dashboard.
- UI/Backend
  - FastAPI backend with WebSocket/live updates and a minimal web UI for:
    - Environment alerts (tree %, excavation)
    - Water quality and treatment recommendations
    - Filtration progress and debris-net status
    - Distribution routes and daily statistics (water filtered, electricity generated, water distributed)
  - UI roadmap (planned):
    - Live camera panel (webcam stream or periodic snapshots), alert banners for tree-cover drop and excavation
    - Panels fed by backend endpoints: /env/summary, /env/recent, /water/recent, /stats/overview, /distribution/summary
    - Historical charts from SQLite (energy_kwh, water volume, alerts per day)
- Deployment
  - Add Dockerfile/compose and environment-based configuration for field deployment.

## Next Steps (Concise)
- Ship a minimal dashboard wiring: /env/summary, /env/recent, /water/recent, /stats/overview, /distribution/summary with live updates.
- Persist alert history and water readings to SQLite; add /water/summary and alert-history endpoints.
- Implement debris-net capacity sensing and auto-dump; begin logging per-stage filtration volumes.
- Correlate turbine energy with water throughput and surface in daily overview.
- Add Docker/Compose, .env-based config, and expand unit/integration tests.

## Troubleshooting

- Webcam not opening: ensure no other app is using it; try an explicit index (envmon --video 0). On Linux, check permissions to /dev/video*.
- No GUI window: omit --no-gui; on headless Linux set DISPLAY or run headless intentionally.
- ROI parse error: format must be "x,y;..."; example: --roi "100,100;500,100;500,400;100,400".
- No data at backend endpoints: start producers (envmon, water_main.py, energy_main.py, distribution_main.py) or use tools/run_all.py; verify runs/data.db and log files exist; override paths with DATA_DB/ENERGY_DB if needed.
- Port already in use: change port (python backend_main.py --port 8001).
- Missing packages: activate your venv and run pip install -r requirements.txt.
- SQLite locked: stop other processes writing to runs/data.db; retry; for long reads, copy the DB first.
- Serial sensor not found: verify port (e.g., COM3 or /dev/ttyUSB0) and permissions; pass --serial-port and --baudrate.
- Windows paths: wrap paths with spaces in quotes, e.g., --video "C:\path with spaces\clip.mp4".