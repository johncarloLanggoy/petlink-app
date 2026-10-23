import sqlite3

# Kokonekta sa database
conn = sqlite3.connect('secure_auth.db')

# Burahin lahat ng services na may 'vet' sa category (luma at bago)
conn.execute("DELETE FROM services WHERE service_category LIKE 'vet%'")

# I-save ang pagbabago
conn.commit()
conn.close()
print('✅ Matagumpay na nabura ang lumang Vet Services!')
