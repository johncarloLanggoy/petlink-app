import sqlite3
import os

# ── Database file name (base sa app.py mo) ──────────────────────
DB_FILE = "secure_auth.db"

def cleanup_distemper_services():
    if not os.path.exists(DB_FILE):
        print(f"❌ Error: Hindi mahanap ang database file na '{DB_FILE}'.")
        print("Siguraduhin na nasa tamang folder ka kung saan naka-save ang secure_auth.db.")
        return

    print(f"🔍 Kinokonekta sa database: {DB_FILE}")
    
    try:
        # Kumonekta sa database
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()

        # ── 1. I-check muna kung may makitang distemper services ──
        cursor.execute("""
            SELECT id, name FROM services 
            WHERE service_category = 'vet_disease' 
               OR name LIKE '%Distemper%' 
               OR name LIKE '%Panleukopenia%' 
               OR name LIKE '%Parvovirus%' 
               OR name LIKE '%Infectious Hepatitis%' 
               OR name LIKE '%Leptospirosis%' 
               OR name LIKE '%Feline Leukemia%' 
               OR name LIKE '%Feline Immunodeficiency%' 
               OR name LIKE '%Feline Infectious Peritonitis%'
        """)
        
        services_to_delete = cursor.fetchall()
        
        if not services_to_delete:
            print("✅ Wala nang nakitang Distemper o Severe Disease services sa database. Malinis na ito!")
            return

        # ── 2. Ipakita kung ano ang matatagpuan ───────────────────
        print(f"\n⚠️  May nakitang {len(services_to_delete)} services na matatamaan:")
        for srv in services_to_delete:
            print(f"   - ID: {srv[0]} | Name: {srv[1]}")
        
        confirm = input("\nSigurado ka bang gusto mong i-delete ang mga ito? (y/n): ").strip().lower()
        
        if confirm == 'y':
            # ── 3. I-delete ang mga services ──────────────────────
            cursor.execute("""
                DELETE FROM services 
                WHERE service_category = 'vet_disease' 
                   OR name LIKE '%Distemper%' 
                   OR name LIKE '%Panleukopenia%' 
                   OR name LIKE '%Parvovirus%' 
                   OR name LIKE '%Infectious Hepatitis%' 
                   OR name LIKE '%Leptospirosis%' 
                   OR name LIKE '%Feline Leukemia%' 
                   OR name LIKE '%Feline Immunodeficiency%' 
                   OR name LIKE '%Feline Infectious Peritonitis%'
            """)
            
            # ── 4. OPTIONAL: I-reset ang mga appointment na may kinalaman dito ──
            # Kung may mga lumang appointments na nakabook pa sa mga services na ito,
            # kailangan i-cancel or i-remove. (Ingat: Baka mabawasan ang appointments mo).
            # 
            # cursor.execute("""
            #     DELETE FROM appointments 
            #     WHERE services LIKE '%Distemper%' 
            #        OR services LIKE '%Panleukopenia%'
            # """)
            
            conn.commit()
            print(f"\n✅ Successfully deleted {len(services_to_delete)} distemper-related services!")
            print("💡 I-refresh mo ang Vet Panel mo para makita ang pagbabago sa dropdown.")
        else:
            print("\n❌ Cancelled. Walang nabago sa database.")

    except sqlite3.Error as e:
        print(f"\n❌ Database Error: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    cleanup_distemper_services()