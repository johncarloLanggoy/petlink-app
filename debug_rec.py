import sqlite3
import json
import os

DB_FILE = "secure_auth.db"

if not os.path.exists(DB_FILE):
    print(f"❌ Hindi mahanap ang {DB_FILE}")
    exit(1)

conn = sqlite3.connect(DB_FILE)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

print("=" * 70)
print("🔍 ML RECOMMENDATIONS — ACTUAL DB STATE")
print("=" * 70)

cursor.execute("""
    SELECT ml.id, ml.pet_id, p.name as pet_name, 
           p.customer_email,
           ml.status, ml.validated_at, ml.vet_notes, ml.created_at
    FROM ml_recommendations ml
    LEFT JOIN pets p ON ml.pet_id = p.id
    ORDER BY p.name, ml.id
""")

for row in cursor.fetchall():
    status_icon = "🟢" if row["status"] == "pending" else ("✅" if row["status"] == "validated" else "❌")
    
    print(f"\n{status_icon} Record #{row['id']} | Pet: {row['pet_name']} (ID: {row['pet_id']})")
    print(f"   Owner: {row['customer_email']}")
    print(f"   Status: {row['status']}")
    print(f"   Created: {row['created_at']}")
    print(f"   Validated: {row['validated_at'] or '(not yet)'}")
    print(f"   Vet Notes: {row['vet_notes'] or '(none)'}")

conn.close()

print("\n" + "=" * 70)