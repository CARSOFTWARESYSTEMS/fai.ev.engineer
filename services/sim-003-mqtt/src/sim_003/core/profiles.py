"""Battery profile configuration.

Thresholds live here — never scattered as bare constants through the
generator/detector — so future battery classes (two/three/four-wheeler,
bus, truck, drone, aerospace, BESS) can be added as additional profiles
without touching detection logic.
"""
from __future__ import annotations

from pydantic import BaseModel, Field


class BatteryProfile(BaseModel):
    profile_id: str
    display_name: str
    chemistry: str
    nominal_voltage_v: float
    maximum_valid_voltage_v: float
    maximum_valid_temperature_c: float
    maximum_absolute_current_a: float
    minimum_soc_percent: float = 0.0
    maximum_soc_percent: float = 100.0


SIM003_48V_DEMO = BatteryProfile(
    profile_id="sim003_48v_demo",
    display_name="48V Synthetic Battery Demo",
    chemistry="LFP",
    nominal_voltage_v=51.2,
    maximum_valid_voltage_v=60.0,
    maximum_valid_temperature_c=60.0,
    maximum_absolute_current_a=500.0,
    minimum_soc_percent=0.0,
    maximum_soc_percent=100.0,
)

_PROFILES: dict[str, BatteryProfile] = {
    SIM003_48V_DEMO.profile_id: SIM003_48V_DEMO,
}


def get_profile(profile_id: str) -> BatteryProfile:
    try:
        return _PROFILES[profile_id]
    except KeyError as exc:
        raise ValueError(f"Unknown battery profile_id: {profile_id!r}") from exc


def list_profiles() -> list[BatteryProfile]:
    return list(_PROFILES.values())
