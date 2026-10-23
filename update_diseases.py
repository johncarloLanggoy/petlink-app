import sqlite3
from datetime import datetime

conn = sqlite3.connect('secure_auth.db')
c = conn.cursor()
now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

# 1. Burahin ang lumang diseases
c.execute("DELETE FROM services WHERE service_category = 'vet_disease'")

# 2. I-insert ang mga bago
new_diseases = [
    # DOGS
    ("Canine Distemper with Respiratory Complications", "Treatment for Canine Distemper (Respiratory)", 150.00, 45, 1, "vet_disease", now),
    ("Canine Distemper with Gastrointestinal Complications", "Treatment for Canine Distemper (Gastrointestinal)", 150.00, 45, 1, "vet_disease", now),
    ("Canine Distemper with Neurological Complications", "Treatment for Canine Distemper (Neurological)", 180.00, 60, 1, "vet_disease", now),
    ("Severe Canine Distemper", "Intensive treatment for Severe Canine Distemper", 200.00, 60, 1, "vet_disease", now),
    ("Canine Distemper with Secondary Pneumonia", "Treatment for Canine Distemper with Pneumonia", 180.00, 60, 1, "vet_disease", now),
    
    # CATS
    ("Severe Feline Panleukopenia", "Intensive treatment for Severe Feline Panleukopenia", 180.00, 60, 1, "vet_disease", now),
    ("Feline Panleukopenia with Dehydration", "Treatment for Panleukopenia with Dehydration", 150.00, 45, 1, "vet_disease", now),
    ("Feline Panleukopenia with Secondary Infection", "Treatment for Panleukopenia with Secondary Infection", 170.00, 60, 1, "vet_disease", now),
    ("Feline Panleukopenia with Sepsis", "Intensive treatment for Panleukopenia with Sepsis", 200.00, 60, 1, "vet_disease", now),
    ("Feline Panleukopenia in Neonatal Kittens", "Specialized treatment for Panleukopenia in Kittens", 160.00, 45, 1, "vet_disease", now),
]

for service in new_diseases:
    c.execute('''
        INSERT INTO services (name, description, price, duration, is_active, service_category, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', service)

conn.commit()
conn.close()
print('✅ Matagumpay na napalitan ang Disease Treatments sa database!')
