import sqlite3
from datetime import datetime

conn = sqlite3.connect('secure_auth.db')
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

# ⚠️ PALITAN ITO ng mga appointment ID na BAYAD NA sa Xendit
# Base sa output mo, ang mga may Payment Ref ay yung mga nag-attempt magbayad
# Pero ikaw lang ang nakakaalam kung alin ang TALAGANG bayad na

PAID_APPOINTMENT_IDS = [
    30,  # ← Palitan/punan ng actual IDs na bayad na
    # 29,
    # 28,
    # ... etc
]

print("=" * 80)
print("🔧 FIXING PAYMENT STATUS")
print("=" * 80)

now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
fixed_count = 0

for appt_id in PAID_APPOINTMENT_IDS:
    # I-check muna
    cursor.execute("""
        SELECT id, payment_status, payment_reference, status
        FROM appointments WHERE id = ?
    """, (appt_id,))
    
    row = cursor.fetchone()
    
    if not row:
        print(f"❌ Appointment #{appt_id} not found — skipped")
        continue
    
    print(f"\n📋 Appointment #{appt_id}")
    print(f"   Before: payment_status={row['payment_status']}, status={row['status']}")
    
    # I-update
    cursor.execute("""
        UPDATE appointments 
        SET payment_status = 'paid',
            status = 'confirmed',
            paid_at = ?,
            updated_at = ?
        WHERE id = ?
    """, (now, now, appt_id))
    
    fixed_count += 1
    print(f"   ✅ After: payment_status=paid, status=confirmed")

conn.commit()

# I-verify
print("\n" + "=" * 80)
print("📊 UPDATED APPOINTMENTS")
print("=" * 80)

cursor.execute("""
    SELECT a.id, p.name as pet_name, a.payment_status, a.status, a.paid_at
    FROM appointments a
    JOIN pets p ON a.pet_id = p.id
    WHERE a.id IN ({})
    ORDER BY a.id DESC
""".format(','.join(['?' for _ in PAID_APPOINTMENT_IDS])), PAID_APPOINTMENT_IDS)

for row in cursor.fetchall():
    print(f"\n🆔 Appointment #{row['id']} ({row['pet_name']})")
    print(f"   💰 Payment: {row['payment_status']}")
    print(f"   📌 Status: {row['status']}")
    print(f"   ✅ Paid At: {row['paid_at']}")

print(f"\n🎉 Total fixed: {fixed_count} appointment(s)")
print("\n👉 Refresh mo na ang dashboard (Ctrl + Shift + R)")

conn.close()