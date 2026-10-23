import sqlite3

conn = sqlite3.connect('secure_auth.db')
c = conn.cursor()

# 1. Staff Services
staff_durations = {
    'Bath & Brush': 45,
    'Nail Trim': 20,
    'Ear Cleaning': 20,
    'Teeth Cleaning': 30,
    'Flea & Tick Treatment': 40,
    'De-shedding': 60,
    'Full Grooming': 90,
    'Creative Styling': 120
}
for name, dur in staff_durations.items():
    c.execute("UPDATE services SET duration = ? WHERE name = ?", (dur, name))

# 2. General Vet Services
general_durations = {
    'General Checkup': 45,
    'Sick Pet Consultation': 45,
    'Deworming': 20,
    'Wound Treatment': 30,
    'Vaccination': 30
}
for name, dur in general_durations.items():
    c.execute("UPDATE services SET duration = ? WHERE name = ?", (dur, name))

# 3. Disease Treatments (Dog)
c.execute("UPDATE services SET duration = 45 WHERE name LIKE '%Canine Distemper%' AND name NOT LIKE '%Neurological%' AND name NOT LIKE '%Severe%' AND name NOT LIKE '%Gastrointestinal%' AND name NOT LIKE '%Pneumonia%'")
c.execute("UPDATE services SET duration = 60 WHERE name LIKE '%Gastrointestinal%'")
c.execute("UPDATE services SET duration = 90 WHERE name LIKE '%Neurological%' OR name LIKE '%Severe Canine%' OR name LIKE '%Secondary Pneumonia%'")

# 4. Disease Treatments (Cat)
c.execute("UPDATE services SET duration = 45 WHERE name LIKE '%Dehydration%' OR name LIKE '%Neonatal Kittens%'")
c.execute("UPDATE services SET duration = 60 WHERE name LIKE '%Secondary Infection%'")
c.execute("UPDATE services SET duration = 90 WHERE name LIKE '%Sepsis%' OR name LIKE '%Severe Feline%'")

conn.commit()
conn.close()
print('✅ Matagumpay na na-update ang lahat ng appointment durations base sa Pet Express!')
