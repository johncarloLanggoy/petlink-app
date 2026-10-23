import sqlite3

conn = sqlite3.connect('secure_auth.db')
conn.execute("DELETE FROM services WHERE name IN ('Cat Grooming', 'Dog Grooming')")
conn.commit()
conn.close()
print('Deleted Cat Grooming and Dog Grooming!')
