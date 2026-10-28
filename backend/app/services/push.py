"""
FCM push notification service.

Uses the legacy FCM HTTP API (Authorization: key=<FCM_SERVER_KEY>).
If FCM_SERVER_KEY is not set in the environment, all sends are logged as stubs
and return True so the rest of the application keeps running normally.

For the FCM HTTP v1 API (OAuth2 Bearer token via service account JSON),
swap FCM_LEGACY_URL for the v1 endpoint and add `google-auth` to requirements.
"""

import logging
from typing import Optional

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

FCM_LEGACY_URL = "https://fcm.googleapis.com/fcm/send"

# Lazy client — reused within a single async context if needed.
# For simplicity, we open a new client per call; adjust if volume is high.


async def send_push(
    user,
    title: str,
    body: str,
    data: Optional[dict] = None,
) -> bool:
    """
    Send a push notification to a single user.

    Returns True on success (or when running in stub mode),
    False if the FCM call fails or the user has no push token.
    Never raises — all errors are logged.
    """
    if not settings.FCM_SERVER_KEY:
        logger.info("[PUSH STUB] %s: %s → %s", title, body, getattr(user, "phone", "?"))
        return True

    if not getattr(user, "push_token", None):
        return False

    payload = {
        "to": user.push_token,
        "notification": {
            "title": title,
            "body": body,
        },
        "data": data or {},
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                FCM_LEGACY_URL,
                json=payload,
                headers={
                    "Authorization": f"key={settings.FCM_SERVER_KEY}",
                    "Content-Type": "application/json",
                },
            )

        if resp.status_code == 200:
            result = resp.json()
            if result.get("failure", 0) > 0:
                logger.warning(
                    "[PUSH] FCM reported failure for user %s: %s",
                    getattr(user, "phone", "?"),
                    result,
                )
                return False
            return True
        else:
            logger.error(
                "[PUSH] FCM HTTP %s for user %s: %s",
                resp.status_code,
                getattr(user, "phone", "?"),
                resp.text,
            )
            return False

    except Exception as exc:
        logger.error(
            "[PUSH] Exception sending push to %s: %s",
            getattr(user, "phone", "?"),
            exc,
        )
        return False


async def send_push_to_many(
    users: list,
    title: str,
    body: str,
    data: Optional[dict] = None,
) -> int:
    """
    Send push notification to multiple users.
    Sends in batches of 500 (FCM limit).
    Returns the number of successfully delivered messages.
    Never raises.
    """
    if not settings.FCM_SERVER_KEY:
        for user in users:
            logger.info(
                "[PUSH STUB] %s: %s → %s", title, body, getattr(user, "phone", "?")
            )
        return len(users)

    tokens = [u.push_token for u in users if getattr(u, "push_token", None)]
    if not tokens:
        return 0

    sent = 0
    batch_size = 500

    for i in range(0, len(tokens), batch_size):
        batch = tokens[i : i + batch_size]
        payload = {
            "registration_ids": batch,
            "notification": {
                "title": title,
                "body": body,
            },
            "data": data or {},
        }
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    FCM_LEGACY_URL,
                    json=payload,
                    headers={
                        "Authorization": f"key={settings.FCM_SERVER_KEY}",
                        "Content-Type": "application/json",
                    },
                )
            if resp.status_code == 200:
                result = resp.json()
                sent += result.get("success", 0)
                if result.get("failure", 0) > 0:
                    logger.warning(
                        "[PUSH] FCM batch: %s successes, %s failures",
                        result.get("success"),
                        result.get("failure"),
                    )
            else:
                logger.error(
                    "[PUSH] FCM batch HTTP %s: %s", resp.status_code, resp.text
                )
        except Exception as exc:
            logger.error("[PUSH] Exception in batch push: %s", exc)

    return sent
