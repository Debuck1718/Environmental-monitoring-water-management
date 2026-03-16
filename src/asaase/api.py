from flask import Blueprint, jsonify, request
import os
import json
import time
from src.asaase.db import get_db_connection, save_waypoints, get_robot_settings, set_robot_mode, set_robot_manual_command
from src.asaase.radio_listener import robot_last_seen, send_radio_command


asaase_bp = Blueprint('asaase', __name__)

@asaase_bp.route('/ground/latest', methods=['GET'])
def get_ground_latest():
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM ground_telemetry ORDER BY ts DESC LIMIT 50").fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])

@asaase_bp.route('/ground/heatmap', methods=['GET'])
def get_ground_heatmap():
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM ground_telemetry WHERE soil_classification IN ('MODERATE', 'CRITICAL')").fetchall()
    conn.close()
    
    features = []
    for row in rows:
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [row['gps_lon'], row['gps_lat']]},
            "properties": {
                "severity": row['soil_classification'],
                "ts": row['ts'],
                "confidence_score": row['confidence_score'],
                "dispenser_action": row['dispenser_action']
            }
        })
    return jsonify({"type": "FeatureCollection", "features": features})

@asaase_bp.route('/aqua/latest', methods=['GET'])
def get_aqua_latest():
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM aqua_telemetry ORDER BY ts DESC LIMIT 50").fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])

@asaase_bp.route('/aqua/heatmap', methods=['GET'])
def get_aqua_heatmap():
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM aqua_telemetry WHERE dual_stream_verdict IN ('MODERATE', 'CRITICAL')").fetchall()
    conn.close()
    
    features = []
    for row in rows:
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [row['gps_lon'], row['gps_lat']]},
            "properties": {
                "severity": row['dual_stream_verdict'],
                "ts": row['ts'],
                "turbidity_ntu": row['turbidity_ntu'],
                "ph_value": row['ph_value'],
                "dual_stream_verdict": row['dual_stream_verdict']
            }
        })
    return jsonify({"type": "FeatureCollection", "features": features})

@asaase_bp.route('/alerts', methods=['GET'])
def get_alerts():
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 10))
    offset = (page - 1) * limit
    
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM asaase_alerts ORDER BY ts DESC LIMIT ? OFFSET ?", (limit, offset)).fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])

@asaase_bp.route('/reports/<int:alert_id>', methods=['GET'])
def get_report(alert_id):
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM remediation_reports WHERE alert_id = ?", (alert_id,)).fetchone()
    conn.close()
    if row:
        return jsonify(dict(row))
    return jsonify({"error": "Report not found"}), 404

@asaase_bp.route('/status', methods=['GET'])
def get_status():
    conn = get_db_connection()
    # 24h stats
    cutoff = time.time() - 86400
    alert_count = conn.execute("SELECT COUNT(*) FROM asaase_alerts WHERE ts > ?", (cutoff,)).fetchone()[0]
    critical_count = conn.execute("SELECT COUNT(*) FROM asaase_alerts WHERE ts > ? AND severity = 'CRITICAL'", (cutoff,)).fetchone()[0]
    conn.close()
    
    status = {
        "ground": {
            "online": False,
            "battery_pct": 0,
            "last_seen": 0
        },
        "aqua": {
            "online": False,
            "battery_pct": 0,
            "last_seen": 0
        },
        "alert_count_24h": alert_count,
        "critical_count_24h": critical_count
    }
    
    # Check last seen for robots
    for rid, data in robot_last_seen.items():
        online = (time.time() - data['ts']) < 600 # 10 min window
        if rid.startswith('GROUND'):
            status['ground'] = {"online": online, "battery_pct": data['battery'], "last_seen": data['ts']}
        elif rid.startswith('AQUA'):
            status['aqua'] = {"online": online, "battery_pct": data['battery'], "last_seen": data['ts']}
            
    return jsonify(status)

@asaase_bp.route('/ground/waypoints', methods=['POST'])
def post_ground_waypoints():
    data = request.json
    robot_id = data.get('robot_id')
    waypoints = data.get('waypoints', [])
    save_waypoints(robot_id, waypoints)
    # Send waypoints over radio
    send_radio_command(robot_id, f"WAYPOINTS:{json.dumps(waypoints)}")
    print(f"Waypoints sent to {robot_id}: {waypoints}")
    return jsonify({"status": "success"})

@asaase_bp.route('/aqua/route', methods=['POST'])
def post_aqua_route():
    data = request.json
    robot_id = data.get('robot_id')
    waypoints = data.get('waypoints', [])
    save_waypoints(robot_id, waypoints)
    # Send route over radio
    send_radio_command(robot_id, f"ROUTE:{json.dumps(waypoints)}")
    print(f"Route sent to {robot_id}: {waypoints}")
    return jsonify({"status": "success"})

@asaase_bp.route('/control/settings/<robot_id>', methods=['GET'])
def get_control_settings(robot_id):
    from src.asaase.db import get_robot_settings
    return jsonify(get_robot_settings(robot_id))

@asaase_bp.route('/control/mode', methods=['POST'])
def post_control_mode():
    data = request.json
    robot_id = data.get('robot_id')
    mode = data.get('mode')
    if mode not in ['MANUAL', 'SEMI_AUTO', 'FULLY_AUTO']:
        return jsonify({"error": "Invalid mode"}), 400
    from src.asaase.db import set_robot_mode
    set_robot_mode(robot_id, mode)
    return jsonify({"status": "success", "mode": mode})

@asaase_bp.route('/control/manual', methods=['POST'])
def post_control_manual():
    data = request.json
    robot_id = data.get('robot_id')
    command = data.get('command')
    from src.asaase.db import get_robot_settings, set_robot_manual_command
    settings = get_robot_settings(robot_id)
    if settings['control_mode'] == 'FULLY_AUTO':
        return jsonify({"error": "Robot is in Fully Autonomous mode. Override not permitted."}), 403
    set_robot_manual_command(robot_id, command)
    send_radio_command(robot_id, command)
    print(f"MANUAL COMMAND SENT TO {robot_id}: {command}")
    return jsonify({"status": "success", "command": command})

# --- New BASE & Approval Endpoints ---

@asaase_bp.route('/base/settings', methods=['GET'])
def get_base_settings():
    from src.asaase.db import get_base_mode
    return jsonify({"operation_mode": get_base_mode()})

@asaase_bp.route('/base/mode', methods=['POST'])
def update_base_mode():
    data = request.json
    from src.asaase.db import set_base_mode
    set_base_mode(data['mode'])
    return jsonify({"status": "success"})

@asaase_bp.route('/control/approvals', methods=['GET'])
def list_approvals():
    from src.asaase.db import get_pending_approvals
    return jsonify(get_pending_approvals())

@asaase_bp.route('/control/approve', methods=['POST'])
def approve_action():
    data = request.json # {approval_id: X, action: 'APPROVED'|'REJECTED'}
    from src.asaase.db import update_approval_status
    update_approval_status(data['approval_id'], data['action'])
    return jsonify({"status": "success"})


