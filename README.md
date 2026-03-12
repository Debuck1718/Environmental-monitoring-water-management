# EcoGuard HQ: Environmental Monitoring & Water Management System

EcoGuard HQ is a comprehensive, full-stack solution designed for real-time environmental surveillance and intelligent water resource management. It integrates computer vision, sensor data ingestion, and automated control systems into a unified dashboard.

## 🌟 Key Features

### 🖥️ Real-Time Dashboard
A premium, dark-mode web interface built with **React**, **Vite**, and **Tailwind CSS**. 
- **Live Metrics**: At-a-glance view of tree cover, pH levels, and temperature.
- **Dynamic Charts**: Interactive trend visualizations using **Recharts**.
- **System Health**: Real-time connection monitoring and alert status.

### 🌲 Environmental Monitoring (Computer Vision)
Powered by **OpenCV**, this module monitors physical environments via video streams.
- **Tree Cover Analysis**: Calculates green ratios to detect deforestation or growth.
- **Excavation Detection**: Identifies unauthorized digging or terrain changes.
- **Activity Tracking**: Motion-based region detection to monitor site activity.
- **ROI Masking**: Define specific "Regions of Interest" to reduce noise.

### 💧 Water Quality & Management
A multi-stage system ensuring water safety and efficient delivery.
- **Sensor Ingest**: Real-time monitoring of pH, Turbidity, and Temperature (supports Serial/Arduino & Mock sources).
- **Automated Filtration**: Intelligent control of filtration cycles, including debris dumps and backwash procedures.
- **Smart Distribution**: A graph-based routing engine that uses Dijkstra's algorithm to calculate optimal delivery paths to various nodes (homes/factories).

### ⚡ Hydro-Energy Monitoring
Tracks energy generation from water turbines.
- **Telemetry Ingest**: Real-time RPM and Power (Watts) tracking.
- **Persistence**: Daily statistics and cumulative energy (kWh) calculations.

---

## 🏗️ Architecture & Code Structure

### Backend (Python/Flask)
The engine of the system, handling data processing and persistence.
- `dashboard_api.py`: Flask-based REST API serving analytics to the frontend.
- `main.py`: Entry point for Computer Vision monitoring (`src.environmental_monitoring`).
- `water_main.py`: Runner for water quality telemetry.
- `filtration_main.py`: Logic for automated hardware control.
- `distribution_main.py`: Routing and distribution simulation.
- `storage/`: Abstracted SQLite storage layer for consistent data handling across modules.

### Frontend (React/TypeScript)
The presentation layer, providing a modern UX.
- `dashboard/src/components/`: Modular UI components (Gauges, Stat Cards, Charts).
- `dashboard/src/api.ts`: Typed data fetching layer connecting to the Flask backend.
- `dashboard/src/index.css`: Custom design system with glassmorphism and HSL-tailored colors.

---

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Node.js LTS
- OpenCV & Flask dependencies (`pip install -r requirements.txt`)

### Running the Fullstack System
We provide a convenience script to launch both the backend and frontend simultaneously:

```powershell
./run_fullstack.ps1
```

### Manual Component Launch
If you wish to run components individually:

**1. Start the API Backend:**
```bash
python dashboard_api.py
```

**2. Start the Environmental Monitor:**
```bash
python main.py --video path/to/video.mp4 --db runs/data.db
```

**3. Start the Web Dashboard:**
```bash
cd dashboard
npm install
npm run dev
```

---

## 🛠️ Configuration
The system is highly configurable via CLI arguments or YAML files:
- **Alert Thresholds**: Set custom bounds for pH, temperature, or green ratio drops.
- **ROI Selection**: Pass polygon coordinates to focus the CV monitor on specific areas.
- **Mock vs. Real Hardware**: Toggle between simulated data and real Serial/USB sensor feeds.

---

## 📝 License
This project is licensed under the MIT License - see the LICENSE file for details.