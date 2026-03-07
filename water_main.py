import argparse
import time
from typing import Optional, Dict

from src.water.ingest import MockWaterSource, SerialWaterSource
from src.water.rules import WaterRulesConfig, evaluate
from src.environmental_monitoring.utils import JsonlLogger
from src.storage.sqlite_store import SQLiteStore, StoreConfig


def main():
    parser = argparse.ArgumentParser(description="Water Quality Monitoring Runner")
    parser.add_argument("--serial-port", type=str, default="", help="Serial port for sensor (e.g., COM3, /dev/ttyUSB0)")
    parser.add_argument("--baudrate", type=int, default=9600, help="Baud rate for serial port")
    parser.add_argument("--period", type=float, default=1.0, help="Polling period in seconds")
    parser.add_argument("--log", type=str, default="", help="JSONL file to log readings and alerts")
    parser.add_argument("--db", type=str, default="", help="SQLite DB file to persist water readings and recommendations")
    parser.add_argument("--ph-min", type=float, default=6.5)
    parser.add_argument("--ph-max", type=float, default=8.5)
    parser.add_argument("--turbidity-max", type=float, default=10.0)
    parser.add_argument("--temp-max", type=float, default=35.0)
    # Optional contaminant simulation (mg/L)
    parser.add_argument("--lead", type=float, default=None, help="Simulated lead concentration mg/L")
    parser.add_argument("--arsenic", type=float, default=None, help="Simulated arsenic concentration mg/L")
    parser.add_argument("--nitrate", type=float, default=None, help="Simulated nitrate concentration mg/L")
    args = parser.parse_args()

    cfg = WaterRulesConfig(
        ph_min=args.ph_min,
        ph_max=args.ph_max,
        turbidity_max_ntu=args.turbidity_max,
        temp_max_c=args.temp_max,
    )

    if args.serial_port:
        source = SerialWaterSource(port=args.serial_port, baudrate=args.baudrate, period_sec=args.period)
    else:
        source = MockWaterSource(period_sec=args.period)

    logger = JsonlLogger(args.log) if args.log else None
    store = SQLiteStore(StoreConfig(path=args.db)) if args.db else None

    contaminants: Dict[str, float] = {}
    if args.lead is not None:
        contaminants["lead"] = args.lead
    if args.arsenic is not None:
        contaminants["arsenic"] = args.arsenic
    if args.nitrate is not None:
        contaminants["nitrate"] = args.nitrate

    try:
        for reading in source.stream():
            result = evaluate(reading, cfg, contaminants=contaminants if contaminants else None)
            alerts = result["alerts"]
            contam_str = ""
            if "contaminants" in result:
                contam_str = " " + " ".join([f"{k}={v}mg/L" for k, v in result["contaminants"].items()])
            print(f"[{time.strftime('%H:%M:%S')}] pH={reading.ph:.2f} turbidity={reading.turbidity_ntu:.2f} NTU"
                  + (f" temp={reading.temperature_c:.1f}C" if reading.temperature_c is not None else "")
                  + contam_str
                  + f" | alerts={alerts}")
            if logger:
                logger.write(result)
            if store:
                store.insert_water(result)
    except KeyboardInterrupt:
        print("Stopping water monitoring.")
    finally:
        if store:
            store.close()


if __name__ == "__main__":
    main()