from __future__ import annotations

import random
import time
from dataclasses import dataclass, field
from enum import Enum, auto
from typing import Dict, Any, Optional

from src.environmental_monitoring.utils import JsonlLogger


class State(Enum):
    IDLE = auto()
    FILTERING = auto()
    DUMP_DEBRIS = auto()
    BACKWASH = auto()
    ALERT = auto()


@dataclass
class FiltrationConfig:
    debris_capacity_max: float = 100.0   # percent
    debris_dump_threshold: float = 80.0  # percent -> trigger dump
    filter_dp_max_kpa: float = 25.0      # differential pressure threshold for backwash
    backwash_duration_sec: int = 10
    dump_duration_sec: int = 5
    cycle_period_sec: float = 1.0


@dataclass
class Telemetry:
    ts: float
    debris_load_pct: float
    filter_dp_kpa: float
    flow_lpm: float


class MockSensors:
    def __init__(self):
        self._debris = 0.0
        self._dp = 5.0
        self._flow = 50.0

    def read(self) -> Telemetry:
        # Simulate gradual debris accumulation and dp increase, flow drop
        self._debris = min(100.0, self._debris + random.uniform(0.5, 2.0))
        self._dp = min(40.0, self._dp + random.uniform(0.1, 0.5))
        self._flow = max(10.0, self._flow - random.uniform(0.2, 1.0))
        return Telemetry(ts=time.time(), debris_load_pct=round(self._debris, 1), filter_dp_kpa=round(self._dp, 1), flow_lpm=round(self._flow, 1))

    def reset_debris(self):
        self._debris = max(0.0, self._debris - random.uniform(60.0, 90.0))

    def reduce_dp(self):
        self._dp = max(5.0, self._dp - random.uniform(10.0, 20.0))
        self._flow = min(60.0, self._flow + random.uniform(5.0, 15.0))


class MockActuators:
    def __init__(self):
        self.dump_open = False
        self.backwash_on = False

    def open_dump(self):
        self.dump_open = True

    def close_dump(self):
        self.dump_open = False

    def start_backwash(self):
        self.backwash_on = True

    def stop_backwash(self):
        self.backwash_on = False


@dataclass
class FiltrationSystem:
    cfg: FiltrationConfig = field(default_factory=FiltrationConfig)
    sensors: MockSensors = field(default_factory=MockSensors)
    actuators: MockActuators = field(default_factory=MockActuators)
    state: State = State.IDLE
    last_transition_ts: float = field(default_factory=time.time)

    def step(self) -> Dict[str, Any]:
        tel = self.sensors.read()
        alerts = {
            "debris_high": tel.debris_load_pct >= self.cfg.debris_dump_threshold,
            "filter_clogged": tel.filter_dp_kpa >= self.cfg.filter_dp_max_kpa,
        }

        now = time.time()

        if self.state in (State.IDLE, State.FILTERING):
            self.state = State.FILTERING
            # Transition to dump debris if debris high
            if alerts["debris_high"]:
                self.state = State.DUMP_DEBRIS
                self.actuators.open_dump()
                self.last_transition_ts = now
            # Transition to backwash if filter clogged
            elif alerts["filter_clogged"]:
                self.state = State.BACKWASH
                self.actuators.start_backwash()
                self.last_transition_ts = now

        elif self.state == State.DUMP_DEBRIS:
            # Complete dump after duration and reset debris
            if now - self.last_transition_ts >= self.cfg.dump_duration_sec:
                self.actuators.close_dump()
                self.sensors.reset_debris()
                self.state = State.FILTERING
                self.last_transition_ts = now

        elif self.state == State.BACKWASH:
            if now - self.last_transition_ts >= self.cfg.backwash_duration_sec:
                self.actuators.stop_backwash()
                self.sensors.reduce_dp()
                self.state = State.FILTERING
                self.last_transition_ts = now

        status = {
            "ts": tel.ts,
            "state": self.state.name,
            "telemetry": {
                "debris_load_pct": tel.debris_load_pct,
                "filter_dp_kpa": tel.filter_dp_kpa,
                "flow_lpm": tel.flow_lpm,
            },
            "actuators": {
                "dump_open": self.actuators.dump_open,
                "backwash_on": self.actuators.backwash_on,
            },
            "alerts": alerts,
        }
        return status

    def run(self, duration_sec: Optional[int] = None, logger: Optional[JsonlLogger] = None):
        start = time.time()
        try:
            while True:
                status = self.step()
                print(f"[{time.strftime('%H:%M:%S')}] State={status['state']} | debris={status['telemetry']['debris_load_pct']}% "
                      f"dp={status['telemetry']['filter_dp_kpa']}kPa flow={status['telemetry']['flow_lpm']}LPM "
                      f"| dump={status['actuators']['dump_open']} backwash={status['actuators']['backwash_on']}")
                if logger:
                    logger.write(status)
                time.sleep(self.cfg.cycle_period_sec)
                if duration_sec is not None and (time.time() - start) >= duration_sec:
                    break
        except KeyboardInterrupt:
            print("Stopping filtration system.")