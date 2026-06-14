from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(Text, nullable=True)
    is_system = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Permission(Base):
    __tablename__ = "permissions"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(Text, nullable=True)
    module = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class RolePermission(Base):
    __tablename__ = "role_permissions"
    id = Column(Integer, primary_key=True, index=True)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    permission_id = Column(Integer, ForeignKey("permissions.id"), nullable=False)


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user")
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    avatar = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Employee(Base):
    __tablename__ = "employees"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=True)
    department = Column(String, nullable=False)
    position = Column(String, nullable=False)
    status = Column(String, default="active")
    salary = Column(Float, nullable=True)
    joined_date = Column(String, nullable=False)
    avatar = Column(String, nullable=True)
    location = Column(String, nullable=True)


class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    head = Column(String, nullable=True)
    description = Column(Text, nullable=True)


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    date = Column(String, nullable=False)
    check_in = Column(String, nullable=True)
    check_out = Column(String, nullable=True)
    status = Column(String, default="present")


class LeaveRequest(Base):
    __tablename__ = "leave_requests"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    type = Column(String, nullable=False)
    start_date = Column(String, nullable=False)
    end_date = Column(String, nullable=False)
    status = Column(String, default="pending_department")
    reason = Column(Text, nullable=False)
    current_approver_role = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)


class Lead(Base):
    __tablename__ = "leads"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    company = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    status = Column(String, default="new")
    stage = Column(String, default="prospecting")
    value = Column(Float, default=0)
    assigned_to = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Contact(Base):
    __tablename__ = "contacts"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    company = Column(String, nullable=False)
    role = Column(String, nullable=True)
    avatar = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Deal(Base):
    __tablename__ = "deals"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    contact = Column(String, nullable=False)
    company = Column(String, nullable=True)
    value = Column(Float, default=0)
    stage = Column(String, default="prospecting")
    probability = Column(Float, nullable=True)
    close_date = Column(String, nullable=False)
    assigned_to = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    sku = Column(String, unique=True, nullable=False)
    stock = Column(Integer, default=0)
    unit_price = Column(Float, nullable=False)
    status = Column(String, default="active")
    description = Column(Text, nullable=True)
    vendor = Column(String, nullable=True)


class Vendor(Base):
    __tablename__ = "vendors"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    status = Column(String, default="active")
    category = Column(String, nullable=True)


class Purchase(Base):
    __tablename__ = "purchases"
    id = Column(Integer, primary_key=True, index=True)
    vendor = Column(String, nullable=False)
    product = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    total = Column(Float, nullable=False)
    date = Column(String, nullable=False)
    status = Column(String, default="pending")


class Invoice(Base):
    __tablename__ = "invoices"
    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String, unique=True, nullable=False)
    client = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String, default="draft")
    issue_date = Column(String, nullable=False)
    due_date = Column(String, nullable=False)
    description = Column(Text, nullable=True)


class Expense(Base):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    category = Column(String, nullable=False)
    date = Column(String, nullable=False)
    status = Column(String, default="pending")
    description = Column(Text, nullable=True)
    submitted_by = Column(String, nullable=True)


class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default="active")
    progress = Column(Integer, default=0)
    start_date = Column(String, nullable=False)
    end_date = Column(String, nullable=False)
    manager = Column(String, nullable=True)
    priority = Column(String, default="medium")


class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default="todo")
    priority = Column(String, default="medium")
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    assignee = Column(String, nullable=True)
    due_date = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Milestone(Base):
    __tablename__ = "milestones"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    due_date = Column(String, nullable=False)
    status = Column(String, default="pending")
    description = Column(Text, nullable=True)


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    target_role = Column(String, nullable=True)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String, default="info")
    read = Column(Boolean, default=False)
    link = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Workflow(Base):
    __tablename__ = "workflows"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    trigger = Column(String, nullable=False)
    status = Column(String, default="active")
    runs = Column(Integer, default=0)
    last_run = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    steps = relationship("WorkflowStep", back_populates="workflow", cascade="all, delete-orphan", order_by="WorkflowStep.step_order")
    run_records = relationship("WorkflowRun", back_populates="workflow", cascade="all, delete-orphan")


