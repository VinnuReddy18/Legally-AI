from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    voyage_api_key: str = ""
    voyage_embed_model: str = "voyage-law-2"

    openai_api_key: str = ""
    openai_model: str = "gpt-4o"

    database_url: str = "sqlite:///./data/legally.db"
    cors_origins: str = "http://localhost:3000"

    # When true, the AI layer returns deterministic local output so the app
    # runs end-to-end without network access or spending tokens.
    legally_offline: bool = False

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def sqlite_path(self) -> str:
        # Accept both "sqlite:///./data/legally.db" and a bare path.
        url = self.database_url
        if url.startswith("sqlite:///"):
            return url.replace("sqlite:///", "", 1)
        return url


@lru_cache
def get_settings() -> Settings:
    return Settings()
