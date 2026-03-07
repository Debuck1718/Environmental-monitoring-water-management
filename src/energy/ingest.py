import random
import time
from dataclasses import dataclass
from typing import Iterator


@dataclass
class TurbineReading:
    ts: float
    power_w: float  # instantaneous power in Watts
    rpm: float      # turbine speed


class MockTurbineSource:
    """
    Generates synthetic turbine telemetry for testing and development.
    """
    def __init__(self, period_sec: float = 1.0, base_power_w: float = 150.0):
        self.period_sec = period_sec
        self.base_power_w = base_power_w

    def stream(self) -> Iterator[TurbineReading]:
        while True:
            now = time.time()
            # Simulate small fluctuations
            power = max(0.0, random.gauss(self.base_power_w, self.base_power_w * 0.05))
            rpm = max(0.0, random.gauss(1200.0, 50.0))
            yield TurbineReading(ts=now, power_w=round(power, 2), rpm=round(rpm, 1))
            time.sleep(self.period_sec)