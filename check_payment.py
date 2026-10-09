import sqlite3

# Buksan ang database
conn = sqlite3.connect('secure_auth.db')
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

print("=" * 80)
print("📋 APPOINTMENTS STATUS")
print("=" * 80)

# Kunin lahat ng appointments
cursor.execute("""
    SELECT 
        a.id,
        p.name as pet_name,
        a.payment_status,
        a.payment_reference,
        a.paid_at,
        a.status,
        a.appointment_date,
        a.appointment_time
    FROM appointments a
    JOIN pets p ON a.pet_id = p.id
    ORDER BY a.id DESC
    LIMIT 20
""")

rows = cursor.fetchall()

if not rows:
    print("❌ Walang appointments sa database.")
else:
    for row in rows:
        print(f"\n🆔 Appointment #{row['id']}")
        print(f"   🐾 Pet: {row['pet_name']}")
        print(f"   📅 Date: {row['appointment_date']} {row['appointment_time']}")
        print(f"   💰 Payment Status: {row['payment_status']}")
        print(f"   📝 Payment Ref: {row['payment_reference']}")
        print(f"   ✅ Paid At: {row['paid_at']}")
        print(f"   📌 Appointment Status: {row['status']}")

print("\n" + "=" * 80)

conn.close()