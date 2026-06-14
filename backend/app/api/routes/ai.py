"""
AI Copilot route — upgraded to inject real scoped enterprise context into every
LLM call.  The OpenRouter → Gemini → fallback chain is preserved exactly.
The fallback now uses live DB data instead of hardcoded fake metrics.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
import httpx

from app.database import get_db
from app.core.config import OPENROUTER_API_KEY, GEMINI_API_KEY
from app.core.security import get_current_user
from app.ai.context_builder import build_context
from app.ai.prompt_builder import (
    build_system_prompt,
    build_fallback_response,
    build_context_aware_suggestions,
)

router = APIRouter(prefix="/ai", tags=["ai"])


class ChatMessage(BaseModel):
    role: str
    content: str


class AiChatInput(BaseModel):
    message: str
    module: str = "general"
    history: List[ChatMessage] = []


# ── LLM callers (unchanged — preserved exactly) ───────────────────────────────

async def call_openrouter(messages: list) -> Optional[str]:
    if not OPENROUTER_API_KEY:
        return None
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "deepseek/deepseek-chat",
                    "messages": messages,
                    "max_tokens": 800,
                },
            )
            if resp.status_code == 200:
                return resp.json()["choices"][0]["message"]["content"]
    except Exception:
        pass
    return None


async def call_gemini(prompt: str) -> Optional[str]:
    if not GEMINI_API_KEY:
        return None
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/"
                f"gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}",
                json={"contents": [{"parts": [{"text": prompt}]}]},
            )
            if resp.status_code == 200:
                return resp.json()["candidates"][0]["content"]["parts"][0]["text"]
    except Exception:
        pass
    return None


# ── Chat endpoint ─────────────────────────────────────────────────────────────

@router.post("/chat")
async def ai_chat(
    body: AiChatInput,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    AI Copilot chat.  Flow:
      1. Build scoped enterprise context from live DB (reuses analytics services)
      2. Inject context into LLM system prompt
      3. Try OpenRouter (DeepSeek) → Gemini → data-driven fallback
      4. Return {response, module, suggestions} — shape unchanged
    """
    # ── 1. Gather real scoped context ─────────────────────────────────────────
    ctx = build_context(current_user, db, module=body.module)

    # ── 2. Build context-enriched system prompt ────────────────────────────────
    system_prompt = build_system_prompt(ctx)

    # ── 3. Try OpenRouter (DeepSeek) ──────────────────────────────────────────
    messages = [{"role": "system", "content": system_prompt}]
    for h in body.history[-6:]:
        messages.append({"role": h.role, "content": h.content})
    messages.append({"role": "user", "content": body.message})

    response = await call_openrouter(messages)

    # ── 4. Try Gemini ──────────────────────────────────────────────────────────
    if not response:
        gemini_prompt = f"{system_prompt}\n\nUser: {body.message}"
        response = await call_gemini(gemini_prompt)

    # ── 5. Data-driven fallback (real DB data, no fake numbers) ───────────────
    if not response:
        response = build_fallback_response(ctx, body.message)

    # ── 6. Context-aware follow-up suggestions ────────────────────────────────
    suggestions = build_context_aware_suggestions(ctx, body.module)

    return {"response": response, "module": body.module, "suggestions": suggestions}


# ── Suggestions endpoint (unchanged) ─────────────────────────────────────────

@router.get("/suggestions")
def get_ai_suggestions(module: Optional[str] = None):
    suggestions_map = {
        "hrms": [
            {"id": 1, "prompt": "Analyze employee attendance trends for this month", "category": "HR Analytics"},
            {"id": 2, "prompt": "Which departments have the highest leave activity?", "category": "Workforce"},
            {"id": 3, "prompt": "How many leave approvals are currently pending?", "category": "Approvals"},
        ],
        "crm": [
            {"id": 4, "prompt": "Summarize the current sales pipeline", "category": "Sales"},
            {"id": 5, "prompt": "What is our current lead conversion rate?", "category": "Lead Analysis"},
            {"id": 6, "prompt": "Show open leads and pipeline value", "category": "Deal Insights"},
        ],
        "finance": [
            {"id": 7, "prompt": "Show revenue and outstanding invoice summary", "category": "Revenue"},
            {"id": 8, "prompt": "What are the top expense categories?", "category": "Expenses"},
            {"id": 9, "prompt": "How many invoices are overdue or outstanding?", "category": "Invoices"},
        ],
        "projects": [
            {"id": 10, "prompt": "Which projects are active and what is their progress?", "category": "Project Health"},
            {"id": 11, "prompt": "Summarize team task completion rates", "category": "Team Performance"},
            {"id": 12, "prompt": "What is the average project completion percentage?", "category": "Progress"},
        ],
        "erp": [
            {"id": 13, "prompt": "Show inventory status and low-stock items", "category": "Inventory"},
            {"id": 14, "prompt": "Which products are critically low on stock?", "category": "Stock Alerts"},
            {"id": 15, "prompt": "Summarize product and vendor status", "category": "Supply Chain"},
        ],
        "analytics": [
            {"id": 16, "prompt": "Give me an executive summary of operations", "category": "Overview"},
            {"id": 17, "prompt": "Which department has the most activity?", "category": "Department Insights"},
            {"id": 18, "prompt": "Show key financial and workforce KPIs", "category": "KPIs"},
        ],
    }
    default = [
        {"id": 19, "prompt": "Summarize company operations across all modules", "category": "Overview"},
        {"id": 20, "prompt": "How many pending approvals and unread notifications do I have?", "category": "My Summary"},
        {"id": 21, "prompt": "Show the latest activity and key metrics", "category": "Operations"},
    ]
    return suggestions_map.get(module or "", default)
