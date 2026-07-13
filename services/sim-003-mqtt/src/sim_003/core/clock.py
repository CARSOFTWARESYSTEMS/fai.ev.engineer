"""Injectable clock so telemetry generation is deterministic and testable."""
from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime, timedelta, timezone


class Clock(ABC):
    @abstractmethod
    def now(self) -> datetime: ...


class SystemClock(Clock):
    def now(self) -> datetime:
        return datetime.now(timezone.utc)


class FixedClock(Clock):
    """Deterministic clock for tests and reproducible demo runs.

    Each call to now() advances by `step` so sequential events still get
    monotonically increasing timestamps without depending on wall-clock time.
    """

    def __init__(self, start: datetime, step: timedelta = timedelta(seconds=1)):
        if start.tzinfo is None:
            raise ValueError("FixedClock start must be timezone-aware (UTC)")
        self._current = start
        self._step = step

    def now(self) -> datetime:
        value = self._current
        self._current = self._current + self._step
        return value

    def peek(self) -> datetime:
        """Return the next value without advancing — useful for computing offsets."""
        return self._current
