import os
from time import monotonic
import httpx
from dotenv import load_dotenv
from google import genai
from google.genai import errors
from google.genai import types

load_dotenv()


def call_model_with_fallbacks(
    input_prompt: str, max_total_seconds: float = 30.0
) -> str:
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        raise RuntimeError("Gemini is not configured")
    client = genai.Client(api_key=gemini_key)
    # gemini-3.8-flash has been observed stalling long enough to burn most of
    # the shared deadline below, starving the rest of the fallback chain of a
    # chance to even be tried -- kept last so it's only reached as a final
    # resort, not the first thing attempted.
    models = [
        os.getenv("GEMINI_CHAT_MODEL", "gemini-3.5-flash"),
        "gemini-3.6-flash",
        "gemini-3.5-flash-lite",
        "gemini-2.5-flash-lite",
        "gemini-3.8-flash",
    ]
    deadline = monotonic() + max_total_seconds
    for model in models:
        remaining = deadline - monotonic()
        # Gemini rejects requests with less than ten seconds of deadline.
        if remaining < 10:
            break
        try:
            response = client.models.generate_content(
                model=model,
                contents=input_prompt,
                config=types.GenerateContentConfig(
                    # Timeout lives in http_options and is in milliseconds
                    http_options=types.HttpOptions(
                        timeout=max(1, int(remaining * 1000)),
                        retry_options=types.HttpRetryOptions(attempts=1),
                    )
                ),
            )

            # Ignore thought/signature parts; only final text belongs in chat.
            candidates = response.candidates or []
            content = candidates[0].content if candidates else None
            text = (
                "\n".join(
                    part.text
                    for part in (content.parts or [])
                    if part.text and not part.thought
                )
                if content
                else ""
            )
            if text.strip() and monotonic() <= deadline:
                return text.strip()
        except (errors.APIError, httpx.HTTPError):
            # Never log provider error bodies: they may include health content.
            continue

    raise RuntimeError(
        "All models failed to respond within their shared timeout window."
    )


# test
if __name__ == "__main__":
    print(call_model_with_fallbacks("Hello. what model is this?"))
