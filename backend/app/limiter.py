"""Shared slowapi rate limiter instance."""
from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi import Request


def get_user_key(request: Request) -> str:
    """Rate-limit key: authenticated user's sub claim, fallback to IP."""
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
        try:
            from app.services.auth import verify_access_token
            payload = verify_access_token(token)
            if payload and payload.get("sub"):
                return f"user:{payload['sub']}"
        except Exception:
            pass
    return get_remote_address(request)


# Global limiter: 100 req/min per IP by default.
# Per-endpoint overrides are applied with @limiter.limit().
limiter = Limiter(key_func=get_remote_address, default_limits=["100 per minute"])
