"""
AI Backend Configuration — loads environment variables and provides typed settings.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    # OpenAI
    openai_api_key: str = ""

    # Database (read-only)
    database_url: str = "postgresql+asyncpg://localhost:5432/assessment_tool"

    # Node.js Backend
    backend_api_url: str = "http://localhost:5000"
    backend_api_key: str = ""

    # LangSmith
    langchain_tracing_v2: bool = True
    langchain_api_key: str = ""
    langchain_project: str = "assessment-tool-ai"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # LLM — GPT-4o-mini everywhere for cost optimization
    # GPT-4o-mini is 15x cheaper and with structured output JSON mode
    # achieves comparable accuracy for educational content
    default_model: str = "gpt-4o-mini"
    report_model: str = "gpt-4o-mini"  # Changed: was gpt-4o ($0.095 → $0.006/report)
    temperature: float = 0.3
    max_tokens: int = 4000  # Reduced: was 8000 — most responses are <3000 tokens
    max_report_tokens: int = 4000

    # Cost optimization
    enable_cache: bool = True
    cache_ttl_seconds: int = 86400        # 24h — results cached until data changes
    enable_batch_calls: bool = True       # Batch multiple STPs/WLPs into single LLM call
    use_json_mode: bool = True            # Structured output — eliminates parsing retries
    max_stps_per_call: int = 3            # Was 5 individual calls → now 1 batched call
    max_wlps_per_call: int = 4            # Was 4 individual calls → now 1 batched call
    skip_empty_domains: bool = True       # Skip analysis for domains with no assessment data

    # CORS (comma-separated list of allowed origins for production)
    cors_origins: str = "*"  # Override in .env: cors_origins=https://app.example.com

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore"  # Critical: ignore extra system/env vars to prevent startup failure
    }


@lru_cache()
def get_settings() -> Settings:
    return Settings()


def validate_required_settings() -> None:
    """Raise at startup if critical configuration is missing."""
    settings = get_settings()
    if not settings.openai_api_key:
        raise RuntimeError(
            "OPENAI_API_KEY is not set. All LLM calls will fail. "
            "Add OPENAI_API_KEY to your .env file."
        )
    if settings.database_url == "postgresql+asyncpg://localhost:5432/assessment_tool":
        import warnings
        warnings.warn(
            "DATABASE_URL is using the default placeholder. "
            "Set DATABASE_URL in your .env file.",
            stacklevel=2,
        )


def configure_langsmith():
    """Configure LangSmith environment variables for tracing."""
    settings = get_settings()
    os.environ["LANGCHAIN_TRACING_V2"] = str(settings.langchain_tracing_v2).lower()
    os.environ["LANGCHAIN_API_KEY"] = settings.langchain_api_key
    os.environ["LANGCHAIN_PROJECT"] = settings.langchain_project
    os.environ["OPENAI_API_KEY"] = settings.openai_api_key
