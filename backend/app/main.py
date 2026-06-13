import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import create_tables
from app.api.routes import (
    auth, dashboard, employees, departments, attendance, leaves,
    leads, contacts, deals, products, vendors, purchases,
    invoices, expenses, projects, tasks, milestones,
    analytics, ai, workflows, notifications, users
)
from app.api.routes import export
from app.api.routes import payslips, profiles, announcements, timesheets, support, documents
from app.api.routes import rbac
from app.api.routes import activity

app = FastAPI(title="Enterprise OS API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_PREFIX = "/api"

app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(dashboard.router, prefix=API_PREFIX)
app.include_router(employees.router, prefix=API_PREFIX)
app.include_router(departments.router, prefix=API_PREFIX)
app.include_router(attendance.router, prefix=API_PREFIX)
app.include_router(leaves.router, prefix=API_PREFIX)
app.include_router(leads.router, prefix=API_PREFIX)
app.include_router(contacts.router, prefix=API_PREFIX)
app.include_router(deals.router, prefix=API_PREFIX)
app.include_router(products.router, prefix=API_PREFIX)
app.include_router(vendors.router, prefix=API_PREFIX)
app.include_router(purchases.router, prefix=API_PREFIX)
app.include_router(invoices.router, prefix=API_PREFIX)
app.include_router(expenses.router, prefix=API_PREFIX)
app.include_router(projects.router, prefix=API_PREFIX)
app.include_router(tasks.router, prefix=API_PREFIX)
app.include_router(milestones.router, prefix=API_PREFIX)
app.include_router(analytics.router, prefix=API_PREFIX)
app.include_router(ai.router, prefix=API_PREFIX)
app.include_router(workflows.router, prefix=API_PREFIX)
app.include_router(notifications.router, prefix=API_PREFIX)
app.include_router(users.router, prefix=API_PREFIX)
app.include_router(export.router, prefix=API_PREFIX)
app.include_router(payslips.router, prefix=API_PREFIX)
app.include_router(profiles.router, prefix=API_PREFIX)
app.include_router(announcements.router, prefix=API_PREFIX)
app.include_router(timesheets.router, prefix=API_PREFIX)
app.include_router(support.router, prefix=API_PREFIX)
app.include_router(documents.router, prefix=API_PREFIX)
app.include_router(rbac.router, prefix=API_PREFIX)
app.include_router(activity.router, prefix=API_PREFIX)


@app.get("/api/healthz")
def health_check():
    return {"status": "ok"}


@app.on_event("startup")
def startup():
    create_tables()

    # ── Safe column migrations — each ALTER TABLE is guarded by PRAGMA ──────
    from sqlalchemy import text
    from app.database import engine

    # Maps: (table_name, column_name) → full ALTER TABLE SQL
    _col_migrations = [
        ("users",          "role_id",               "ALTER TABLE users ADD COLUMN role_id INTEGER REFERENCES roles(id)"),
        ("users",          "department_id",          "ALTER TABLE users ADD COLUMN department_id INTEGER REFERENCES departments(id)"),
        ("leave_requests", "current_approver_role",  "ALTER TABLE leave_requests ADD COLUMN current_approver_role TEXT"),
        ("leave_requests", "created_at",             "ALTER TABLE leave_requests ADD COLUMN created_at TEXT"),
        ("leave_requests", "updated_at",             "ALTER TABLE leave_requests ADD COLUMN updated_at TEXT"),
        ("notifications",  "user_id",                "ALTER TABLE notifications ADD COLUMN user_id INTEGER"),
        ("notifications",  "target_role",            "ALTER TABLE notifications ADD COLUMN target_role TEXT"),
    ]

    with engine.connect() as _conn:
        # Cache existing columns per table to avoid redundant PRAGMAs
        _table_cols: dict = {}
        for tbl, col, sql in _col_migrations:
            if tbl not in _table_cols:
                r = _conn.execute(text(f"PRAGMA table_info({tbl})"))
                _table_cols[tbl] = {row[1] for row in r.fetchall()}
            if col not in _table_cols[tbl]:
                try:
                    _conn.execute(text(sql))
                    _conn.commit()
                    _table_cols[tbl].add(col)
                except Exception as _e:
                    print(f"Migration skipped ({tbl}.{col}): {_e}")

    from app.database import SessionLocal
    db = SessionLocal()
    try:
        from app import models
        from app.core.security import get_password_hash
        from datetime import datetime

        # ── Users ──────────────────────────────────────────────────────
        if db.query(models.User).count() == 0:
            admin = models.User(name="Alex Morgan", email="admin@enterpriseos.com", hashed_password=get_password_hash("admin123"), role="admin")
            db.add(admin)
            db.flush()

        if not db.query(models.User).filter(models.User.email == "employee@enterpriseos.com").first():
            emp_user = models.User(name="Jordan Lee", email="employee@enterpriseos.com", hashed_password=get_password_hash("employee123"), role="employee")
            db.add(emp_user)
            db.flush()

        # ── Departments ────────────────────────────────────────────────
        if db.query(models.Department).count() == 0:
            depts = [
                models.Department(name="Engineering", head="Sarah Chen", description="Product development and infrastructure"),
                models.Department(name="Sales", head="Marcus Johnson", description="Revenue generation and client acquisition"),
                models.Department(name="Marketing", head="Emma Davis", description="Brand, campaigns, and growth"),
                models.Department(name="HR", head="James Wilson", description="People operations and culture"),
                models.Department(name="Finance", head="Priya Patel", description="Financial planning and analysis"),
                models.Department(name="Operations", head="Tom Baker", description="Business operations and logistics"),
            ]
            db.add_all(depts)
            db.flush()

        # ── Employees ──────────────────────────────────────────────────
        if db.query(models.Employee).count() == 0:
            employees_data = [
                models.Employee(name="Sarah Chen", email="sarah.chen@co.com", department="Engineering", position="VP Engineering", status="active", salary=145000, joined_date="2021-03-15", location="San Francisco"),
                models.Employee(name="Marcus Johnson", email="marcus.j@co.com", department="Sales", position="Sales Director", status="active", salary=125000, joined_date="2020-07-01", location="New York"),
                models.Employee(name="Emma Davis", email="emma.d@co.com", department="Marketing", position="CMO", status="active", salary=130000, joined_date="2021-01-10", location="Austin"),
                models.Employee(name="James Wilson", email="james.w@co.com", department="HR", position="HR Manager", status="active", salary=95000, joined_date="2022-02-14", location="Chicago"),
                models.Employee(name="Priya Patel", email="priya.p@co.com", department="Finance", position="CFO", status="active", salary=155000, joined_date="2020-09-01", location="Boston"),
                models.Employee(name="Tom Baker", email="tom.b@co.com", department="Operations", position="COO", status="active", salary=140000, joined_date="2021-06-01", location="Seattle"),
                models.Employee(name="Lisa Park", email="lisa.p@co.com", department="Engineering", position="Senior Engineer", status="active", salary=115000, joined_date="2022-04-11", location="San Francisco"),
                models.Employee(name="David Kim", email="david.k@co.com", department="Engineering", position="Frontend Engineer", status="active", salary=105000, joined_date="2023-01-15", location="Remote"),
                models.Employee(name="Ana Rodriguez", email="ana.r@co.com", department="Sales", position="Account Executive", status="active", salary=85000, joined_date="2022-08-01", location="Miami"),
                models.Employee(name="Ben Thompson", email="ben.t@co.com", department="Marketing", position="Growth Manager", status="on_leave", salary=90000, joined_date="2022-11-01", location="Austin"),
                models.Employee(name="Jordan Lee", email="employee@enterpriseos.com", department="Engineering", position="Software Engineer", status="active", salary=98000, joined_date="2023-06-01", location="Remote"),
            ]
            db.add_all(employees_data)
            db.flush()

        # ── Ensure Jordan Lee employee record exists ───────────────────
        if not db.query(models.Employee).filter(models.Employee.email == "employee@enterpriseos.com").first():
            db.add(models.Employee(name="Jordan Lee", email="employee@enterpriseos.com", department="Engineering", position="Software Engineer", status="active", salary=98000, joined_date="2023-06-01", location="Remote"))
            db.flush()

        # ── Leads ──────────────────────────────────────────────────────
        if db.query(models.Lead).count() == 0:
            leads_data = [
                models.Lead(name="Michael Grant", company="TechCorp Inc", email="mgrant@techcorp.com", stage="proposal", value=85000, status="qualified", assigned_to="Marcus Johnson"),
                models.Lead(name="Jennifer Walsh", company="DataFlow Systems", email="jwalsh@dataflow.com", stage="negotiation", value=142000, status="hot", assigned_to="Marcus Johnson"),
                models.Lead(name="Robert Chen", company="Nexus Solutions", email="rchen@nexus.com", stage="prospecting", value=52000, status="new", assigned_to="Ana Rodriguez"),
                models.Lead(name="Diana Prince", company="Apex Ventures", email="dprince@apex.com", stage="qualified", value=210000, status="qualified", assigned_to="Marcus Johnson"),
                models.Lead(name="Kevin Santos", company="Blue Wave Media", email="ksantos@bluewave.com", stage="closed_won", value=95000, status="won", assigned_to="Ana Rodriguez"),
                models.Lead(name="Lisa Monroe", company="Synergy Corp", email="lmonroe@synergy.com", stage="closed_lost", value=60000, status="lost", assigned_to="Ana Rodriguez"),
            ]
            db.add_all(leads_data)
            db.flush()

        if db.query(models.Contact).count() == 0:
            contacts_data = [
                models.Contact(name="Michael Grant", email="mgrant@techcorp.com", company="TechCorp Inc", role="CTO", phone="+1-555-0101"),
                models.Contact(name="Jennifer Walsh", email="jwalsh@dataflow.com", company="DataFlow Systems", role="CEO", phone="+1-555-0102"),
                models.Contact(name="Diana Prince", email="dprince@apex.com", company="Apex Ventures", role="VP Product", phone="+1-555-0103"),
                models.Contact(name="Kevin Santos", email="ksantos@bluewave.com", company="Blue Wave Media", role="Head of Marketing", phone="+1-555-0104"),
            ]
            db.add_all(contacts_data)
            db.flush()

        if db.query(models.Deal).count() == 0:
            deals_data = [
                models.Deal(title="TechCorp Enterprise License", contact="Michael Grant", company="TechCorp Inc", value=85000, stage="proposal", probability=65, close_date="2024-02-28", assigned_to="Marcus Johnson"),
                models.Deal(title="DataFlow Annual Contract", contact="Jennifer Walsh", company="DataFlow Systems", value=142000, stage="negotiation", probability=80, close_date="2024-01-31", assigned_to="Marcus Johnson"),
                models.Deal(title="Apex Platform Deal", contact="Diana Prince", company="Apex Ventures", value=210000, stage="qualified", probability=40, close_date="2024-03-15", assigned_to="Marcus Johnson"),
                models.Deal(title="Blue Wave Subscription", contact="Kevin Santos", company="Blue Wave Media", value=95000, stage="closed_won", probability=100, close_date="2024-01-15", assigned_to="Ana Rodriguez"),
            ]
            db.add_all(deals_data)
            db.flush()

        if db.query(models.Product).count() == 0:
            products_data = [
                models.Product(name="Enterprise Server Pro", category="Hardware", sku="HW-001", stock=45, unit_price=4500, status="active", vendor="TechSupply Co"),
                models.Product(name="Network Switch 48-Port", category="Hardware", sku="HW-002", stock=8, unit_price=1200, status="active", vendor="NetGear Pro"),
                models.Product(name="SaaS Analytics Suite", category="Software", sku="SW-001", stock=500, unit_price=299, status="active"),
                models.Product(name="Security Scanner Pro", category="Software", sku="SW-002", stock=200, unit_price=599, status="active"),
                models.Product(name="Office Desk Chair", category="Furniture", sku="FN-001", stock=0, unit_price=450, status="out_of_stock"),
                models.Product(name="Standing Desk", category="Furniture", sku="FN-002", stock=12, unit_price=850, status="active"),
            ]
            db.add_all(products_data)
            db.flush()

        if db.query(models.Vendor).count() == 0:
            vendors_data = [
                models.Vendor(name="TechSupply Co", email="orders@techsupply.com", phone="+1-555-2001", status="active", category="Hardware"),
                models.Vendor(name="NetGear Pro", email="sales@netgearpro.com", phone="+1-555-2002", status="active", category="Networking"),
                models.Vendor(name="Office World", email="b2b@officeworld.com", phone="+1-555-2003", status="active", category="Office Supplies"),
                models.Vendor(name="CloudBase Solutions", email="enterprise@cloudbase.io", phone="+1-555-2004", status="active", category="Cloud Services"),
            ]
            db.add_all(vendors_data)
            db.flush()

        if db.query(models.Invoice).count() == 0:
            invoices_data = [
                models.Invoice(invoice_number="INV-001024", client="TechCorp Inc", amount=85000, status="paid", issue_date="2024-01-01", due_date="2024-01-31", description="Enterprise License Q1"),
                models.Invoice(invoice_number="INV-001025", client="DataFlow Systems", amount=42000, status="sent", issue_date="2024-01-10", due_date="2024-02-10", description="Platform Subscription"),
                models.Invoice(invoice_number="INV-001026", client="Apex Ventures", amount=28500, status="draft", issue_date="2024-01-15", due_date="2024-02-15", description="Consulting Services"),
                models.Invoice(invoice_number="INV-001027", client="Blue Wave Media", amount=95000, status="paid", issue_date="2023-12-01", due_date="2023-12-31", description="Annual Contract"),
                models.Invoice(invoice_number="INV-001028", client="Nexus Solutions", amount=15000, status="overdue", issue_date="2023-12-15", due_date="2024-01-05", description="Support Package"),
            ]
            db.add_all(invoices_data)
            db.flush()

        if db.query(models.Expense).count() == 0:
            expenses_data = [
                models.Expense(title="AWS Infrastructure", amount=12400, category="Technology", date="2024-01-01", status="approved", submitted_by="Sarah Chen"),
                models.Expense(title="Office Rent - January", amount=18500, category="Office", date="2024-01-01", status="approved", submitted_by="Tom Baker"),
                models.Expense(title="Team Offsite - SF", amount=8200, category="Travel", date="2024-01-08", status="approved", submitted_by="Emma Davis"),
                models.Expense(title="Marketing Campaign Q1", amount=25000, category="Marketing", date="2024-01-10", status="pending", submitted_by="Emma Davis"),
                models.Expense(title="Legal Consulting", amount=5500, category="Professional Services", date="2024-01-12", status="pending", submitted_by="Priya Patel"),
                models.Expense(title="Software Licenses", amount=7800, category="Technology", date="2024-01-15", status="approved", submitted_by="Sarah Chen"),
            ]
            db.add_all(expenses_data)
            db.flush()

        if db.query(models.Project).count() == 0:
            projects_data = [
                models.Project(name="Platform Redesign 2024", description="Complete overhaul of the enterprise platform UI/UX", status="active", progress=45, start_date="2024-01-01", end_date="2024-04-30", manager="Sarah Chen", priority="high"),
                models.Project(name="Mobile App Launch", description="Native iOS and Android enterprise app", status="active", progress=72, start_date="2023-11-01", end_date="2024-02-28", manager="David Kim", priority="high"),
                models.Project(name="Data Analytics Pipeline", description="Real-time data processing and reporting infrastructure", status="active", progress=88, start_date="2023-10-15", end_date="2024-01-31", manager="Lisa Park", priority="medium"),
                models.Project(name="Sales CRM Integration", description="Integrate third-party CRM with internal systems", status="planning", progress=15, start_date="2024-02-01", end_date="2024-05-31", manager="Marcus Johnson", priority="medium"),
            ]
            db.add_all(projects_data)
            db.flush()

        if db.query(models.Task).count() == 0:
            tasks_data = [
                models.Task(title="Design system component library", status="done", priority="high", project_id=1, assignee="David Kim", due_date="2024-01-20"),
                models.Task(title="Implement dashboard analytics module", status="in_progress", priority="high", project_id=1, assignee="Lisa Park", due_date="2024-02-05"),
                models.Task(title="API performance optimization", status="in_progress", priority="medium", project_id=1, assignee="Sarah Chen", due_date="2024-02-10"),
                models.Task(title="Mobile onboarding flow", status="todo", priority="high", project_id=2, assignee="David Kim", due_date="2024-02-15"),
                models.Task(title="Push notification integration", status="in_progress", priority="medium", project_id=2, assignee="David Kim", due_date="2024-02-20"),
                models.Task(title="Data pipeline unit tests", status="done", priority="low", project_id=3, assignee="Lisa Park", due_date="2024-01-25"),
                models.Task(title="Set up ETL infrastructure", status="done", priority="high", project_id=3, assignee="Sarah Chen", due_date="2024-01-15"),
                models.Task(title="CRM API contract review", status="todo", priority="medium", project_id=4, assignee="Marcus Johnson", due_date="2024-02-28"),
                models.Task(title="Build REST API endpoints", status="in_progress", priority="high", project_id=1, assignee="Jordan Lee", due_date="2024-02-12"),
                models.Task(title="Write integration tests", status="todo", priority="medium", project_id=1, assignee="Jordan Lee", due_date="2024-02-20"),
            ]
            db.add_all(tasks_data)
            db.flush()

        if db.query(models.Workflow).count() == 0:
            workflows_data = [
                models.Workflow(name="New Employee Onboarding", description="Automated workflow for new hire setup", trigger="employee_created", status="active", runs=48),
                models.Workflow(name="Invoice Payment Reminder", description="Send reminders for overdue invoices", trigger="invoice_overdue", status="active", runs=124),
                models.Workflow(name="Lead Qualification Scoring", description="Auto-score leads based on engagement", trigger="lead_created", status="active", runs=89),
                models.Workflow(name="Weekly Performance Report", description="Generate and email weekly KPI reports", trigger="schedule_weekly", status="active", runs=36),
                models.Workflow(name="Low Stock Alert", description="Alert procurement when stock falls below threshold", trigger="stock_low", status="inactive", runs=12),
            ]
            db.add_all(workflows_data)
            db.flush()

        if db.query(models.Notification).count() == 0:
            notifications_data = [
                models.Notification(title="New Lead Assigned", message="Michael Grant from TechCorp has been assigned to you", type="info", read=False, link="/crm/leads"),
                models.Notification(title="Invoice Overdue", message="Invoice INV-001028 from Nexus Solutions is 10 days overdue", type="warning", read=False, link="/finance/invoices"),
                models.Notification(title="Project Milestone Reached", message="Data Analytics Pipeline is 88% complete", type="success", read=True, link="/projects"),
                models.Notification(title="New Employee Added", message="Ben Thompson has joined the Marketing team", type="info", read=True, link="/hrms"),
                models.Notification(title="Low Stock Alert", message="Office Desk Chair is out of stock", type="warning", read=False, link="/erp"),
                models.Notification(title="Deal Closed Won", message="Blue Wave Media deal worth $95K has been closed", type="success", read=True, link="/crm/deals"),
            ]
            db.add_all(notifications_data)
            db.flush()

        if db.query(models.AttendanceRecord).count() == 0:
            import datetime as dt
            today = dt.date.today()
            emps = db.query(models.Employee).all()
            for emp in emps[:5]:
                for i in range(5):
                    d = today - dt.timedelta(days=i)
                    db.add(models.AttendanceRecord(employee_id=emp.id, date=str(d), check_in="09:00", check_out="18:00", status="present"))

        if db.query(models.LeaveRequest).count() == 0:
            emps = db.query(models.Employee).all()
            if len(emps) >= 10:
                db.add(models.LeaveRequest(employee_id=emps[9].id, type="Sick Leave", start_date="2024-01-22", end_date="2024-01-24", status="approved", reason="Medical appointment"))
                db.add(models.LeaveRequest(employee_id=emps[1].id, type="Annual Leave", start_date="2024-02-05", end_date="2024-02-09", status="pending", reason="Family vacation"))
            jordan = db.query(models.Employee).filter(models.Employee.email == "employee@enterpriseos.com").first()
            if jordan:
                db.add(models.LeaveRequest(employee_id=jordan.id, type="Sick Leave", start_date="2024-01-10", end_date="2024-01-11", status="approved", reason="Flu recovery"))
                db.add(models.LeaveRequest(employee_id=jordan.id, type="Casual Leave", start_date="2024-02-14", end_date="2024-02-14", status="pending", reason="Personal errand"))

        if db.query(models.Purchase).count() == 0:
            purchases_data = [
                models.Purchase(vendor="TechSupply Co", product="Enterprise Server Pro", quantity=10, unit_price=4200, total=42000, date="2024-01-05", status="delivered"),
                models.Purchase(vendor="NetGear Pro", product="Network Switch 48-Port", quantity=5, unit_price=1100, total=5500, date="2024-01-08", status="delivered"),
                models.Purchase(vendor="Office World", product="Standing Desk", quantity=20, unit_price=800, total=16000, date="2024-01-12", status="pending"),
            ]
            db.add_all(purchases_data)

        if db.query(models.Milestone).count() == 0:
            milestones_data = [
                models.Milestone(title="Design System Complete", project_id=1, due_date="2024-01-31", status="completed"),
                models.Milestone(title="Beta Launch", project_id=1, due_date="2024-03-15", status="pending"),
                models.Milestone(title="iOS App Store Release", project_id=2, due_date="2024-02-28", status="pending"),
                models.Milestone(title="Pipeline Go-Live", project_id=3, due_date="2024-01-31", status="completed"),
            ]
            db.add_all(milestones_data)

        # ── NEW: Payslips ──────────────────────────────────────────────
        if db.query(models.Payslip).count() == 0:
            jordan = db.query(models.Employee).filter(models.Employee.email == "employee@enterpriseos.com").first()
            sarah = db.query(models.Employee).filter(models.Employee.email == "sarah.chen@co.com").first()
            months = ["2024-01", "2024-02", "2024-03", "2024-04", "2024-05", "2024-06"]
            for m in months:
                if jordan:
                    base = 8166.67
                    bonus = 500 if m in ["2024-03", "2024-06"] else 0
                    ded = base * 0.22
                    db.add(models.Payslip(employee_id=jordan.id, month=m, salary=base, deductions=ded, bonus=bonus, final_amount=base + bonus - ded, status="paid"))
                if sarah:
                    base = 12083.33
                    bonus = 1500 if m in ["2024-03", "2024-06"] else 0
                    ded = base * 0.24
                    db.add(models.Payslip(employee_id=sarah.id, month=m, salary=base, deductions=ded, bonus=bonus, final_amount=base + bonus - ded, status="paid"))

        # ── NEW: Announcements ──────────────────────────────────────────
        if db.query(models.Announcement).count() == 0:
            anns = [
                models.Announcement(title="Company Town Hall — June 20th", content="Join us for the quarterly all-hands meeting on June 20th at 3 PM EST. We'll cover Q2 results, product roadmap, and team recognitions. Zoom link will be shared 24hrs before.", type="meeting", pinned=True, created_by="Alex Morgan"),
                models.Announcement(title="Office Closed — Independence Day", content="The office will be closed on July 4th in observance of Independence Day. Remote employees should update their status in the system.", type="holiday", pinned=True, created_by="HR Team"),
                models.Announcement(title="New Health Insurance Benefits", content="We've upgraded our health insurance package effective July 1st. All employees will receive enhanced dental and vision coverage. Please review the updated benefits document in the Document Center.", type="hr_update", pinned=False, created_by="James Wilson"),
                models.Announcement(title="Q2 Revenue Milestone Achieved!", content="We've hit $2.4M in Q2 revenue, surpassing our target by 18%! This is a testament to the incredible work of our sales and engineering teams. Bonuses will be processed this month.", type="company_news", pinned=False, created_by="Alex Morgan"),
                models.Announcement(title="New Hire Orientation — June 17th", content="Please join us in welcoming 3 new team members joining the Engineering department on June 17th. The orientation will be held in Conference Room B from 9 AM.", type="hr_update", pinned=False, created_by="James Wilson"),
                models.Announcement(title="System Maintenance — June 15th 2-4 AM", content="Scheduled maintenance for the enterprise platform will occur on June 15th between 2 AM and 4 AM EST. The system will be temporarily unavailable during this window.", type="general", pinned=False, created_by="Sarah Chen"),
            ]
            db.add_all(anns)

        # ── NEW: Timesheets ─────────────────────────────────────────────
        if db.query(models.Timesheet).count() == 0:
            import datetime as dt
            jordan = db.query(models.Employee).filter(models.Employee.email == "employee@enterpriseos.com").first()
            today = dt.date.today()
            if jordan:
                for i in range(14):
                    d = today - dt.timedelta(days=i)
                    if d.weekday() < 5:
                        db.add(models.Timesheet(employee_id=jordan.id, project_id=1, date=str(d), hours=8.0, description="Development work on Platform Redesign", billable=True, status="approved" if i > 2 else "pending"))

        # ── NEW: Support Requests ───────────────────────────────────────
        if db.query(models.SupportRequest).count() == 0:
            jordan = db.query(models.Employee).filter(models.Employee.email == "employee@enterpriseos.com").first()
            if jordan:
                reqs = [
                    models.SupportRequest(employee_id=jordan.id, request_type="IT", title="Laptop running slow", description="My development laptop has been very slow recently. RAM usage is consistently at 95%. Requesting either a RAM upgrade or hardware replacement.", status="in_progress", priority="high"),
                    models.SupportRequest(employee_id=jordan.id, request_type="HR", title="Remote work equipment allowance", description="Requesting the standard $500 remote work equipment allowance as a new employee to purchase ergonomic accessories for my home office.", status="open", priority="medium"),
                    models.SupportRequest(employee_id=jordan.id, request_type="Reimbursement", title="Conference ticket reimbursement", description="Attended NodeConf on June 8th for professional development. Attached receipt for $350 registration fee.", status="resolved", priority="low"),
                ]
                db.add_all(reqs)

        # ── NEW: Documents ──────────────────────────────────────────────
        if db.query(models.Document).count() == 0:
            jordan = db.query(models.Employee).filter(models.Employee.email == "employee@enterpriseos.com").first()
            docs = [
                models.Document(title="Employee Handbook 2024", doc_type="policy", filename="employee_handbook_2024.pdf", size_kb=2048, uploaded_by="HR Team", is_company_doc=True),
                models.Document(title="Code of Conduct", doc_type="policy", filename="code_of_conduct.pdf", size_kb=512, uploaded_by="HR Team", is_company_doc=True),
                models.Document(title="Benefits Guide 2024", doc_type="policy", filename="benefits_guide_2024.pdf", size_kb=1024, uploaded_by="James Wilson", is_company_doc=True),
                models.Document(title="Remote Work Policy", doc_type="policy", filename="remote_work_policy.pdf", size_kb=256, uploaded_by="HR Team", is_company_doc=True),
                models.Document(title="IT Security Guidelines", doc_type="policy", filename="it_security_guidelines.pdf", size_kb=384, uploaded_by="Sarah Chen", is_company_doc=True),
                models.Document(title="Expense Reimbursement Policy", doc_type="policy", filename="expense_policy.pdf", size_kb=196, uploaded_by="Priya Patel", is_company_doc=True),
            ]
            if jordan:
                docs += [
                    models.Document(title="Offer Letter — Jordan Lee", doc_type="offer_letter", filename="offer_letter_jordan.pdf", size_kb=128, uploaded_by="HR Team", employee_id=jordan.id, is_company_doc=False),
                    models.Document(title="Employment Contract", doc_type="contract", filename="employment_contract_jordan.pdf", size_kb=320, uploaded_by="HR Team", employee_id=jordan.id, is_company_doc=False),
                ]
            db.add_all(docs)

        # ── NEW: Employee Profiles ──────────────────────────────────────
        if db.query(models.EmployeeProfile).count() == 0:
            emp_user = db.query(models.User).filter(models.User.email == "employee@enterpriseos.com").first()
            if emp_user:
                db.add(models.EmployeeProfile(
                    user_id=emp_user.id,
                    phone="+1-555-9988",
                    address="123 Oak Street, Remote City, CA 94102",
                    emergency_contact="Riley Lee",
                    emergency_phone="+1-555-9900",
                    skills="Python,TypeScript,React,FastAPI,PostgreSQL,Docker",
                    bio="Full-stack software engineer with 3 years of experience building enterprise applications. Passionate about clean code and developer experience.",
                ))

        # ── RBAC: Roles ─────────────────────────────────────────────────
        ROLE_DEFS = [
            ("Super Admin",       "Full unrestricted access to all modules and settings",   True),
            ("Admin",             "Full access to all modules; can manage users and data",  True),
            ("HR Manager",        "Manage employees, leave, attendance, and payroll",        True),
            ("Finance Manager",   "Access to finance, invoices, expenses, and payroll",     True),
            ("Project Manager",   "Manage projects, tasks, milestones, and timesheets",     True),
            ("Department Head",   "View and manage their department's employees and data",  True),
            ("Employee",          "Access to personal modules: leaves, payslips, profile",  True),
        ]
        if db.query(models.Role).count() == 0:
            for name, desc, is_sys in ROLE_DEFS:
                db.add(models.Role(name=name, description=desc, is_system=is_sys))
            db.flush()

        # ── RBAC: Permissions ───────────────────────────────────────────
        PERM_DEFS = [
            ("view_dashboard",    "View the main dashboard and KPI cards",          "dashboard"),
            ("manage_employees",  "Create, edit, and deactivate employee records",  "hrms"),
            ("approve_leave",     "Approve or reject employee leave requests",       "hrms"),
            ("manage_payroll",    "Access and process payslips and salary data",     "finance"),
            ("view_finance",      "View invoices, expenses, and financial reports",  "finance"),
            ("manage_projects",   "Create and manage projects, tasks, milestones",   "projects"),
            ("view_analytics",    "Access analytics dashboards and reports",         "analytics"),
            ("manage_settings",   "Manage system settings and user accounts",        "settings"),
        ]
        if db.query(models.Permission).count() == 0:
            for name, desc, module in PERM_DEFS:
                db.add(models.Permission(name=name, description=desc, module=module))
            db.flush()

        # ── RBAC: Role-Permission mapping ───────────────────────────────
        if db.query(models.RolePermission).count() == 0:
            ALL_PERMS = [p[0] for p in PERM_DEFS]
            ROLE_PERM_MAP = {
                "Super Admin":      ALL_PERMS,
                "Admin":            ALL_PERMS,
                "HR Manager":       ["view_dashboard", "manage_employees", "approve_leave", "manage_payroll", "view_analytics"],
                "Finance Manager":  ["view_dashboard", "manage_payroll", "view_finance", "view_analytics"],
                "Project Manager":  ["view_dashboard", "manage_projects", "view_analytics"],
                "Department Head":  ["view_dashboard", "manage_employees", "approve_leave", "view_analytics"],
                "Employee":         ["view_dashboard"],
            }
            roles_map = {r.name: r.id for r in db.query(models.Role).all()}
            perms_map = {p.name: p.id for p in db.query(models.Permission).all()}
            for role_name, perm_names in ROLE_PERM_MAP.items():
                role_id = roles_map.get(role_name)
                if not role_id:
                    continue
                for perm_name in perm_names:
                    perm_id = perms_map.get(perm_name)
                    if perm_id:
                        db.add(models.RolePermission(role_id=role_id, permission_id=perm_id))
            db.flush()

        # ── RBAC: Link existing users to their roles ────────────────────
        roles_map = {r.name: r.id for r in db.query(models.Role).all()}
        depts_map = {d.name: d.id for d in db.query(models.Department).all()}
        admin_user = db.query(models.User).filter(models.User.email == "admin@enterpriseos.com").first()
        if admin_user and not admin_user.role_id:
            admin_user.role_id = roles_map.get("Admin")
        emp_user = db.query(models.User).filter(models.User.email == "employee@enterpriseos.com").first()
        if emp_user and not emp_user.role_id:
            emp_user.role_id = roles_map.get("Employee")
            emp_user.department_id = depts_map.get("Engineering")

        # ── RBAC: Seed test users for each non-trivial role ─────────────
        db.flush()  # ensure prior inserts are visible to subsequent queries
        TEST_USERS = [
            # (name, email, password, role_str, role_name_in_db, dept_name)
            ("Sarah HR", "hr@enterpriseos.com", "hr1234", "hr_manager", "HR Manager", "HR"),
            ("Frank Finance", "finance@enterpriseos.com", "finance123", "finance_manager", "Finance Manager", "Finance"),
            ("Max Projects", "pm@enterpriseos.com", "pm1234", "project_manager", "Project Manager", "Engineering"),
            ("Super Admin", "superadmin@enterpriseos.com", "super123", "super_admin", "Super Admin", None),
        ]
        from sqlalchemy import text as _text
        existing_emails = {row[0] for row in db.execute(_text("SELECT email FROM users")).fetchall()}
        for name, email, password, role_str, role_name, dept_name in TEST_USERS:
            if email not in existing_emails:
                u = models.User(
                    name=name,
                    email=email,
                    hashed_password=get_password_hash(password),
                    role=role_str,
                    role_id=roles_map.get(role_name),
                    department_id=depts_map.get(dept_name) if dept_name else None,
                )
                db.add(u)
            else:
                # Ensure password is up-to-date on restarts (fixes previously seeded short passwords)
                existing = db.query(models.User).filter(models.User.email == email).first()
                if existing:
                    existing.hashed_password = get_password_hash(password)

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Seed error (non-fatal): {e}")
    finally:
        db.close()
