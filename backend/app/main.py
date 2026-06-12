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


@app.get("/api/healthz")
def health_check():
    return {"status": "ok"}


@app.on_event("startup")
def startup():
    create_tables()
    # Seed default data if empty
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        from app import models
        from app.core.security import get_password_hash
        from datetime import datetime

        if db.query(models.User).count() == 0:
            admin = models.User(name="Alex Morgan", email="admin@enterpriseos.com", hashed_password=get_password_hash("admin123"), role="admin")
            db.add(admin)
            db.flush()

        # Seed employee user if missing (idempotent)
        if not db.query(models.User).filter(models.User.email == "employee@enterpriseos.com").first():
            emp_user = models.User(name="Jordan Lee", email="employee@enterpriseos.com", hashed_password=get_password_hash("employee123"), role="employee")
            db.add(emp_user)
            db.flush()

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

        if db.query(models.Employee).count() == 0:
            employees = [
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
            ]
            db.add_all(employees)
            db.flush()

        if db.query(models.Lead).count() == 0:
            leads = [
                models.Lead(name="Michael Grant", company="TechCorp Inc", email="mgrant@techcorp.com", stage="proposal", value=85000, status="qualified", assigned_to="Marcus Johnson"),
                models.Lead(name="Jennifer Walsh", company="DataFlow Systems", email="jwalsh@dataflow.com", stage="negotiation", value=142000, status="hot", assigned_to="Marcus Johnson"),
                models.Lead(name="Robert Chen", company="Nexus Solutions", email="rchen@nexus.com", stage="prospecting", value=52000, status="new", assigned_to="Ana Rodriguez"),
                models.Lead(name="Diana Prince", company="Apex Ventures", email="dprince@apex.com", stage="qualified", value=210000, status="qualified", assigned_to="Marcus Johnson"),
                models.Lead(name="Kevin Santos", company="Blue Wave Media", email="ksantos@bluewave.com", stage="closed_won", value=95000, status="won", assigned_to="Ana Rodriguez"),
                models.Lead(name="Lisa Monroe", company="Synergy Corp", email="lmonroe@synergy.com", stage="closed_lost", value=60000, status="lost", assigned_to="Ana Rodriguez"),
            ]
            db.add_all(leads)
            db.flush()

        if db.query(models.Contact).count() == 0:
            contacts = [
                models.Contact(name="Michael Grant", email="mgrant@techcorp.com", company="TechCorp Inc", role="CTO", phone="+1-555-0101"),
                models.Contact(name="Jennifer Walsh", email="jwalsh@dataflow.com", company="DataFlow Systems", role="CEO", phone="+1-555-0102"),
                models.Contact(name="Diana Prince", email="dprince@apex.com", company="Apex Ventures", role="VP Product", phone="+1-555-0103"),
                models.Contact(name="Kevin Santos", email="ksantos@bluewave.com", company="Blue Wave Media", role="Head of Marketing", phone="+1-555-0104"),
            ]
            db.add_all(contacts)
            db.flush()

        if db.query(models.Deal).count() == 0:
            deals = [
                models.Deal(title="TechCorp Enterprise License", contact="Michael Grant", company="TechCorp Inc", value=85000, stage="proposal", probability=65, close_date="2024-02-28", assigned_to="Marcus Johnson"),
                models.Deal(title="DataFlow Annual Contract", contact="Jennifer Walsh", company="DataFlow Systems", value=142000, stage="negotiation", probability=80, close_date="2024-01-31", assigned_to="Marcus Johnson"),
                models.Deal(title="Apex Platform Deal", contact="Diana Prince", company="Apex Ventures", value=210000, stage="qualified", probability=40, close_date="2024-03-15", assigned_to="Marcus Johnson"),
                models.Deal(title="Blue Wave Subscription", contact="Kevin Santos", company="Blue Wave Media", value=95000, stage="closed_won", probability=100, close_date="2024-01-15", assigned_to="Ana Rodriguez"),
            ]
            db.add_all(deals)
            db.flush()

        if db.query(models.Product).count() == 0:
            products = [
                models.Product(name="Enterprise Server Pro", category="Hardware", sku="HW-001", stock=45, unit_price=4500, status="active", vendor="TechSupply Co"),
                models.Product(name="Network Switch 48-Port", category="Hardware", sku="HW-002", stock=8, unit_price=1200, status="active", vendor="NetGear Pro"),
                models.Product(name="SaaS Analytics Suite", category="Software", sku="SW-001", stock=500, unit_price=299, status="active"),
                models.Product(name="Security Scanner Pro", category="Software", sku="SW-002", stock=200, unit_price=599, status="active"),
                models.Product(name="Office Desk Chair", category="Furniture", sku="FN-001", stock=0, unit_price=450, status="out_of_stock"),
                models.Product(name="Standing Desk", category="Furniture", sku="FN-002", stock=12, unit_price=850, status="active"),
            ]
            db.add_all(products)
            db.flush()

        if db.query(models.Vendor).count() == 0:
            vendors = [
                models.Vendor(name="TechSupply Co", email="orders@techsupply.com", phone="+1-555-2001", status="active", category="Hardware"),
                models.Vendor(name="NetGear Pro", email="sales@netgearpro.com", phone="+1-555-2002", status="active", category="Networking"),
                models.Vendor(name="Office World", email="b2b@officeworld.com", phone="+1-555-2003", status="active", category="Office Supplies"),
                models.Vendor(name="CloudBase Solutions", email="enterprise@cloudbase.io", phone="+1-555-2004", status="active", category="Cloud Services"),
            ]
            db.add_all(vendors)
            db.flush()

        if db.query(models.Invoice).count() == 0:
            import random, string
            invoices = [
                models.Invoice(invoice_number="INV-001024", client="TechCorp Inc", amount=85000, status="paid", issue_date="2024-01-01", due_date="2024-01-31", description="Enterprise License Q1"),
                models.Invoice(invoice_number="INV-001025", client="DataFlow Systems", amount=42000, status="sent", issue_date="2024-01-10", due_date="2024-02-10", description="Platform Subscription"),
                models.Invoice(invoice_number="INV-001026", client="Apex Ventures", amount=28500, status="draft", issue_date="2024-01-15", due_date="2024-02-15", description="Consulting Services"),
                models.Invoice(invoice_number="INV-001027", client="Blue Wave Media", amount=95000, status="paid", issue_date="2023-12-01", due_date="2023-12-31", description="Annual Contract"),
                models.Invoice(invoice_number="INV-001028", client="Nexus Solutions", amount=15000, status="overdue", issue_date="2023-12-15", due_date="2024-01-05", description="Support Package"),
            ]
            db.add_all(invoices)
            db.flush()

        if db.query(models.Expense).count() == 0:
            expenses = [
                models.Expense(title="AWS Infrastructure", amount=12400, category="Technology", date="2024-01-01", status="approved", submitted_by="Sarah Chen"),
                models.Expense(title="Office Rent - January", amount=18500, category="Office", date="2024-01-01", status="approved", submitted_by="Tom Baker"),
                models.Expense(title="Team Offsite - SF", amount=8200, category="Travel", date="2024-01-08", status="approved", submitted_by="Emma Davis"),
                models.Expense(title="Marketing Campaign Q1", amount=25000, category="Marketing", date="2024-01-10", status="pending", submitted_by="Emma Davis"),
                models.Expense(title="Legal Consulting", amount=5500, category="Professional Services", date="2024-01-12", status="pending", submitted_by="Priya Patel"),
                models.Expense(title="Software Licenses", amount=7800, category="Technology", date="2024-01-15", status="approved", submitted_by="Sarah Chen"),
            ]
            db.add_all(expenses)
            db.flush()

        if db.query(models.Project).count() == 0:
            projects = [
                models.Project(name="Platform Redesign 2024", description="Complete overhaul of the enterprise platform UI/UX", status="active", progress=45, start_date="2024-01-01", end_date="2024-04-30", manager="Sarah Chen", priority="high"),
                models.Project(name="Mobile App Launch", description="Native iOS and Android enterprise app", status="active", progress=72, start_date="2023-11-01", end_date="2024-02-28", manager="David Kim", priority="high"),
                models.Project(name="Data Analytics Pipeline", description="Real-time data processing and reporting infrastructure", status="active", progress=88, start_date="2023-10-15", end_date="2024-01-31", manager="Lisa Park", priority="medium"),
                models.Project(name="Sales CRM Integration", description="Integrate third-party CRM with internal systems", status="planning", progress=15, start_date="2024-02-01", end_date="2024-05-31", manager="Marcus Johnson", priority="medium"),
            ]
            db.add_all(projects)
            db.flush()

        if db.query(models.Task).count() == 0:
            tasks = [
                models.Task(title="Design system component library", status="done", priority="high", project_id=1, assignee="David Kim", due_date="2024-01-20"),
                models.Task(title="Implement dashboard analytics module", status="in_progress", priority="high", project_id=1, assignee="Lisa Park", due_date="2024-02-05"),
                models.Task(title="API performance optimization", status="in_progress", priority="medium", project_id=1, assignee="Sarah Chen", due_date="2024-02-10"),
                models.Task(title="Mobile onboarding flow", status="todo", priority="high", project_id=2, assignee="David Kim", due_date="2024-02-15"),
                models.Task(title="Push notification integration", status="in_progress", priority="medium", project_id=2, assignee="David Kim", due_date="2024-02-20"),
                models.Task(title="Data pipeline unit tests", status="done", priority="low", project_id=3, assignee="Lisa Park", due_date="2024-01-25"),
                models.Task(title="Set up ETL infrastructure", status="done", priority="high", project_id=3, assignee="Sarah Chen", due_date="2024-01-15"),
                models.Task(title="CRM API contract review", status="todo", priority="medium", project_id=4, assignee="Marcus Johnson", due_date="2024-02-28"),
            ]
            db.add_all(tasks)
            db.flush()

        if db.query(models.Workflow).count() == 0:
            workflows = [
                models.Workflow(name="New Employee Onboarding", description="Automated workflow for new hire setup", trigger="employee_created", status="active", runs=48),
                models.Workflow(name="Invoice Payment Reminder", description="Send reminders for overdue invoices", trigger="invoice_overdue", status="active", runs=124),
                models.Workflow(name="Lead Qualification Scoring", description="Auto-score leads based on engagement", trigger="lead_created", status="active", runs=89),
                models.Workflow(name="Weekly Performance Report", description="Generate and email weekly KPI reports", trigger="schedule_weekly", status="active", runs=36),
                models.Workflow(name="Low Stock Alert", description="Alert procurement when stock falls below threshold", trigger="stock_low", status="inactive", runs=12),
            ]
            db.add_all(workflows)
            db.flush()

        if db.query(models.Notification).count() == 0:
            notifications = [
                models.Notification(title="New Lead Assigned", message="Michael Grant from TechCorp has been assigned to you", type="info", read=False, link="/crm/leads"),
                models.Notification(title="Invoice Overdue", message="Invoice INV-001028 from Nexus Solutions is 10 days overdue", type="warning", read=False, link="/finance/invoices"),
                models.Notification(title="Project Milestone Reached", message="Data Analytics Pipeline is 88% complete", type="success", read=True, link="/projects"),
                models.Notification(title="New Employee Added", message="Ben Thompson has joined the Marketing team", type="info", read=True, link="/hrms"),
                models.Notification(title="Low Stock Alert", message="Office Desk Chair is out of stock", type="warning", read=False, link="/erp"),
                models.Notification(title="Deal Closed Won", message="Blue Wave Media deal worth $95K has been closed", type="success", read=True, link="/crm/deals"),
            ]
            db.add_all(notifications)
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
            if emps:
                db.add(models.LeaveRequest(employee_id=emps[9].id, type="Sick Leave", start_date="2024-01-22", end_date="2024-01-24", status="approved", reason="Medical appointment"))
                db.add(models.LeaveRequest(employee_id=emps[1].id, type="Annual Leave", start_date="2024-02-05", end_date="2024-02-09", status="pending", reason="Family vacation"))

        if db.query(models.Purchase).count() == 0:
            purchases = [
                models.Purchase(vendor="TechSupply Co", product="Enterprise Server Pro", quantity=10, unit_price=4200, total=42000, date="2024-01-05", status="delivered"),
                models.Purchase(vendor="NetGear Pro", product="Network Switch 48-Port", quantity=5, unit_price=1100, total=5500, date="2024-01-08", status="delivered"),
                models.Purchase(vendor="Office World", product="Standing Desk", quantity=20, unit_price=800, total=16000, date="2024-01-12", status="pending"),
            ]
            db.add_all(purchases)

        if db.query(models.Milestone).count() == 0:
            milestones = [
                models.Milestone(title="Design System Complete", project_id=1, due_date="2024-01-31", status="completed"),
                models.Milestone(title="Beta Launch", project_id=1, due_date="2024-03-15", status="pending"),
                models.Milestone(title="iOS App Store Release", project_id=2, due_date="2024-02-28", status="pending"),
                models.Milestone(title="Pipeline Go-Live", project_id=3, due_date="2024-01-31", status="completed"),
            ]
            db.add_all(milestones)

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Seed error (non-fatal): {e}")
    finally:
        db.close()
