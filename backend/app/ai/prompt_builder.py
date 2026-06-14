"""
AI Prompt Builder — builds system prompts with injected real enterprise context
and generates data-driven fallback responses when LLM APIs are unavailable.
"""

MODULE_FOCUS: dict[str, str] = {
    "hrms":      "HR management, employee performance, attendance, workforce planning, and leave approvals",
    "crm":       "sales pipeline, lead conversion, deal tracking, and customer relationships",
    "erp":       "inventory management, vendor relations, stock levels, and supply chain",
    "finance":   "revenue trends, expense management, invoice tracking, and financial health",
    "projects":  "project progress, task management, deadlines, and team productivity",
    "analytics": "KPIs, business performance metrics, and strategic insights",
    "general":   "enterprise operations, business performance, and operational decision-making",
}

_BASE_SYSTEM = """You are an Enterprise OS AI Copilot — an intelligent operational assistant \
integrated directly into a live enterprise platform.

Your role:
- Answer questions about the company's real operational data with precision
- Provide actionable insights grounded in the actual numbers provided below
- Be concise, professional, and data-driven
- NEVER fabricate numbers or invent metrics that are absent from the context

IMPORTANT: Only reference data explicitly provided in the LIVE ENTERPRISE CONTEXT section below."""


def build_system_prompt(ctx: dict) -> str:
    """
    Build a rich system prompt with real scoped enterprise context injected.
    Every LLM call (OpenRouter and Gemini) uses this prompt so it always
    answers based on live DB data rather than training-data guesses.
    """
    lines = [_BASE_SYSTEM, ""]

    module = ctx.get("module", "general")
    focus = MODULE_FOCUS.get(module, MODULE_FOCUS["general"])
    role_label = ctx.get("user_role", "employee").replace("_", " ").title()
    lines.append(f"Module: {module.upper()} — focus on {focus}.")
    lines.append(f"User: {ctx.get('user_name', 'Unknown')} | Role: {role_label}")
    if ctx.get("user_dept"):
        lines.append(f"Department scope: {ctx['user_dept']}")
    lines.append("")
    lines.append("══ LIVE ENTERPRISE CONTEXT (real data from database) ══")

    hr = ctx.get("hr")
    if hr:
        hbd = hr.get("headcount_by_dept", [])
        dept_str = (
            ", ".join(f"{d['department']} ({d['count']})" for d in hbd)
            if hbd else "N/A"
        )
        lines.append(
            f"\nWORKFORCE:\n"
            f"  Active employees: {hr.get('active_employees', 'N/A')}\n"
            f"  Currently on leave: {hr.get('on_leave_count', 'N/A')}\n"
            f"  Pending leave approvals: {hr.get('pending_approvals', 'N/A')}\n"
            f"  Avg approval turnaround: {hr.get('avg_turnaround_days', 'N/A')} days\n"
            f"  Headcount by dept: {dept_str}"
        )

    leaves = ctx.get("leaves")
    if leaves:
        lines.append(
            f"\nLEAVE REQUESTS (your scope):\n"
            f"  Total: {leaves['total']} | Pending: {leaves['pending']} | "
            f"Approved: {leaves['approved']} | Rejected: {leaves['rejected']}"
        )

    finance = ctx.get("finance")
    if finance:
        exp_cats = finance.get("expense_by_category", [])
        exp_str = (
            ", ".join(f"{e['category']} (${e['total']:,.0f})" for e in exp_cats[:3])
            if exp_cats else "none"
        )
        inv_dist = finance.get("invoice_status_distribution", [])
        inv_str = (
            ", ".join(f"{i['status']}: {i['count']}" for i in inv_dist)
            if inv_dist else "none"
        )
        lines.append(
            f"\nFINANCE:\n"
            f"  Revenue (paid invoices): ${finance.get('total_paid', 0):,.2f}\n"
            f"  Outstanding (sent/overdue): ${finance.get('total_outstanding', 0):,.2f}\n"
            f"  Top expense categories: {exp_str}\n"
            f"  Invoice status breakdown: {inv_str}"
        )

    dept_data = ctx.get("department")
    if dept_data and dept_data.get("departments"):
        lines.append("\nDEPARTMENTS (last 30 days):")
        for d in dept_data["departments"][:6]:
            lines.append(
                f"  {d['department']}: {d['employee_count']} employees, "
                f"{d['leave_requests_30d']} leaves, {d['activity_count_30d']} activities, "
                f"{d['doc_uploads_30d']} doc uploads"
            )

    activity = ctx.get("activity")
    if activity:
        top_actors = activity.get("top_actors", [])
        actors_str = (
            ", ".join(f"{a['name']} ({a['count']} actions)" for a in top_actors[:3])
            if top_actors else "none"
        )
        lines.append(
            f"\nACTIVITY (last 30 days):\n"
            f"  Total actions logged: {activity.get('total_30d', 0)}\n"
            f"  Most active users: {actors_str}"
        )

    inventory = ctx.get("inventory")
    if inventory:
        low_str = (
            ", ".join(f"{p['name']} ({p['stock']} units)" for p in inventory["low_stock_items"])
            if inventory["low_stock_items"] else "none"
        )
        lines.append(
            f"\nINVENTORY:\n"
            f"  Total products: {inventory['total_products']}\n"
            f"  Low stock (< 10 units): {inventory['low_stock_count']}\n"
            f"  Low stock items: {low_str}"
        )

    crm = ctx.get("crm")
    if crm:
        lines.append(
            f"\nCRM:\n"
            f"  Total leads: {crm['total_leads']} | Open: {crm['open_leads']} | Won: {crm['closed_won']}\n"
            f"  Pipeline value: ${crm['pipeline_value']:,.0f} | "
            f"Conversion rate: {crm['conversion_rate']}%"
        )

    projects = ctx.get("projects")
    if projects:
        lines.append(
            f"\nPROJECTS:\n"
            f"  Total: {projects['total']} | Active: {projects['active']} | "
            f"Avg progress: {projects['avg_progress']}%"
        )

    docs = ctx.get("documents")
    if docs:
        cat_dist = docs.get("category_distribution", [])
        cat_str = (
            ", ".join(f"{c['category']}: {c['count']}" for c in cat_dist[:4])
            if cat_dist else "none"
        )
        lines.append(
            f"\nDOCUMENTS (your scope):\n"
            f"  Total accessible: {docs.get('total_docs', 0)}\n"
            f"  By category: {cat_str}"
        )

    notifs = ctx.get("notifications")
    if notifs:
        lines.append(
            f"\nNOTIFICATIONS:\n"
            f"  Total: {notifs['total']} | Unread: {notifs['unread']}"
        )

    lines.append("\n══ END OF LIVE CONTEXT ══")
    lines.append(
        "\nAnswer based only on the data above. Be specific with numbers. "
        "If something isn't covered, say so honestly rather than guessing."
    )

    return "\n".join(lines)


