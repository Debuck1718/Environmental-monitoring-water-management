import argparse

from src.environmental_monitoring.utils import JsonlLogger
from src.filtration.system import FiltrationSystem, FiltrationConfig


def main():
    parser = argparse.ArgumentParser(description="Filtration System Runner")
    parser.add_argument("--dump-threshold", type=float, default=80.0, help="Debris load percentage to trigger dump")
    parser.add_argument("--dp-max", type=float, default=25.0, help="Max differential pressure (kPa) before backwash")
    parser.add_argument("--dump-duration", type=int, default=5, help="Seconds to keep dump gate open")
    parser.add_argument("--backwash-duration", type=int, default=10, help="Seconds to run backwash")
    parser.add_argument("--period", type=float, default=1.0, help="Control cycle period (seconds)")
    parser.add_argument("--duration", type=int, default=0, help="Total run duration seconds (0=until Ctrl+C)")
    parser.add_argument("--log", type=str, default="", help="Optional JSONL log file")
    args = parser.parse_args()

    cfg = FiltrationConfig(
        debris_dump_threshold=args.dump_threshold,
        filter_dp_max_kpa=args.dp_max,
        dump_duration_sec=args.dump_duration,
        backwash_duration_sec=args.backwash_duration,
        cycle_period_sec=args.period
    )

    system = FiltrationSystem(cfg=cfg)
    logger = JsonlLogger(args.log) if args.log else None
    system.run(duration_sec=(args.duration if args.duration > 0 else None), logger=logger)


if __name__ == "__main__":
    main()