from pydantic import BaseModel
from typing import List, Optional


class MonthCount(BaseModel):
    month: str
    count: int


class LeaveTrendMonth(BaseModel):
    month: str
    approved: int
    rejected: int
    pending: int


class DeptHeadcount(BaseModel):
    department: str
    count: int


class HRAnalytics(BaseModel):
    active_employees: int
    on_leave_count: int
    pending_approvals: int
    avg_turnaround_days: float
    headcount_by_dept: List[DeptHeadcount]
    leave_trends: List[LeaveTrendMonth]


class InvoiceStatusItem(BaseModel):
    status: str
    count: int
    total: float


class ExpenseCategoryItem(BaseModel):
    category: str
    total: float


class RevenueMonth(BaseModel):
    month: str
    revenue: float


class FinanceAnalytics(BaseModel):
    total_paid: float
    total_outstanding: float
    revenue_by_month: List[RevenueMonth]
    expense_by_category: List[ExpenseCategoryItem]
    invoice_status_distribution: List[InvoiceStatusItem]


class DeptMetric(BaseModel):
    department: str
    employee_count: int
    leave_requests_30d: int
    activity_count_30d: int
    doc_uploads_30d: int


class DepartmentAnalytics(BaseModel):
    scope_dept: Optional[str]
    departments: List[DeptMetric]


class DailyActivity(BaseModel):
    date: str
    count: int


class TopActor(BaseModel):
    name: str
    count: int


class EntityBreakdown(BaseModel):
    entity_type: str
    count: int


class ActivityAnalytics(BaseModel):
    total_30d: int
    daily_activity: List[DailyActivity]
    top_actors: List[TopActor]
    entity_type_breakdown: List[EntityBreakdown]


class DocMonthUpload(BaseModel):
    month: str
    count: int


class DocCategoryItem(BaseModel):
    category: str
    count: int


class DocVisibilityItem(BaseModel):
    visibility: str
    count: int


class DocumentAnalytics(BaseModel):
    total_docs: int
    uploads_by_month: List[DocMonthUpload]
    category_distribution: List[DocCategoryItem]
    visibility_breakdown: List[DocVisibilityItem]
