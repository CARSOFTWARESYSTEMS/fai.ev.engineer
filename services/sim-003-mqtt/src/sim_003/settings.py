"""Environment-driven configuration for SIM-003.

All values here have safe local-development defaults. Nothing here is a
secret — credentials are loaded separately from an ignored local file
(see MQTT_PASSWORD_FILE) and are never hardcoded.
"""
from __future__ import annotations

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="", env_file=".env", extra="ignore")

    # Transport
    sim003_transport: str = Field(default="in_memory", alias="SIM003_TRANSPORT")  # "mqtt" | "in_memory"
    sim003_poc_local_only: bool = Field(default=True, alias="SIM003_POC_LOCAL_ONLY")
    sim003_event_buffer_limit: int = Field(default=5000, alias="SIM003_EVENT_BUFFER_LIMIT")
    sim003_max_events_per_run: int = Field(default=1000, alias="SIM003_MAX_EVENTS_PER_RUN")

    # MQTT / Mosquitto
    mqtt_broker_host: str = Field(default="127.0.0.1", alias="MQTT_BROKER_HOST")
    mqtt_broker_port: int = Field(default=1883, alias="MQTT_BROKER_PORT")
    mqtt_keepalive_seconds: int = Field(default=30, alias="MQTT_KEEPALIVE_SECONDS")
    mqtt_qos: int = Field(default=1, alias="MQTT_QOS")
    mqtt_retain: bool = Field(default=False, alias="MQTT_RETAIN")
    mqtt_tls: bool = Field(default=False, alias="MQTT_TLS")
    mqtt_topic_root: str = Field(default="ev-engineer/v1/sim", alias="MQTT_TOPIC_ROOT")
    mqtt_publisher_username: str | None = Field(default=None, alias="MQTT_PUBLISHER_USERNAME")
    mqtt_publisher_password: str | None = Field(default=None, alias="MQTT_PUBLISHER_PASSWORD")
    mqtt_subscriber_username: str | None = Field(default=None, alias="MQTT_SUBSCRIBER_USERNAME")
    mqtt_subscriber_password: str | None = Field(default=None, alias="MQTT_SUBSCRIBER_PASSWORD")

    # Auth
    firebase_service_account_path: str | None = Field(default=None, alias="FIREBASE_SERVICE_ACCOUNT_PATH")
    firebase_project_id: str | None = Field(default=None, alias="FIREBASE_PROJECT_ID")
    # Dev-only bypass. Must never be enabled outside local loopback development.
    sim003_dev_auth_bypass: bool = Field(default=False, alias="SIM003_DEV_AUTH_BYPASS")
    sim003_dev_bypass_uid: str = Field(default="dev-local-user", alias="SIM003_DEV_BYPASS_UID")
    sim003_dev_bypass_org: str = Field(default="demo-organisation", alias="SIM003_DEV_BYPASS_ORG")
    sim003_dev_bypass_role: str = Field(default="engineer", alias="SIM003_DEV_BYPASS_ROLE")

    # CORS
    sim003_allowed_origins: str = Field(
        default="http://localhost:5173,http://127.0.0.1:5173", alias="SIM003_ALLOWED_ORIGINS"
    )

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.sim003_allowed_origins.split(",") if o.strip()]

    def enforce_local_only(self) -> None:
        """Reject non-loopback broker hosts while SIM003_POC_LOCAL_ONLY is set."""
        if self.sim003_poc_local_only and self.mqtt_broker_host not in ("127.0.0.1", "localhost", "::1"):
            raise ValueError(
                f"MQTT_BROKER_HOST={self.mqtt_broker_host!r} is not loopback, but "
                "SIM003_POC_LOCAL_ONLY=true. Refusing to start in POC-local-only mode."
            )


_settings: Settings | None = None


def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings()
        _settings.enforce_local_only()
    return _settings


def reset_settings_cache() -> None:
    """Test-only: force re-reading settings/env on next get_settings() call."""
    global _settings
    _settings = None
