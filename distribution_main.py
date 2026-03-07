import argparse
import time
from typing import Dict, List, Tuple

from src.distribution.route import Graph
from src.storage.sqlite_store import SQLiteStore, StoreConfig


def build_sample_graph() -> Graph:
    # Simple demo network: plant -> J1 -> H1/H2, and plant -> J2 -> H3
    g = Graph()
    g.add_edge("plant", "J1", 1.0)
    g.add_edge("J1", "H1", 1.0)
    g.add_edge("J1", "H2", 1.2)
    g.add_edge("plant", "J2", 1.5)
    g.add_edge("J2", "H3", 1.0)
    return g


def main():
    parser = argparse.ArgumentParser(description="Water Distribution Runner (simulation)")
    parser.add_argument("--homes", type=str, default="H1:10,H2:15,H3:8", help="Target homes and LPM demand 'H1:10,H2:15,...'")
    parser.add_argument("--duration", type=int, default=60, help="Simulation duration seconds")
    parser.add_argument("--db", type=str, default="runs/data.db", help="SQLite DB for persistence")
    args = parser.parse_args()

    # Parse demands (LPM)
    demands: Dict[str, float] = {}
    for token in args.homes.split(","):
        if not token.strip():
            continue
        name, val = token.split(":")
        demands[name.strip()] = float(val.strip())

    g = build_sample_graph()
    store = SQLiteStore(StoreConfig(path=args.db))

    start = time.time()
    last = start
    try:
        while True:
            now = time.time()
            if now - start >= args.duration:
                break
            dt_min = (now - last) / 60.0  # minutes
            last = now

            # Route to each home from plant and allocate volume
            for home, lpm in demands.items():
                cost, path = g.shortest_path("plant", home)
                if not path:
                    continue
                vol_liters = max(0.0, lpm) * dt_min
                store.insert_distribution_event(home=home, path=path, volume_liters=vol_liters, cost=cost)
                print(f"Delivered {vol_liters:.2f} L to {home} via {path} (cost {cost:.2f})")
            time.sleep(1.0)
    except KeyboardInterrupt:
        print("Stopping distribution simulation.")
    finally:
        store.close()


if __name__ == "__main__":
    main()