"""Gemini chat completion wrapper with retry and error mapping."""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass

from google import genai  # type: ignore[attr-defined]

logger = logging.getLogger(__name__)


class AIProviderError(Exception):
    """Base provider error for upstream failures."""


class AIProviderRateLimitError(AIProviderError):
    """Raised when provider request is rate/usage limited."""


def _is_rate_limit_error(exc: Exception) -> bool:
    msg = str(exc).lower()
    return (
        "429" in msg
        or "rate limit" in msg
        or "quota" in msg
        or "resource_exhausted" in msg
    )


@dataclass(frozen=True)
class ChatCompletionResult:
    """Normalized completion output."""

    content: str
    model: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


class GeminiChatProvider:
    """Isolates Gemini SDK calls for easier swapping/testing."""

    def __init__(
        self,
        *,
        api_key: str,
        max_retries_on_transient: int = 4,
    ) -> None:
        self._client = genai.Client(api_key=api_key)
        self._max_retries = max(1, max_retries_on_transient)

    async def chat_completion(
        self,
        *,
        messages: list[dict[str, str]],
        model: str,
    ) -> ChatCompletionResult:
        last_error: Exception | None = None
        prompt = _messages_to_prompt(messages)

        for attempt in range(self._max_retries):
            try:
                response = await asyncio.to_thread(
                    self._client.models.generate_content,
                    model=model,
                    contents=prompt,
                )
                text = (getattr(response, "text", None) or "").strip()
                usage = getattr(response, "usage_metadata", None)
                prompt_tokens = int(getattr(usage, "prompt_token_count", 0) or 0)
                completion_tokens = int(
                    getattr(usage, "candidates_token_count", 0) or 0
                )
                total_tokens = int(getattr(usage, "total_token_count", 0) or 0)
                return ChatCompletionResult(
                    content=text,
                    model=model,
                    prompt_tokens=prompt_tokens,
                    completion_tokens=completion_tokens,
                    total_tokens=total_tokens,
                )
            except Exception as e:
                last_error = e
                if _is_rate_limit_error(e):
                    wait = min(45.0, (2.0 ** (attempt + 1)) + attempt * 0.5)
                    logger.warning(
                        "Gemini rate limited (attempt %s), retry in %.1fs",
                        attempt + 1,
                        wait,
                    )
                    await asyncio.sleep(wait)
                    continue
                break

        assert last_error is not None
        if _is_rate_limit_error(last_error):
            raise AIProviderRateLimitError(str(last_error)) from last_error
        raise AIProviderError(str(last_error)) from last_error

    async def moderate(self, *, text: str) -> tuple[bool, str | None]:
        """
        Compatibility method for existing chat_service flow.
        Gemini safety is applied during generation, so this is fail-open.
        """
        if not text.strip():
            return False, None
        return False, None


def _messages_to_prompt(messages: list[dict[str, str]]) -> str:
    """Flatten role/content turns into a Gemini-compatible text prompt."""
    lines: list[str] = []
    for msg in messages:
        role = (msg.get("role") or "user").strip().lower()
        content = (msg.get("content") or "").strip()
        if not content:
            continue
        if role == "system":
            lines.append(f"[SYSTEM]\n{content}")
        elif role == "assistant":
            lines.append(f"[ASSISTANT]\n{content}")
        else:
            lines.append(f"[USER]\n{content}")
    return "\n\n".join(lines)
