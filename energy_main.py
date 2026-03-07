import argparse
import time

from src.energy.ingest import MockTurbineSource
from src.energy.storage import EnergyDB, EnergyDBConfig


def main():
    parser = argparse.ArgumentParser(description="Energy Generation Monitoring Runner")
    parser.add_argument("--period", type=float, default=1.0, help="Telemetry sampling period (seconds)")
    parser.add_argument("--base-power", type=float, default=150.0, help="Base turbine power (W) for mock source")
    parser.add_argument("--db", type=str, default="runs/energy.db", help="Path to SQLite DB file")
    args = parser.parse_args()

    source = MockTurbineSource(period_sec=args.period, base_power_w=args.base_power)
    db = EnergyDB(EnergyDBConfig(path=args.db))

    try:
        for reading in source.stream():
            db.add_sample(reading.ts, reading.power_w, reading.rpm)
            stats = db.get_day_stats()
            print(f"[{time.strftime('%H:%M:%S')}] power={reading.power_w:.1f}W rpm={reading.rpm:.0f} | "
                  f"day={stats['day']} energy={stats['energy_kwh']:.4f} kWh avgP={stats['avg_power_w']:.1f}W "
                  f"samples={stats['samples']}")
    except KeyboardInterrupt:
        print("Stopping energy monitoring.")
    finally:
        db.close()


if __name__ == "__main__":
    main()