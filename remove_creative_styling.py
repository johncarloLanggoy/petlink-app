import sqlite3

conn = sqlite3.connect('secure_auth.db')
c = conn.cursor()

# Burahin ang Creative Styling
c.execute("DELETE FROM services WHERE name = 'Creative Styling'")

conn.commit()
conn.close()
print('✅ Matagumpay na natanggal ang Creative Styling!')
