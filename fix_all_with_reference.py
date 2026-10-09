import sqlite3
from datetime import datetime

conn = sqlite3.connect('secure_auth.db')
cursor = conn.cursor()

now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

# I-update LAHAT ng appointments na may payment_reference
# PERO HINDI pa paid
cursor.execute("""
    UPDATE appointments 
    SET payment_status = 'paid',
        status = 'confirmed',
        paid_at = ?,
        updated_at = ?
    WHERE payment_reference IS NOT NULL
      AND payment_reference != ''
      AND payment_status != 'paid'
""", (now, now))

affected = cursor.rowcount
conn.commit()

print(f"✅ Updated {affected} appointment(s)")
print(f"🎉 Refresh mo na ang dashboard (Ctrl + Shift + R)")

# I-verify
cursor.execute("""
    SELECT id, payment_status, status, paid_at
    FROM appointments
    WHERE payment_reference IS NOT NULL
    ORDER BY id DESC
    LIMIT 10
""")

print("\n📊 Updated Appointments:")
for row in cursor.fetchall():
    print(f"   #{row[0]} → {row[1]} | {row[2]} | {row[3]}")

conn.close()