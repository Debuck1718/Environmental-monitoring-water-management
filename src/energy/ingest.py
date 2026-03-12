import random
import time
import json
import os
from dataclasses import dataclass
from typing import Iterator


@dataclass
class TurbineReading:
    ts: float
    power_w: float  # instantaneous power in Watts
    rpm: float      # turbine speed


class MockTurbineSource:
    """
    Generates synthetic turbine telemetry linked to water filtration flow.
    """
    def __init__(self, period_sec: float = 1.0, base_power_w: float = 150.0):
        self.period_sec = period_sec
        self.base_power_w = base_power_w
        self.last_log_path = os.path.join(os.getcwd(), "runs", "filtration_latest.json")

    def _get_current_flow(self) -> float:
        """Helper to simulate reading flow from the shared state/file."""
        try:
            if os.path.exists(self.last_log_path):
                with open(self.last_log_path, 'r') as f:
                    data = json.load(f)
                    return data.get("telemetry", {}).get("flow_lpm", 45.0)
        except:
            pass
        return 45.0 # Default fallback flow

    def stream(self) -> Iterator[TurbineReading]:
        while True:
            now = time.time()
            flow = self._get_current_flow()
            
            # Power is proportional to flow (simple model)
            # 45 LPM -> base_power_w
            flow_ratio = flow / 45.0
            power = max(0.0, random.gauss(self.base_power_w * flow_ratio, self.base_power_w * 0.02))
            rpm = max(0.0, random.gauss(1200.0 * flow_ratio, 30.0))
            
            yield TurbineReading(ts=now, power_w=round(power, 2), rpm=round(rpm, 1))
            time.sleep(self.period_sec)