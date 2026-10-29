from pydantic_settings import BaseSettings
from typing import List
import json


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/krasivo"
    SECRET_KEY: str = "change-me-in-production-at-least-32-chars-long"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    REDIS_URL: str = "redis://localhost:6379/0"
    UPLOAD_DIR: str = "/app/uploads"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    CORS_ORIGINS: str = '["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:8000", "https://krasivo.ru"]'
    DEBUG: bool = True
    FCM_SERVER_KEY: str = ""
    FCM_PROJECT_ID: str = ""

    def get_cors_origins(self) -> List[str]:
        try:
            return json.loads(self.CORS_ORIGINS)
        except Exception:
            return ["*"]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
