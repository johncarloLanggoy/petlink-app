import sqlite3
from datetime import datetime

conn = sqlite3.connect('secure_auth.db')
c = conn.cursor()
now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

# Bagong General Vet Services (Lalabas sa Dog at Cat)
new_services = [
    ("General Checkup", "Complete health examination for dogs and cats", 50.00, 45, 1, "vet", now),
    ("Vaccination", "Pet vaccination service for dogs and cats", 40.00, 30, 1, "vet", now),
    ("Sick Pet Consultation", "Consultation for pets showing signs of illness", 60.00, 30, 1, "vet", now),
    ("Deworming", "Regular deworming treatment for dogs and cats", 30.00, 20, 1, "vet", now),
    ("Wound Treatment", "Cleaning, dressing, and treatment of wounds", 70.00, 30, 1, "vet", now)
]

# I-insert sila sa database
for service in new_services:
    # Check muna kung existing na para iwas duplicate
    c.execute("SELECT id FROM services WHERE name = ? AND service_category = 'vet'", (service[0],))
    if not c.fetchone():
        c.execute('''
            INSERT INTO services (name, description, price, duration, is_active, service_category, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', service)

conn.commit()
conn.close()
print('✅ Matagumpay na naidagdag ang 5 General Vet Services!')
