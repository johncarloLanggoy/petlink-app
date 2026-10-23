import sqlite3
from datetime import datetime

# Kokonekta sa database
conn = sqlite3.connect('secure_auth.db')
c = conn.cursor()
now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

# Yung eksaktong 10 Vet Services na gusto mo
vet_services = [
    # DOGS
    ("Canine Distemper", "Treatment for Canine Distemper", 150.00, 45, 1, "vet_dog", now),
    ("Canine Parvovirus", "Treatment for Canine Parvovirus", 150.00, 60, 1, "vet_dog", now),
    ("Infectious Canine Hepatitis", "Treatment for Infectious Canine Hepatitis", 130.00, 45, 1, "vet_dog", now),
    ("Leptospirosis", "Treatment for Leptospirosis", 120.00, 45, 1, "vet_dog", now),
    ("Kennel Cough", "Treatment for Kennel Cough", 100.00, 30, 1, "vet_dog", now),
    
    # CATS
    ("Feline Panleukopenia", "Treatment for Feline Panleukopenia", 150.00, 45, 1, "vet_cat", now),
    ("Feline Leukemia Virus (FeLV)", "Treatment and management for Feline Leukemia Virus", 160.00, 60, 1, "vet_cat", now),
    ("Feline Infectious Peritonitis (FIP)", "Treatment for Feline Infectious Peritonitis", 180.00, 60, 1, "vet_cat", now),
    ("Feline Upper Respiratory Infection", "Treatment for Feline Upper Respiratory Infection", 120.00, 45, 1, "vet_cat", now),
    ("Feline Calicivirus Infection", "Treatment for Feline Calicivirus Infection", 120.00, 45, 1, "vet_cat", now),
]

# I-insert sila sa database
for service in vet_services:
    c.execute('''
        INSERT INTO services (name, description, price, duration, is_active, service_category, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', service)

conn.commit()
conn.close()
print('✅ Matagumpay na naibalik ang 10 Vet Services!')
