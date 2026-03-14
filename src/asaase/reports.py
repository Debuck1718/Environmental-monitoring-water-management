import os
import json
import time
from datetime import datetime
from src.asaase.db import get_db_connection, save_remediation_report, update_alert_report_status

def generate_report(alert_id: int):
    conn = get_db_connection()
    alert = conn.execute("SELECT * FROM asaase_alerts WHERE id = ?", (alert_id,)).fetchone()
    if not alert:
        conn.close()
        return None
    
    alert = dict(alert)
    telemetry = None
    if alert['robot_id'].startswith('GROUND'):
        telemetry = conn.execute("SELECT * FROM ground_telemetry WHERE robot_id = ? ORDER BY ts DESC LIMIT 1", (alert['robot_id'],)).fetchone()
    else:
        telemetry = conn.execute("SELECT * FROM aqua_telemetry WHERE robot_id = ? ORDER BY ts DESC LIMIT 1", (alert['robot_id'],)).fetchone()
    
    conn.close()
    if telemetry:
        telemetry = dict(telemetry)
    
    timestamp = datetime.fromtimestamp(alert['ts']).strftime('%Y-%m-%d %H:%M:%S')
    
    # English Content
    report_en = {
        "incident_summary": {
            "robot": alert['robot_id'],
            "location": f"{alert['gps_lat']:.4f}, {alert['gps_lon']:.4f}",
            "timestamp": timestamp,
            "severity": alert['severity'],
            "sensor_readings": telemetry if telemetry else "Historical telemetry unavailable"
        },
        "detected_contaminants": "Mercury/Lead/Arsenic inferred from increased turbidity and soil degradation." if alert['alert_type'] == 'SOIL' else "High acidity/chemical contamination indicated by pH and turbidity.",
        "robot_actions_taken": telemetry.get('dispenser_action', 'Automatic neutralization dispensed') if telemetry else "Automated remediation triggered.",
        "recommended_followup": "Immediate EPA field inspection required. Secure site and prevent further water access.",
        "phytoremediation_species": "Vetiver grass (Chrysopogon zizanioides), Chromolaena odorata - Plant at 10cm intervals at the border of the contaminated zone.",
        "soil_treatment": "Biochar dose (50g/m²). Mix into top 5cm of soil before planting native seeds.",
        "water_safety": "Safe pH range is 6.5-8.5. Ca(OH)₂ (Slaked Lime) treatment required for neutralization."
    }
    
    # Twi Content (Bilingual requirement)
    report_tw = {
        "incident_summary_tw": f"Robot: {alert['robot_id']}, Beae: {alert['gps_lat']:.4f}, {alert['gps_lon']:.4f}, Bere: {timestamp}, Severity: {alert['severity']}",
        "detected_contaminants_tw": "[TWI TRANSLATION REQUIRED — consult local translator]",
        "robot_actions_taken_tw": "[TWI TRANSLATION REQUIRED — consult local translator]",
        "recommended_followup_tw": "EPA mpaninfoɛ nkyɛn kɔhwehwɛ mu ntɛm pa ara. Monsi kwan mma nkorɔfoɔ mmɛnom nsuo no.",
        "phytoremediation_species_tw": "Vetiver grass (Chrysopogon zizanioides), Chromolaena odorata - Monnua no mita 10 mu biara wɔ beaeɛ a nsuo no asɛe no.",
        "soil_treatment_tw": "Biochar (50g/m²). Momfra dɔteɛ no mu ansa na moatue aba foforɔ no.",
        "water_safety_tw": "Nsuo a ɛyɛ bɔkɔɔ pH firi 6.5 kɔsi 8.5. Slaked Lime (Mhyire) na yɛde siesie nsuo no."
    }
    
    save_remediation_report(alert_id, json.dumps(report_en), json.dumps(report_tw))
    update_alert_report_status(alert_id, True)
    
    return {"en": report_en, "tw": report_tw}