def build_fallback_response(ctx: dict, message: str) -> str:
    """
    Generate a data-driven fallback when both OpenRouter and Gemini are
    unavailable.  Uses real context — never fabricates numbers.
    """
    msg_lower = message.lower()

    hr = ctx.get("hr")
    finance = ctx.get("finance")
    leaves = ctx.get("leaves")
    activity = ctx.get("activity")
    docs = ctx.get("documents")
    inventory = ctx.get("inventory")
    crm = ctx.get("crm")
    projects = ctx.get("projects")
    notifs = ctx.get("notifications")
    dept_data = ctx.get("department")

    parts: list[str] = []

    # ── Workforce / HR ────────────────────────────────────────────────────────
    if any(w in msg_lower for w in ["employee", "hr", "staff", "team", "workforce", "headcount", "attendance"]):
        if hr:
            hbd = hr.get("headcount_by_dept", [])
            dept_str = ", ".join(f"{d['department']}: {d['count']}" for d in hbd) if hbd else "N/A"
            parts.append(
                f"**Workforce Summary**\n"
                f"- Active employees: {hr['active_employees']}\n"
                f"- Currently on leave: {hr['on_leave_count']}\n"
                f"- Pending leave approvals: {hr['pending_approvals']}\n"
                f"- Avg approval turnaround: {hr['avg_turnaround_days']} days\n"
                f"- By department: {dept_str}"
            )
        else:
            parts.append("HR data is not available in your current scope.")

    # ── Leave / approvals ─────────────────────────────────────────────────────
    elif any(w in msg_lower for w in ["leave", "approval", "pending", "request", "time off"]):
        if leaves:
            parts.append(
                f"**Leave Requests (your scope)**\n"
                f"- Total: {leaves['total']}\n"
                f"- Pending approval: {leaves['pending']}\n"
                f"- Approved: {leaves['approved']}\n"
                f"- Rejected: {leaves['rejected']}"
            )
        if hr and leaves and hr.get("pending_approvals") != leaves.get("pending"):
            parts.append(f"Org-wide pending approvals: {hr['pending_approvals']}")

    # ── Finance / revenue / invoices ──────────────────────────────────────────
    elif any(w in msg_lower for w in ["revenue", "sales", "profit", "finance", "invoice", "expense", "budget", "money"]):
        if finance:
            inv_dist = finance.get("invoice_status_distribution", [])
            inv_str = " | ".join(
                f"{i['status']}: {i['count']} (${i['total']:,.0f})" for i in inv_dist
            ) if inv_dist else "N/A"
            exp_cats = finance.get("expense_by_category", [])
            exp_str = ", ".join(
                f"{e['category']}: ${e['total']:,.0f}" for e in exp_cats[:4]
            ) if exp_cats else "N/A"
            parts.append(
                f"**Finance Summary**\n"
                f"- Revenue (paid invoices): ${finance['total_paid']:,.2f}\n"
                f"- Outstanding (sent/overdue): ${finance['total_outstanding']:,.2f}\n"
                f"- Invoice status: {inv_str}\n"
                f"- Top expense categories: {exp_str}"
            )
        else:
            parts.append("Finance data is not available in your current scope.")

    # ── Projects / tasks / milestones ─────────────────────────────────────────
    elif any(w in msg_lower for w in ["project", "task", "deadline", "progress", "milestone", "sprint"]):
        if projects:
            parts.append(
                f"**Projects**\n"
                f"- Total: {projects['total']}\n"
                f"- Active: {projects['active']}\n"
                f"- Avg progress: {projects['avg_progress']}%"
            )
        else:
            parts.append("Project data is not available in your current scope.")

    # ── Inventory / ERP ───────────────────────────────────────────────────────
    elif any(w in msg_lower for w in ["inventory", "stock", "product", "vendor", "erp", "supply"]):
        if inventory:
            low_str = (
                ", ".join(f"{p['name']} ({p['stock']} units)" for p in inventory["low_stock_items"])
                if inventory["low_stock_items"] else "none"
            )
            parts.append(
                f"**Inventory**\n"
                f"- Total products: {inventory['total_products']}\n"
                f"- Low stock (< 10 units): {inventory['low_stock_count']}\n"
                f"- Low stock items: {low_str}"
            )
        else:
            parts.append("Inventory data is not available in your current scope.")

    # ── CRM / leads / deals ───────────────────────────────────────────────────
    elif any(w in msg_lower for w in ["lead", "deal", "crm", "pipeline", "conversion", "prospect", "contact"]):
        if crm:
            parts.append(
                f"**CRM Pipeline**\n"
                f"- Total leads: {crm['total_leads']}\n"
                f"- Open leads: {crm['open_leads']}\n"
                f"- Closed won: {crm['closed_won']}\n"
                f"- Pipeline value: ${crm['pipeline_value']:,.0f}\n"
                f"- Conversion rate: {crm['conversion_rate']}%"
            )
        else:
            parts.append("CRM data is not available in your current scope.")

    # ── Documents ─────────────────────────────────────────────────────────────
    elif any(w in msg_lower for w in ["document", "file", "upload", "doc", "attachment"]):
        if docs:
            cat_dist = docs.get("category_distribution", [])
            cat_str = (
                ", ".join(f"{c['category']}: {c['count']}" for c in cat_dist[:5])
                if cat_dist else "none"
            )
            parts.append(
                f"**Documents (your scope)**\n"
                f"- Total accessible: {docs['total_docs']}\n"
                f"- By category: {cat_str}"
            )
        else:
            parts.append("No document data available in your scope.")

    # ── Activity / audit ──────────────────────────────────────────────────────
    elif any(w in msg_lower for w in ["activity", "actions", "audit", "log", "history"]):
        if activity:
            top_actors = activity.get("top_actors", [])
            actors_str = (
                ", ".join(f"{a['name']} ({a['count']} actions)" for a in top_actors[:5])
                if top_actors else "none"
            )
            entity_bd = activity.get("entity_type_breakdown", [])
            entity_str = (
                ", ".join(f"{e['entity_type']}: {e['count']}" for e in entity_bd[:4])
                if entity_bd else "none"
            )
            parts.append(
                f"**Activity Log (last 30 days)**\n"
                f"- Total actions: {activity['total_30d']}\n"
                f"- Most active users: {actors_str}\n"
                f"- By entity type: {entity_str}"
            )
        else:
            parts.append("Activity data is not available in your current scope.")

    # ── Notifications ─────────────────────────────────────────────────────────
    elif any(w in msg_lower for w in ["notification", "alert", "unread", "inbox"]):
        if notifs:
            parts.append(f"**Notifications:** {notifs['total']} total, {notifs['unread']} unread.")
        else:
            parts.append("Notification data is not available.")

    # ── Department / team ─────────────────────────────────────────────────────
    elif any(w in msg_lower for w in ["department", "dept", "most active", "team activity"]):
        if dept_data and dept_data.get("departments"):
            parts.append("**Department Activity (last 30 days)**")
            for d in dept_data["departments"]:
                parts.append(
                    f"- {d['department']}: {d['employee_count']} employees, "
                    f"{d['leave_requests_30d']} leaves, "
                    f"{d['activity_count_30d']} activities"
                )
        else:
            parts.append("Department data is not available in your current scope.")

    # ── General / executive summary ───────────────────────────────────────────
    else:
        summary_lines: list[str] = []
        if hr:
            summary_lines.append(
                f"{hr['active_employees']} active employees, "
                f"{hr['pending_approvals']} pending leave approvals"
            )
        if finance:
            summary_lines.append(
                f"${finance['total_paid']:,.0f} revenue collected, "
                f"${finance['total_outstanding']:,.2f} outstanding"
            )
        if projects:
            summary_lines.append(
                f"{projects['active']} active projects at {projects['avg_progress']}% avg completion"
            )
        if crm:
            summary_lines.append(
                f"{crm['open_leads']} open leads (${crm['pipeline_value']:,.0f} pipeline)"
            )
        if inventory:
            summary_lines.append(
                f"{inventory['total_products']} products, "
                f"{inventory['low_stock_count']} low on stock"
            )
        if leaves:
            summary_lines.append(f"{leaves['pending']} pending leave requests in your scope")
        if notifs and notifs["unread"] > 0:
            summary_lines.append(f"{notifs['unread']} unread notifications")

        if summary_lines:
            parts.append(
                "**Enterprise Operations Summary**\n- " + "\n- ".join(summary_lines)
            )
            parts.append("What specific area would you like to explore further?")
        else:
            parts.append(
                "I'm your Enterprise OS AI Copilot. I can help you analyze workforce data, "
                "finances, projects, sales pipeline, and operational metrics. "
                "What would you like to know?"
            )

    return "\n\n".join(parts) if parts else (
        "I'm ready to help with your enterprise operations. "
        "Ask me about HR, finance, projects, CRM, or any other module."
    )


