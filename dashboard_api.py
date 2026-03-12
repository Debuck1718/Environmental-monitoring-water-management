import json
from flask import Flask, jsonify
from flask_cors import CORS
import sqlite3
import os

from src.energy.storage import EnergyDB, EnergyDBConfig

app = Flask(__name__)
CORS(app)  # Enable CORS for React development server

DB_PATH = os.path.join(os.getcwd(), "runs", "data.db")
ENERGY_DB_PATH = os.path.join(os.getcwd(), "runs", "energy.db")

# Simulation State
SIMULATION_OVERRIDES = {
    "turbidity_spike": 0,
    "flow_restriction": 0,
    "energy_efficiency_boost": 1.0,
    "active_anomaly": None
}

def get_db_connection(path=DB_PATH):
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/api/simulate', methods=['POST'])
def update_simulation():
    from flask import request
    data = request.json
    param = data.get('parameter')
    value = data.get('value')
    
    if param in SIMULATION_OVERRIDES:
        SIMULATION_OVERRIDES[param] = value
        return jsonify({"status": "success", "parameter": param, "value": value})
    return jsonify({"status": "error", "message": "Invalid parameter"}), 400

@app.route('/api/latest-stats')
def get_latest_stats():
    # Latest Environment Frame
    env_frame = None
    if os.path.exists(DB_PATH):
        conn = get_db_connection(DB_PATH)
        env_frame = conn.execute('SELECT * FROM env_frames ORDER BY ts DESC LIMIT 1').fetchone()
        water_reading = conn.execute('SELECT * FROM water_readings ORDER BY ts DESC LIMIT 1').fetchone()
        conn.close()
    else:
        water_reading = None

    # Latest Filtration
    filtration = None
    filt_path = os.path.join(os.getcwd(), "runs", "filtration_latest.json")
    if os.path.exists(filt_path):
        with open(filt_path, 'r') as f:
            filtration = json.load(f)

    # Latest Energy
    energy = None
    if os.path.exists(ENERGY_DB_PATH):
        edb = EnergyDB(EnergyDBConfig(path=ENERGY_DB_PATH))
        energy = edb.get_day_stats()
        edb.close()
    
    # Latest Distribution
    distribution = []
    if os.path.exists(DB_PATH):
        conn = get_db_connection(DB_PATH)
        rows = conn.execute('''
            SELECT e.* FROM distribution_events e
            INNER JOIN (
                SELECT home, MAX(ts) as max_ts FROM distribution_events GROUP BY home
            ) latest ON e.home = latest.home AND e.ts = latest.max_ts
        ''').fetchall()
        conn.close()
        distribution = [dict(row) for row in rows]
    
    stats = {
        "env": dict(env_frame) if env_frame else None,
        "water": dict(water_reading) if water_reading else None,
        "filtration": filtration,
        "energy": energy,
        "distribution": distribution,
        "health": None # Calculated below
    }


    # Apply Simulation Overrides
    if stats['water'] and SIMULATION_OVERRIDES['turbidity_spike'] > 0:
        stats['water']['turbidity_ntu'] += SIMULATION_OVERRIDES['turbidity_spike']
        stats['water']['alerts'] = "SIMULATION: CONTAMINATION SPIKE DETECTED"
    
    if stats['filtration'] and SIMULATION_OVERRIDES['flow_restriction'] > 0:
        reduction = SIMULATION_OVERRIDES['flow_restriction']
        stats['filtration']['telemetry']['flow_lpm'] = max(0, stats['filtration']['telemetry']['flow_lpm'] - reduction)
        if stats['energy']:
            stats['energy']['avg_power_w'] = max(0, stats['energy']['avg_power_w'] - (reduction * 2))

    if stats['energy'] and SIMULATION_OVERRIDES['energy_efficiency_boost'] != 1.0:
        stats['energy']['avg_power_w'] *= SIMULATION_OVERRIDES['energy_efficiency_boost']

    stats['health'] = calculate_health_score(stats['env'], stats['water'], stats['filtration'], stats['energy'], stats['distribution'])

    
    return jsonify(stats)