class WorkflowStep(Base):
    __tablename__ = "workflow_steps"
    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id"), nullable=False)
    step_order = Column(Integer, nullable=False, default=0)
    action_type = Column(String, nullable=False)
    target = Column(String, nullable=False)
    delay_minutes = Column(Integer, default=0)
    workflow = relationship("Workflow", back_populates="steps")


class WorkflowRun(Base):
    __tablename__ = "workflow_runs"
    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id"), nullable=False)
    status = Column(String, nullable=False, default="completed")  # running | completed | failed
    started_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    duration_ms = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)
    workflow = relationship("Workflow", back_populates="run_records")
    logs = relationship("WorkflowExecutionLog", back_populates="run", cascade="all, delete-orphan")


class WorkflowExecutionLog(Base):
    __tablename__ = "workflow_execution_logs"
    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(Integer, ForeignKey("workflow_runs.id"), nullable=False)
    step_order = Column(Integer, nullable=False)
    action_type = Column(String, nullable=False)
    target = Column(String, nullable=True)
    status = Column(String, nullable=False)  # success | failed | skipped
    message = Column(Text, nullable=True)
    executed_at = Column(DateTime, default=datetime.utcnow)
    run = relationship("WorkflowRun", back_populates="logs")


# ── NEW MODELS ────────────────────────────────────────────────────────────────

class Payslip(Base):
    __tablename__ = "payslips"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    month = Column(String, nullable=False)
    salary = Column(Float, nullable=False)
    deductions = Column(Float, default=0)
    bonus = Column(Float, default=0)
    final_amount = Column(Float, nullable=False)
    status = Column(String, default="paid")
    generated_at = Column(DateTime, default=datetime.utcnow)


class EmployeeProfile(Base):
    __tablename__ = "employee_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    phone = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    emergency_contact = Column(String, nullable=True)
    emergency_phone = Column(String, nullable=True)
    skills = Column(Text, nullable=True)
    bio = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow)


class Announcement(Base):
    __tablename__ = "announcements"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    type = Column(String, default="general")
    pinned = Column(Boolean, default=False)
    created_by = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Timesheet(Base):
    __tablename__ = "timesheets"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    date = Column(String, nullable=False)
    hours = Column(Float, nullable=False)
    description = Column(Text, nullable=True)
    billable = Column(Boolean, default=True)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)


class SupportRequest(Base):
    __tablename__ = "support_requests"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    request_type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String, default="open")
    priority = Column(String, default="medium")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)


class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    doc_type = Column(String, nullable=False)
    filename = Column(String, nullable=False)
    size_kb = Column(Integer, default=0)
    uploaded_by = Column(String, nullable=True)
    uploaded_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    is_company_doc = Column(Boolean, default=False)
    # DMS extended fields
    category = Column(String, nullable=True, default="General")
    visibility = Column(String, nullable=False, default="private")
    description = Column(Text, nullable=True)
    department = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class DocumentAccess(Base):
    """Explicit per-user document sharing grants."""
    __tablename__ = "document_access"
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    user_id = Column(Integer, nullable=False)
    access_type = Column(String, default="view")   # "view" | "edit"
    granted_by = Column(Integer, nullable=True)
    granted_at = Column(DateTime, default=datetime.utcnow)


# ── Workflow Engine ────────────────────────────────────────────────────────────

class WorkflowLog(Base):
    """Immutable audit trail for every workflow state transition."""
    __tablename__ = "workflow_logs"
    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String, nullable=False)        # e.g. "leave_request"
    entity_id = Column(Integer, nullable=False)
    action = Column(String, nullable=False)             # "submitted" | "approved_stage1" | "approved_final" | "rejected"
    performed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    performed_by_name = Column(String, nullable=True)
    role = Column(String, nullable=True)                # actor's role string
    comments = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)


class ActivityLog(Base):
    """System-wide activity feed — one row per significant user action."""
    __tablename__ = "activity_logs"
    id = Column(Integer, primary_key=True, index=True)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    actor_name = Column(String, nullable=True)
    actor_role = Column(String, nullable=True)
    action = Column(String, nullable=False)
    entity_type = Column(String, nullable=True)
    entity_id = Column(Integer, nullable=True)
    description = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
