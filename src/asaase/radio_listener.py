import threading
import serial
import json
import os
import time
from pydantic import ValidationError
from src.asaase.models import GroundPacket, AquaPacket
from src.asaase.db import save_ground_telemetry, save_aqua_telemetry, create_alert
from src.asaase.sms import notify_all
from src.asaase.reports import generate_report

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.json")

# Shared state for health monitoring
robot_last_seen = {} # {robot_id: {"ts": float, "battery": int}}

def load_config():
    with open(CONFIG_PATH, 'r') as f:
        return json.load(f)

def handle_ground_packet(packet_data: dict):
    try:
        packet = GroundPacket(**packet_data)
        data = packet.model_dump()
        data['ts'] = time.time()
        data['raw_packet'] = json.dumps(packet_data)
        
        save_ground_telemetry(data)
        robot_last_seen[packet.robot_id] = {"ts": data['ts'], "battery": packet.battery_pct}
        
        if packet.soil_classification in ["MODERATE", "CRITICAL"]:
            alert_id = create_alert(
                packet.robot_id, 
                packet.soil_classification, 
                packet.gps_lat, 
                packet.gps_lon, 
                "SOIL", 
                f"Contamination detected: {packet.soil_classification}"
            )
            data['id'] = alert_id
            notify_all(data)
            if packet.soil_classification == "CRITICAL":
                generate_report(alert_id)
                
    except ValidationError as e:
        print(f"Ground Packet Validation Error: {e}")

def handle_aqua_packet(packet_data: dict, config: dict):
    try:
        packet = AquaPacket(**packet_data)
        data = packet.model_dump()
        data['ts'] = time.time()
        data['raw_packet'] = json.dumps(packet_data)
        
        # Dual-stream server-side re-validation
        verdict = packet.camera_water_classification
        if packet.camera_water_classification == "CRITICAL" and (
            packet.turbidity_ntu > config['turbidity_critical_ntu'] or 
            packet.ph_value < config['ph_critical_min']
        ):
            verdict = "CRITICAL"
        else:
            verdict = packet.camera_water_classification
        
        data['dual_stream_verdict'] = verdict
        
        save_aqua_telemetry(data)
        robot_last_seen[packet.robot_id] = {"ts": data['ts'], "battery": packet.battery_pct}
        
        if verdict in ["MODERATE", "CRITICAL"]:
            alert_id = create_alert(
                packet.robot_id, 
                verdict, 
                packet.gps_lat, 
                packet.gps_lon, 
                "WATER", 
                f"Water contamination detected: {verdict}"
            )
            data['id'] = alert_id
            notify_all(data)
            if verdict == "CRITICAL":
                generate_report(alert_id)
                
    except ValidationError as e:
        print(f"Aqua Packet Validation Error: {e}")

def listen_serial(port, baud_rate, robot_prefix):
    config = load_config()
    while True:
        try:
            with serial.Serial(port, baud_rate, timeout=1) as ser:
                print(f"Started ASAASE listener on {port} for {robot_prefix}...")
                while True:
                    line = ser.readline().decode('utf-8').strip()
                    if line:
                        try:
                            packet_data = json.loads(line)
                            rid = packet_data.get("robot_id", "")
                            if rid.startswith(robot_prefix):
                                if robot_prefix == "GROUND":
                                    handle_ground_packet(packet_data)
                                elif robot_prefix == "AQUA":
                                    handle_aqua_packet(packet_data, config)
                        except json.JSONDecodeError:
                            print(f"Malformed ASAASE packet on {port}: {line}")
        except Exception as e:
            print(f"ASAASE Serial Error on {port}: {e}. Retrying in 10s...")
            time.sleep(10)

def start_radio_listener():
    config = load_config()
    t1 = threading.Thread(target=listen_serial, args=(config['ground_serial_port'], config['baud_rate'], "GROUND"), daemon=True)
    t2 = threading.Thread(target=listen_serial, args=(config['aqua_serial_port'], config['baud_rate'], "AQUA"), daemon=True)
    t1.start()
    t2.start()
