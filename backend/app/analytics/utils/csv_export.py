import csv
import io
from typing import List, Dict, Any


def dicts_to_csv(rows: List[Dict[str, Any]], fieldnames: List[str] = None) -> str:
    """Convert a list of dicts to a CSV string."""
    if not rows:
        return ""
    if fieldnames is None:
        fieldnames = list(rows[0].keys())
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(rows)
    return buf.getvalue()
