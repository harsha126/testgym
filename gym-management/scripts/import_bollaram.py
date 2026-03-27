#!/usr/bin/env python3
"""
Import script for BOLLARAM FEES LIST Excel file.

Dependencies:
    pip install pandas openpyxl psycopg2-binary python-dotenv bcrypt

Usage:
    cd gym-management/scripts
    python3 import_bollaram.py           # live run
    python3 import_bollaram.py --dry-run # preview without committing
"""

import sys
import os
import argparse
from collections import Counter
from datetime import datetime, timedelta
from decimal import Decimal, InvalidOperation

import pandas as pd
import psycopg2
import bcrypt
from dotenv import dotenv_values

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(SCRIPT_DIR, "..", ".env")
EXCEL_PATH = os.path.join(SCRIPT_DIR, "..", "BOLLARAM FEES LIST (1).xlsx")
TODAY = datetime.today().date()

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
ph_counter = 0


def generate_placeholder() -> str:
    global ph_counter
    ph_counter += 1
    return f"PH{ph_counter:04d}"


def excel_serial_to_date(n):
    """Convert Excel date serial number to Python date."""
    try:
        return (datetime(1899, 12, 30) + timedelta(days=int(float(n)))).date()
    except (TypeError, ValueError):
        return None


def parse_date(val):
    """Parse a date value that may be a serial number, datetime, or string."""
    if val is None:
        return None
    try:
        if pd.isnull(val):
            return None
    except (TypeError, ValueError):
        pass
    if isinstance(val, datetime):
        return val.date()
    if hasattr(val, 'date') and callable(val.date):
        return val.date()
    try:
        f = float(val)
        if f > 1000:
            return excel_serial_to_date(f)
    except (TypeError, ValueError):
        pass
    try:
        return pd.to_datetime(str(val)).date()
    except Exception:
        return None


def parse_fee(val):
    """
    Returns (Decimal amount, bool is_pt).
    Strips '(PT)' annotation and handles float→int conversion.
    """
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return Decimal("0"), False
    s = str(val).strip()
    is_pt = "(PT)" in s.upper()
    s = s.upper().replace("(PT)", "").strip()
    # Remove trailing .0 from pandas float conversion
    if s.endswith(".0"):
        s = s[:-2]
    try:
        return Decimal(s), is_pt
    except InvalidOperation:
        return Decimal("0"), is_pt


def normalize_phone(val) -> str | None:
    """Normalise a phone value to a clean string, or None if blank."""
    if val is None:
        return None
    try:
        if pd.isnull(val):
            return None
    except (TypeError, ValueError):
        pass
    # pandas may read numbers as floats: 9876543210.0 → "9876543210"
    try:
        s = str(int(float(val)))
    except (ValueError, TypeError):
        s = str(val)
    s = s.strip().replace(" ", "").replace("-", "")
    # Handle comma-separated phones (take first one)
    if "," in s:
        s = s.split(",")[0].strip()
    # Truncate to 20 chars (DB limit)
    s = s[:20]
    return s if s else None


def normalize_gender(val) -> str | None:
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return None
    s = str(val).strip().upper()
    if s.startswith("M"):
        return "Male"
    if s.startswith("F"):
        return "Female"
    if s.startswith("C"):
        return "Couple"
    return None


def hash_password(raw: str) -> str:
    return bcrypt.hashpw(raw.encode(), bcrypt.gensalt(10)).decode()


def make_password(phone: str) -> str:
    """Last 4 chars of phone + 'gym'."""
    suffix = phone[-4:] if len(phone) >= 4 else phone
    return hash_password(suffix + "gym")


