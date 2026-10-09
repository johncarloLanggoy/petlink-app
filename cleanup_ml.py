"""
Cleanup script para alisin ang duplicate ML recommendations.
Ito ay mag-iwan ng 1 record per pet (ang pinakabago).
"""
import sqlite3
import os

# ── Hanapin ang database file ────────────────────────────────────────
DB_FILE = "secure_auth.db"

if not os.path.exists(DB_FILE):
    print(f"❌ Error: Hindi mahanap ang {DB_FILE} sa current folder!")
    print(f"   Current folder: {os.getcwd()}")
    print(f"   Siguraduhing nasa tamang folder ka.")
    exit(1)

print(f"📂 Database: {os.path.abspath(DB_FILE)}")
print()

# ── Connect sa database ──────────────────────────────────────────────
conn = sqlite3.connect(DB_FILE)
cursor = conn.cursor()

# ── Check kung may ml_recommendations table ──────────────────────────
cursor.execute("""
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='ml_recommendations'
""")
if not cursor.fetchone():
    print("❌ Error: Walang ml_recommendations table sa database!")
    conn.close()
    exit(1)

# ═══════════════════════════════════════════════════════════════════
# STEP 1: Ipakita ang current state
# ═══════════════════════════════════════════════════════════════════
print("=" * 60)
print("📊 BEFORE CLEANUP")
print("=" * 60)

cursor.execute("SELECT COUNT(*) FROM ml_recommendations")
total_before = cursor.fetchone()[0]
print(f"Total records: {total_before}")

# Ipakita ang duplicates per pet
cursor.execute("""
    SELECT pet_id, status, COUNT(*) as count
    FROM ml_recommendations
    GROUP BY pet_id, status
    HAVING COUNT(*) > 1
    ORDER BY count DESC
""")
duplicates = cursor.fetchall()

if duplicates:
    print(f"\n⚠️  May duplicates na nakita:")
    for pet_id, status, count in duplicates:
        # Kunin ang pet name
        cursor.execute("SELECT name FROM pets WHERE id = ?", (pet_id,))
        pet_row = cursor.fetchone()
        pet_name = pet_row[0] if pet_row else f"Pet #{pet_id}"
        print(f"   - {pet_name} (Pet ID: {pet_id}) | Status: {status} | Count: {count}")
else:
    print("\n✅ Walang duplicates na nakita.")

print()

# ═══════════════════════════════════════════════════════════════════
# STEP 2: Delete duplicates — KEEP lang ang latest per pet
# ═══════════════════════════════════════════════════════════════════
print("=" * 60)
print("🧹 CLEANING UP")
print("=" * 60)

# Delete lahat ng records na HINDI ang pinakabagong ID per pet
cursor.execute("""
    DELETE FROM ml_recommendations 
    WHERE id NOT IN (
        SELECT MAX(id) 
        FROM ml_recommendations 
        GROUP BY pet_id
    )
""")

deleted_count = cursor.rowcount
conn.commit()

print(f"🗑️  Deleted: {deleted_count} duplicate records")
print()

# ═══════════════════════════════════════════════════════════════════
# STEP 3: Ipakita ang final state
# ═══════════════════════════════════════════════════════════════════
print("=" * 60)
print("📊 AFTER CLEANUP")
print("=" * 60)

cursor.execute("SELECT COUNT(*) FROM ml_recommendations")
total_after = cursor.fetchone()[0]
print(f"Total records: {total_after}")

# Ipakita ang natitirang records
cursor.execute("""
    SELECT ml.id, ml.pet_id, p.name, ml.status, ml.created_at
    FROM ml_recommendations ml
    LEFT JOIN pets p ON ml.pet_id = p.id
    ORDER BY ml.id DESC
""")
remaining = cursor.fetchall()

if remaining:
    print(f"\n✅ Natitirang records:")
    for rec_id, pet_id, pet_name, status, created_at in remaining:
        pet_display = pet_name if pet_name else f"Pet #{pet_id}"
        print(f"   #{rec_id} | {pet_display} | {status} | {created_at}")
else:
    print("\n✅ Wala nang natitirang records.")

print()

# ── Close connection ─────────────────────────────────────────────────
conn.close()

print("=" * 60)
print("🎉 CLEANUP COMPLETE!")
print("=" * 60)
print()
print("Mga susunod na hakbang:")
print("  1. I-restart ang Flask app (Ctrl+C tapos: python app.py)")
print("  2. Hard refresh browser (Ctrl + Shift + R)")
print("  3. I-test ang customer dashboard at vet panel")
print()