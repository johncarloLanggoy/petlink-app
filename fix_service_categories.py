# fix_service_categories.py
# ── ONE-TIME DATABASE FIX ─────────────────────────────────────────
# Inaayos ang service_category column ng services table
# Base sa pangalan ng service, awtomatikong nade-detect kung vet o staff

import sqlite3
import json
from datetime import datetime

DB_FILE = "secure_auth.db"

def fix_service_categories():
    """I-update ang service_category base sa pangalan ng service"""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    
    print("=" * 80)
    print("🔧 FIXING SERVICE CATEGORIES")
    print("=" * 80)
    print(f"📅 Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # ── Step 1: Check current state ────────────────────────────────
    print("📊 CURRENT STATE:")
    print("-" * 80)
    
    total = conn.execute("SELECT COUNT(*) as c FROM services").fetchone()['c']
    vet_count = conn.execute(
        "SELECT COUNT(*) as c FROM services WHERE service_category = 'vet'"
    ).fetchone()['c']
    staff_count = conn.execute(
        "SELECT COUNT(*) as c FROM services WHERE service_category = 'staff'"
    ).fetchone()['c']
    null_count = conn.execute(
        "SELECT COUNT(*) as c FROM services WHERE service_category IS NULL OR service_category = ''"
    ).fetchone()['c']
    
    print(f"  Total services:    {total}")
    print(f"  Vet services:      {vet_count}")
    print(f"  Staff services:    {staff_count}")
    print(f"  NULL/empty:        {null_count}")
    print()
    
    # ── Step 2: Determine category per service ─────────────────────
    print("🔍 ANALYZING SERVICES:")
    print("-" * 80)
    
    # Keywords para sa vet services (case-insensitive matching)
    VET_KEYWORDS = [
        # General vet
        'vaccination', 'vaccine', 'health check', 'check-up', 'checkup',
        'deworming', 'consultation', 'medical', 'treatment',
        # Diseases / Tests
        'heartworm', 'rabies', 'distemper', 'parvo', 'kennel cough',
        'fleas', 'tick', 'dental', 'allergy test', 'blood test',
        'x-ray', 'xray', 'surgery', 'spay', 'neuter', 'microchip',
        'senior wellness', 'iv fluid', 'wound dressing',
        'ear infection', 'eye infection', 'skin infection',
        'health certificate', 'emergency',
        # Species-specific
        'dog vaccination', 'cat vaccination', 'dog heartworm', 'cat heartworm',
        'dog surgery', 'cat surgery', 'dog dental', 'cat dental',
    ]
    
    # Staff keywords
    STAFF_KEYWORDS = [
        'bath', 'brush', 'grooming', 'groom', 'nail trim',
        'de-shedding', 'deshedding', 'styling', 'ear cleaning',
        'teeth cleaning', 'flea & tick treatment' # NOTE: ito ay grooming kung staff
    ]
    
    services = conn.execute("""
        SELECT id, name, service_category 
        FROM services 
        ORDER BY name
    """).fetchall()
    
    updated = 0
    for svc in services:
        name_lower = svc['name'].lower()
        current_cat = (svc['service_category'] or '').strip().lower()
        
        # Skip kung may tamang category na
        if current_cat in ('vet', 'staff'):
            continue
        
        # Auto-detect base sa keywords
        detected_cat = None
        
        # Check vet keywords first (priority)
        for kw in VET_KEYWORDS:
            if kw in name_lower:
                detected_cat = 'vet'
                break
        
        # Kung walang vet keyword, check staff keywords
        if not detected_cat:
            for kw in STAFF_KEYWORDS:
                if kw in name_lower:
                    detected_cat = 'staff'
                    break
        
        # Default to 'staff' kung walang match
        if not detected_cat:
            detected_cat = 'staff'
        
        # Update
        conn.execute(
            "UPDATE services SET service_category = ? WHERE id = ?",
            (detected_cat, svc['id'])
        )
        updated += 1
        print(f"  ✅ [{detected_cat:6}] {svc['name']}")
    
    conn.commit()
    
    # ── Step 3: Verify ─────────────────────────────────────────────
    print()
    print("=" * 80)
    print("📊 AFTER FIX:")
    print("=" * 80)
    
    vet_after = conn.execute(
        "SELECT COUNT(*) as c FROM services WHERE service_category = 'vet'"
    ).fetchone()['c']
    staff_after = conn.execute(
        "SELECT COUNT(*) as c FROM services WHERE service_category = 'staff'"
    ).fetchone()['c']
    null_after = conn.execute(
        "SELECT COUNT(*) as c FROM services WHERE service_category IS NULL OR service_category = ''"
    ).fetchone()['c']
    
    print(f"  Vet services:      {vet_after}")
    print(f"  Staff services:    {staff_after}")
    print(f"  NULL/empty:        {null_after}")
    print(f"  Updated:           {updated}")
    print()
    
    # ── Step 4: Show vet services ──────────────────────────────────
    print("=" * 80)
    print("🐾 VET SERVICES (lalabas sa Today's Patients):")
    print("=" * 80)
    
    vet_services = conn.execute("""
        SELECT name FROM services 
        WHERE service_category = 'vet' AND is_active = 1
        ORDER BY name
    """).fetchall()
    
    for i, svc in enumerate(vet_services, 1):
        print(f"  {i:3}. {svc['name']}")
    
    print()
    
    # ── Step 5: Show active appointments analysis ─────────────────
    print("=" * 80)
    print("📋 TODAY'S CONFIRMED APPOINTMENTS ANALYSIS:")
    print("=" * 80)
    
    today = datetime.now().strftime('%Y-%m-%d')
    print(f"📅 Today: {today}")
    print()
    
    appointments = conn.execute("""
        SELECT 
            a.id, a.services, a.appointment_date, 
            a.appointment_time, a.status, a.pet_id,
            p.name as pet_name
        FROM appointments a
        JOIN pets p ON a.pet_id = p.id
        WHERE a.appointment_date = ? 
          AND a.status = 'confirmed'
        ORDER BY a.appointment_time
    """, (today,)).fetchall()
    
    if not appointments:
        print("  ⚠️  Walang confirmed appointments ngayong araw.")
    else:
        for app in appointments:
            print(f"\n  📌 Appointment #{app['id']} — {app['pet_name']}")
            print(f"     Time: {app['appointment_time']}")
            print(f"     Status: {app['status']}")
            
            try:
                svc_list = json.loads(app['services'])
                print(f"     Services:")
                has_vet = False
                for svc_name in svc_list:
                    cat_row = conn.execute(
                        "SELECT service_category FROM services WHERE name = ?",
                        (svc_name,)
                    ).fetchone()
                    cat = cat_row['service_category'] if cat_row else 'NOT FOUND'
                    icon = "🩺" if cat == 'vet' else "✂️" if cat == 'staff' else "❓"
                    print(f"       {icon} {svc_name} → [{cat}]")
                    if cat == 'vet':
                        has_vet = True
                
                if has_vet:
                    print(f"     ✅ MAY VET SERVICE — LALABAS sa Today's Patients")
                else:
                    print(f"     ❌ WALANG VET SERVICE — HINDI lalabas")
            except Exception as e:
                print(f"     ❌ Error parsing services: {e}")
    
    conn.close()
    
    print()
    print("=" * 80)
    print("✅ DONE!")
    print("=" * 80)


if __name__ == "__main__":
    fix_service_categories()