def calculate_health_score(env, water, filtration, energy, distribution):

    score = 100.0
    reasons = []
    
    # Water Quality (30%)
    if water:
        # pH penalty (6.5 - 8.5 ideal)
        ph = water['ph']
        if ph < 6.5 or ph > 8.5:
            penalty = min(15, abs(ph - 7.5) * 10)
            score -= penalty
            reasons.append(f"pH out of range ({ph})")
        
        # Temp penalty (ideal < 25C)
        temp = water['temperature_c']
        if temp > 25:
            penalty = min(15, (temp - 25) * 2)
            score -= penalty
            reasons.append(f"High water temperature ({temp}C)")

    # Filtration (40%)
    if filtration:
        clog = filtration.get('telemetry', {}).get('bottle_clog_pct', 0)
        net = filtration.get('telemetry', {}).get('net_load_pct', 0)
        if clog > 70:
            score -= 20
            reasons.append(f"High filter clogging ({clog}%)")
        if net > 80:
            score -= 10
            reasons.append(f"Nets near capacity ({net}%)")
        
        if filtration.get('state') != 'FILTERING':
            score -= 5
            reasons.append(f"System in maintenance mode: {filtration.get('state')}")

    # Energy Efficiency (30%)
    if energy and filtration:
        flow = filtration.get('telemetry', {}).get('flow_lpm', 0)
        power = energy.get('avg_power_w', 0)
        # Expected power: ~3.3W per LPM (150W / 45LPM)
        expected = flow * 3.3
        if expected > 0:
            efficiency = power / expected
            if efficiency < 0.8:
                score -= 15
                reasons.append(f"Low turbine efficiency ({efficiency*100:.1f}%)")

    # Distribution Fulfillment (Punts if no distribution data provided)
    if distribution:
        # Sum of actual volumes vs expected
        # Expected is ~33 LPM total (10+15+8)
        total_delivered = sum(d['volume_liters'] * 60 for d in distribution)
        if total_delivered < 25:
            penalty = min(20, (30 - total_delivered) * 2)
            score -= penalty
            reasons.append(f"Insufficient water distribution ({total_delivered:.1f} LPM)")

    return {

        "score": max(0, round(score, 1)),
        "status": "EXCELLENT" if score > 90 else "GOOD" if score > 75 else "WARNING" if score > 50 else "CRITICAL",
        "reasons": reasons
    }

@app.route('/api/system-health')
def get_system_health():
    # Fetch all data and calculate
    latest = get_latest_stats().get_json()
    return jsonify(latest['health'])

@app.route('/api/history')
def get_history():
    env_history = []
    water_history = []
    if os.path.exists(DB_PATH):
        conn = get_db_connection(DB_PATH)
        env_history = conn.execute('SELECT ts, green_ratio FROM env_frames ORDER BY ts DESC LIMIT 20').fetchall()
        water_history = conn.execute('SELECT ts, ph, temperature_c FROM water_readings ORDER BY ts DESC LIMIT 20').fetchall()
        conn.close()
    
    return jsonify({
        "env": [dict(row) for row in env_history],
        "water": [dict(row) for row in water_history]
    })

@app.route('/api/energy-history')
def get_energy_history():
    samples = []
    if os.path.exists(ENERGY_DB_PATH):
        conn = get_db_connection(ENERGY_DB_PATH)
        rows = conn.execute('SELECT ts, power_w, rpm FROM turbine_samples ORDER BY ts DESC LIMIT 30').fetchall()
        conn.close()
        samples = [dict(row) for row in rows]
    return jsonify(samples)

@app.route('/api/distribution/latest')
def get_distribution_latest():
    events = []
    if os.path.exists(DB_PATH):
        conn = get_db_connection(DB_PATH)
        # Get latest event for each home
        rows = conn.execute('''
            SELECT e.* FROM distribution_events e
            INNER JOIN (
                SELECT home, MAX(ts) as max_ts FROM distribution_events GROUP BY home
            ) latest ON e.home = latest.home AND e.ts = latest.max_ts
        ''').fetchall()
        conn.close()
        events = [dict(row) for row in rows]
    return jsonify(events)

@app.route('/api/distribution/history')
def get_distribution_history():
    history = []
    if os.path.exists(DB_PATH):
        conn = get_db_connection(DB_PATH)
        rows = conn.execute('SELECT day, total_volume_liters FROM distribution_daily ORDER BY day DESC LIMIT 7').fetchall()
        conn.close()
        history = [dict(row) for row in rows]
    return jsonify(history)

@app.route('/api/filtration')
def get_filtration():
    path = os.path.join(os.getcwd(), "runs", "filtration_latest.json")
    if os.path.exists(path):
        with open(path, 'r') as f:
            return jsonify(json.load(f))
    return jsonify({"error": "Filtration data not available"}), 404

@app.route('/api/control/<action>', methods=['POST'])
def system_control(action):
    # Mapping actions to system commands
    # In a real system, this would send a signal to the running process
    # For simulation, we can log the request
    print(f"CONTROL RECEIVED: {action}")
    
    filt_path = os.path.join(os.getcwd(), "runs", "filtration_latest.json")
    if os.path.exists(filt_path):
        with open(filt_path, 'r') as f:
            data = json.load(f)
            # Simulate immediate action by updating the latest status
            if action == 'net-clear':
                data['state'] = 'CLEAR_NETS'
            elif action == 'backwash':
                data['state'] = 'BACKWASH'
            
        with open(filt_path, 'w') as f:
            json.dump(data, f)
            
    return jsonify({"status": "success", "action": action})

if __name__ == '__main__':
    # Ensure the database directory exists
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    app.run(port=5000, debug=True)