def build_context_aware_suggestions(ctx: dict, module: str) -> list[str]:
    """
    Return 3 context-aware follow-up suggestions based on real data signals.
    Falls back to generic module suggestions when data is unavailable.
    """
    suggestions: list[str] = []

    hr = ctx.get("hr")
    finance = ctx.get("finance")
    leaves = ctx.get("leaves")
    inventory = ctx.get("inventory")
    crm = ctx.get("crm")
    projects = ctx.get("projects")
    notifs = ctx.get("notifications")

    # Data-driven suggestions based on what the numbers highlight
    if hr and hr.get("pending_approvals", 0) > 0:
        suggestions.append(f"Show all {hr['pending_approvals']} pending leave approvals")
    if finance and finance.get("total_outstanding", 0) > 0:
        suggestions.append(f"Summarize outstanding invoices (${finance['total_outstanding']:,.0f})")
    if inventory and inventory.get("low_stock_count", 0) > 0:
        suggestions.append(f"List {inventory['low_stock_count']} low-stock products")
    if crm and crm.get("open_leads", 0) > 0:
        suggestions.append(f"Summarize {crm['open_leads']} open leads")
    if projects and projects.get("active", 0) > 0:
        suggestions.append(f"Review {projects['active']} active projects")
    if notifs and notifs.get("unread", 0) > 0:
        suggestions.append(f"Show {notifs['unread']} unread notifications")
    if leaves and leaves.get("pending", 0) > 0:
        suggestions.append(f"Review {leaves['pending']} pending leave requests")
    if hr and hr.get("on_leave_count", 0) > 0:
        suggestions.append(f"Show employees currently on leave ({hr['on_leave_count']})")

    # Trim to 3 and fill gaps with module-appropriate fallbacks
    suggestions = suggestions[:3]
    module_defaults = {
        "hrms":      ["Analyze attendance trends", "Which department has the most leave requests?", "Show workforce headcount by department"],
        "crm":       ["Summarize the sales pipeline", "Which leads are in the negotiation stage?", "Show deal conversion rate"],
        "finance":   ["Show revenue vs expenses breakdown", "List overdue invoices", "Which expense category is highest?"],
        "projects":  ["Which projects are behind schedule?", "Show task completion rates", "Identify team bottlenecks"],
        "erp":       ["Show inventory status", "List vendors with active orders", "Which products need restocking?"],
        "analytics": ["Give an executive operations summary", "Show department performance", "Compare this month vs last month"],
        "general":   ["Summarize company operations", "What are the top priorities today?", "Show key metrics across all modules"],
    }
    defaults = module_defaults.get(module, module_defaults["general"])
    for d in defaults:
        if len(suggestions) >= 3:
            break
        if d not in suggestions:
            suggestions.append(d)

    return suggestions[:3]
