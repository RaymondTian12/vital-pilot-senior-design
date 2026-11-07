import os
import httpx
from dotenv import load_dotenv
from google import genai
from google.genai import errors
from google.genai import types
# from time import time
load_dotenv()



def call_model_with_fallbacks(input_prompt: str, max_total_seconds: float = 30.0) -> str:
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        raise RuntimeError("Gemini is not configured")
    client = genai.Client(api_key=gemini_key)
    models = ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-2.5-flash-lite"]
    for model in models:
        try:
            print(f"Attempting generation with: {model}...")
            # start_time = time.start()
            response = client.models.generate_content(
                model=model,
                contents=input_prompt,
                config=types.GenerateContentConfig(
                    # Timeout lives in http_options and is in milliseconds
                    http_options=types.HttpOptions(timeout=int(max_total_seconds * 1000))
                )
            )
            print(f"Success with {model}!")
            return response.text
        except errors.APIError as e:
            print(f"Failed on {model}: {e.message}")
            print("Moving to the next model...")
        except httpx.TimeoutException:
            print(f"Timed out on {model} after {max_total_seconds}s, moving to the next model...")

    raise RuntimeError("All models failed to respond within their individual timeout windows.")


# test
if __name__ == "__main__":
    print(call_model_with_fallbacks("Hello. what model is this?"))
