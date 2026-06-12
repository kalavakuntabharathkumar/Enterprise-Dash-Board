import csv
import io
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.core.security import get_admin_user

router = APIRouter(prefix="/export", tags=["export"])


def csv_response(rows: list[dict], filename: str) -> StreamingResponse:
    if not rows:
        rows = [{}]
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=rows[0].keys())
    writer.writeheader()
    writer.writerows(rows)
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/employees")
def export_employees(db: Session = Depends(get_db), _=Depends(get_admin_user)):
    employees = db.query(models.Employee).all()
    rows = [
        {
            "ID": e.id, "Name": e.name, "Email": e.email, "Phone": e.phone or "",
            "Department": e.department, "Position": e.position, "Status": e.status,
            "Salary": e.salary or "", "Joined Date": e.joined_date, "Location": e.location or "",
        }
        for e in employees
    ]
    return csv_response(rows, "employees.csv")


@router.get("/leads")
def export_leads(db: Session = Depends(get_db), _=Depends(get_admin_user)):
    leads = db.query(models.Lead).all()
    rows = [
        {
            "ID": l.id, "Name": l.name, "Company": l.company, "Email": l.email,
            "Phone": l.phone or "", "Stage": l.stage, "Status": l.status,
            "Value": l.value, "Assigned To": l.assigned_to or "", "Created At": str(l.created_at),
        }
        for l in leads
    ]
    return csv_response(rows, "leads.csv")


@router.get("/attendance")
def export_attendance(db: Session = Depends(get_db), _=Depends(get_admin_user)):
    records = db.query(models.AttendanceRecord).all()
    rows = [
        {
            "ID": r.id, "Employee ID": r.employee_id, "Date": r.date,
            "Check In": r.check_in or "", "Check Out": r.check_out or "", "Status": r.status,
        }
        for r in records
    ]
    return csv_response(rows, "attendance.csv")


@router.get("/contacts")
def export_contacts(db: Session = Depends(get_db), _=Depends(get_admin_user)):
    contacts = db.query(models.Contact).all()
    rows = [
        {
            "ID": c.id, "Name": c.name, "Email": c.email, "Phone": c.phone or "",
            "Company": c.company, "Role": c.role or "", "Created At": str(c.created_at),
        }
        for c in contacts
    ]
    return csv_response(rows, "contacts.csv")