# ---------------------------------------------------------------------------
# DB helpers
# ---------------------------------------------------------------------------
def get_or_create_plan(cur, name: str) -> int:
    cur.execute("SELECT id FROM subscription_plans WHERE name = %s", (name,))
    row = cur.fetchone()
    if row:
        return row[0]
    cur.execute(
        """INSERT INTO subscription_plans (name, duration_days, price, is_custom, is_active)
           VALUES (%s, 30, 0, false, true) RETURNING id""",
        (name,),
    )
    return cur.fetchone()[0]


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main(dry_run: bool):
    # Load DB config
    env = dotenv_values(ENV_PATH)
    db_config = {
        "host": os.environ.get("PGHOST", "localhost"),
        "port": int(os.environ.get("PGPORT", 5432)),
        "dbname": env.get("POSTGRES_DB", "gymdb"),
        "user": env.get("POSTGRES_USER", "gymuser"),
        "password": env.get("POSTGRES_PASSWORD", "gympass"),
    }

    conn = psycopg2.connect(**db_config)
    cur = conn.cursor()

    # Ensure plans exist
    monthly_plan_id = get_or_create_plan(cur, "Monthly")
    pt_plan_id = get_or_create_plan(cur, "Personal Training")
    print(f"Plans: Monthly={monthly_plan_id}, Personal Training={pt_plan_id}")

    # Read Excel
    print(f"Reading {EXCEL_PATH}")
    df = pd.read_excel(EXCEL_PATH, header=0)

    # Expected columns by position:
    # 0=AddNo, 1=Active, 2=Name, 3=Sex, 4=Address, 5=MobileNo,
    # 6=MonthlyFees, 7=Mode, 8=PaymentDate, 9=NextPayment
    col_names = list(df.columns)
    print(f"Columns found ({len(col_names)}): {col_names[:10]}")

    # Normalise column access by position to avoid header name issues
    df.columns = range(len(df.columns))

    # Filter out completely empty rows (no Active, no Name, no Phone)
    def is_empty_row(row):
        def blank(val):
            return val is None or (isinstance(val, float) and pd.isna(val)) or str(val).strip() == ""

        return blank(row.get(1)) and blank(row.get(2)) and (
            normalize_phone(row.get(5)) is None
        )

    rows = [row for _, row in df.iterrows() if not is_empty_row(row)]
    print(f"Non-empty rows: {len(rows)}")

    # Group rows by phone
    phone_groups: dict[str, list] = {}
    no_phone_rows: list = []

    for row in rows:
        phone = normalize_phone(row.get(5))
        if not phone:
            no_phone_rows.append(row)
        else:
            phone_groups.setdefault(phone, []).append(row)

    # Each no-phone row gets its own placeholder group
    for row in no_phone_rows:
        ph = generate_placeholder()
        phone_groups[ph] = [row]

    print(f"User groups: {len(phone_groups)} "
          f"(unique phones: {len(phone_groups) - len(no_phone_rows)}, "
          f"placeholders: {len(no_phone_rows)})")

    # Stats
    stats = {"users_created": 0, "subs_created": 0, "payments_created": 0,
             "skipped": 0, "errors": []}

    for phone, group_rows in phone_groups.items():
        cur.execute("SAVEPOINT sp_user")
        try:
            # Determine user fields
            names = [str(r.get(2)).strip() for r in group_rows
                     if r.get(2) is not None and not (isinstance(r.get(2), float) and pd.isna(r.get(2)))
                     and str(r.get(2)).strip()]
            name = Counter(names).most_common(1)[0][0] if names else None

            genders = [normalize_gender(r.get(3)) for r in group_rows]
            gender = next((g for g in genders if g), None)

            active_flags = [str(r.get(1)).strip().upper() for r in group_rows
                            if r.get(1) is not None and not (isinstance(r.get(1), float) and pd.isna(r.get(1)))]
            is_active = not all(f == "D" for f in active_flags) if active_flags else True

            # Idempotency: skip if phone already in DB
            cur.execute("SELECT id FROM users WHERE phone = %s", (phone,))
            if cur.fetchone():
                print(f"  SKIP (exists): {phone}")
                stats["skipped"] += 1
                continue

            # INSERT user
            password_hash = make_password(phone)
            cur.execute(
                """INSERT INTO users (name, phone, password, role, is_active, gender, created_at, updated_at)
                   VALUES (%s, %s, %s, 'USER', %s, %s, NOW(), NOW()) RETURNING id""",
                (name, phone, password_hash, is_active, gender),
            )
            user_id = cur.fetchone()[0]
            stats["users_created"] += 1

            # Sort rows by payment date
            def row_date(r):
                d = parse_date(r.get(8))
                return d or datetime.min.date()

            sorted_rows = sorted(group_rows, key=row_date)

            for i, row in enumerate(sorted_rows):
                start_date = parse_date(row.get(8))
                end_date = parse_date(row.get(9))
                amount, is_pt = parse_fee(row.get(6))
                address = str(row.get(4)).strip() if row.get(4) is not None and not (isinstance(row.get(4), float) and pd.isna(row.get(4))) else None

                # Determine status
                is_last = (i == len(sorted_rows) - 1)
                if not is_active:
                    status = "EXPIRED"
                elif is_last:
                    status = "ACTIVE" if (end_date and end_date >= TODAY) else "EXPIRED"
                else:
                    status = "EXPIRED"

                plan_id = pt_plan_id if is_pt else monthly_plan_id

                # Use safe defaults for missing dates
                if not start_date:
                    start_date = TODAY
                if not end_date:
                    end_date = start_date + timedelta(days=30)

                cur.execute(
                    """INSERT INTO user_subscriptions (user_id, plan_id, start_date, end_date, status, notes, created_at)
                       VALUES (%s, %s, %s, %s, %s, %s, NOW()) RETURNING id""",
                    (user_id, plan_id, start_date, end_date, status, address),
                )
                sub_id = cur.fetchone()[0]
                stats["subs_created"] += 1

                cur.execute(
                    """INSERT INTO payments (user_id, subscription_id, amount, payment_date, payment_method, created_at)
                       VALUES (%s, %s, %s, %s, 'CASH', NOW())""",
                    (user_id, sub_id, float(amount), start_date),
                )
                stats["payments_created"] += 1

        except Exception as e:
            stats["errors"].append(f"phone={phone}: {e}")
            print(f"  ERROR phone={phone}: {e}")
            cur.execute("ROLLBACK TO SAVEPOINT sp_user")
            continue

    if dry_run:
        print("\n--- DRY RUN: rolling back ---")
        conn.rollback()
    else:
        conn.commit()
        print("\n--- Changes committed ---")

    cur.close()
    conn.close()

    print("\n=== Summary ===")
    print(f"  Users created:         {stats['users_created']}")
    print(f"  Subscriptions created: {stats['subs_created']}")
    print(f"  Payments created:      {stats['payments_created']}")
    print(f"  Skipped (exists):      {stats['skipped']}")
    print(f"  Errors:                {len(stats['errors'])}")
    if stats["errors"]:
        print("\nError details:")
        for e in stats["errors"]:
            print(f"  {e}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Import Bollaram Excel data")
    parser.add_argument("--dry-run", action="store_true",
                        help="Parse and preview without committing to DB")
    args = parser.parse_args()
    main(dry_run=args.dry_run)
