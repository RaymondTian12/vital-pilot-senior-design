from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from backend.llm import call_model_with_fallbacks
from backend.models.User import User
from backend.security import get_current_user
from backend.db import get_db_connection
router = APIRouter()

instructions = """
You are Pilot AI, a health information assistant for the VitalPilot website.

VitalPilot allows users to enter and understand health measurements
such as blood pressure, heart rate, blood oxygen, temperature,
and other vital signs.

Your purpose is to explain health information in clear,
easy-to-understand language.

RULES:
- Provide general educational health information.
- Do not diagnose medical conditions.
- Do not prescribe medication.
- Do not tell users to stop or change medication.
- Do not invent health measurements or medical history.
- If you do not have enough information, say so.
- When appropriate, recommend speaking with a healthcare professional.
- For potentially urgent situations, recommend appropriate immediate care.

RESPONSE STYLE:
- Keep normal responses between 2 and 4 short paragraphs.
- Keep most responses under 150 words.
- Use short paragraphs instead of one large block.
- Put a blank line between paragraphs.
- Use bullet points when explaining multiple items.
- Use plain text only. Do not use Markdown symbols such as ** or #.
- Start each bullet line with "- " and put a blank line before and after a bullet list.
- Avoid long introductions.
- Answer the user's question directly, unless key details are missing,
  in which case ask follow-up questions first.

FOLLOW-UP QUESTIONS:
- If the user's message is vague or missing important details, ask 1 to 3
  short follow-up questions before giving a full answer.
- For symptoms, ask about details such as how long it has lasted, how severe
  it is (1 to 10), where it is, what makes it better or worse, and any other
  symptoms.
- For vital readings, ask about context if it matters, such as the time of
  day, recent activity, medications, or whether this is unusual for them.
- When you have enough information, give your answer, then end with one short
  follow-up question that helps the user go further.
- Do not ask questions you already know the answer to from earlier in the
  conversation.
- Never delay urgent safety advice to ask questions. If something sounds like
  an emergency, say so first.
"""

class ChatMessage(BaseModel):
    role: str      # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []

METRICS = [
    ("Blood glucose", "mg/dL", "BloodGlucose", "glucose_mgdl", "logged_at"),
    ("Blood pressure", "mmHg", "BloodPressure", "CONCAT(systolic_mmhg, '/', diastolic_mmhg)", "logged_at"),
    ("Blood oxygen", "%", "BloodOxygenSaturation", "spo2_percentage", "logged_at"),
    ("Peak flow", "L/min", "PeakFlowRate", "flow_rate_lmin", "logged_at"),
    ("Steps", "steps", "PhysicalActivity", "steps_taken", "logged_at"),
    ("Sleep", "hours", "Sleep", "duration_hours", "logged_at"),
    ("Water intake", "cups", "WaterIntake", "amount_cups", "logged_at"),
    ("BMI", "", "BodyMassIndex", "bmi_value", "recorded_at"),
]

def get_user_metrics(user: User) -> str:
  conn = get_db_connection()
  if not conn:
    return ""
  lines = []
  try:
      with conn.cursor() as cursor:
          for label, unit, table, value, timestamp in METRICS:
              cursor.execute(
                  f"SELECT {value}, {timestamp} FROM {table} "
                  f"WHERE user_id = %s ORDER BY {timestamp} DESC LIMIT 1",
                  (user.user_id,),
              )
              row = cursor.fetchone()
              if row:
                  lines.append(f"{label}: {row[0]} {unit} ({row[1].date()})")
  except Exception as e:
      print(f"Failed to acquire user metrics. Error: {e}")
  finally:
      conn.close()

  return "\n".join(lines)


@router.post("/chat")
def chat(payload: ChatRequest, current_user: User = Depends(get_current_user)):
    conversation = "\n".join(
        f"{m.role.upper()}: {m.content}" for m in payload.history[-10:]
    )
    metrics = get_user_metrics(current_user)
    prompt = f"""{instructions}
    USER'S LATEST HEALTH METRICS:
    {metrics or "None available"}
    CONVERSATION SO FAR:
    {conversation or "None"}

    USER: {payload.message}
    """

    try:
        reply = call_model_with_fallbacks(prompt)
    except RuntimeError:
        raise HTTPException(
            status_code=503,
            detail="Pilot AI is busy right now. Please try again in a few minutes.",
        )

    return {"reply": (reply or "").strip()}
