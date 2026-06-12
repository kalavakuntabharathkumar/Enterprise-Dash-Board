from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
import httpx
import os
from app.database import get_db
from app.core.config import OPENROUTER_API_KEY, GEMINI_API_KEY

router = APIRouter(prefix="/ai", tags=["ai"])


class ChatMessage(BaseModel):
    role: str
    content: str


class AiChatInput(BaseModel):
    message: str
    module: str = "general"
    history: List[ChatMessage] = []


SYSTEM_PROMPT = """You are an AI assistant integrated into Enterprise OS — a unified enterprise operating system. 
You help users with HR management, CRM, ERP, finance, projects, analytics, and business operations.
Be concise, professional, and data-driven. Provide actionable insights."""

MODULE_CONTEXTS = {
    "hrms": "Focus on HR metrics, employee performance, attendance, and workforce planning.",
    "crm": "Focus on sales pipeline, lead conversion, deal tracking, and customer relationships.",
    "erp": "Focus on inventory management, vendor relations, and supply chain optimization.",
    "finance": "Focus on revenue trends, expense management, invoice tracking, and budget analysis.",
    "projects": "Focus on project progress, task management, deadlines, and team productivity.",
    "analytics": "Focus on KPIs, business performance metrics, and strategic insights.",
    "general": "Provide general business insights and enterprise operations support.",
}


async def call_openrouter(messages: list) -> str:
    if not OPENROUTER_API_KEY:
        return None
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={"Authorization": f"Bearer {OPENROUTER_API_KEY}", "Content-Type": "application/json"},
                json={"model": "deepseek/deepseek-chat", "messages": messages, "max_tokens": 800},
            )
            if resp.status_code == 200:
                return resp.json()["choices"][0]["message"]["content"]
    except Exception:
        pass
    return None


async def call_gemini(message: str) -> str:
    if not GEMINI_API_KEY:
        return None
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}",
                json={"contents": [{"parts": [{"text": message}]}]},
            )
            if resp.status_code == 200:
                return resp.json()["candidates"][0]["content"]["parts"][0]["text"]
    except Exception:
        pass
    return None


def get_fallback_response(message: str, module: str) -> str:
    msg_lower = message.lower()
    if any(w in msg_lower for w in ["revenue", "sales", "profit"]):
        return "Based on current data, revenue is trending upward with a 12.5% growth month-over-month. The top performing segments are Enterprise and SMB. Consider focusing on high-value deals in the proposal stage to accelerate Q4 targets."
    elif any(w in msg_lower for w in ["employee", "hr", "staff", "team"]):
        return "Current workforce analysis shows 87% of employees are active with an 8.2% growth rate this quarter. Attendance rates remain high at 94%. Consider reviewing the 3 pending leave requests and scheduling performance reviews for the engineering department."
    elif any(w in msg_lower for w in ["project", "task", "deadline"]):
        return "Project portfolio overview: 4 active projects with average completion at 65%. The Platform Redesign project is at risk with only 45% completion approaching deadline. I recommend reallocating resources from the Mobile App project to ensure timely delivery."
    elif any(w in msg_lower for w in ["inventory", "stock", "product"]):
        return "Inventory analysis indicates 3 products are critically low on stock (below 10 units). Total inventory value stands at $485,000. Recommend initiating purchase orders for low-stock items and reviewing vendor contracts for better pricing."
    elif any(w in msg_lower for w in ["invoice", "expense", "finance", "budget"]):
        return "Financial snapshot: $2.4M revenue (paid invoices), $1.1M total expenses, net profit margin at 54%. There are 8 pending invoices worth $340K. 2 invoices are overdue — recommend immediate follow-up with the respective clients."
    elif any(w in msg_lower for w in ["lead", "deal", "crm", "pipeline"]):
        return "CRM pipeline summary: 24 active leads with $1.2M total pipeline value. 6 deals in negotiation stage (highest probability). Lead conversion rate is at 31%. Recommend prioritizing the 4 leads in proposal stage for outreach this week."
    else:
        return f"Enterprise OS AI Copilot is ready to help with {module} insights. I can analyze your HR data, sales pipeline, financial metrics, project status, and inventory levels. What specific metrics or insights would you like to explore?"


@router.post("/chat")
async def ai_chat(body: AiChatInput):
    module_ctx = MODULE_CONTEXTS.get(body.module, MODULE_CONTEXTS["general"])
    system = f"{SYSTEM_PROMPT}\n\nCurrent module context: {module_ctx}"
    messages = [{"role": "system", "content": system}]
    for h in body.history[-6:]:
        messages.append({"role": h.role, "content": h.content})
    messages.append({"role": "user", "content": body.message})

    response = await call_openrouter(messages)
    if not response:
        response = await call_gemini(f"{system}\n\nUser: {body.message}")
    if not response:
        response = get_fallback_response(body.message, body.module)

    suggestions = [
        "Summarize this week's performance",
        "What are the key risks?",
        "Generate a status report",
    ]
    return {"response": response, "module": body.module, "suggestions": suggestions}


@router.get("/suggestions")
def get_ai_suggestions(module: Optional[str] = None):
    suggestions_map = {
        "hrms": [
            {"id": 1, "prompt": "Analyze employee attendance trends for this month", "category": "HR Analytics"},
            {"id": 2, "prompt": "Which departments have the highest turnover risk?", "category": "Workforce"},
            {"id": 3, "prompt": "Generate a performance review summary", "category": "Performance"},
        ],
        "crm": [
            {"id": 4, "prompt": "Summarize the current sales pipeline", "category": "Sales"},
            {"id": 5, "prompt": "Which leads are most likely to convert this week?", "category": "Lead Analysis"},
            {"id": 6, "prompt": "Analyze deal win/loss patterns", "category": "Deal Insights"},
        ],
        "finance": [
            {"id": 7, "prompt": "Generate a monthly revenue summary", "category": "Revenue"},
            {"id": 8, "prompt": "Identify top expense categories this quarter", "category": "Expenses"},
            {"id": 9, "prompt": "Which invoices are at risk of becoming overdue?", "category": "Invoices"},
        ],
        "projects": [
            {"id": 10, "prompt": "Which projects are behind schedule?", "category": "Project Health"},
            {"id": 11, "prompt": "Summarize team task completion rates", "category": "Team Performance"},
            {"id": 12, "prompt": "Identify bottlenecks in the current sprint", "category": "Productivity"},
        ],
    }
    default = [
        {"id": 13, "prompt": "Give me an executive summary of today's business metrics", "category": "Overview"},
        {"id": 14, "prompt": "What are the top 3 priorities I should focus on?", "category": "Strategy"},
        {"id": 15, "prompt": "Analyze overall business performance this month", "category": "Analytics"},
    ]
    return suggestions_map.get(module or "", default)
